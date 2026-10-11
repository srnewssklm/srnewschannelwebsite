# Fix Campaign History Persistence Issue

## Problem
Campaigns appear briefly after creation but disappear when the page is refreshed. This is caused by incorrect RLS (Row Level Security) policies that prevent the frontend from querying campaigns from the database.

## Root Cause
The original RLS policies used `auth.jwt() ->> 'email'` which doesn't correctly extract the email from Supabase's JWT token structure. The email is stored at the root level of the JWT, not nested.

## Solution
Apply the fixed migration file that updates the RLS policies to use the correct JWT format.

## Steps to Fix

### Option 1: Apply via Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `whatsapp-campaigns-migration-fixed.sql`
5. Paste into the SQL editor
6. Click **Run** (or press F5)
7. You should see "Success. No rows returned"

### Option 2: Apply via Supabase CLI
```powershell
# Make sure you're linked to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

## What Changed

### Before (Incorrect)
```sql
auth.jwt() ->> 'email' in ('user@example.com', ...)
```

### After (Correct)
```sql
coalesce((auth.jwt() ->> 'email'), '') in ('sailendrakondapalli@gmail.com', ...)
```

The fixed version:
- Uses `auth.jwt() ->> 'email'` (root level) instead of `auth.jwt() -> 'user_metadata' ->> 'email'`
- Uses `coalesce()` to handle NULL values safely
- Also checks both `user_metadata` and `app_metadata` for the 'role' field

## Verify the Fix

After applying the migration:

1. **Log in** to your admin dashboard
2. **Create a test campaign** at `/admin/whatsapp`
3. **Wait for it to complete** (should show in campaign history)
4. **Refresh the page** (F5 or Ctrl+R)
5. **Check if the campaign still appears** in the history section

If the campaign persists after refresh, the fix is successful! ✅

## Additional Notes

### Affected Files
- `whatsapp-campaigns-migration-fixed.sql` - New fixed migration
- `supabase/functions/send-whatsapp-campaign/index.ts` - Fixed typo in `personalizeMessage` function

### Admin Email Whitelist
The following emails have admin access:
- sailendrakondapalli@gmail.com
- adduriaswani@gmail.com
- susmithajewlaries@gmail.com
- nashejewels@gmail.com

To add more admins, update the email list in the RLS policies.

### Debugging RLS Issues

If campaigns still don't appear, you can temporarily test by disabling RLS:

```sql
-- TEMPORARY: Disable RLS for testing (DO NOT USE IN PRODUCTION!)
alter table whatsapp_campaigns disable row level security;
alter table whatsapp_campaign_recipients disable row level security;
```

If campaigns appear after disabling RLS, the issue is definitely in the policies. Check your JWT structure:

```sql
-- Run this query while logged in to see your JWT structure
select auth.jwt();
```

### Re-enable RLS after testing:
```sql
alter table whatsapp_campaigns enable row level security;
alter table whatsapp_campaign_recipients enable row level security;
```

## Support

If you continue to experience issues:
1. Check browser console for errors (F12)
2. Check Supabase logs in the dashboard
3. Verify your email is in the whitelist
4. Check if the migration was applied successfully
