import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from './logger'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Please add your GEMINI_API_KEY to .env.local')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Use gemini-2.5-flash for vision (as per user requirement)
// Falls back to gemini-2.0-flash-exp if 2.5 is not available
const VISION_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash'

export interface PlasticDetectionResult {
  detectedCategory: 'PET' | 'HDPE' | 'LDPE' | 'PP' | 'PS' | 'Other' | null
  confidence: number // 0-1
  estimatedWeight: number // in kg
  reasoning: string
  manualReviewRequired: boolean
  detectedItems: Array<{
    item: string
    category: string
    confidence: number
  }>
}

/**
 * Enhanced prompt for plastic material detection
 * This prompt is specifically designed for the Bangladeshi context and plastic waste collection
 */
const PLASTIC_DETECTION_PROMPT = `You are an expert AI assistant specialized in identifying and categorizing plastic waste materials, particularly in the context of waste collection in Bangladesh. Your task is to analyze images of plastic waste and provide detailed, accurate classifications.

CRITICAL INSTRUCTIONS:
1. Identify all plastic materials visible in the image
2. Classify each plastic item according to these categories:
   - PET (Polyethylene Terephthalate): Clear/transparent bottles, food containers, beverage bottles
   - HDPE (High-Density Polyethylene): Milk jugs, detergent bottles, opaque containers (usually white or colored)
   - LDPE (Low-Density Polyethylene): Plastic bags, shrink wrap, squeezable bottles
   - PP (Polypropylene): Yogurt containers, medicine bottles, bottle caps, food containers
   - PS (Polystyrene): Disposable cups, food containers, packaging foam
   - Other: Mixed plastics, composite materials, or unidentifiable plastic types

3. Estimate the weight (in kilograms) of the visible plastic waste based on:
   - Type and density of plastic material
   - Volume visible in the image
   - Common weight ranges for similar items in Bangladesh context
   - Consider that plastic bottles typically weigh 20-50g each when empty
   - Plastic bags typically weigh 5-15g each
   - Bulk plastic waste varies significantly by type and density

4. Provide confidence score (0-1) based on:
   - Image clarity and visibility of plastic items
   - Ability to identify recycling codes or labels
   - Distinctiveness of plastic type characteristics
   - Whether items are clearly visible vs obscured

5. Assessment quality factors:
   - If image is blurry, dark, or items are not clearly visible → Lower confidence, suggest manual review
   - If multiple plastic types are mixed → Classify as the most dominant type or "Other"
   - If recycling codes (♻️ symbols with numbers) are visible → Higher confidence for that specific type
   - Consider local Bangladeshi plastic waste patterns (e.g., common bottle types, packaging)

6. Output format requirements:
   - Provide JSON response with exact structure specified below
   - Be precise with weight estimates (±20% accuracy expected)
   - Confidence should reflect genuine uncertainty, not guesswork

OUTPUT FORMAT (JSON only, no markdown):
{
  "detectedCategory": "PET" | "HDPE" | "LDPE" | "PP" | "PS" | "Other" | null,
  "confidence": 0.0-1.0,
  "estimatedWeight": number (in kg),
  "reasoning": "Detailed explanation of what you see and how you classified it",
  "manualReviewRequired": boolean,
  "detectedItems": [
    {
      "item": "Description of plastic item",
      "category": "PET" | "HDPE" | etc,
      "confidence": 0.0-1.0
    }
  ]
}

IMPORTANT NOTES:
- If the image does not clearly show plastic waste, set detectedCategory to null and confidence to below 0.5
- If image quality is poor or items are unclear, set manualReviewRequired to true
- Weight estimation should be realistic for Bangladesh context (consider local packaging sizes)
- Always provide reasoning for your classification
- Be honest about uncertainty - better to flag for manual review than guess incorrectly

Now analyze the provided image and return your assessment in the exact JSON format above.`

/**
 * Analyze an image to detect and classify plastic materials using Gemini Vision AI
 * @param imageFile - The image file to analyze (File or Buffer)
 * @param userCategory - Optional user-provided category for comparison
 * @param userWeight - Optional user-provided weight for comparison
 * @returns Plastic detection result with AI analysis
 */
