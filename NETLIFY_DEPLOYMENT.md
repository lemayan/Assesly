# Netlify Deployment Guide

## Prerequisites
- A Netlify account (https://app.netlify.com/)
- Your repository connected to Netlify

## Frontend Deployment Steps

### Option 1: Deploy via Netlify UI (Recommended)

1. **Connect Your Repository**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub/GitLab/Bitbucket repository
   - Select your repository

2. **Configure Build Settings**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Node version: 20

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add your backend API URL:
     ```
     VITE_API_URL=https://your-backend-api.com
     ```

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically build and deploy your frontend

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Netlify in your project**
   ```bash
   cd frontend
   netlify init
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

Create a `.env` file in the frontend directory (don't commit this):
```
VITE_API_URL=https://your-backend-api.com
```

In Netlify dashboard, add the same variables under:
Site settings → Environment variables

## Backend Hosting

**Note:** Netlify is primarily for static sites and frontend applications. Your backend needs to be hosted separately on:
- **Render** (recommended for Node.js backends)
- **Heroku**
- **Railway** (if you reconsider)
- **DigitalOcean App Platform**
- **AWS/Azure/GCP**

## Automatic Deployments

Netlify will automatically:
- Deploy when you push to your main/master branch
- Create preview deployments for pull requests
- Provide deploy previews with unique URLs

## Custom Domain

1. Go to Site settings → Domain management
2. Add your custom domain
3. Configure DNS settings as instructed by Netlify

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Verify Node version matches your local environment
- Ensure all dependencies are in `package.json`

### Routing Issues
- The `netlify.toml` redirects config handles SPA routing
- All routes redirect to `index.html` for React Router to handle

### Environment Variables Not Working
- Variables must be prefixed with `VITE_` to be exposed
- Rebuild after adding new environment variables
