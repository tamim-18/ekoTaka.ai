# 🔑 API Keys Setup Guide - EkoTaka.ai

This guide will help you obtain all the necessary API keys and credentials for the EkoTaka.ai project.

## 📋 Quick Checklist

- [ ] Clerk Authentication
- [ ] MongoDB Atlas Database
- [ ] Cloudinary Image Upload
- [ ] Google Maps API
- [ ] Google Gemini AI API

---

## 1️⃣ Clerk Authentication

**What it's for:** User authentication, login, registration, session management

**Where to get it:**
1. Go to [https://dashboard.clerk.com/](https://dashboard.clerk.com/)
2. Sign up for a free account (or sign in)
3. Click "Create Application"
4. Enter app name: "EkoTaka" or "eko-taka"
5. Choose authentication methods (Email, Phone, Social)
6. After creation, go to **"API Keys"** in the sidebar
7. Copy:
   - `Publishable Key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret Key` → `CLERK_SECRET_KEY`

**For Webhooks (Optional but Recommended):**
1. Go to **"Webhooks"** in Clerk dashboard
2. Click "Add Endpoint"
3. Enter endpoint URL: `https://your-domain.com/api/webhooks/clerk`
4. Select events: `user.created`, `user.updated`, `user.deleted`
5. Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

**Free Tier:** Up to 10,000 MAU (Monthly Active Users)

---

## 2️⃣ MongoDB Atlas Database

**What it's for:** Storing all application data (users, pickups, transactions, etc.)

**Where to get it:**
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new organization (or use default)
4. Click "Build a Database"
5. Choose **FREE (M0)** tier
6. Select a cloud provider and region (choose closest to you)
7. Create a database user:
   - Username: `ekotaka_admin` (or your choice)
   - Password: Generate a strong password (save it!)
8. Set network access:
   - Click "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Restrict to your server IPs
9. Click "Finish and Close"
10. Go to "Database" → Click "Connect"
11. Choose "Connect your application"
12. Copy the connection string
13. Replace `<password>` with your database password
14. Replace `<dbname>` with `eko_taka` (or your preferred database name)

**Format:** `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/eko_taka?retryWrites=true&w=majority`

**Free Tier:** 512 MB storage, shared cluster

---

## 3️⃣ Cloudinary Image Upload

**What it's for:** Storing and managing pickup photos (before/after images)

**Where to get it:**
1. Go to [https://cloudinary.com/console](https://cloudinary.com/console)
2. Sign up for a free account
3. After signup, you'll see your dashboard
4. Copy from the dashboard:
   - `Cloud Name` → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET`

**To create upload preset (optional):**
1. Go to **Settings** → **Upload** → **Upload presets**
2. Click "Add upload preset"
3. Name: `eko_taka_uploads`
4. Signing mode: **Unsigned** (for client-side uploads)
5. Upload folder: `ekotaka/pickups`
6. Click "Save"

**Free Tier:** 25 GB storage, 25 GB monthly bandwidth

---

## 4️⃣ Google Maps API

**What it's for:** Displaying maps, showing pickup locations, route optimization

**Where to get it:**
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project:
   - Click "Select a project" → "New Project"
   - Name: "EkoTaka Maps" or "eko-taka"
   - Click "Create"
4. Wait for project to be created, then select it
5. Enable APIs:
   - Go to **"APIs & Services"** → **"Library"**
   - Search and enable:
     - **"Maps JavaScript API"**
     - **"Geocoding API"**
     - **"Directions API"** (for route optimization)
     - **"Places API"** (optional, for location search)
6. Create API Key:
   - Go to **"APIs & Services"** → **"Credentials"**
   - Click "Create Credentials" → "API Key"
   - Copy the API key → `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
7. (Recommended) Restrict the API key:
   - Click on the API key to edit
   - Under "API restrictions": Select "Restrict key"
   - Choose: Maps JavaScript API, Geocoding API, Directions API
   - Under "Application restrictions": Select "HTTP referrers"
   - Add: `http://localhost:3000/*` (for development)
   - Add: `https://your-domain.com/*` (for production)

**Free Tier:** $200 credit/month (usually enough for development)

---

## 5️⃣ Google Gemini AI API

**What it's for:** AI verification of pickup images, route optimization suggestions

**Where to get it:**
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - OR: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select your Google Cloud project (same one used for Maps, or create new)
5. Copy the generated API key → `GOOGLE_GEMINI_API_KEY`

**Alternative method (if above doesn't work):**
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Select your project
3. Go to **"APIs & Services"** → **"Library"**
4. Search for "Generative Language API" or "Gemini API"
5. Enable it
6. Go to **"Credentials"** → Create API Key

**Free Tier:** 
- 60 requests/minute
- 15 requests/day for rate limit (generous free tier)

---

## 6️⃣ Payment Gateways (Optional for MVP)

### bKash API
**What it's for:** Processing payments to collectors

**Where to get it:**
1. Contact bKash merchant services
2. Apply for merchant account at [https://www.bkash.com/business](https://www.bkash.com/business)
3. Complete KYC process
4. Receive API credentials from bKash

**For MVP:** Use simulated/mock API responses

### Nagad API
**What it's for:** Alternative payment method

**Where to get it:**
1. Contact Nagad merchant services
2. Apply for merchant account
3. Receive API credentials

**For MVP:** Use simulated/mock API responses

---

## 📝 Setting Up Your .env.local File

1. Copy the `env.example` file:
   ```bash
   cp env.example .env.local
   ```

2. Open `.env.local` in your code editor

3. Fill in all the values you obtained from the steps above

4. Make sure `.env.local` is in your `.gitignore` file (should be by default)

5. Never commit `.env.local` to version control!

---

## ✅ Verification Checklist

After setting up all API keys, verify they work:

- [ ] Clerk: Can you see the Clerk dashboard with your app?
- [ ] MongoDB: Can you connect to your cluster?
- [ ] Cloudinary: Can you upload a test image via dashboard?
- [ ] Google Maps: Does the API key show as enabled in Google Cloud Console?
- [ ] Gemini: Can you make a test API call?

---

## 🚨 Security Best Practices

1. **Never commit API keys to git** - Always use `.env.local`
2. **Use different keys for development and production**
3. **Restrict API keys** - Set limitations in service dashboards
4. **Rotate keys periodically** - Change keys every 3-6 months
5. **Monitor usage** - Check dashboards regularly for unusual activity
6. **Use environment variables in production** - Set in Vercel/Netlify dashboard, not in code

---

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Google Maps API Documentation](https://developers.google.com/maps/documentation)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

## 🆘 Troubleshooting

**Issue: API key not working**
- Check if the key is copied correctly (no extra spaces)
- Verify the key is enabled/activated in the service dashboard
- Check API restrictions/quotas

**Issue: MongoDB connection failing**
- Verify the connection string format
- Check if your IP is whitelisted
- Verify database username and password

**Issue: Cloudinary upload failing**
- Check if API keys are correct
- Verify upload preset is set to "unsigned" if using client-side upload
- Check Cloudinary dashboard for errors

**Issue: Google Maps not loading**
- Verify API key restrictions allow your domain
- Check browser console for API errors
- Ensure required APIs are enabled

---

Good luck with your setup! 🚀

