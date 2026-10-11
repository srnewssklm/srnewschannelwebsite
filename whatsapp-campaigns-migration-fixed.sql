-- =============================================
-- WhatsApp Campaigns Migration (FIXED RLS Policies)
-- Tracks WhatsApp bulk messaging campaigns and individual recipient delivery status
-- =============================================

-- Drop existing policies if they exist
drop policy if exists "Admins can view all campaigns" on whatsapp_campaigns;
drop policy if exists "Admins can create campaigns" on whatsapp_campaigns;
drop policy if exists "Admins can update campaigns" on whatsapp_campaigns;
drop policy if exists "Admins can view all recipients" on whatsapp_campaign_recipients;
drop policy if exists "Admins can create recipients" on whatsapp_campaign_recipients;
drop policy if exists "Admins can update recipients" on whatsapp_campaign_recipients;

-- Create campaigns table (if not exists)
create table if not exists whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Campaign details
  name text not null,
  message text not null,
  
  -- User who created the campaign
  created_by uuid references auth.users(id) on delete cascade not null,
  
  -- Campaign status
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Counters
  total_recipients int not null default 0,
  sent_count int not null default 0,
  delivered_count int not null default 0,
  failed_count int not null default 0,
  pending_count int not null default 0,
  
  -- Mode (test or production)
  mode text not null default 'test' check (mode in ('test', 'production')),
  
  -- Metadata
  metadata jsonb default '{}'::jsonb,
  
  -- Error tracking
  error_message text,
  
  -- Completion timestamp
  completed_at timestamptz
);

-- Create index for faster queries
create index if not exists idx_whatsapp_campaigns_created_by on whatsapp_campaigns(created_by);
create index if not exists idx_whatsapp_campaigns_status on whatsapp_campaigns(status);
create index if not exists idx_whatsapp_campaigns_created_at on whatsapp_campaigns(created_at desc);

-- Create recipients table (if not exists)
create table if not exists whatsapp_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Reference to campaign
  campaign_id uuid references whatsapp_campaigns(id) on delete cascade not null,
  
  -- Recipient details
  name text not null,
  phone text not null,
  
  -- WhatsApp message ID from Meta API
  whatsapp_message_id text,
  
  -- Status tracking
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'delivered', 'read', 'failed')),
  
  -- Personalized message (after placeholder replacement)
  personalized_message text,
  
  -- Error tracking
  error_code text,
  error_message text,
  
  -- Timestamps for status changes
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  
  -- Metadata (API response, etc.)
  metadata jsonb default '{}'::jsonb
);

-- Create indexes for faster queries
create index if not exists idx_whatsapp_recipients_campaign_id on whatsapp_campaign_recipients(campaign_id);
create index if not exists idx_whatsapp_recipients_status on whatsapp_campaign_recipients(status);
create index if not exists idx_whatsapp_recipients_whatsapp_message_id on whatsapp_campaign_recipients(whatsapp_message_id);
create index if not exists idx_whatsapp_recipients_phone on whatsapp_campaign_recipients(phone);

-- Enable Row Level Security
alter table whatsapp_campaigns enable row level security;
alter table whatsapp_campaign_recipients enable row level security;

-- FIXED RLS Policies for whatsapp_campaigns
-- Check user metadata role OR email whitelist using correct Supabase JWT format
create policy "Admins can view all campaigns"
  on whatsapp_campaigns for select
  using (
    -- Check role in user metadata
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    or
    -- Check email whitelist (email is at root of JWT)
    coalesce((auth.jwt() ->> 'email'), '') in (
      'sailendrakondapalli@gmail.com',
      'adduriaswani@gmail.com',
      'susmithajewlaries@gmail.com',
      'nashejewels@gmail.com'
    )
  );

create policy "Admins can create campaigns"
  on whatsapp_campaigns for insert
  with check (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() ->> 'email'), '') in (
      'sailendrakondapalli@gmail.com',
      'adduriaswani@gmail.com',
      'susmithajewlaries@gmail.com',
      'nashejewels@gmail.com'
    )
  );

