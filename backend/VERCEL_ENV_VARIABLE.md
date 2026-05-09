# Vercel Environment Variable - MONGO_URL

## ⚠️ Important:
यह project में कोई existing MongoDB connection string नहीं है क्योंकि यह `.env` file में होता है जो gitignore में है (security के लिए सही है)।

## आपको क्या करना है:

### Option 1: अगर आपके पास पहले से MongoDB Atlas account है:

1. MongoDB Atlas में जाएं: https://www.mongodb.com/cloud/atlas
2. अपना connection string copy करें (format नीचे देखें)
3. Vercel में paste करें

### Option 2: अगर आपके पास MongoDB Atlas account नहीं है:

1. **MongoDB Atlas Free Account बनाएं:**
   - Go to: https://www.mongodb.com/cloud/atlas/register
   - Free account बनाएं

2. **Cluster Create करें:**
   - Free tier (M0) select करें
   - Region select करें (closest to you)
   - Cluster name: कोई भी (जैसे: Cluster0)
   - Create cluster click करें

3. **Database User बनाएं:**
   - Security > Database Access
   - Add New Database User
   - Username और Password set करें
   - Database User Privileges: "Read and write to any database"
   - Add User

4. **Network Access Setup:**
   - Security > Network Access
   - Add IP Address
   - "Allow Access from Anywhere" (0.0.0.0/0) select करें
   - Confirm

5. **Connection String Get करें:**
   - Database > Connect
   - "Connect your application" select करें
   - Driver: Node.js, Version: Latest
   - Connection string copy करें

6. **Connection String Format:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database_name>?retryWrites=true&w=majority
```

7. **Password Replace करें:**
   - Copy किए गए string में `<password>` को अपने actual password से replace करें
   - Example:
   ```
   mongodb+srv://myuser:MyPassword123@cluster0.abc123.mongodb.net/school-management?retryWrites=true&w=majority
   ```

## Vercel में Add करें:

### Vercel Dashboard से:
1. Vercel project में जाएं
2. **Settings** > **Environment Variables**
3. **Add New** click करें
4. Fill करें:
   - **Key**: `MONGO_URL`
   - **Value**: अपना MongoDB Atlas connection string (ऊपर का format)
   - **Environment**: **All** (Production, Preview, Development)
5. **Save** click करें

### या Vercel CLI से:
```bash
cd backend
vercel env add MONGO_URL
```
- जब prompt करे, connection string paste करें
- Environment select करें

## Example Connection String Format:

```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/YOUR_DATABASE_NAME?retryWrites=true&w=majority
```

**Replace करें:**
- `YOUR_USERNAME`: MongoDB Atlas username
- `YOUR_PASSWORD`: MongoDB Atlas password (URL encode अगर special characters हों)
- `cluster0.xxxxx`: आपका cluster address
- `YOUR_DATABASE_NAME`: Database name (जैसे: `school-management` या `school`)

## ⚠️ Important Notes:

1. **Local Development के लिए** (`mongodb+srv://choudharyusama908:1234usama@cluster0.t28gimi.mongodb.net/School?appName=Cluster0`) Vercel में use न करें
   - यह सिर्फ local MongoDB के लिए है
   - Vercel में MongoDB Atlas connection string use करें

2. **Password में Special Characters:**
   - अगर password में `@`, `#`, `%` जैसे characters हैं, तो URL encode करें:
     - `@` = `%40`
     - `#` = `%23`
     - `%` = `%25`
     - Space = `%20`

3. **Security:**
   - Connection string को कभी code में directly न लिखें
   - हमेशा environment variables use करें

## Test करने के लिए:

Deploy के बाद Vercel logs check करें:
- Vercel Dashboard > Deployments > Latest deployment > Logs
- "Connected to MongoDB" message दिखना चाहिए

