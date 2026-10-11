-- =============================================
-- COMPLETE DATABASE MIGRATION
-- E-commerce + Admin Panel + WhatsApp Campaigns
-- For New Supabase Account Setup
-- =============================================
-- Run this entire file in Supabase SQL Editor
-- This will set up all tables, policies, triggers, and storage buckets
-- =============================================

-- =============================================
-- CORE E-COMMERCE TABLES
-- =============================================

-- Products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  category text not null,
  description text,
  images text[] default '{}',
  tags text[] default '{}',
  stock integer default 0,
  size text default 'Medium',
  series_id text default 'NS0',
  created_at timestamptz default now()
);

-- Cart table
create table if not exists cart (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Orders table
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  total_amount numeric not null,
  payment_status text default 'pending',
  address text,
  city text,
  state text,
  pincode text,
  order_series text,
  razorpay_payment_id text,
  razorpay_order_id text,
  payment_method text default 'upi',
  payment_screenshot_url text,
  upi_ref text,
  payment_verified boolean default false,
  tracking_id text,
  tracking_image_url text,
  tracking_updated_at timestamptz,
  created_at timestamptz default now()
);

-- Order items table
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  price numeric not null
);

-- Wishlist table
create table if not exists wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Stock history table (audit log)
create table if not exists stock_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  old_stock integer,
  new_stock integer,
  changed_by uuid references auth.users(id),
  reason text,
  created_at timestamptz default now()
);

-- Reviews table
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  user_avatar text,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz default now()
);

-- Site settings table
create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Promo codes table
create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null default 'percentage',
  discount_value numeric not null,
  min_order_amount numeric default 0,
  applicable_category text default null,
  is_one_time boolean default false,
  is_active boolean default true,
  expires_at timestamptz default null,
  created_at timestamptz default now()
);

-- Promo code usage tracking
create table if not exists promo_code_uses (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references promo_codes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  order_id uuid default null,
  used_at timestamptz default now(),
  unique(code_id, user_id)
);

-- =============================================
-- WHATSAPP CAMPAIGNS TABLES
-- =============================================

-- WhatsApp campaigns table
create table if not exists whatsapp_campaigns (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  message text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_recipients int not null default 0,
  sent_count int not null default 0,
  delivered_count int not null default 0,
  failed_count int not null default 0,
  pending_count int not null default 0,
  mode text not null default 'test' check (mode in ('test', 'production')),
  metadata jsonb default '{}'::jsonb,
  error_message text,
  completed_at timestamptz
);

-- WhatsApp campaign recipients table
create table if not exists whatsapp_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  campaign_id uuid references whatsapp_campaigns(id) on delete cascade not null,
  name text not null,
  phone text not null,
  whatsapp_message_id text,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'delivered', 'read', 'failed')),
  personalized_message text,
  error_code text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Products indexes
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_created_at on products(created_at desc);

-- Orders indexes
create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_payment_status on orders(payment_status);

-- WhatsApp campaigns indexes
create index if not exists idx_whatsapp_campaigns_created_by on whatsapp_campaigns(created_by);
create index if not exists idx_whatsapp_campaigns_status on whatsapp_campaigns(status);
create index if not exists idx_whatsapp_campaigns_created_at on whatsapp_campaigns(created_at desc);
create index if not exists idx_whatsapp_recipients_campaign_id on whatsapp_campaign_recipients(campaign_id);
create index if not exists idx_whatsapp_recipients_status on whatsapp_campaign_recipients(status);
create index if not exists idx_whatsapp_recipients_whatsapp_message_id on whatsapp_campaign_recipients(whatsapp_message_id);
create index if not exists idx_whatsapp_recipients_phone on whatsapp_campaign_recipients(phone);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
alter table products enable row level security;
alter table cart enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table wishlist enable row level security;
alter table stock_history enable row level security;
alter table reviews enable row level security;
alter table site_settings enable row level security;
alter table promo_codes enable row level security;
alter table promo_code_uses enable row level security;
alter table whatsapp_campaigns enable row level security;
alter table whatsapp_campaign_recipients enable row level security;

