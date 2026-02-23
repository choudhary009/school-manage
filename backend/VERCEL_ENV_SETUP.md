# Vercel Environment Variable Setup

## ✅ Project Database Connection String:

**पूरे project में यही एक database use हो रहा है:**

```
mongodb+srv://choudharyusama908:1234usama@cluster0.t28gimi.mongodb.net/School?retryWrites=true&w=majority
```

**Original format (MongoDB Atlas से):**
```
mongodb+srv://choudharyusama908:1234usama@cluster0.t28gimi.mongodb.net/School?appName=Cluster0
```

**Note:** `?appName=Cluster0` को `?retryWrites=true&w=majority` से replace किया गया है (production के लिए better)।

## Vercel में Add करने के Steps:

### Method 1: Vercel Dashboard से (Recommended)

1. **Vercel Dashboard खोलें:**
   - https://vercel.com/dashboard पर जाएं
   - अपना project select करें

2. **Environment Variables में जाएं:**
   - Project के Settings tab पर click करें
   - Left sidebar में "Environment Variables" click करें

3. **New Variable Add करें:**
   - "Add New" button click करें
   - Fill करें:
     - **Key**: `MONGO_URL`
     - **Value**: 
       ```
       mongodb+srv://choudharyusama908:1234usama@cluster0.t28gimi.mongodb.net/School?retryWrites=true&w=majority
       ```
     - **Environment**: **All** select करें (Production, Preview, Development)
   - **Save** click करें

4. **Redeploy करें:**
   - Deployments tab पर जाएं
   - Latest deployment के three dots (...) menu से "Redeploy" click करें
   - या नई deployment trigger करें

### Method 2: Vercel CLI से

```bash
cd backend
vercel env add MONGO_URL
```

जब prompt करे, तो यह value paste करें:
```
mongodb+srv://choudharyusama908:1234usama@cluster0.t28gimi.mongodb.net/School?retryWrites=true&w=majority
```

Environment select करें: `Production, Preview, Development` (all)

## ✅ Verification:

Deploy के बाद logs check करें:
1. Vercel Dashboard > Deployments > Latest deployment
2. Logs tab click करें
3. "Connected to MongoDB" message दिखना चाहिए

## ⚠️ Important Notes:

1. **Password Security**: यह connection string में password plain text में है। 
   - Production में strong password use करें
   - Password को regularly change करें

2. **Network Access**: MongoDB Atlas में Network Access check करें:
   - Security > Network Access
   - "Allow Access from Anywhere" (0.0.0.0/0) enable होना चाहिए
   - या Vercel के IP addresses add करें

3. **Database Name**: Database name `School` है (capital S के साथ)

4. **Connection String Format**: 
   - Original: `?appName=Cluster0`
   - Updated: `?retryWrites=true&w=majority` (better for production)

## Test API:

Deploy के बाद test करें:
```
https://your-project.vercel.app/
```

Successful response मिलना चाहिए!

