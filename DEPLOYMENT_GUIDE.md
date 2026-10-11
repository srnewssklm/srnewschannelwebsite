# Complete Deployment Guide
## Migrating to New Supabase Account

This guide walks you through deploying your e-commerce project with a fresh Supabase account.

---

## 📋 Prerequisites

- [ ] New Supabase account created at https://supabase.com
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Git repository ready
- [ ] Node.js and npm installed

---

## 🚀 Step-by-Step Deployment

### 1️⃣ Create New Supabase Project

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Save this securely!
   - **Region**: Choose closest to your users
4. Wait for project to be ready (~2 minutes)
5. Note down:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Project Reference ID**: Found in Settings > General
   - **Anon Key**: Found in Settings > API
   - **Service Role Key**: Found in Settings > API (keep secret!)

---

### 2️⃣ Run Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `complete-database-migration.sql` from your project
5. Copy and paste the **entire contents** into the SQL editor
6. Click **Run** (or press F5)
7. Wait for completion (should see "Success" message)

✅ **Verify**: Check that tables were created:
- Go to **Table Editor** and you should see all tables listed

---

### 3️⃣ Update Frontend Environment Variables

Update your `.env` file with the new Supabase credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Important: DO NOT add WhatsApp credentials here!
# They go in Supabase secrets (see step 5)
```

⚠️ **Never commit `.env` to Git!** Make sure it's in `.gitignore`

---

### 4️⃣ Link Supabase CLI to Project

```powershell
# Navigate to project directory
cd d:\sailproject\srnewestv

# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Verify link
supabase projects list
```

---

### 5️⃣ Deploy Edge Functions

```powershell
# Deploy WhatsApp campaign sender function
supabase functions deploy send-whatsapp-campaign

# Deploy WhatsApp webhook function
supabase functions deploy whatsapp-webhook

# Verify deployment
supabase functions list
```

✅ **Expected output**: Both functions should show as "deployed"

---

### 6️⃣ Set Supabase Secrets (WhatsApp API)

```powershell
# Set WhatsApp Access Token
supabase secrets set WHATSAPP_ACCESS_TOKEN="your_meta_access_token"

# Set Phone Number ID
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"

# Set Business Account ID
supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID="your_business_account_id"

# Set Webhook Verify Token (create a random string)
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN="your_random_verify_token_here"

# Verify secrets were set
supabase secrets list
```

📝 **How to get WhatsApp credentials**: See `WHATSAPP_SETUP_GUIDE.md` Part 1

---

### 7️⃣ Build and Deploy Frontend

#### Option A: Deploy to Vercel (Recommended)

1. Push code to GitHub:
```powershell
git add .
git commit -m "Initial deployment with new Supabase"
git push origin main
```

2. Go to https://vercel.com
3. Click **"Import Project"**
4. Select your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **Deploy**

#### Option B: Deploy to Netlify

1. Push code to GitHub (same as above)
2. Go to https://netlify.com
3. Click **"Add new site"** > **"Import existing project"**
4. Select your repository
5. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables (same as Vercel)
7. Click **Deploy**

---

### 8️⃣ Configure WhatsApp Webhook (Optional)

If using WhatsApp messaging:

1. Go to Meta Developer Console: https://developers.facebook.com
2. Select your app
3. Go to **WhatsApp** > **Configuration**
4. Click **Edit** next to Webhook
5. Enter:
   - **Callback URL**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook`
   - **Verify Token**: Same token you set in secrets above
6. Click **Verify and Save**
7. Subscribe to webhook fields: `messages`, `message_status`

---

### 9️⃣ Set Up Storage Buckets (Auto-created)

The migration script automatically creates these buckets:
- ✅ `product-images` (public) - for product photos
- ✅ `payment-screenshots` (private) - for UPI payment proofs

**Verify buckets exist**:
1. Go to **Storage** in Supabase dashboard
2. Check both buckets are listed

---

### 🔟 Create Admin Users

Run this SQL in Supabase SQL Editor to make yourself an admin:

```sql
-- Replace with your actual email
update auth.users 
set raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
where email = 'your-email@example.com';
```

Or use the email whitelist (already configured in RLS policies):
- sailendrakondapalli@gmail.com
- adduriaswani@gmail.com
- susmithajewlaries@gmail.com
- nashejewels@gmail.com
- naveenreddygandluri51@gmail.com
- aswaniadduri11@gmail.com
- ssbmanogna@gmail.com

---

## ✅ Verification Checklist

After deployment, verify everything works:

### Database
- [ ] All tables visible in Table Editor
- [ ] RLS policies enabled
- [ ] Storage buckets created

### Frontend
- [ ] Site loads without errors
- [ ] Users can sign up/login
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Wishlist functionality works

### Admin Panel
- [ ] Can access `/admin` routes
- [ ] Can add/edit products
- [ ] Can view orders
- [ ] Can manage promo codes
- [ ] WhatsApp messaging page loads

### Edge Functions
- [ ] Functions listed in Supabase dashboard
- [ ] Secrets configured
- [ ] Can send test WhatsApp campaign

---

## 🐛 Troubleshooting

### "Invalid API key" Error
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Rebuild and redeploy after changing env vars

### "RLS policy violation" Error
- Verify your email is in the admin whitelist
- OR add admin role to your user (see step 10)

### Edge Function Not Working
- Check function logs: `supabase functions logs send-whatsapp-campaign`
- Verify secrets are set: `supabase secrets list`
- Redeploy function: `supabase functions deploy send-whatsapp-campaign --no-verify-jwt`

### WhatsApp Messages Not Sending
- Verify WhatsApp credentials are correct
- Check Edge Function logs for errors
- Ensure phone numbers are in E.164 format
- Verify webhook is configured in Meta Console

### Storage Upload Fails
- Check bucket exists in Storage tab
- Verify RLS policies allow uploads
- Check file size (limit: 10MB for payment screenshots)

---

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **WhatsApp Cloud API**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Meta Developer Console**: https://developers.facebook.com

---

## 🔐 Security Notes

### Never Commit These Files:
```
.env
.env.local
.env.production
supabase/.env
```

### Keep These Secret:
- Supabase Service Role Key (never use in frontend!)
- WhatsApp Access Token
- Database Password
- Webhook Verify Token

### Safe to Commit:
- Supabase URL (public)
- Supabase Anon Key (public, protected by RLS)
- All `.sql` migration files
- All frontend code

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors (F12)
2. Check Supabase logs in dashboard
3. Check Edge Function logs: `supabase functions logs <function-name>`
4. Review this deployment guide again

---

## 🎉 You're Done!

Your e-commerce platform with admin panel and WhatsApp messaging is now live!

**Access your sites:**
- Customer Site: `https://your-site.vercel.app`
- Admin Panel: `https://your-site.vercel.app/admin`
- Supabase Dashboard: `https://app.supabase.com/project/YOUR_REF`

Happy selling! 🚀
