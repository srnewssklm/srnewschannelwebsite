# Complete Deployment Script for New Supabase Account
# Run this after creating your Supabase project and running the database migration

Write-Host "🚀 Complete Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseCli) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Please install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Get project reference
Write-Host "Enter your Supabase Project Reference ID:" -ForegroundColor Yellow
Write-Host "(Found in: Supabase Dashboard > Settings > General)" -ForegroundColor Gray
$projectRef = Read-Host "Project Ref"

if ([string]::IsNullOrWhiteSpace($projectRef)) {
    Write-Host "❌ Project reference is required!" -ForegroundColor Red
    exit 1
}

# Link project
Write-Host ""
Write-Host "Linking to Supabase project..." -ForegroundColor Yellow
supabase link --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project!" -ForegroundColor Red
    Write-Host "Make sure you're logged in with: supabase login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Project linked successfully" -ForegroundColor Green
Write-Host ""

# Deploy Edge Functions
Write-Host "Deploying Edge Functions..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Deploying send-whatsapp-campaign..." -ForegroundColor Cyan
supabase functions deploy send-whatsapp-campaign
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy send-whatsapp-campaign" -ForegroundColor Red
    exit 1
}
Write-Host "✅ send-whatsapp-campaign deployed" -ForegroundColor Green
Write-Host ""

Write-Host "Deploying whatsapp-webhook..." -ForegroundColor Cyan
supabase functions deploy whatsapp-webhook
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy whatsapp-webhook" -ForegroundColor Red
    exit 1
}
Write-Host "✅ whatsapp-webhook deployed" -ForegroundColor Green
Write-Host ""

# Set secrets
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Setting up Supabase Secrets" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need WhatsApp Cloud API credentials from Meta Developer Console" -ForegroundColor Yellow
Write-Host "See WHATSAPP_SETUP_GUIDE.md for instructions" -ForegroundColor Gray
Write-Host ""

$setupSecrets = Read-Host "Do you want to set up WhatsApp secrets now? (y/n)"

if ($setupSecrets -eq "y" -or $setupSecrets -eq "Y") {
    Write-Host ""
    Write-Host "Enter your WhatsApp credentials:" -ForegroundColor Yellow
    Write-Host ""
    
    $accessToken = Read-Host "WhatsApp Access Token"
    if (-not [string]::IsNullOrWhiteSpace($accessToken)) {
        supabase secrets set WHATSAPP_ACCESS_TOKEN="$accessToken"
        Write-Host "✅ Access token set" -ForegroundColor Green
    }
    
    $phoneNumberId = Read-Host "Phone Number ID"
    if (-not [string]::IsNullOrWhiteSpace($phoneNumberId)) {
        supabase secrets set WHATSAPP_PHONE_NUMBER_ID="$phoneNumberId"
        Write-Host "✅ Phone Number ID set" -ForegroundColor Green
    }
    
    $businessAccountId = Read-Host "Business Account ID"
    if (-not [string]::IsNullOrWhiteSpace($businessAccountId)) {
        supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID="$businessAccountId"
        Write-Host "✅ Business Account ID set" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Creating random webhook verify token..." -ForegroundColor Yellow
    $verifyToken = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    supabase secrets set WHATSAPP_WEBHOOK_VERIFY_TOKEN="$verifyToken"
    Write-Host "✅ Webhook verify token set: $verifyToken" -ForegroundColor Green
    Write-Host "Save this token - you'll need it for Meta webhook configuration!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping secrets setup. You can set them later with:" -ForegroundColor Yellow
    Write-Host "   supabase secrets set WHATSAPP_ACCESS_TOKEN='your_token'" -ForegroundColor Gray
    Write-Host ""
}

# Show deployed functions
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Edge Functions Deployed:" -ForegroundColor Green
supabase functions list
Write-Host ""

Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Update your .env file with new Supabase credentials:" -ForegroundColor Yellow
Write-Host "   VITE_SUPABASE_URL=https://$projectRef.supabase.co" -ForegroundColor Gray
Write-Host "   VITE_SUPABASE_ANON_KEY=your_anon_key" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Build and deploy your frontend:" -ForegroundColor Yellow
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Configure WhatsApp webhook in Meta Console:" -ForegroundColor Yellow
Write-Host "   URL: https://$projectRef.supabase.co/functions/v1/whatsapp-webhook" -ForegroundColor Gray
if ($verifyToken) {
    Write-Host "   Verify Token: $verifyToken" -ForegroundColor Gray
}
Write-Host ""
Write-Host "4. Make yourself admin by running this SQL in Supabase:" -ForegroundColor Yellow
Write-Host "   update auth.users set raw_user_meta_data = raw_user_meta_data || '{\"role\":\"admin\"}'::jsonb" -ForegroundColor Gray
Write-Host "   where email = 'your-email@example.com';" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
