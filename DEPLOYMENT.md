# Deployment Guide

This document provides step-by-step instructions for deploying the Fitness Health Monitoring AI application.

## Deployment Options

### 1. Vercel (Recommended) 🚀

Vercel is the easiest way to deploy Next.js applications with zero configuration.

#### Quick Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/NISHANT-GUPTA1/Fitness_Health_Monitoring_AI)

#### Manual Setup
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

#### Environment Variables in Vercel
- Go to your Vercel dashboard
- Select your project
- Navigate to Settings → Environment Variables
- Add variables from `.env.example`

### 2. Netlify 🌐

#### Quick Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/NISHANT-GUPTA1/Fitness_Health_Monitoring_AI)

#### Manual Setup
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod`

### 3. GitHub Pages 📄

GitHub Pages deployment is configured with GitHub Actions.

#### Setup Steps
1. Go to your repository on GitHub
2. Navigate to Settings → Pages
3. Source: "GitHub Actions"
4. Push to main branch to trigger deployment

### 4. Docker Deployment 🐳

#### Create Dockerfile
```dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Commands
```bash
docker build -t fitness-ai .
docker run -p 3000:3000 fitness-ai
```

## Environment Configuration

### Production Environment Variables
Create `.env.production` with:
```
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_APP_ENV=production
```

### Development Environment Variables
Create `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_ENV=development
```

## Backend Deployment (Flask)

### Option 1: Heroku
1. Create `Procfile`: `web: python scripts/flask_backend.py`
2. Create `requirements.txt`
3. Deploy: `git push heroku main`

### Option 2: Railway
1. Connect your GitHub repository
2. Railway will auto-deploy on push

### Option 3: DigitalOcean App Platform
1. Create new app from GitHub
2. Configure build and run commands
3. Deploy

## Domain Configuration

### Custom Domain on Vercel
1. Go to Vercel dashboard
2. Select project → Settings → Domains
3. Add your custom domain
4. Update DNS records

### Custom Domain on Netlify
1. Go to Netlify dashboard
2. Site settings → Domain management
3. Add custom domain
4. Configure DNS

## Performance Optimization

### Image Optimization
- Images are already configured with `unoptimized: true`
- Consider using Vercel's Image Optimization in production

### Bundle Analysis
```bash
npm install --save-dev @next/bundle-analyzer
```

Add to `next.config.mjs`:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

Run analysis: `ANALYZE=true npm run build`

## Monitoring and Analytics

### Add Google Analytics
1. Get GA4 tracking ID
2. Add to environment variables
3. Configure in `app/layout.tsx`

### Error Monitoring with Sentry
```bash
npm install @sentry/nextjs
```

## Troubleshooting

### Common Issues
1. **Build fails**: Check Node.js version (use 18+)
2. **Images not loading**: Verify image paths and Next.js config
3. **API errors**: Check environment variables and CORS settings

### Debug Mode
Set `DEBUG=1` in environment to enable detailed logging.

## Security Checklist

- [ ] Environment variables are not exposed to client
- [ ] HTTPS is enabled
- [ ] Security headers are configured
- [ ] Dependencies are up to date
- [ ] Secrets are stored securely

## Deployment Checklist

- [ ] Tests pass locally
- [ ] Build succeeds
- [ ] Environment variables configured
- [ ] Domain configured (if custom)
- [ ] SSL certificate active
- [ ] Analytics configured
- [ ] Monitoring setup
- [ ] Backup strategy in place
