# 📱 WhatsApp Cloud API Integration

## Quick Links

- 📚 [Complete Setup Guide](./WHATSAPP_SETUP_GUIDE.md) - Step-by-step instructions
- 🔧 [Technical Documentation](./WHATSAPP_INTEGRATION.md) - Architecture and features
- 📝 [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - What was built

## ⚡ Quick Start

### 1. Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

### 2. Get Meta Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a WhatsApp Business app
3. Get three credentials:
   - Access Token
   - Phone Number ID
   - Business Account ID

See [Setup Guide Part 1](./WHATSAPP_SETUP_GUIDE.md#part-1-meta-whatsapp-business-setup) for detailed instructions.

### 3. Deploy

```bash
# Link your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set WHATSAPP_ACCESS_TOKEN="your_token"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="your_phone_id"
supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID="your_business_id"

# Generate and set webhook verify token
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN="$(openssl rand -hex 32)"

# Deploy everything
./deploy-whatsapp.sh  # Linux/Mac
# or
.\deploy-whatsapp.ps1  # Windows
```

### 4. Test

1. Navigate to `/admin/whatsapp` in your dashboard
2. Select "Test" mode
3. Upload JSON with your verified test number:
```json
[
  {
    "name": "Test User",
    "phone": "YOUR_VERIFIED_TEST_NUMBER"
  }
]
```
4. Compose and send a test campaign
5. Check WhatsApp for the message

## 🎯 Features

✅ **Secure** - All secrets server-side  
✅ **Admin-Only** - Server-side role verification  
✅ **Test & Production** - Clear mode separation  
✅ **Batch Sending** - Up to 100 recipients per batch  
✅ **Validation** - Phone numbers, duplicates, formats  
✅ **Tracking** - Campaign and recipient status  
✅ **Webhooks** - Real-time delivery updates  
✅ **History** - View all past campaigns  
✅ **Personalization** - {{name}} placeholder support  

## 📁 What Was Built

### Database Tables
- `whatsapp_campaigns` - Campaign records
- `whatsapp_campaign_recipients` - Individual delivery status

### Edge Functions
- `send-whatsapp-campaign` - Secure message sending
- `whatsapp-webhook` - Delivery status updates

### UI
- Complete admin interface at `/admin/whatsapp`
- Test/Production mode toggle
- JSON upload with validation
- Real-time result display
- Campaign history

## 🔒 Security

- ✅ No secrets in frontend code
- ✅ No secrets in environment variables
- ✅ Server-side admin verification
- ✅ RLS policies on all tables
- ✅ Input validation and sanitization
- ✅ Rate limiting

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [WHATSAPP_SETUP_GUIDE.md](./WHATSAPP_SETUP_GUIDE.md) | Complete setup instructions (11 parts) |
| [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md) | Technical overview and troubleshooting |
| [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) | What was built and project status |

## 🐛 Troubleshooting

### "WhatsApp API configuration missing"
```bash
# Check secrets
supabase secrets list

# Set missing secrets
supabase secrets set WHATSAPP_ACCESS_TOKEN="your_token"
```

### "Admin privileges required"
```sql
-- Grant admin role
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
WHERE email = 'your_email@example.com';
```

### "Message not delivered"
- Test mode: Verify phone number in Meta dashboard
- Production: Check business verification status
- Both: Review Edge Function logs

### More Help
See the [Troubleshooting Section](./WHATSAPP_SETUP_GUIDE.md#part-9-troubleshooting) in the setup guide.

## 🎉 Ready to Deploy?

Follow the [Complete Setup Guide](./WHATSAPP_SETUP_GUIDE.md) for detailed instructions.

---

**Status**: ✅ Implementation Complete  
**Build**: ✅ Successful (35.26 kB)  
**Security**: ✅ All credentials server-side  
