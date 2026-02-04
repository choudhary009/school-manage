# Database Information

## Project Database Connection

इस project में **एक ही database** use हो रहा है:

### MongoDB Connection String:
```
mongodb+srv://choudharyusama908:1234usama@cluster0.t28gimi.mongodb.net/School?appName=Cluster0
```

### Database Details:
- **Database Name**: `School`
- **Cluster**: `cluster0.t28gimi.mongodb.net`
- **Username**: `choudharyusama908`
- **Provider**: MongoDB Atlas

### Vercel Environment Variable:
Vercel में add करने के लिए (recommended format):
```
mongodb+srv://choudharyusama908:1234usama@cluster0.t28gimi.mongodb.net/School?retryWrites=true&w=majority
```

### Local Development (.env file):
Backend folder में `.env` file बनाएं:
```
MONGO_URL=mongodb+srv://choudharyusama908:1234usama@cluster0.t28gimi.mongodb.net/School?retryWrites=true&w=majority
```

## Important Notes:

1. **Single Database**: पूरे project में यही एक database use हो रहा है
2. **Environment Variable**: Code में `process.env.MONGO_URL` use होता है
3. **Security**: Connection string को कभी code में directly न लिखें
4. **Network Access**: MongoDB Atlas में "Allow Access from Anywhere" (0.0.0.0/0) enable होना चाहिए

