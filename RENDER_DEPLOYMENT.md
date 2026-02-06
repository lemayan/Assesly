# Render Deployment Guide for Backend

## Step 1: Create a Render Account
Go to https://render.com and sign up (free tier available)

## Step 2: Create PostgreSQL Database

1. From Render Dashboard, click **New** → **PostgreSQL**
2. Configure:
   - **Name**: `assesly-db`
   - **Database**: `assesly`
   - **User**: `assesly_user`
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free
3. Click **Create Database**
4. Once created, copy the **Internal Database URL** (it looks like: `postgresql://user:pass@host/db`)

## Step 3: Deploy Backend Service

### Via Render Dashboard (Recommended):

1. Click **New** → **Web Service**
2. Connect your Git repository (GitHub/GitLab)
3. Configure the service:
   - **Name**: `assesly-backend`
   - **Region**: Oregon (same as database)
   - **Branch**: `main` or `master`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: 
     ```
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command**: 
     ```
     npx prisma migrate deploy && npm start
     ```
   - **Plan**: Free

4. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable":
   
   ```
   NODE_ENV=production
   DATABASE_URL=<paste your Internal Database URL from Step 2>
   JWT_SECRET=<generate a random 32+ character string>
   CORS_ORIGINS=https://assesly.netlify.app
   PORT=10000
   ```

5. Click **Create Web Service**

## Step 4: Update Frontend Environment Variable

Once your backend is deployed, you'll get a URL like:
`https://assesly-backend.onrender.com`

Update your Netlify environment variable:

```bash
cd frontend
netlify env:set VITE_API_URL "https://assesly-backend.onrender.com"
```

Then redeploy frontend:
```bash
npm run build
netlify deploy --prod
```

## Important Notes

### Free Tier Limitations
- Backend spins down after 15 minutes of inactivity
- First request after spin-down takes 30-50 seconds to wake up
- Database has 90-day expiry on free tier

### Generate JWT Secret
Use this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS Configuration
Your CORS_ORIGINS should include your Netlify frontend URL:
```
CORS_ORIGINS=https://assesly.netlify.app
```

Add more origins separated by commas for multiple domains:
```
CORS_ORIGINS=https://assesly.netlify.app,https://custom-domain.com
```

## Monitoring & Logs

- View logs: Dashboard → Your Service → Logs
- Monitor health: Dashboard → Your Service → Metrics
- Database metrics: Dashboard → Database → Metrics

## Auto-Deploy

Render automatically deploys when you push to your connected Git branch.

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is the **Internal Database URL**
- Check database is in same region as web service
- Ensure Prisma schema matches migrations

### Build Failures
- Check Node version matches local (add `NODE_VERSION=20` env var if needed)
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Migration Issues
- Run migrations manually from Render Shell:
  ```bash
  npx prisma migrate deploy
  ```
- Or reset database (WARNING: deletes all data):
  ```bash
  npx prisma migrate reset --force
  ```

## Useful Commands

Access Render Shell (under service's "Shell" tab):
```bash
# Check Prisma status
npx prisma migrate status

# View database
npx prisma studio

# Run seed
npm run seed
```

## Upgrade to Paid Plan (Optional)

Free tier limitations can be removed with paid plans ($7/month):
- No spin-down
- Faster performance
- More resources
- Persistent database
