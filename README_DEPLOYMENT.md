# Quick Start: Deploy to New Supabase Account

This is your **quick reference** for deploying the complete project to a new Supabase account.

---

## 📦 What's Included

This project includes:
- ✅ **E-commerce Frontend**: Product catalog, cart, wishlist, checkout
- ✅ **Admin Dashboard**: Product management, order tracking, customer management
- ✅ **WhatsApp Messaging**: Bulk WhatsApp campaigns via Meta Cloud API
- ✅ **Payment Integration**: UPI payments with screenshot upload
- ✅ **Promo Codes**: Discount system with usage tracking
- ✅ **Reviews System**: Customer reviews and ratings
- ✅ **Order Tracking**: Tracking ID and image upload

---

## 🚀 Quick Deploy (3 Steps)

### Step 1: Database Setup
1. Create new Supabase project at https://app.supabase.com
2. Go to **SQL Editor** > **New Query**
3. Paste entire contents of `complete-database-migration.sql`
4. Click **Run**

### Step 2: Deploy Edge Functions
Run the automated script:
```powershell
.\deploy-complete.ps1
```

Or manually:
```powershell
supabase link --project-ref YOUR_REF
supabase functions deploy send-whatsapp-campaign
supabase functions deploy whatsapp-webhook
supabase secrets set WHATSAPP_ACCESS_TOKEN="your_token"
```

### Step 3: Deploy Frontend
Update `.env` with new credentials:
```env
VITE_SUPABASE_URL=https://your-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Then deploy to Vercel/Netlify or run locally:
```powershell
npm install
npm run dev
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `complete-database-migration.sql` | **Complete database schema** - Run this first! |
| `DEPLOYMENT_GUIDE.md` | **Detailed step-by-step guide** with troubleshooting |
| `deploy-complete.ps1` | **Automated deployment script** for Windows |
| `WHATSAPP_SETUP_GUIDE.md` | How to get WhatsApp API credentials |
| `FIX_CAMPAIGN_HISTORY.md` | Fix for campaign persistence issue |

---

## 🗄️ Database Tables Created

The migration creates these tables:

### E-commerce Core
- `products` - Product catalog with images, stock, pricing
- `cart` - Shopping cart (user + product + quantity)
- `orders` - Order records with payment info
- `order_items` - Line items for each order
- `wishlist` - User wishlists

### Admin & Features
- `stock_history` - Audit log for stock changes
- `reviews` - Customer reviews and ratings
- `site_settings` - Hero video, banners, etc.
- `promo_codes` - Discount codes
- `promo_code_uses` - Track who used which codes

### WhatsApp Campaigns
- `whatsapp_campaigns` - Campaign records
- `whatsapp_campaign_recipients` - Recipient delivery status

### Storage Buckets
- `product-images` (public) - Product photos
- `payment-screenshots` (private) - UPI payment proofs

---

## 🔐 Admin Access

After deployment, make yourself admin:

```sql
-- Run in Supabase SQL Editor
update auth.users 
set raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
where email = 'your-email@example.com';
```

Or use the pre-configured email whitelist (no SQL needed):
- sailendrakondapalli@gmail.com
- adduriaswani@gmail.com
- susmithajewlaries@gmail.com
- nashejewels@gmail.com
- naveenreddygandluri51@gmail.com
- aswaniadduri11@gmail.com
- ssbmanogna@gmail.com

---

## 🧪 Test Your Deployment

### Frontend Tests
- [ ] Site loads at homepage
- [ ] Products display correctly
- [ ] Can add to cart
- [ ] Can add to wishlist
- [ ] Can register/login

### Admin Tests
- [ ] Can access `/admin` routes
- [ ] Can add/edit products
- [ ] Can view orders
- [ ] Can create promo codes
- [ ] WhatsApp page loads

### WhatsApp Tests (Optional)
- [ ] Edge Functions deployed
- [ ] Secrets configured
- [ ] Can create test campaign
- [ ] Campaign appears in history after refresh

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid API key" | Update `.env` with correct Supabase URL and anon key |
| "Permission denied" | Make yourself admin (see Admin Access section) |
| Edge function fails | Check logs: `supabase functions logs send-whatsapp-campaign` |
| Campaign disappears on refresh | Apply `whatsapp-campaigns-migration-fixed.sql` |
| Can't upload images | Check storage buckets exist and RLS policies are active |

---

## 📚 Full Documentation

- **Complete Setup**: See `DEPLOYMENT_GUIDE.md`
- **WhatsApp Setup**: See `WHATSAPP_SETUP_GUIDE.md`
- **Campaign Issues**: See `FIX_CAMPAIGN_HISTORY.md`

---

## 🎯 Project Structure

```
srnewestv/
├── src/
│   ├── pages/
│   │   ├── admin/          # Admin dashboard pages
│   │   └── ...             # Customer-facing pages
│   ├── services/           # API services (Supabase, WhatsApp)
│   └── lib/                # Supabase client setup
├── supabase/
│   └── functions/          # Edge Functions
│       ├── send-whatsapp-campaign/
│       └── whatsapp-webhook/
├── complete-database-migration.sql   # ⭐ RUN THIS FIRST
├── DEPLOYMENT_GUIDE.md              # Detailed guide
├── deploy-complete.ps1              # Automated script
└── README_DEPLOYMENT.md             # This file
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] Database migrated (ran `complete-database-migration.sql`)
- [ ] Edge Functions deployed
- [ ] WhatsApp secrets configured (if using WhatsApp)
- [ ] Frontend `.env` updated
- [ ] Admin access configured
- [ ] Storage buckets created
- [ ] Tested on staging/dev environment
- [ ] Reviewed RLS policies
- [ ] Git repository pushed

---

## 🌐 Environment Variables

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Supabase Secrets (via CLI)
```bash
WHATSAPP_ACCESS_TOKEN          # From Meta Developer Console
WHATSAPP_PHONE_NUMBER_ID       # From Meta WhatsApp Business
WHATSAPP_BUSINESS_ACCOUNT_ID   # From Meta WhatsApp Business
WHATSAPP_WEBHOOK_VERIFY_TOKEN  # Create random string
```

---

## 🔒 Security Best Practices

✅ **Do:**
- Use environment variables for all credentials
- Enable RLS on all tables
- Keep Service Role Key secret (server-side only)
- Use HTTPS in production
- Regularly update dependencies

❌ **Don't:**
- Commit `.env` files to Git
- Expose Service Role Key in frontend
- Disable RLS policies
- Use test credentials in production
- Share admin credentials

---

## 📞 Need Help?

1. Check **browser console** (F12) for errors
2. Check **Supabase logs** in dashboard
3. Review **DEPLOYMENT_GUIDE.md** troubleshooting section
4. Check **Edge Function logs**: `supabase functions logs <name>`

---

## 🎉 You're Ready!

Your complete e-commerce platform with admin panel and WhatsApp messaging is ready to deploy!

**Quick Links:**
- Supabase Dashboard: https://app.supabase.com
- Meta Developer Console: https://developers.facebook.com
- Vercel Deployment: https://vercel.com
- Netlify Deployment: https://netlify.com

Good luck with your deployment! 🚀
