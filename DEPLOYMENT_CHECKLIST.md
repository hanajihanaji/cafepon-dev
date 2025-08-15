# 🚀 Deployment Checklist

## ✅ Completed
- [x] GitHub repository created and pushed
- [x] Strapi CMS configured for production
- [x] Next.js frontend ready for deployment
- [x] Database configuration prepared
- [x] CORS settings configured

## 📋 Next Steps

### 1. Railway (Strapi CMS) Deployment

#### A. Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub account
3. Connect to `hanajihanaji/cafepon-dev` repository

#### B. Deploy PostgreSQL Database
1. Create new project in Railway
2. Add service → Database → PostgreSQL
3. Wait for database to be ready

#### C. Deploy Strapi Application
1. Add service → GitHub Repo
2. Select `hanajihanaji/cafepon-dev`
3. Set root directory: `cafepon-cms`
4. Configure environment variables:

```bash
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

# Database (Railway auto-generates)
DATABASE_CLIENT=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Security Keys (generate new ones)
APP_KEYS=generate-random-64-char-string
API_TOKEN_SALT=generate-random-64-char-string
ADMIN_JWT_SECRET=generate-random-64-char-string
TRANSFER_TOKEN_SALT=generate-random-64-char-string
JWT_SECRET=generate-random-64-char-string

# Frontend URL (will be set after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
```

#### D. Generate Security Keys
Run this command to generate keys:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 2. Vercel (Next.js Frontend) Deployment

#### A. Create Vercel Account
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub account
3. Import `hanajihanaji/cafepon-dev` repository

#### B. Configure Project Settings
- Framework: Next.js (auto-detected)
- Root Directory: `/` (default)
- Build Command: `npm run build`
- Output Directory: `.next`

#### C. Set Environment Variables
```bash
NEXT_PUBLIC_STRAPI_URL=https://your-strapi-app.railway.app
STRAPI_API_TOKEN=your-generated-api-token
```

### 3. Post-Deployment Configuration

#### A. Strapi Admin Setup
1. Visit your Railway Strapi URL + `/admin`
2. Create admin account
3. Generate API token in Settings → API Tokens
4. Update Vercel environment variables with the token

#### B. Update CORS Settings
1. In Railway, update `FRONTEND_URL` environment variable
2. Set to your Vercel deployment URL
3. Restart Strapi service

#### C. Data Migration
1. Export data from local Strapi
2. Import to production Strapi
3. Verify all menu items and categories

## 🔗 Expected URLs
- **Frontend**: https://cafepon-dev.vercel.app
- **Strapi CMS**: https://cafepon-cms-production.railway.app
- **Admin Panel**: https://cafepon-cms-production.railway.app/admin

## 🛠️ Troubleshooting
- Check Railway logs for Strapi issues
- Check Vercel function logs for frontend issues
- Verify environment variables are set correctly
- Ensure CORS settings allow frontend domain