export async function analyzePlasticImage(
  imageFile: File | Buffer,
  userCategory?: string,
  userWeight?: number
): Promise<PlasticDetectionResult> {
  const startTime = Date.now()
  const fileSize = imageFile instanceof File ? imageFile.size : imageFile.length
  const fileName = imageFile instanceof File ? imageFile.name : 'buffer'
  
  logger.info('Starting Gemini AI plastic detection', {
    fileName,
    fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
    userCategory,
    userWeight,
    model: VISION_MODEL
  })

  try {
    // Convert File to Buffer if needed
    let imageBuffer: Buffer
    let mimeType: string

    if (imageFile instanceof File) {
      logger.debug('Converting File to Buffer for Gemini', { fileName, type: imageFile.type })
      imageBuffer = Buffer.from(await imageFile.arrayBuffer())
      mimeType = imageFile.type || 'image/jpeg'
    } else {
      imageBuffer = imageFile
      mimeType = 'image/jpeg' // Default, could be improved with file detection
    }

    // Convert buffer to base64
    logger.debug('Converting image to base64', { 
      bufferSize: `${(imageBuffer.length / 1024).toFixed(2)} KB`,
      mimeType 
    })
    const base64Image = imageBuffer.toString('base64')

    // Initialize the vision model
    const model = genAI.getGenerativeModel({ model: VISION_MODEL })

    // Prepare the prompt with user context if provided
    let enhancedPrompt = PLASTIC_DETECTION_PROMPT
    if (userCategory || userWeight) {
      enhancedPrompt += `\n\nUSER PROVIDED INFORMATION:\n`
      if (userCategory) {
        enhancedPrompt += `- User categorized this as: ${userCategory}\n`
      }
      if (userWeight) {
        enhancedPrompt += `- User estimated weight: ${userWeight} kg\n`
      }
      enhancedPrompt += `\nPlease validate the user's input against what you see in the image. If your analysis differs significantly, explain why in the reasoning field and suggest manual review if confidence is low.`
    }

    // Make the API call
    logger.info('Sending request to Gemini API', { model: VISION_MODEL })
    const apiStartTime = Date.now()
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      {
        text: enhancedPrompt,
      },
    ])

    const response = await result.response
    const text = response.text()
    
    logger.success('Gemini API response received', {
      responseLength: `${text.length} characters`,
      apiDuration: `${Date.now() - apiStartTime}ms`
    })
    
    logger.debug('Raw Gemini response', { responsePreview: text.substring(0, 200) })

    // Parse JSON response (might be wrapped in markdown code blocks)
    let jsonText = text.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/i, '').replace(/\s*```$/i, '')
    }

    // Parse the JSON
    logger.debug('Parsing Gemini JSON response')
    const parsedResult = JSON.parse(jsonText) as PlasticDetectionResult

    // Validate and normalize the result
    const finalResult = {
      detectedCategory: parsedResult.detectedCategory || null,
      confidence: Math.max(0, Math.min(1, parsedResult.confidence || 0)),
      estimatedWeight: Math.max(0, parsedResult.estimatedWeight || 0),
      reasoning: parsedResult.reasoning || 'Analysis completed',
      manualReviewRequired: parsedResult.manualReviewRequired ?? false,
      detectedItems: parsedResult.detectedItems || [],
    }
    
    logger.success('Plastic detection analysis completed', {
      detectedCategory: finalResult.detectedCategory,
      confidence: `${(finalResult.confidence * 100).toFixed(1)}%`,
      estimatedWeight: `${finalResult.estimatedWeight} kg`,
      manualReviewRequired: finalResult.manualReviewRequired,
      detectedItemsCount: finalResult.detectedItems.length,
      totalDuration: `${Date.now() - startTime}ms`
    })
    
    logger.debug('Full detection result', finalResult)
    
    return finalResult
  } catch (error) {
    logger.error('Gemini AI analysis failed', error instanceof Error ? error : new Error(String(error)), {
      fileName,
      userCategory,
      userWeight,
      duration: `${Date.now() - startTime}ms`
    })
    
    // If parsing fails, return a safe default that requires manual review
    const fallbackResult = {
      detectedCategory: null,
      confidence: 0.3,
      estimatedWeight: userWeight || 0,
      reasoning: `AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Manual review required.`,
      manualReviewRequired: true,
      detectedItems: [],
    }
    
    logger.warn('Returning fallback result due to AI failure', fallbackResult)
    
    return fallbackResult
  }
}