create policy "Admins can update campaigns"
  on whatsapp_campaigns for update
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() ->> 'email'), '') in (
      'sailendrakondapalli@gmail.com',
      'adduriaswani@gmail.com',
      'susmithajewlaries@gmail.com',
      'nashejewels@gmail.com'
    )
  );

-- FIXED RLS Policies for whatsapp_campaign_recipients
create policy "Admins can view all recipients"
  on whatsapp_campaign_recipients for select
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() ->> 'email'), '') in (
      'sailendrakondapalli@gmail.com',
      'adduriaswani@gmail.com',
      'susmithajewlaries@gmail.com',
      'nashejewels@gmail.com'
    )
  );

create policy "Admins can create recipients"
  on whatsapp_campaign_recipients for insert
  with check (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() ->> 'email'), '') in (
      'sailendrakondapalli@gmail.com',
      'adduriaswani@gmail.com',
      'susmithajewlaries@gmail.com',
      'nashejewels@gmail.com'
    )
  );

create policy "Admins can update recipients"
  on whatsapp_campaign_recipients for update
  using (
    coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
    or
    coalesce((auth.jwt() ->> 'email'), '') in (
      'sailendrakondapalli@gmail.com',
      'adduriaswani@gmail.com',
      'susmithajewlaries@gmail.com',
      'nashejewels@gmail.com'
    )
  );

-- Function to update campaign counters (recreate if exists)
create or replace function update_campaign_counters()
returns trigger as $$
begin
  -- Update the campaign counters based on recipient statuses
  update whatsapp_campaigns
  set
    sent_count = (
      select count(*) from whatsapp_campaign_recipients 
      where campaign_id = NEW.campaign_id 
      and status in ('sent', 'delivered', 'read')
    ),
    delivered_count = (
      select count(*) from whatsapp_campaign_recipients 
      where campaign_id = NEW.campaign_id 
      and status in ('delivered', 'read')
    ),
    failed_count = (
      select count(*) from whatsapp_campaign_recipients 
      where campaign_id = NEW.campaign_id 
      and status = 'failed'
    ),
    pending_count = (
      select count(*) from whatsapp_campaign_recipients 
      where campaign_id = NEW.campaign_id 
      and status in ('pending', 'sending')
    ),
    updated_at = now()
  where id = NEW.campaign_id;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to update campaign counters when recipient status changes
drop trigger if exists update_campaign_counters_trigger on whatsapp_campaign_recipients;
create trigger update_campaign_counters_trigger
  after insert or update of status on whatsapp_campaign_recipients
  for each row
  execute function update_campaign_counters();

-- Function to auto-complete campaigns
create or replace function auto_complete_campaigns()
returns trigger as $$
begin
  -- If all recipients are in a final state (sent/delivered/read/failed), mark campaign as completed
  if NEW.pending_count = 0 and NEW.status = 'processing' then
    update whatsapp_campaigns
    set 
      status = 'completed',
      completed_at = now(),
      updated_at = now()
    where id = NEW.id;
  end if;
  
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger to auto-complete campaigns
drop trigger if exists auto_complete_campaigns_trigger on whatsapp_campaigns;
create trigger auto_complete_campaigns_trigger
  after update of pending_count on whatsapp_campaigns
  for each row
  execute function auto_complete_campaigns();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant select, insert, update on whatsapp_campaigns to authenticated;
grant select, insert, update on whatsapp_campaign_recipients to authenticated;

-- Comments for documentation
comment on table whatsapp_campaigns is 'Stores WhatsApp bulk messaging campaigns';
comment on table whatsapp_campaign_recipients is 'Stores individual recipients and their delivery status for each campaign';
comment on column whatsapp_campaigns.mode is 'Campaign mode: test (using test numbers) or production (real numbers)';
comment on column whatsapp_campaign_recipients.whatsapp_message_id is 'Message ID returned by WhatsApp Cloud API for tracking';
