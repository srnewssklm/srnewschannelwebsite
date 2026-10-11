# How to Fill .env File

This guide shows you exactly where to get each value for your `.env` file.

---

## 📋 Quick Checklist

- [ ] Create Supabase project
- [ ] Copy Supabase URL
- [ ] Copy Supabase Anon Key
- [ ] (Optional) Add Razorpay Key
- [ ] (Optional) Add Admin Email
- [ ] Test locally

---

## 🔧 Step-by-Step Instructions

### 1️⃣ Get Supabase Credentials

#### Create Supabase Project (if you haven't already)
1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name**: `sr-news-ecommerce` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
4. Click **"Create Project"**
5. Wait 2-3 minutes for setup

#### Get Your Credentials
1. In your Supabase project dashboard
2. Click **Settings** (bottom left) → **API**
3. You'll see:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
```
**Copy this** → Paste into `.env` as `VITE_SUPABASE_URL`

```
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Copy this entire key** → Paste into `.env` as `VITE_SUPABASE_ANON_KEY`

**Your `.env` should now look like:**
```env
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MjAwNTU3NjAwMH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 2️⃣ Razorpay Key (Optional - Only if using Razorpay)

If you want to use Razorpay for payments:

1. Go to https://dashboard.razorpay.com
2. Sign up / Log in
3. Click **Settings** → **API Keys**
4. Generate Test/Live keys
5. Copy the **Key ID** (starts with `rzp_test_` or `rzp_live_`)

**Add to `.env`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_abcd1234efgh5678
```

**If you're only using UPI payment with screenshot upload**, you can skip this or leave it empty:
```env
VITE_RAZORPAY_KEY_ID=
```

---

### 3️⃣ Admin Email (Optional)

Add your email address to identify yourself as admin:

```env
VITE_ADMIN_EMAIL=yourname@example.com
```

**Note:** The project already has these emails whitelisted in the database:
- sailendrakondapalli@gmail.com
- adduriaswani@gmail.com
- susmithajewlaries@gmail.com
- nashejewels@gmail.com
- naveenreddygandluri51@gmail.com
- aswaniadduri11@gmail.com
- ssbmanogna@gmail.com

If your email is in this list, admin access is automatic!

---

## ✅ Complete Example

Here's what your filled `.env` should look like:

```env
# SUPABASE CONFIGURATION
VITE_SUPABASE_URL=https://zibjkepoebarwcuofayo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppYmprZXBvZWJhcndjdW9mYXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzQyMjUsImV4cCI6MjEwNjAxMDIyNX0.r8NafqI6f4TRLT9-dKtH22Q9O7VYdJUwESjxktk_w-I

# RAZORPAY (Optional)
VITE_RAZORPAY_KEY_ID=rzp_test_1234567890abcd

# ADMIN EMAIL
VITE_ADMIN_EMAIL=sailendrakondapalli@gmail.com
```

---

## 🚀 Test Your Configuration

After filling in the values:

```powershell
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Visit http://localhost:5173 and test:
- ✅ Site loads without errors
- ✅ Can view products
- ✅ Can sign up/login
- ✅ Can access `/admin` if you're an admin

---

## 🐛 Troubleshooting

### "Invalid API key" Error
- Check that `VITE_SUPABASE_URL` is correct (no trailing slash)
- Check that `VITE_SUPABASE_ANON_KEY` is the full key (very long string)
- Make sure you copied the **anon** key, not the service_role key

### "Network error" or "CORS error"
- Verify your Supabase project is active (not paused)
- Check if you've run the database migration (`complete-database-migration.sql`)

### Can't Access Admin Panel
- Check if your email is in the whitelist
- OR add yourself as admin using SQL:
```sql
update auth.users 
set raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
where email = 'your-email@example.com';
```

### Environment Variables Not Loading
- Restart the dev server after changing `.env`
- Make sure `.env` is in the project root (same folder as `package.json`)
- Variable names must start with `VITE_` to be accessible in the frontend

---

## 🔒 Security Reminders

### ✅ Safe to Share (These are public)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RAZORPAY_KEY_ID` (test key only)

### ❌ NEVER Share or Commit
- Database password
- Supabase Service Role Key (don't use in frontend anyway!)
- Razorpay Key Secret
- WhatsApp Access Token
- `.env` file itself

### WhatsApp Credentials (Server-Side Only)
These go in **Supabase Secrets** (NOT in `.env`):
```bash
supabase secrets set WHATSAPP_ACCESS_TOKEN="your_token"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="your_id"
supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID="your_account_id"
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN="random_string"
```

See `WHATSAPP_SETUP_GUIDE.md` for details.

---

## 🌐 For Production Deployment

When deploying to Vercel/Netlify:

1. **Don't rely on `.env` file** - it's not uploaded
2. **Add environment variables in the hosting dashboard:**
   - Vercel: Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
3. Use the **same variable names** as in `.env`
4. Deploy!

---

## 📚 Need More Help?

- **Supabase Setup**: See `DEPLOYMENT_GUIDE.md`
- **WhatsApp Setup**: See `WHATSAPP_SETUP_GUIDE.md`
- **General Deployment**: See `README_DEPLOYMENT.md`

---

**That's it! Fill in your values and you're ready to go! 🎉**