-- Drop existing policies if they exist (for clean reinstall)
drop policy if exists "Products are viewable by everyone" on products;
drop policy if exists "Only admins can insert products" on products;
drop policy if exists "Only admins can update products" on products;
drop policy if exists "Only admins can delete products" on products;
drop policy if exists "Users can view own cart" on cart;
drop policy if exists "Users can insert own cart" on cart;
drop policy if exists "Users can update own cart" on cart;
drop policy if exists "Users can delete own cart" on cart;
drop policy if exists "Users can view own orders" on orders;
drop policy if exists "Users can insert own orders" on orders;
drop policy if exists "Admins can view all orders" on orders;
drop policy if exists "Admins can update orders" on orders;
drop policy if exists "Users manage own orders update" on orders;
drop policy if exists "Users can view own order items" on order_items;
drop policy if exists "Users can insert order items" on order_items;
drop policy if exists "Admins can view all order items" on order_items;
drop policy if exists "Users can view own wishlist" on wishlist;
drop policy if exists "Users can insert own wishlist" on wishlist;
drop policy if exists "Users can delete own wishlist" on wishlist;
drop policy if exists "Admins can manage stock history" on stock_history;
drop policy if exists "Reviews are public" on reviews;
drop policy if exists "Users can insert own review" on reviews;
drop policy if exists "Users can update own review" on reviews;
drop policy if exists "Users can delete own review" on reviews;
drop policy if exists "Anyone can read site settings" on site_settings;
drop policy if exists "Authenticated can update site settings" on site_settings;
drop policy if exists "Public can read active promo codes" on promo_codes;
drop policy if exists "Admins manage promo codes" on promo_codes;
drop policy if exists "Users read own promo uses" on promo_code_uses;
drop policy if exists "Users insert own promo uses" on promo_code_uses;
drop policy if exists "Admins read all promo uses" on promo_code_uses;
drop policy if exists "Admins can view all campaigns" on whatsapp_campaigns;
drop policy if exists "Admins can create campaigns" on whatsapp_campaigns;
drop policy if exists "Admins can update campaigns" on whatsapp_campaigns;
drop policy if exists "Admins can view all recipients" on whatsapp_campaign_recipients;
drop policy if exists "Admins can create recipients" on whatsapp_campaign_recipients;
drop policy if exists "Admins can update recipients" on whatsapp_campaign_recipients;

-- Products: anyone can read, only admins can write
create policy "Products are viewable by everyone" on products for select using (true);
create policy "Only admins can insert products" on products for insert with check (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);
create policy "Only admins can update products" on products for update using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);
create policy "Only admins can delete products" on products for delete using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);

-- Cart: users can only access their own cart
create policy "Users can view own cart" on cart for select using (auth.uid() = user_id);
create policy "Users can insert own cart" on cart for insert with check (auth.uid() = user_id);
create policy "Users can update own cart" on cart for update using (auth.uid() = user_id);
create policy "Users can delete own cart" on cart for delete using (auth.uid() = user_id);

-- Orders: users can access their own orders, admins can access all
create policy "Users can view own orders" on orders for select using (
  auth.uid() = user_id
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);
create policy "Users can insert own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Users can update own orders" on orders for update using (
  auth.uid() = user_id
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);

-- Order items: users can view their own order items, admins can view all
create policy "Users can view own order items" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  or coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);
create policy "Users can insert order items" on order_items for insert with check (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

-- Wishlist: users can only access their own wishlist
create policy "Users can view own wishlist" on wishlist for select using (auth.uid() = user_id);
create policy "Users can insert own wishlist" on wishlist for insert with check (auth.uid() = user_id);
create policy "Users can delete own wishlist" on wishlist for delete using (auth.uid() = user_id);

-- Stock history: only admins
create policy "Admins can manage stock history" on stock_history for all using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);

-- Reviews: anyone can read, users can manage their own
create policy "Reviews are public" on reviews for select using (true);
create policy "Users can insert own review" on reviews for insert with check (auth.uid() = user_id);
create policy "Users can update own review" on reviews for update using (auth.uid() = user_id);
create policy "Users can delete own review" on reviews for delete using (auth.uid() = user_id);

-- Site settings: anyone can read, authenticated can update
create policy "Anyone can read site settings" on site_settings for select using (true);
create policy "Authenticated can update site settings" on site_settings for all using (auth.role() = 'authenticated');

