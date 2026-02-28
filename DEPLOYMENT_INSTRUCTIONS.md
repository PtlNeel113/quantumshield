# QuantumShield - Vercel Deployment Fix

## Problem
Frontend Vercel pe deploy hai lekin backend localhost pe hai, isliye "Network error" aa raha hai.

## Solution
Next.js API routes banaye gaye hain jo Vercel pe directly kaam karenge.

## Vercel Deployment Steps

### 1. Environment Variable Set Karein
Vercel Dashboard mein jaake:
1. Project Settings > Environment Variables
2. Add new variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `/api`
   - **Environment**: Production, Preview, Development (sab select karein)

### 2. Redeploy Karein
```bash
git add .
git commit -m "Add Next.js API routes for Vercel deployment"
git push
```

Ya Vercel dashboard se manually redeploy karein.

## Local Development

### Option 1: Next.js API Routes Use Karein (Recommended for Vercel)
```bash
# .env.local mein
NEXT_PUBLIC_API_URL=/api

npm run dev
```

### Option 2: Python Backend Use Karein (Full Features)
```bash
# .env.local mein
NEXT_PUBLIC_API_URL=http://localhost:8000

# Terminal 1: Backend start karein
cd backend
python start.py

# Terminal 2: Frontend start karein
npm run dev
```

## Demo Credentials
- **Koi bhi email aur password use kar sakte hain!**
- Example: `test@example.com` / `password123`
- Example: `myemail@domain.com` / `anything`

Predefined users (optional):
- admin@quantumshield.com / admin123
- analyst@quantumshield.com / analyst123
- viewer@quantumshield.com / viewer123
- nil1032007@gmail.com / kuch bhi

## Files Created
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint
- `app/api/auth/me/route.ts` - Current user endpoint
- `app/api/auth/refresh/route.ts` - Token refresh endpoint

## Note
Ye demo implementation hai. Production mein:
- Proper JWT library use karein (jose, jsonwebtoken)
- Database connection add karein
- Proper password hashing implement karein
- Rate limiting add karein
