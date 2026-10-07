-- ==============================================================================
-- FOODZA / FOODCONNECT — SUPABASE AUTH & ROW LEVEL SECURITY (RLS) SETUP
-- ==============================================================================
-- This script configures:
-- 1. Database schema alignment (adds supabase_uid to public.users if not present)
-- 2. Supabase Auth trigger to auto-create public.users and public.customers
-- 3. Row Level Security (RLS) policies for all exposed tables
-- ==============================================================================

-- 1. SCHEMA ALIGNMENT
--------------------------------------------------------------------------------
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS supabase_uid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_supabase_uid_key 
  ON public.users(supabase_uid);

-- 2. AUTH USER SYNC TRIGGER
--------------------------------------------------------------------------------
-- Automatically creates records in public.users (and public.customers)
-- whenever a new user signs up in auth.users via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public."UserRole";
  user_name TEXT;
  new_user_id TEXT;
BEGIN
  -- Read role safely from app_metadata (never user_metadata for authorization)
  -- Defaults to CUSTOMER if not explicitly specified
  assigned_role := COALESCE(
    (NEW.raw_app_meta_data->>'role')::public."UserRole",
    'CUSTOMER'::public."UserRole"
  );
  
  -- Read user's display name
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  new_user_id := gen_random_uuid()::text;

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    supabase_uid,
    name,
    email,
    phone,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    NEW.id::text,
    user_name,
    NEW.email,
    NEW.phone,
    assigned_role,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (supabase_uid) DO UPDATE
  SET 
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    updated_at = NOW();

  -- If customer, auto-create customer profile
  IF assigned_role = 'CUSTOMER' THEN
    INSERT INTO public.customers (
      id,
      user_id,
      name,
      phone,
      created_at,
      updated_at
    )
    SELECT 
      gen_random_uuid()::text,
      u.id,
      user_name,
      NEW.phone,
      NOW(),
      NOW()
    FROM public.users u
    WHERE u.supabase_uid = NEW.id::text
    ON CONFLICT (user_id) DO UPDATE
    SET 
      phone = COALESCE(EXCLUDED.phone, public.customers.phone),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger firing on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. ENABLE ROW LEVEL SECURITY (RLS) ON ALL CORE TABLES
--------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. PUBLIC CATALOG POLICIES (Restaurants & Menus)
--------------------------------------------------------------------------------
-- Public can browse active restaurants
DROP POLICY IF EXISTS "Public can view active restaurants" ON public.restaurants;
CREATE POLICY "Public can view active restaurants"
  ON public.restaurants FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Public can view menu categories
DROP POLICY IF EXISTS "Public can view menu categories" ON public.menu_categories;
CREATE POLICY "Public can view menu categories"
  ON public.menu_categories FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Public can view active menu items
DROP POLICY IF EXISTS "Public can view available menu items" ON public.menu_items;
CREATE POLICY "Public can view available menu items"
  ON public.menu_items FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE AND is_available = TRUE);

-- 5. USERS & PROFILES POLICIES
--------------------------------------------------------------------------------
-- Users can view and update their own record
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (supabase_uid = (SELECT auth.uid()::text));

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (supabase_uid = (SELECT auth.uid()::text))
  WITH CHECK (supabase_uid = (SELECT auth.uid()::text));

-- Customers can view and update their own customer record
DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
CREATE POLICY "Customers can view own profile"
  ON public.customers FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users WHERE supabase_uid = (SELECT auth.uid()::text)
  ));

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
CREATE POLICY "Customers can update own profile"
  ON public.customers FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users WHERE supabase_uid = (SELECT auth.uid()::text)
  ))
  WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE supabase_uid = (SELECT auth.uid()::text)
  ));

-- 6. ADDRESSES POLICIES
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Customers can manage own addresses" ON public.addresses;
CREATE POLICY "Customers can manage own addresses"
  ON public.addresses FOR ALL
  TO authenticated
  USING (customer_id IN (
    SELECT c.id FROM public.customers c 
    JOIN public.users u ON u.id = c.user_id 
    WHERE u.supabase_uid = (SELECT auth.uid()::text)
  ))
  WITH CHECK (customer_id IN (
    SELECT c.id FROM public.customers c 
    JOIN public.users u ON u.id = c.user_id 
    WHERE u.supabase_uid = (SELECT auth.uid()::text)
  ));

-- 7. ORDERS POLICIES
--------------------------------------------------------------------------------
-- Customers can view their own orders
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (customer_id IN (
    SELECT c.id FROM public.customers c 
    JOIN public.users u ON u.id = c.user_id 
    WHERE u.supabase_uid = (SELECT auth.uid()::text)
  ));

-- Restaurant managers can view and manage their restaurant's orders
DROP POLICY IF EXISTS "Managers can view restaurant orders" ON public.orders;
CREATE POLICY "Managers can view restaurant orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (restaurant_id IN (
    SELECT m.restaurant_id FROM public.managers m 
    JOIN public.users u ON u.id = m.user_id 
    WHERE u.supabase_uid = (SELECT auth.uid()::text)
  ));

-- Order items visible to the owning customer or store manager
DROP POLICY IF EXISTS "Users can view relevant order items" ON public.order_items;
CREATE POLICY "Users can view relevant order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT o.id FROM public.orders o
    WHERE o.customer_id IN (
      SELECT c.id FROM public.customers c 
      JOIN public.users u ON u.id = c.user_id 
      WHERE u.supabase_uid = (SELECT auth.uid()::text)
    )
    OR o.restaurant_id IN (
      SELECT m.restaurant_id FROM public.managers m 
      JOIN public.users u ON u.id = m.user_id 
      WHERE u.supabase_uid = (SELECT auth.uid()::text)
    )
  ));

-- 8. NOTIFICATIONS POLICIES
--------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM public.users WHERE supabase_uid = (SELECT auth.uid()::text)
  ));
