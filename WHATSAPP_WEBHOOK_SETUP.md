# WhatsApp Webhook Setup Guide

## Overview

This guide explains how to set up the Meta WhatsApp webhook for receiving message delivery status updates and incoming messages.

**Webhook URL:** `https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook`

---

## 📋 Prerequisites

1. **Meta Business Account** with WhatsApp Business API access
2. **WhatsApp Business App** configured in Meta Developer Console
3. **Vercel Account** with deployment access to `srnewschannelwebsite`
4. **Meta App Secret** from your Meta Developer App settings

---

## 🔧 Step 1: Configure Vercel Environment Variables

You need to add TWO server-side environment variables to Vercel. These are **NOT** prefixed with `VITE_` so they remain server-side only.

### In Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Select project: **srnewschannelwebsite**
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

#### Variable 1: Webhook Verify Token

```
Name: WHATSAPP_VERIFY_TOKEN
Value: [Create a random secure string, e.g., "MySecureToken2024_SR_News_12345"]
Environments: ✅ Production ✅ Preview ✅ Development
```

**Important:** Remember this token - you'll need it when configuring Meta webhook.

#### Variable 2: Meta App Secret

```
Name: META_APP_SECRET
Value: [Your Meta App Secret from Developer Console]
Environments: ✅ Production ✅ Preview ✅ Development
```

**How to find Meta App Secret:**
- Go to https://developers.facebook.com/apps/
- Select your WhatsApp app
- Go to **Settings** → **Basic**
- Copy the **App Secret** (click "Show" button)

5. Click **Save** after adding both variables

---

## 🚀 Step 2: Deploy to Vercel

After adding environment variables:

1. Go to **Deployments** tab in Vercel
2. Click **...** menu on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

The webhook endpoint will be available at:
```
https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook
```

---

## 🔗 Step 3: Configure Webhook in Meta Developer Console

### 3.1 Navigate to Webhook Configuration

1. Go to https://developers.facebook.com/apps/
2. Select your **WhatsApp Business App**
3. In the left sidebar, click **WhatsApp** → **Configuration**
4. Scroll to **Webhooks** section
5. Click **Edit** or **Configure webhooks**

### 3.2 Set Webhook URL

**Callback URL:**
```
https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook
```

**Verify Token:**
```
[Enter the EXACT same token you used for WHATSAPP_VERIFY_TOKEN in Vercel]
```

### 3.3 Subscribe to Webhook Fields

Select the following webhook fields to receive notifications:

✅ **messages** - Required for incoming messages and delivery status

Click **Verify and Save**

### 3.4 Verification Process

Meta will send a GET request to verify the webhook:

```
GET https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE_STRING
```

If configured correctly:
- ✅ Verification succeeds
- ✅ Webhook becomes active
- ✅ You'll see "Valid" or "Active" status in Meta console

If verification fails:
- ❌ Check the verify token matches exactly
- ❌ Check environment variables are deployed
- ❌ Check Vercel deployment logs

---

## 🧪 Step 4: Test the Webhook

### Test Webhook Verification (GET)

Test manually with curl:

```bash
curl "https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_VERIFY_TOKEN&hub.challenge=test123"
```

**Expected Response:**
```
test123
```

### Test Webhook Event (POST)

Send a test WhatsApp message through your admin panel and check:

1. **Vercel Logs:**
   - Go to Vercel Dashboard → Deployments → Click deployment → Functions
   - Look for `/api/whatsapp-webhook` logs
   - Should see `[Webhook] Event received` logs

2. **Meta Developer Console:**
   - Go to WhatsApp → Configuration → Webhooks
   - Check "Recent Deliveries" or "Test Events"

---

## 📊 What the Webhook Receives

### Incoming Messages

When someone sends a message to your WhatsApp number:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{
          "from": "919876543210",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "Hello"
          }
        }],
        "metadata": {
          "phone_number_id": "123456789"
        }
      }
    }]
  }]
}
```

### Message Status Updates

When your sent message is delivered/read:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "919876543210"
        }],
        "metadata": {
          "phone_number_id": "123456789"
        }
      }
    }]
  }]
}
```

**Status values:**
- `sent` - Message sent to WhatsApp servers
- `delivered` - Message delivered to recipient's phone
- `read` - Message read by recipient
- `failed` - Message delivery failed

---

## 🔒 Security Features

### 1. Signature Verification

Every POST request is verified using HMAC-SHA256:

```javascript
X-Hub-Signature-256: sha256=<signature>
```

The webhook automatically:
- Verifies signature against raw request body
- Uses constant-time comparison to prevent timing attacks
- Rejects requests with invalid signatures (403)

### 2. Token Verification

GET verification requests check:
- Mode is "subscribe"
- Token matches `WHATSAPP_VERIFY_TOKEN` exactly
- Returns challenge only if both match

### 3. No Sensitive Data Logging

The webhook implementation:
- ✅ Logs event types and message IDs
- ✅ Logs status updates
- ❌ Does NOT log message content in production
- ❌ Does NOT log access tokens or secrets

---

## 🐛 Troubleshooting

### Verification Fails in Meta Console

**Check:**
1. Verify token matches exactly (case-sensitive)
2. Environment variables are saved in Vercel
3. Latest deployment is active
4. No typos in webhook URL

**Debug:**
```bash
# Test GET verification
curl -i "https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

### Webhook Not Receiving Events

**Check:**
1. Webhook is marked "Active" in Meta console
2. "messages" field is subscribed
3. WhatsApp phone number is linked to the webhook

**Debug:**
- Check Vercel function logs
- Check Meta webhook "Recent Deliveries"
- Send a test message from Meta console

### Signature Verification Fails

**Check:**
1. `META_APP_SECRET` in Vercel matches Meta console
2. Request body is received as raw bytes (not pre-parsed JSON)

**Debug:**
- Check Vercel logs for `[Webhook] Invalid signature` warnings
- Verify Meta App Secret is correct

---

## 📁 Files Created/Modified

### New Files:
- `api/whatsapp-webhook.js` - Serverless function handling webhook

### Modified Files:
- `vercel.json` - Updated routing to exclude `/api/*` from SPA routing
- `.env.example` - Added webhook environment variables

### Unchanged:
- All React frontend code
- Admin panel functionality  
- Supabase Edge Functions
- Authentication system

---

## 🔄 Future Enhancements

The webhook currently logs events. Future improvements:

1. **Database Integration:**
   - Store incoming messages in Supabase
   - Update campaign delivery status in `whatsapp_campaign_recipients` table

2. **Auto-Reply:**
   - Respond to specific keywords
   - Send automated responses

3. **Analytics:**
   - Track delivery rates
   - Monitor message failures
   - Generate delivery reports

4. **Opt-out Handling:**
   - Process "STOP" messages
   - Update recipient preferences

---

## 📞 Support

If you encounter issues:

1. Check Vercel function logs
2. Check Meta webhook delivery logs
3. Verify environment variables are set
4. Test with curl commands provided above

---

## ✅ Verification Checklist

Before marking as complete:

- [ ] Environment variables added to Vercel
- [ ] Vercel redeployed with new variables
- [ ] Webhook URL configured in Meta console
- [ ] Webhook verification succeeded in Meta
- [ ] "messages" field subscribed
- [ ] Test GET request returns challenge
- [ ] Test message sends trigger webhook logs
- [ ] Signature verification working (no 403 errors)

---

**Webhook Status:** Ready for deployment and configuration
**Last Updated:** 2026-10-09
