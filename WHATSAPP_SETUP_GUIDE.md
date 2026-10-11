# WhatsApp Cloud API Integration - Setup Guide

## Overview

This guide walks you through setting up the WhatsApp Cloud API integration for bulk messaging campaigns. The integration uses Meta's WhatsApp Business Platform, Supabase Edge Functions, and secure database persistence.

## Architecture

- **Frontend**: React admin dashboard for campaign management
- **Backend**: Supabase Edge Functions for secure API calls
- **Database**: PostgreSQL tables for campaign and recipient tracking
- **API**: Meta WhatsApp Cloud API (Graph API v21.0)
- **Webhooks**: Real-time delivery status updates

---

## Prerequisites

Before starting, ensure you have:

1. ✅ A Facebook Business Account
2. ✅ A Meta Developer Account
3. ✅ A verified WhatsApp Business Account
4. ✅ Supabase project with admin access
5. ✅ Supabase CLI installed (for deploying Edge Functions)

---

## Part 1: Meta WhatsApp Business Setup

### Step 1.1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in app details:
   - **App Name**: `YourCompany WhatsApp Messaging`
   - **Contact Email**: Your business email
   - **Business Account**: Select your business account
5. Click **"Create App"**

### Step 1.2: Add WhatsApp Product

1. In your app dashboard, find **"WhatsApp"** product
2. Click **"Set up"** to add WhatsApp to your app
3. You'll be taken to the WhatsApp getting started page

### Step 1.3: Get Your Credentials

You need three pieces of information:

#### A. Access Token

**For Testing** (Temporary, 24-hour token):
1. Go to **WhatsApp** → **Getting Started**
2. Under "Send and receive messages", find **"Temporary access token"**
3. Copy the token (starts with `EAAA...`)
4. ⚠️ **Important**: This expires in 24 hours - only use for initial testing

**For Production** (Permanent System User Token):
1. Go to **Business Settings** in Meta Business Suite
2. Click **"System Users"** → **"Add"**
3. Create a system user with **Admin** role
4. Click on the system user → **"Generate New Token"**
5. Select your app and permissions:
   - ✅ `whatsapp_business_management`
   - ✅ `whatsapp_business_messaging`
6. Choose **"Never Expire"** for token duration
7. Copy and securely save this token

#### B. Phone Number ID

1. Go to **WhatsApp** → **Getting Started**
2. Under "Send and receive messages", find **"Phone number ID"**
3. Copy the ID (numeric, e.g., `123456789012345`)

#### C. Business Account ID

1. Go to **WhatsApp** → **Getting Started**
2. Find **"WhatsApp Business Account ID"**
3. Copy the ID (numeric)

### Step 1.4: Add a Test Phone Number

**For Testing Only**:
1. Go to **WhatsApp** → **Getting Started**
2. Under "Send and receive messages", click **"Add phone number"**
3. Enter your personal phone number (with country code)
4. You'll receive a verification code via WhatsApp
5. Enter the code to verify

⚠️ **Important**: In test mode, you can only send messages to this verified number.

### Step 1.5: Add a Production Phone Number (Production Only)

**For Sending to Customers**:
1. Go to **WhatsApp** → **Getting Started**
2. Click **"Add phone number"**
3. You need a business phone number that:
   - Is not registered on regular WhatsApp
   - Can receive SMS or voice calls for verification
   - Will be your official business WhatsApp number
4. Follow verification process (SMS/Voice call)
5. Complete business verification if required

---

## Part 2: Database Setup

### Step 2.1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file: `whatsapp-campaigns-migration.sql`
4. Click **"Run"** to execute the migration

This creates:
- `whatsapp_campaigns` table
- `whatsapp_campaign_recipients` table
- RLS policies for admin-only access
- Triggers for automatic counter updates

### Step 2.2: Verify Tables Created

In SQL Editor, run:
```sql
SELECT * FROM whatsapp_campaigns LIMIT 1;
SELECT * FROM whatsapp_campaign_recipients LIMIT 1;
```

You should see empty results (no error).

### Step 2.3: Grant Admin Role (If Needed)

To mark a user as admin, run in SQL Editor:

```sql
-- Replace 'admin@yourcompany.com' with actual admin email
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
WHERE email = 'admin@yourcompany.com';
```

Verify the admin emails match those in the RLS policies (see migration file).

---

## Part 3: Configure Supabase Secrets

### Step 3.1: Install Supabase CLI (If Not Installed)

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or use npm
npm install -g supabase
```

### Step 3.2: Link Your Project

```bash
# Navigate to your project directory
cd d:\sailproject\srnewestv

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

**Find your project ref**: In Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`

### Step 3.3: Set Required Secrets

Set the three WhatsApp credentials as secrets:

```bash
# Set Access Token
supabase secrets set WHATSAPP_ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"

