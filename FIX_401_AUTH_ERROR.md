# Fix 401 Unauthorized Error

## 🔍 Root Cause Identified

The 401 error occurs because your **Vercel deployment** is using credentials from the **wrong Supabase project**.

### The Problem:
1. **Edge Function deployed on:** `ypgrvpmybwlwoupkqqtw.supabase.co`
2. **Frontend trying to connect to:** `dutroxipxwtxnhgijzoe.supabase.co` (wrong project!)

The authentication token from the wrong project is being sent to the Edge Function, which rejects it with 401.

---

## ✅ Solution: Update Vercel Environment Variables

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com
2. Go to your project: **srnewschannelwebsite**
3. Click **Settings**
4. Click **Environment Variables**

### Step 2: Update These Variables

Delete old values and add these:

**Variable 1:**
- **Name:** `VITE_SUPABASE_URL`
- **Value:** `https://ypgrvpmybwlwoupkqqtw.supabase.co`
- **Environments:** Production, Preview, Development (select all)

**Variable 2:**
- **Name:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZ3J2cG15Yndsd291cGtxcXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDY5NTgsImV4cCI6MjEwNzI4Mjk1OH0.z6PWTmT1snx6OAhQ18h2N-huB_BWoeRkUTnSSHiv-2g`
- **Environments:** Production, Preview, Development (select all)

### Step 3: Redeploy
After saving the variables:
1. Go to **Deployments** tab
2. Click the **...** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete (~2-3 minutes)

---

## 🧪 Verification Steps

After redeployment:

### Step 1: Hard Refresh
- Press `Ctrl + Shift + R` to clear cache

### Step 2: Check Console
Open Developer Tools (F12) and look for:
```
VITE_SUPABASE_URL: https://ypgrvpmybwlwoupkqqtw.supabase.co
```

If it still shows the old URL, clear your browser cache completely.

### Step 3: Re-Login
1. Go to `/admin/login`
2. Login with your admin email
3. Go to `/admin/whatsapp`

### Step 4: Test Campaign
1. Upload a test JSON file
2. Send campaign
3. Check console - should NOT show 401 error
4. Should see success message!

---

## 📋 Files Changed (Local)

### 1. `.env` - Fixed (for local development)
```env
VITE_SUPABASE_URL=https://ypgrvpmybwlwoupkqqtw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZ3J2cG15Yndsd291cGtxcXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDY5NTgsImV4cCI6MjEwNzI4Mjk1OH0.z6PWTmT1snx6OAhQ18h2N-huB_BWoeRkUTnSSHiv-2g
```

---

## 🎯 Why This Happened

### Supabase Client Initialization:
```javascript
// src/lib/supabase.js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dutroxipxwtxnhgijzoe.supabase.co"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJ..."  // old project key
```

The `||` fallback was using credentials from an old project. When environment variables weren't set in Vercel, it used the fallback (wrong project).

### Authentication Flow:
1. Frontend creates session on `dutroxipxwtxnhgijzoe` ❌
2. Gets auth token for that project
3. Sends token to Edge Function on `ypgrvpmybwlwoupkqqtw` ✓
4. Edge Function rejects token (different project) → 401 ❌

### After Fix:
1. Frontend creates session on `ypgrvpmybwlwoupkqqtw` ✓
2. Gets auth token for correct project ✓
3. Sends token to Edge Function on same project ✓
4. Edge Function validates token successfully ✅

---

## 🐛 If Still Getting 401 After Redeploy

### Check 1: Verify Environment Variables Saved
In Vercel Settings → Environment Variables, you should see:
- `VITE_SUPABASE_URL` = `https://ypgrvpmybwlwoupkqqtw.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (the long key)

### Check 2: Check Build Logs
In Vercel Deployments → Click latest deployment → View logs
Look for:
```
✓ built in XXs
```

### Check 3: Test Locally
Local should work now:
```powershell
npm run dev
```

If local works but production doesn't, the environment variables aren't applied correctly in Vercel.

### Check 4: Check Function Logs
In Supabase Dashboard → Edge Functions → send-whatsapp-campaign → Logs

Look for the exact error message when you try to send.

---

## ✅ Success Indicators

After fixing:
1. ✅ No 401 errors in console
2. ✅ Campaign sends successfully
3. ✅ Success toast message appears
4. ✅ Campaign appears in history
5. ✅ WhatsApp message arrives on phone

---

## 🔒 Security Notes

The values used here are **safe to share**:
- ✅ Anon/public key (protected by RLS policies)
- ✅ Project URL (public)

**Never share:**
- ❌ Service Role Key
- ❌ Database password
- ❌ WhatsApp Access Token

---

**Update Vercel environment variables NOW and redeploy!** 🚀
