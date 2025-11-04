# 🚀 Vercel Deployment Checklist

## ✅ Before Pushing to Git

### 1. **Environment Variables in Vercel**
Go to your Vercel project dashboard → Settings → Environment Variables and ensure these are set:

#### 🔴 Critical (Required)
- [ ] `MONGODB_URI` - Your MongoDB Atlas connection string
- [ ] `JWT_SECRET` - A strong secret key (change from default!)
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- [ ] `CLOUDINARY_API_KEY` - Your Cloudinary API key
- [ ] `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
- [ ] `GOOGLE_GEMINI_API_KEY` - Your Gemini AI API key

#### 🟡 Optional (Recommended)
- [ ] `JWT_EXPIRES_IN` - Default: `7d`
- [ ] `NEXT_PUBLIC_APP_URL` - Your Vercel domain (e.g., `https://your-app.vercel.app`)
- [ ] `NODE_ENV` - Set to `production` for production environment

### 2. **Verify Build Locally**
```bash
npm run build
```
✅ Should complete without errors (like it just did!)

### 3. **Check .gitignore**
✅ Your `.gitignore` already includes `.env*` - good!
- Never commit `.env.local` to git
- Vercel will use environment variables from their dashboard

### 4. **Database Considerations**
- ✅ No schema migrations needed (Mongoose handles this automatically)
- ✅ Existing data will remain intact
- ⚠️ Make sure MongoDB Atlas allows connections from Vercel IPs (0.0.0.0/0 for development)

### 5. **API Keys & Security**
- ✅ Verify all API keys are valid and active
- ✅ Check API quotas/limits won't be exceeded
- ✅ Ensure Google Maps API key is restricted to your Vercel domain (production best practice)

## 🚦 What Happens When You Push

1. **Git Push** → Triggers Vercel deployment
2. **Vercel Build** → Runs `npm install` → `npm run build`
3. **Deployment** → If build succeeds, deploys to production
4. **Health Check** → Vercel verifies the deployment

## ⚠️ Potential Issues & Solutions

### Issue 1: Build Fails on Vercel
**Symptoms:** Build errors in Vercel dashboard
**Solution:** 
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Issue 2: Missing Environment Variables
**Symptoms:** App works locally but fails on Vercel
**Solution:**
- Go to Vercel Dashboard → Settings → Environment Variables
- Add missing variables
- Redeploy (or push again)

### Issue 3: Database Connection Issues
**Symptoms:** 500 errors, MongoDB connection failures
**Solution:**
- Verify `MONGODB_URI` is correct in Vercel
- Check MongoDB Atlas network access allows Vercel IPs
- Ensure database user has correct permissions

### Issue 4: API Rate Limits
**Symptoms:** API calls failing after deployment
**Solution:**
- Check Google Maps API quotas
- Verify Gemini API key is valid
- Monitor API usage in respective dashboards

## 🎯 Safe to Push Checklist

- [x] Build passes locally (`npm run build`)
- [ ] All environment variables set in Vercel dashboard
- [ ] `.env.local` is NOT committed (already in `.gitignore`)
- [ ] Database connection tested
- [ ] API keys are valid and active
- [ ] No breaking changes to API routes
- [ ] Code is production-ready

## 📝 Post-Deployment Verification

After deployment, verify:
- [ ] App loads successfully
- [ ] Authentication works (sign in/sign up)
- [ ] Database connections work
- [ ] Image uploads work (Cloudinary)
- [ ] Maps display correctly
- [ ] API routes respond correctly

## 🔄 Rollback Plan

If something goes wrong:
1. Vercel keeps previous deployments
2. Go to Vercel Dashboard → Deployments
3. Click "..." on previous working deployment
4. Select "Promote to Production"

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Deployment Guide](https://vercel.com/docs/concepts/deployments/overview)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Current Status:** ✅ Build successful locally - Safe to push!

