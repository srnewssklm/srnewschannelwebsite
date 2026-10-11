# 🚀 Deployment Checklist for WhatsApp Integration

## ✅ Complete These Steps in Order

---

### 1️⃣ Vercel Environment Variables (CRITICAL)

Go to: https://vercel.com/dashboard → **srnewschannelwebsite** → Settings → Environment Variables

#### Frontend Variables (Already Exist - Verify These)

- [ ] `VITE_SUPABASE_URL` = `https://ypgrvpmybwlwoupkqqtw.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZ3J2cG15Yndsd291cGtxcXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MDY5NTgsImV4cCI6MjEwNzI4Mjk1OH0.z6PWTmT1snx6OAhQ18h2N-huB_BWoeRkUTnSSHiv-2g`

#### Webhook Variables (NEW - Add These)

- [ ] `WHATSAPP_VERIFY_TOKEN` = [Create your own random string like `SRNews_Webhook_2024_SecureToken!`]
- [ ] `META_APP_SECRET` = [From Meta Developer Console → Your App → Settings → Basic → App Secret]

**Important:** Check ✅ Production ✅ Preview ✅ Development for ALL variables

---

### 2️⃣ Redeploy Vercel

- [ ] Go to **Deployments** tab
- [ ] Click **...** menu on latest deployment
- [ ] Click **Redeploy**
- [ ] Wait for deployment to complete (usually 1-2 minutes)
- [ ] Verify deployment status is ✅ Ready

---

### 3️⃣ Test Admin Login (Fixed Authentication)

- [ ] Go to: https://srnewschannelwebsite.vercel.app/admin
- [ ] Should redirect to `/admin/login` (not show dashboard directly)
- [ ] Login with: `adduriaswani@gmail.com`
- [ ] Should redirect to dashboard after login
- [ ] Verify profile dropdown shows in top-right corner
- [ ] Verify you can navigate to WhatsApp page

---

### 4️⃣ Configure Supabase Edge Function Secrets

Go to: https://supabase.com/dashboard/project/ypgrvpmybwlwoupkqqtw/settings/functions

Add these secrets (if not already added):

- [ ] `WHATSAPP_ACCESS_TOKEN` = [Your WhatsApp API access token]
- [ ] `WHATSAPP_PHONE_NUMBER_ID` = [Your phone number ID]
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` = [Your business account ID]

---

### 5️⃣ Configure Meta WhatsApp Webhook

Go to: https://developers.facebook.com/apps/ → Your App → WhatsApp → Configuration

#### Configure Webhook:

- [ ] **Callback URL:** `https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook`
- [ ] **Verify Token:** [Same as `WHATSAPP_VERIFY_TOKEN` in Vercel - must match exactly!]
- [ ] Subscribe to webhook fields: ✅ **messages**
- [ ] Click **Verify and Save**
- [ ] Verification should succeed ✅

---

### 6️⃣ Test Webhook Verification

Run this command (replace `YOUR_TOKEN` with your actual verify token):

```bash
curl "https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

**Expected response:** `test123`

**If you get an error:**
- Check environment variables are deployed
- Check verify token matches exactly
- Check Vercel deployment completed successfully

---

### 7️⃣ Test Campaign Sending

- [ ] Login to admin panel: https://srnewschannelwebsite.vercel.app/admin/login
- [ ] Navigate to WhatsApp page
- [ ] Enable **Test Mode**
- [ ] Add your phone number (with country code, e.g., +919876543210)
- [ ] Enter a test message
- [ ] Click **Send Campaign**
- [ ] Should see success message

---

### 8️⃣ Verify Webhook Receives Events

After sending a test message:

1. **Check Vercel Logs:**
   - [ ] Go to Vercel → Deployments → Latest → Functions
   - [ ] Find `/api/whatsapp-webhook` in the list
   - [ ] Should see logs like:
     ```
     [Webhook] Status update: { messageId: 'wamid...', status: 'sent' }
     [Webhook] Status update: { messageId: 'wamid...', status: 'delivered' }
     ```

2. **Check Meta Console:**
   - [ ] Go to Meta Developer Console → WhatsApp → Configuration → Webhooks
   - [ ] Check "Recent Deliveries" or "Webhook Fields"
   - [ ] Should show successful POST requests with 200 status

---

## 🐛 Troubleshooting Guide

### Problem: 401 Error When Sending Campaign

**Solution:** Vercel missing `VITE_SUPABASE_ANON_KEY`
- Add environment variable in Vercel
- Redeploy
- Hard refresh browser (Ctrl+Shift+R)

---

### Problem: Webhook Verification Fails in Meta

**Solutions:**
1. Verify token mismatch
   - Check token in Vercel matches token in Meta console exactly
   - Case-sensitive!

2. Environment variables not deployed
   - Redeploy after adding variables

3. Wrong endpoint URL
   - Should be: `https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook`
   - NOT: `/api/whatsapp-webhook` (missing domain)

---

### Problem: Admin Page Shows Without Login

**Solution:** Fixed in latest deployment
- Make sure you deployed the latest code
- Clear browser cache
- Go to `/admin` - should redirect to login

---

### Problem: Webhook Not Receiving Status Updates

**Solutions:**
1. Check webhook subscription
   - In Meta console, verify "messages" field is subscribed
   - Status should show "Active" or "Subscribed"

2. Check signature verification
   - Verify `META_APP_SECRET` in Vercel is correct
   - Check Vercel logs for signature errors

3. Test with Meta test button
   - In Meta console, use "Send Test Event" button
   - Check if webhook receives it

---

## 📊 Success Criteria

You'll know everything is working when:

✅ Admin login redirects properly  
✅ WhatsApp page loads without errors  
✅ Test campaign sends successfully  
✅ Message appears on recipient's phone  
✅ Webhook receives status updates (check Vercel logs)  
✅ No 401 or 403 errors in browser console  

---

## 📁 Important URLs

| Resource | URL |
|----------|-----|
| **Production Site** | https://srnewschannelwebsite.vercel.app |
| **Admin Login** | https://srnewschannelwebsite.vercel.app/admin/login |
| **WhatsApp Page** | https://srnewschannelwebsite.vercel.app/admin/whatsapp |
| **Webhook Endpoint** | https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/ypgrvpmybwlwoupkqqtw |
| **Meta Developer Console** | https://developers.facebook.com/apps/ |

---

## 🔑 Admin Emails

Only these emails can access admin panel:
- sailendrakondapalli@gmail.com
- adduriaswani@gmail.com
- susmithajewlaries@gmail.com

---

## 📞 Next Steps After Deployment

1. **Test thoroughly** with test phone numbers
2. **Monitor webhook logs** for any errors
3. **Switch to production mode** when ready
4. **Add more phone numbers** to campaigns
5. **Set up database integration** for delivery tracking (future enhancement)

---

**Deployment Status:** Ready to deploy ✅  
**Last Updated:** 2026-10-09
