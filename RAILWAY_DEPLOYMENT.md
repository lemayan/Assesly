# Deploying Assesly to Railway

This guide will help you deploy both the backend and frontend to Railway.

## Prerequisites

1. Create a Railway account at https://railway.app
2. Install Railway CLI (optional): `npm install -g @railway/cli`
3. Ensure you have Git installed and your project is in a Git repository

## Step 1: Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit for Railway deployment"
```

## Step 2: Deploy Backend

### Option A: Using Railway Dashboard (Recommended for first deployment)

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo" (or connect your GitHub account if not already)
3. Select your repository
4. Railway will detect the backend automatically

### Configure Backend Service

1. **Add PostgreSQL Database:**
   - In your Railway project, click "+ New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable

2. **Set Environment Variables:**
   - Click on your backend service
   - Go to "Variables" tab
   - Add the following variables:
     ```
     NODE_ENV=production
     JWT_SECRET=<generate-a-strong-random-string>
     CORS_ORIGINS=https://your-frontend-url.up.railway.app
     PORT=4000
     ```
   - Note: `DATABASE_URL` is automatically provided by Railway when you add PostgreSQL

3. **Configure Root Directory:**
   - Go to "Settings" tab
   - Set "Root Directory" to `backend`
   - Save changes

4. **Deploy:**
   - Railway will automatically deploy
   - Wait for the build to complete
   - Copy your backend URL (e.g., `https://your-backend.up.railway.app`)

## Step 3: Deploy Frontend

1. In the same Railway project, click "+ New"
2. Select "GitHub Repo" and choose your repository again
3. Name it "frontend" to distinguish from backend

### Configure Frontend Service

1. **Set Environment Variables:**
   - Go to "Variables" tab
   - Add:
     ```
     VITE_API_URL=https://your-backend-url.up.railway.app/api
     ```
   - Replace `your-backend-url` with the actual backend URL from Step 2

2. **Configure Root Directory:**
   - Go to "Settings" tab
   - Set "Root Directory" to `frontend`
   - Save changes

3. **Deploy:**
   - Railway will automatically deploy
   - Copy your frontend URL

## Step 4: Update CORS Configuration

1. Go back to your backend service
2. Update the `CORS_ORIGINS` variable to include your frontend URL:
   ```
   CORS_ORIGINS=https://your-frontend-url.up.railway.app
   ```
3. Railway will automatically redeploy

## Step 5: Run Database Migrations

The migrations will run automatically on deployment thanks to the start command in `railway.json`:
```
npx prisma migrate deploy && npm start
```

If you need to run migrations manually:

1. Open the backend service in Railway
2. Go to "Settings" → "Deploy"  
3. Or use Railway CLI:
   ```bash
   railway login
   railway link
   railway run npx prisma migrate deploy
   ```

## Step 6: Seed the Database (Optional)

If you need to seed your database:

```bash
railway run npm run seed
```

## Important Notes

### Database
- Railway provides PostgreSQL automatically
- The `DATABASE_URL` is injected automatically
- Schema has been updated to use PostgreSQL instead of SQLite

### Environment Variables to Set

**Backend:**
- `DATABASE_URL` - Auto-provided by Railway
- `JWT_SECRET` - Generate a secure random string
- `CORS_ORIGINS` - Your frontend URL
- `NODE_ENV=production`
- `PORT` - Railway provides this automatically, but we set 4000 as default

**Frontend:**
- `VITE_API_URL` - Your backend URL + `/api`

### Security Checklist

✅ Change `JWT_SECRET` to a strong random value  
✅ Update `CORS_ORIGINS` with your actual frontend URL  
✅ Never commit `.env` files with real credentials  
✅ Use Railway's environment variables for sensitive data  

## Troubleshooting

### Build Fails
- Check the build logs in Railway dashboard
- Ensure `package.json` scripts are correct
- Verify root directory is set correctly

### Database Connection Issues
- Verify PostgreSQL service is running
- Check that `DATABASE_URL` is available
- Try redeploying the service

### CORS Errors
- Verify `CORS_ORIGINS` includes your frontend URL (without trailing slash)
- Check that the URL protocol matches (https://)
- Redeploy backend after updating CORS settings

### API Not Connecting
- Verify `VITE_API_URL` is set correctly in frontend
- Check that backend is running and accessible
- Open browser dev tools to see actual error messages

## Monitoring

- View logs in Railway dashboard under each service
- Monitor database usage in PostgreSQL service
- Set up Railway notifications for deployment failures

## Custom Domain (Optional)

1. Go to service "Settings"
2. Click "Generate Domain" or add custom domain
3. Update environment variables accordingly

## Continuous Deployment

Railway automatically redeploys when you push to your main branch. To deploy:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Open an issue in your repository
