#!/bin/bash

# WhatsApp Integration Deployment Script
# This script helps deploy the WhatsApp Cloud API integration to Supabase

set -e

echo "🚀 WhatsApp Integration Deployment"
echo "=================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if project is linked
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Project is not linked to Supabase"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "✅ Project is linked"
echo ""

# Check if secrets are set
echo "📋 Checking required secrets..."
SECRETS=$(supabase secrets list 2>&1)

if echo "$SECRETS" | grep -q "WHATSAPP_ACCESS_TOKEN"; then
    echo "✅ WHATSAPP_ACCESS_TOKEN is set"
else
    echo "❌ WHATSAPP_ACCESS_TOKEN is not set"
    echo "Run: supabase secrets set WHATSAPP_ACCESS_TOKEN=\"your_token_here\""
    exit 1
fi

if echo "$SECRETS" | grep -q "WHATSAPP_PHONE_NUMBER_ID"; then
    echo "✅ WHATSAPP_PHONE_NUMBER_ID is set"
else
    echo "❌ WHATSAPP_PHONE_NUMBER_ID is not set"
    echo "Run: supabase secrets set WHATSAPP_PHONE_NUMBER_ID=\"your_phone_number_id_here\""
    exit 1
fi

if echo "$SECRETS" | grep -q "WHATSAPP_WEBHOOK_VERIFY_TOKEN"; then
    echo "✅ WHATSAPP_WEBHOOK_VERIFY_TOKEN is set"
else
    echo "⚠️  WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set (optional for webhooks)"
fi

echo ""
echo "🗄️  Deploying database migration..."
supabase db push

echo ""
echo "🔧 Deploying Edge Functions..."

echo "  → Deploying send-whatsapp-campaign..."
supabase functions deploy send-whatsapp-campaign

echo "  → Deploying whatsapp-webhook..."
supabase functions deploy whatsapp-webhook

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure webhook in Meta Developer Console"
echo "2. Test with test mode first"
echo "3. Review setup guide: WHATSAPP_SETUP_GUIDE.md"
echo ""
echo "🔗 Your function URLs:"
echo "   Send Campaign: https://$(supabase status | grep 'API URL' | awk '{print $3}' | sed 's|https://||')/functions/v1/send-whatsapp-campaign"
echo "   Webhook: https://$(supabase status | grep 'API URL' | awk '{print $3}' | sed 's|https://||')/functions/v1/whatsapp-webhook"
echo ""
