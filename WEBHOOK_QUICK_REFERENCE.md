# WhatsApp Webhook - Quick Reference

## 🔗 Webhook Endpoint

```
https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook
```

---

## 🔑 Required Vercel Environment Variables

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification | Create your own random string (e.g., `MyToken2024!`) |
| `META_APP_SECRET` | Request signature verification | Meta Developer Console → App → Settings → Basic → App Secret |

---

## 📝 Setup Steps (5 minutes)

### 1. Add Environment Variables to Vercel

```
Settings → Environment Variables → Add:

Name: WHATSAPP_VERIFY_TOKEN
Value: [Your random token - remember this!]
Environments: ✅ Production ✅ Preview ✅ Development

Name: META_APP_SECRET  
Value: [From Meta Developer Console]
Environments: ✅ Production ✅ Preview ✅ Development
```

### 2. Redeploy on Vercel

```
Deployments → ... → Redeploy
```

### 3. Configure in Meta Developer Console

```
WhatsApp → Configuration → Webhooks:

Callback URL: https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook
Verify Token: [Same as WHATSAPP_VERIFY_TOKEN]
Subscribe to: ✅ messages

Click: Verify and Save
```

---

## ✅ Test Webhook

### Test Verification (GET)

```bash
curl "https://srnewschannelwebsite.vercel.app/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Expected: test123
```

### Check Logs

```
Vercel Dashboard → Deployments → Latest → Functions → /api/whatsapp-webhook
```

---

## 🎯 What It Does

| Event | Webhook Receives | Current Action |
|-------|------------------|----------------|
| Message sent | Status: `sent` | Log to console |
| Message delivered | Status: `delivered` | Log to console |
| Message read | Status: `read` | Log to console |
| Message failed | Status: `failed` + error | Log error |
| Incoming message | Message object | Log message type |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Verification fails | Check token matches exactly (case-sensitive) |
| 403 errors | Check `META_APP_SECRET` is correct |
| No events received | Check "messages" is subscribed in Meta console |
| 500 errors | Check environment variables are deployed |

---

## 📊 Status Values

- `sent` - Sent to WhatsApp
- `delivered` - Received by user's phone  
- `read` - Opened by user
- `failed` - Delivery failed (check error code)

---

## 🔒 Security

✅ HMAC-SHA256 signature verification  
✅ Token-based verification  
✅ No secrets in source code  
✅ No sensitive data logging  

---

## 📁 Key Files

- `api/whatsapp-webhook.js` - Main webhook handler
- `vercel.json` - Routing configuration
- `WHATSAPP_WEBHOOK_SETUP.md` - Detailed setup guide

---

**Quick Start:** Add env vars → Redeploy → Configure Meta → Test ✅