# Set Phone Number ID
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="YOUR_PHONE_NUMBER_ID_HERE"

# Set Business Account ID
supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID="YOUR_BUSINESS_ACCOUNT_ID_HERE"

# Set Webhook Verify Token (create a random secure string)
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN="$(openssl rand -hex 32)"
```

**For Windows PowerShell**, generate random token like this:
```powershell
$token = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN="$token"
```

### Step 3.4: Verify Secrets Set

```bash
supabase secrets list
```

You should see:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

⚠️ **Never commit these secrets to Git or expose them in frontend code!**

---

## Part 4: Deploy Edge Functions

### Step 4.1: Deploy Send Campaign Function

```bash
# Deploy the send-whatsapp-campaign function
supabase functions deploy send-whatsapp-campaign

# Verify deployment
supabase functions list
```

### Step 4.2: Deploy Webhook Function

```bash
# Deploy the webhook function
supabase functions deploy whatsapp-webhook

# Verify deployment
supabase functions list
```

### Step 4.3: Get Function URLs

After deployment, note the function URLs:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-whatsapp-campaign
https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook
```

---

## Part 5: Configure Webhooks (For Delivery Status)

### Step 5.1: Get Webhook URL

Your webhook URL is:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook
```

### Step 5.2: Configure in Meta

1. Go to your Meta app dashboard
2. Navigate to **WhatsApp** → **Configuration**
3. Find **"Webhook"** section
4. Click **"Edit"**
5. Enter:
   - **Callback URL**: Your webhook URL from above
   - **Verify Token**: The token you generated (get it with `supabase secrets list`)
6. Click **"Verify and Save"**

### Step 5.3: Subscribe to Webhook Fields

1. In the same webhook section, subscribe to:
   - ✅ `messages` (for delivery status)
2. Save changes

### Step 5.4: Test Webhook

```bash
# Check webhook function logs
supabase functions logs whatsapp-webhook --tail
```

Send a test message and watch for webhook events in the logs.

---

## Part 6: Testing the Integration

### Step 6.1: Test Mode First

1. Log in to your admin dashboard
2. Navigate to **Bulk WhatsApp** in the sidebar
3. Ensure **"Test"** mode is selected (blue badge in header)
4. Upload a JSON file with your verified test phone number:

```json
[
  {
    "name": "Test User",
    "phone": "YOUR_VERIFIED_TEST_NUMBER"
  }
]
```

5. Enter a campaign name and message
6. Click **"Review Campaign"**
7. Click **"Send Campaign"**
8. Check your WhatsApp for the message

### Step 6.2: Verify in Database

In Supabase SQL Editor:

```sql
-- Check campaign created
SELECT * FROM whatsapp_campaigns ORDER BY created_at DESC LIMIT 5;

-- Check recipient status
SELECT * FROM whatsapp_campaign_recipients ORDER BY created_at DESC LIMIT 5;
```

### Step 6.3: Check Edge Function Logs

```bash
# View send function logs
supabase functions logs send-whatsapp-campaign --tail

# View webhook logs
supabase functions logs whatsapp-webhook --tail
```

---

## Part 7: Moving to Production

### Step 7.1: Business Verification

1. Complete Facebook Business Verification in Business Manager
2. This is **required** for production message sending
3. Process can take 1-3 business days

### Step 7.2: Update to Permanent Token

Replace your temporary access token with the permanent system user token:

```bash
supabase secrets set WHATSAPP_ACCESS_TOKEN="YOUR_PERMANENT_TOKEN_HERE"
```

### Step 7.3: Update Phone Number ID

If using a different production phone number:

```bash
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="YOUR_PRODUCTION_PHONE_NUMBER_ID"
```

### Step 7.4: Switch to Production Mode

1. In the admin dashboard
2. Click the **"Production"** toggle in the header
3. The badge will turn green
4. Production mode messages will be sent to real customer phone numbers

### Step 7.5: Test with Real Number

1. Upload JSON with a consenting customer's phone number
2. Send a test campaign
3. Verify delivery status updates in the campaign history

---

## Part 8: Security Checklist

✅ **Verify all these security measures**:

- [ ] Access token is stored in Supabase secrets (not in code)
- [ ] Phone Number ID is stored in Supabase secrets (not in code)
- [ ] RLS policies are enabled on both tables
- [ ] Only admin users can send campaigns
- [ ] Admin role is verified server-side (not trusted from frontend)
- [ ] Edge Functions use service role key (not anon key)
- [ ] Webhook verify token is secure and not exposed
- [ ] Phone numbers are validated before sending
- [ ] Duplicate phone numbers are detected
- [ ] Recipients must be explicitly selected
- [ ] Batch size is limited (100 recipients per request)
- [ ] Rate limiting is respected
- [ ] Test and production modes are clearly separated
- [ ] No secrets in Git repository
- [ ] No secrets in environment variables starting with `VITE_`

---

## Part 9: Troubleshooting

### Error: "WhatsApp API configuration missing"

**Solution**: Secrets not set properly. Check with:
```bash
supabase secrets list
```

Ensure all three required secrets are present.

### Error: "Admin privileges required"

**Solution**: User doesn't have admin role. Run:
```sql
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
WHERE email = 'YOUR_EMAIL_HERE';
```

### Error: "Invalid phone number format"

**Solution**: Phone numbers must be in international format without spaces or special characters:
- ✅ Correct: `919876543210`
- ❌ Wrong: `+91 98765 43210`

### Error: "Message not delivered"

**Possible causes**:
1. Test mode: Recipient not verified in Meta dashboard
2. Production mode: Business verification not complete
3. Phone number not on WhatsApp
4. Recipient has blocked your business number
5. Rate limits exceeded

**Check logs**:
```bash
supabase functions logs send-whatsapp-campaign
```

### Error: "Webhook verification failed"

**Solution**: Verify token mismatch. Get the token:
```bash
supabase secrets list | grep WEBHOOK
```

Make sure it matches exactly in Meta webhook configuration (case-sensitive).

### Function Deployment Fails

**Solution**: Ensure Deno imports are correct and functions are properly formatted:
```bash
# Test function locally first
supabase functions serve send-whatsapp-campaign

