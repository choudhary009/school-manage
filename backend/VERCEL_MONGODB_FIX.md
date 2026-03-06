# Vercel MongoDB Connection Fix

## Problem
Getting `MongooseError: Operation buffering timed out after 10000ms` on Vercel deployment.

## Solutions Applied

### 1. Updated MongoDB Connection Settings
- Increased timeout values for Vercel's serverless environment:
  - `serverSelectionTimeoutMS`: 30 seconds (was 10)
  - `socketTimeoutMS`: 60 seconds (was 45)
  - `connectTimeoutMS`: 30 seconds (was 10)
- Disabled mongoose buffering:
  - `bufferMaxEntries: 0`
  - `bufferCommands: false`

### 2. Added Connection Check in Routes
- Added MongoDB connection state check before queries
- Returns proper error if database is not connected

## Required MongoDB Atlas Settings

### Step 1: Network Access (IP Whitelist)
1. Go to MongoDB Atlas Dashboard
2. Click **Network Access** in the left sidebar
3. Click **Add IP Address**
4. For Vercel, you need to allow all IPs:
   - Click **Allow Access from Anywhere**
   - Or add `0.0.0.0/0` manually
5. Click **Confirm**

**⚠️ Important**: Vercel uses dynamic IP addresses, so you must allow all IPs (0.0.0.0/0) for the connection to work.

### Step 2: Database User
1. Go to **Database Access** in MongoDB Atlas
2. Make sure your database user has proper permissions
3. Username and password should match your connection string

### Step 3: Vercel Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure `MONGODB_URI` is set correctly:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database-name?appName=Cluster0
   ```
3. Select all environments: **Production**, **Preview**, **Development**
4. Click **Save**

### Step 4: Redeploy
After setting environment variables:
1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **Redeploy**

Or use CLI:
```bash
cd backend
vercel --prod
```

## Verify Connection

After redeployment, check logs:
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Click **Logs**
4. You should see: `✅ MongoDB Connected Successfully to: manditrade`

## Common Issues

### Issue: Still getting timeout errors
**Solution**: 
- Check MongoDB Atlas cluster is not paused
- Verify IP whitelist includes 0.0.0.0/0
- Check connection string in Vercel environment variables
- Make sure database user has correct permissions

### Issue: Connection works locally but not on Vercel
**Solution**:
- Local IP might be whitelisted but Vercel IPs are not
- Add 0.0.0.0/0 to MongoDB Atlas Network Access

### Issue: Connection string error
**Solution**:
- Make sure connection string format is correct
- Check username and password are correct
- Verify database name exists

## Testing

Test the connection by calling:
```
GET https://your-vercel-url.vercel.app/api/company/profile
```

With proper authentication headers. Should return company profile without timeout errors.

