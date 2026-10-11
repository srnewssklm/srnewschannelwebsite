# WhatsApp Integration Deployment Script (PowerShell)
# This script helps deploy the WhatsApp Cloud API integration to Supabase

$ErrorActionPreference = "Stop"

Write-Host "🚀 WhatsApp Integration Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if project is linked
if (!(Test-Path ".supabase\config.toml")) {
    Write-Host "❌ Project is not linked to Supabase" -ForegroundColor Red
    Write-Host "Run: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project is linked" -ForegroundColor Green
Write-Host ""

# Check if secrets are set
Write-Host "📋 Checking required secrets..." -ForegroundColor Cyan
$secrets = supabase secrets list 2>&1 | Out-String

if ($secrets -match "WHATSAPP_ACCESS_TOKEN") {
    Write-Host "✅ WHATSAPP_ACCESS_TOKEN is set" -ForegroundColor Green
} else {
    Write-Host "❌ WHATSAPP_ACCESS_TOKEN is not set" -ForegroundColor Red
    Write-Host "Run: supabase secrets set WHATSAPP_ACCESS_TOKEN=`"your_token_here`"" -ForegroundColor Yellow
    exit 1
}

if ($secrets -match "WHATSAPP_PHONE_NUMBER_ID") {
    Write-Host "✅ WHATSAPP_PHONE_NUMBER_ID is set" -ForegroundColor Green
} else {
    Write-Host "❌ WHATSAPP_PHONE_NUMBER_ID is not set" -ForegroundColor Red
    Write-Host "Run: supabase secrets set WHATSAPP_PHONE_NUMBER_ID=`"your_phone_number_id_here`"" -ForegroundColor Yellow
    exit 1
}

if ($secrets -match "WHATSAPP_WEBHOOK_VERIFY_TOKEN") {
    Write-Host "✅ WHATSAPP_WEBHOOK_VERIFY_TOKEN is set" -ForegroundColor Green
} else {
    Write-Host "⚠️  WHATSAPP_WEBHOOK_VERIFY_TOKEN is not set (optional for webhooks)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🗄️  Deploying database migration..." -ForegroundColor Cyan
supabase db push

Write-Host ""
Write-Host "🔧 Deploying Edge Functions..." -ForegroundColor Cyan

Write-Host "  → Deploying send-whatsapp-campaign..." -ForegroundColor Gray
supabase functions deploy send-whatsapp-campaign

Write-Host "  → Deploying whatsapp-webhook..." -ForegroundColor Gray
supabase functions deploy whatsapp-webhook

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure webhook in Meta Developer Console"
Write-Host "2. Test with test mode first"
Write-Host "3. Review setup guide: WHATSAPP_SETUP_GUIDE.md"
Write-Host ""
Write-Host "🔗 Check your Supabase dashboard for function URLs" -ForegroundColor Cyan
Write-Host ""