# Then deploy
supabase functions deploy send-whatsapp-campaign --no-verify-jwt
```

---

## Part 10: Best Practices

### Message Content

1. **Get explicit consent** before sending messages
2. **Provide opt-out instructions** in every message
3. **Respect time zones** - don't send late at night
4. **Keep messages concise** and valuable
5. **Use approved templates** for business-initiated messages (when required)

### Rate Limits

- **Test Mode**: Limited to ~10 messages per minute
- **Production**: Varies by tier (Standard, Plus, Enterprise)
- **Solution**: Implement queuing for large campaigns (>100 recipients)

### Monitoring

1. Check campaign history regularly
2. Monitor delivery rates
3. Review failed messages for patterns
4. Set up alerts for high failure rates

### Data Privacy

1. **Never store sensitive data** in message content
2. **Use placeholders** for personalization only
3. **Delete recipient data** after campaign completion (if applicable)
4. **Comply with GDPR/local regulations**

---

## Part 11: Advanced Configuration

### Custom Templates (Production)

For business-initiated messages outside the 24-hour customer service window:

1. Go to Meta Business Manager
2. Create message templates
3. Submit for approval
4. Use template names in message field:
```javascript
// In your campaign message
Template: greeting_message
Parameters: {{1}}, {{2}}
```

### Multiple Phone Numbers

To use different phone numbers for different campaigns:

1. Add multiple phone numbers in Meta
2. Store phone number IDs in campaign metadata
3. Update Edge Function to accept phone number ID as parameter

### Bulk Processing Queue

For campaigns with >100 recipients:

1. Create a queue table in Supabase
2. Break campaign into batches
3. Process batches asynchronously
4. Update status in real-time

---

## Support Resources

- **Meta WhatsApp Docs**: https://developers.facebook.com/docs/whatsapp
- **Supabase Docs**: https://supabase.com/docs
- **Graph API Reference**: https://developers.facebook.com/docs/graph-api
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp/cloud-api

---

## Quick Reference

### Required Secrets
```
WHATSAPP_ACCESS_TOKEN          - Meta access token
WHATSAPP_PHONE_NUMBER_ID       - Phone number ID from Meta
WHATSAPP_BUSINESS_ACCOUNT_ID   - Business account ID
WHATSAPP_WEBHOOK_VERIFY_TOKEN  - Custom secure token for webhooks
```

### Edge Functions
```
send-whatsapp-campaign  - Sends bulk messages
whatsapp-webhook        - Receives delivery status
```

### Database Tables
```
whatsapp_campaigns              - Campaign records
whatsapp_campaign_recipients    - Individual recipient status
```

### JSON Format
```json
[
  {
    "name": "Customer Name",
    "phone": "919876543210"
  }
]
```

---

## Checklist: Ready for Production?

Before enabling production mode, verify:

- [ ] Facebook Business Verification complete
- [ ] Permanent access token configured
- [ ] Production phone number added and verified
- [ ] Webhook configured and tested
- [ ] Test campaign sent successfully
- [ ] Delivery status updates working
- [ ] Admin permissions properly configured
- [ ] All security measures implemented
- [ ] Privacy policy and consent process in place
- [ ] Team trained on using the system

---

**Need Help?** Check the troubleshooting section or review the Meta WhatsApp documentation for additional support.
