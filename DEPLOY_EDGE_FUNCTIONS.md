# Deploy Edge Functions with Fixed CORS

## 🎯 What Was Fixed

### CORS Headers Updated
Both Edge Functions now have proper CORS configuration:

**Before:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
```

**After:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://srnewschannelwebsite.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth, accept',
  'Access-Control-Max-Age': '86400',
}
```

### Preflight Response Fixed
OPTIONS requests now return explicit `200` status:

```typescript
if (req.method === 'OPTIONS') {
  return new Response(null, { 
    status: 200,  // ← Explicit 200 status
    headers: corsHeaders 
  })
}
```

---

## 📋 Files Changed

1. `supabase/functions/send-whatsapp-campaign/index.ts`
   - Updated CORS headers with frontend origin
   - Added `Access-Control-Allow-Methods`
   - Added all required headers including `x-supabase-auth` and `accept`
   - Fixed OPTIONS response to return explicit 200 status

2. `supabase/functions/whatsapp-webhook/index.ts`
   - Same CORS fixes as above
   - Added GET and POST to allowed methods

---

## 🚀 Deployment Steps

### Option 1: Via Supabase CLI (Recommended)

```powershell
# 1. Make sure you're in project directory
cd d:\sailproject\srnewestv

# 2. Link to your Supabase project (if not already linked)
supabase link --project-ref ypgrvpmybwlwoupkqqtw

# 3. Deploy both functions
supabase functions deploy send-whatsapp-campaign
supabase functions deploy whatsapp-webhook

# 4. Verify deployment
supabase functions list
```

### Option 2: Via Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project (ypgrvpmybwlwoupkqqtw)
3. Go to **Edge Functions** in left sidebar
4. For each function:
   - Click the function name
   - Click **"Deploy"** or **"Edit"**
   - Copy the code from the local file
   - Paste and deploy

---

## ✅ Testing the Fix

### Step 1: Wait for Deployment
After deploying, wait 1-2 minutes for changes to propagate.

### Step 2: Clear Browser Cache
Hard refresh your site:
- Windows: `Ctrl + Shift + R`
- Or open Developer Tools (F12) → Network tab → Check "Disable cache"

### Step 3: Test Preflight
Open Developer Tools (F12) → Network tab:

1. Go to https://srnewschannelwebsite.vercel.app/admin/whatsapp
2. Upload a test JSON file
3. Try to send a campaign
4. Look in Network tab for:
   - **OPTIONS** request to `send-whatsapp-campaign`
   - Should show **Status: 200** (not 403 or 500)
   - Response headers should include:
     ```
     access-control-allow-origin: https://srnewschannelwebsite.vercel.app
     access-control-allow-methods: POST, OPTIONS
     access-control-allow-headers: authorization, x-client-info, apikey, content-type, x-supabase-auth, accept
     ```

### Step 4: Test Actual Request
After preflight succeeds:
- The actual **POST** request should go through
- Campaign should send successfully
- No CORS errors in console

---

## 🐛 If CORS Still Fails

### Check 1: Function Deployed?
```powershell
supabase functions list
```

Both functions should show as deployed.

### Check 2: Check Function Logs
```powershell
supabase functions logs send-whatsapp-campaign
```

Look for any deployment errors.

### Check 3: Verify Frontend URL
Make sure your frontend is actually deployed at:
```
https://srnewschannelwebsite.vercel.app
```

If you changed your Vercel domain, update the CORS origin in both function files.

### Check 4: Test Locally
Local testing doesn't have CORS issues:
```powershell
npm run dev
```

Then test at http://localhost:5173/admin/whatsapp

---

## 📊 Expected Network Flow

### Before Fix:
```
Browser → OPTIONS request → Edge Function
         ← 403 or missing headers ❌
         CORS Error!
```

### After Fix:
```
Browser → OPTIONS request → Edge Function
         ← 200 + CORS headers ✅
Browser → POST request → Edge Function
         ← 200 + Campaign result ✅
```

---

## 🎉 Success Indicators

You'll know it's fixed when:

1. ✅ No CORS errors in browser console
2. ✅ OPTIONS request returns 200 status
3. ✅ POST request completes successfully
4. ✅ Campaign sends and appears in history
5. ✅ WhatsApp message arrives on test phone

---

## 📞 Support

If you continue to see CORS errors after deploying:

1. Check the exact error message in console (F12)
2. Verify the function is deployed: `supabase functions list`
3. Check function logs: `supabase functions logs send-whatsapp-campaign`
4. Test locally first to isolate the issue

---

**Deploy now and test!** 🚀
