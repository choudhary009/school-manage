# Vercel Deployment Guide

## Steps to Deploy Backend on Vercel

### 1. Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Navigate to backend directory
```bash
cd backend
```

### 4. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (for first time) or **Yes** (if already deployed)
- Project name? Enter a name or press Enter for default
- Directory? Press Enter (./)
- Override settings? **No**

### 5. Set Environment Variables

After deployment, set your environment variables in Vercel:

#### MongoDB Connection String Format:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database_name>?retryWrites=true&w=majority
```

**Example:**
```
mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/school-management?retryWrites=true&w=majority
```

#### Set in Vercel Dashboard:
1. Go to your project on Vercel dashboard
2. Go to Settings > Environment Variables
3. Click "Add New"
4. Add:
   - **Key**: `MONGO_URL`
   - **Value**: Your MongoDB connection string (from MongoDB Atlas)
   - **Environment**: All (Production, Preview, Development)
5. Click "Save"

#### Or use CLI:
```bash
cd backend
vercel env add MONGO_URL
# Paste your MongoDB connection string when prompted
```

**Note:** Detailed MongoDB setup instructions are in `MONGODB_SETUP.md` file.

### 6. Deploy to Production
```bash
vercel --prod
```

### Important Notes:

1. **MongoDB Connection**: Make sure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) or add Vercel's IP ranges.

2. **Environment Variables**: Never commit .env file. Use Vercel's environment variables instead.

3. **API Base URL**: After deployment, your API will be available at:
   - Development: `https://your-project-name.vercel.app`
   - Production: `https://your-project-name.vercel.app`

4. **Update Frontend**: Update your frontend API calls to use the Vercel URL instead of `localhost:5000`.

### Local Development:

For local development, use:
```bash
npm run dev
```

This will use the original `index.js` file with nodemon.

For production build locally:
```bash
npm start
```

This will use the `api/index.js` file (same as Vercel).

