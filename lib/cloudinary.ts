import { v2 as cloudinary } from 'cloudinary'
import { logger } from './logger'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface CloudinaryUploadResult {
  cloudinaryId: string
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

/**
 * Upload an image file to Cloudinary
 * @param file - The file to upload (File object or Buffer)
 * @param folder - The folder path in Cloudinary (e.g., 'ekotaka/pickups/before')
 * @returns Cloudinary upload result with URL and public ID
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  folder: string
): Promise<CloudinaryUploadResult> {
  const startTime = Date.now()
  const fileSize = file instanceof File ? file.size : file.length
  const fileName = file instanceof File ? file.name : 'buffer'
  
  logger.info('Starting Cloudinary upload', {
    folder,
    fileName,
    fileSize: `${(fileSize / 1024).toFixed(2)} KB`,
    mimeType: file instanceof File ? file.type : 'unknown'
  })

  try {
    // Convert File to Buffer if needed
    let buffer: Buffer
    if (file instanceof File) {
      logger.debug('Converting File to Buffer', { fileName, size: file.size })
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      buffer = file
    }

    logger.debug('Buffer created, starting Cloudinary upload stream')

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            {
              quality: 'auto',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload stream error', error, { folder, fileName })
            reject(error)
          } else {
            logger.success('Cloudinary upload completed', {
              folder,
              publicId: result?.public_id,
              url: result?.secure_url,
              size: result?.bytes ? `${result.bytes} bytes` : undefined,
              dimensions: (result?.width && result?.height) ? `${result.width}x${result.height}` : undefined,
              format: result?.format,
              duration: `${Date.now() - startTime}ms`
            })
            resolve(result)
          }
        }
      )

      uploadStream.end(buffer)
    })

    return {
      cloudinaryId: result.public_id,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    logger.error('Cloudinary upload failed', error instanceof Error ? error : new Error(String(error)), {
      folder,
      fileName,
      duration: `${Date.now() - startTime}ms`
    })
    throw new Error(
      `Failed to upload image to Cloudinary: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The Cloudinary public ID of the image to delete
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error(
      `Failed to delete image from Cloudinary: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

