# MongoDB Connection String for Vercel

## MongoDB Connection String Format

Vercel में Environment Variable में add करने के लिए MongoDB connection string:

### Format:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database_name>?retryWrites=true&w=majority
```

### Example:
```
mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/school-management?retryWrites=true&w=majority
```

## Steps to Get MongoDB Connection String:

### 1. MongoDB Atlas में जाएं:
- Go to: https://www.mongodb.com/cloud/atlas
- Login करें या Free account बनाएं

### 2. Database Access Setup:
- Left sidebar में "Database Access" click करें
- "Add New Database User" button click करें
- Username और Password set करें
- Database User Privileges: "Read and write to any database" select करें
- "Add User" click करें

### 3. Network Access Setup:
- Left sidebar में "Network Access" click करें
- "Add IP Address" button click करें
- "Allow Access from Anywhere" (0.0.0.0/0) select करें (Vercel के लिए)
- या specific IP addresses add करें
- "Confirm" click करें

### 4. Get Connection String:
- Left sidebar में "Database" click करें
- "Connect" button click करें
- "Connect your application" option select करें
- Driver: "Node.js" select करें
- Version: Latest select करें
- Connection string copy करें

### 5. Connection String में Password Replace करें:
Original string:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/test?retryWrites=true&w=majority
```

Replace करें:
- `<username>`: अपना database username
- `<password>`: अपना database password (URL encode करें अगर special characters हैं)
- `test`: अपना database name (जैसे: school-management)

Final string:
```
mongodb+srv://myuser:mypassword123@cluster0.abc123.mongodb.net/school-management?retryWrites=true&w=majority
```

## Vercel में Add करने के Steps:

### Option 1: Vercel Dashboard से:
1. Vercel dashboard में अपने project पर जाएं
2. "Settings" tab click करें
3. Left sidebar में "Environment Variables" click करें
4. "Add New" button click करें
5. Add करें:
   - **Key**: `MONGO_URL`
   - **Value**: अपना MongoDB connection string (ऊपर का format)
   - **Environment**: All (Production, Preview, Development) select करें
6. "Save" click करें

### Option 2: Vercel CLI से:
```bash
cd backend
vercel env add MONGO_URL
```
- जब prompt करे, तो अपना MongoDB connection string paste करें
- Environment select करें (production/preview/development)

## Important Notes:

1. **Password में Special Characters**: अगर password में special characters (जैसे @, #, %, etc.) हैं, तो URL encode करें:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `%` becomes `%25`
   - `&` becomes `%26`
   - Space becomes `%20`

2. **Security**: 
   - Connection string को कभी code में directly न लिखें
   - Always environment variables use करें
   - .env file को .gitignore में रखें

3. **Database Name**: Connection string में database name specify करें (optional, लेकिन recommended)

4. **Test Connection**: Vercel deploy के बाद logs check करें कि MongoDB connection successful है या नहीं

## Example Connection String Template:

```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/YOUR_DATABASE_NAME?retryWrites=true&w=majority
```

Replace करें:
- `YOUR_USERNAME`: MongoDB Atlas username
- `YOUR_PASSWORD`: MongoDB Atlas password (URL encoded अगर needed)
- `cluster0.xxxxx`: आपका cluster address
- `YOUR_DATABASE_NAME`: Database name (जैसे: school-management)