-- Promo codes: public can read active codes, admins can manage
create policy "Public can read active promo codes" on promo_codes for select using (is_active = true);
create policy "Admins manage promo codes" on promo_codes for all using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);

-- Promo code uses: users can manage their own, admins can view all
create policy "Users read own promo uses" on promo_code_uses for select using (auth.uid() = user_id);
create policy "Users insert own promo uses" on promo_code_uses for insert with check (auth.uid() = user_id);
create policy "Admins read all promo uses" on promo_code_uses for select using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com',
    'naveenreddygandluri51@gmail.com',
    'aswaniadduri11@gmail.com',
    'ssbmanogna@gmail.com'
  )
);

-- WhatsApp campaigns: only admins
create policy "Admins can view all campaigns" on whatsapp_campaigns for select using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com'
  )
);
create policy "Admins can create campaigns" on whatsapp_campaigns for insert with check (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com'
  )
);
create policy "Admins can update campaigns" on whatsapp_campaigns for update using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com'
  )
);

-- WhatsApp campaign recipients: only admins
create policy "Admins can view all recipients" on whatsapp_campaign_recipients for select using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com'
  )
);
create policy "Admins can create recipients" on whatsapp_campaign_recipients for insert with check (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com'
  )
);
create policy "Admins can update recipients" on whatsapp_campaign_recipients for update using (
  coalesce((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  or coalesce((auth.jwt() ->> 'email'), '') in (
    'sailendrakondapalli@gmail.com',
    'adduriaswani@gmail.com',
    'susmithajewlaries@gmail.com',
    'nashejewels@gmail.com'
  )
);

-- =============================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =============================================

-- Function to auto-reduce stock after order
create or replace function reduce_stock_on_order()
returns trigger as $$
begin
  update products
  set stock = stock - new.quantity
  where id = new.product_id and stock >= new.quantity;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists after_order_item_insert on order_items;
create trigger after_order_item_insert
  after insert on order_items
  for each row execute function reduce_stock_on_order();

-- Function to update campaign counters
create or replace function update_campaign_counters()
returns trigger as $$
begin
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

drop trigger if exists update_campaign_counters_trigger on whatsapp_campaign_recipients;
create trigger update_campaign_counters_trigger
  after insert or update of status on whatsapp_campaign_recipients
  for each row execute function update_campaign_counters();

-- Function to auto-complete campaigns
create or replace function auto_complete_campaigns()
returns trigger as $$
begin
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

drop trigger if exists auto_complete_campaigns_trigger on whatsapp_campaigns;
create trigger auto_complete_campaigns_trigger
  after update of pending_count on whatsapp_campaigns
  for each row execute function auto_complete_campaigns();

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Product images bucket (public)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Payment screenshots bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-screenshots', 'payment-screenshots', false, 10485760,
  array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do update set file_size_limit = 10485760;

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Drop existing storage policies if they exist
drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;
drop policy if exists "Users upload own payment screenshot" on storage.objects;
drop policy if exists "Admins read payment screenshots" on storage.objects;

-- Product images: public read, authenticated upload/delete
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' AND auth.role() = 'authenticated');

create policy "Admins can delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Payment screenshots: only owner can upload, admins can read
create policy "Users upload own payment screenshot"
  on storage.objects for insert
  with check (bucket_id = 'payment-screenshots' and auth.role() = 'authenticated');

create policy "Admins read payment screenshots"
  on storage.objects for select
  using (bucket_id = 'payment-screenshots' and auth.role() = 'authenticated');

-- =============================================
-- DEFAULT SITE SETTINGS
-- =============================================

insert into site_settings (key, value)
values 
  ('hero_video_url', ''),
  ('offer_banner', ''),
  ('promo_banners', '')
on conflict (key) do nothing;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

grant usage on schema public to anon, authenticated;
grant select, insert, update on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Next steps:
-- 1. Deploy Edge Functions (send-whatsapp-campaign, whatsapp-webhook)
-- 2. Set Supabase secrets for WhatsApp API
-- 3. Update frontend .env with new Supabase credentials
-- =============================================
