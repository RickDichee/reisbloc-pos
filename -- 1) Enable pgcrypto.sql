-- 1) Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Add columns to devices_v2
ALTER TABLE IF EXISTS public.devices_v2
  ADD COLUMN IF NOT EXISTS mac_address text,
  ADD COLUMN IF NOT EXISTS fingerprint text,
  ADD COLUMN IF NOT EXISTS device_token_hash text;

-- 3) Create or replace devices_view unifying devices and devices_v2
CREATE OR REPLACE VIEW public.devices_view AS
SELECT d.id,
       d.user_id,
       d.is_approved,
       COALESCE(d.mac_address, dv.mac_address) AS mac_address,
       COALESCE(d.fingerprint, dv.fingerprint) AS fingerprint,
       COALESCE(d.device_token_hash, dv.device_token_hash) AS device_token_hash,
       d.created_at,
       d.updated_at
FROM public.devices d
FULL OUTER JOIN public.devices_v2 dv ON d.id = dv.id;

-- 4) Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial primary key,
  user_id uuid NULL,
  device_id uuid NULL,
  event_type text NOT NULL,
  event_payload jsonb NULL,
  ip text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Create device_is_valid function
CREATE OR REPLACE FUNCTION public.device_is_valid(
  device_uuid uuid,
  provided_fingerprint text,
  provided_mac text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
BEGIN
  IF device_uuid IS NULL THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO v_count
  FROM public.devices_view dv
  WHERE dv.id = device_uuid
    AND dv.is_approved = true
    AND (
      (dv.mac_address IS NOT NULL AND dv.mac_address = provided_mac)
      OR (dv.fingerprint IS NOT NULL AND dv.fingerprint = provided_fingerprint)
    );

  RETURN v_count > 0;
END;
$$;

-- revoke execute from anon and authenticated for the function
REVOKE ALL ON FUNCTION public.device_is_valid(uuid,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.device_is_valid(uuid,text,text) FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.device_is_valid(uuid,text,text) TO supabase_auth_admin;

-- 6) Example: update RLS policies for orders table (replace with your actual table names)
-- Ensure RLS enabled
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies that are too open if exist (example names)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'orders_select_authenticated') THEN
    EXECUTE 'DROP POLICY orders_select_authenticated ON public.orders';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'orders_insert_authenticated') THEN
    EXECUTE 'DROP POLICY orders_insert_authenticated ON public.orders';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'orders_update_authenticated') THEN
    EXECUTE 'DROP POLICY orders_update_authenticated ON public.orders';
  END IF;
END$$;

-- Create policies using device_is_valid and role check
CREATE POLICY orders_select_authenticated ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'authenticated'
    AND (
      public.device_is_valid((auth.jwt() ->> 'device_id')::uuid, auth.jwt() ->> 'fingerprint', auth.jwt() ->> 'mac_address')
    )
  );

CREATE POLICY orders_insert_authenticated ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'authenticated'
    AND (
      public.device_is_valid((auth.jwt() ->> 'device_id')::uuid, auth.jwt() ->> 'fingerprint', auth.jwt() ->> 'mac_address')
    )
  );

CREATE POLICY orders_update_authenticated ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'authenticated'
    AND (
      public.device_is_valid((auth.jwt() ->> 'device_id')::uuid, auth.jwt() ->> 'fingerprint', auth.jwt() ->> 'mac_address')
    )
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'authenticated'
    AND (
      public.device_is_valid((auth.jwt() ->> 'device_id')::uuid, auth.jwt() ->> 'fingerprint', auth.jwt() ->> 'mac_address')
    )
  );

-- 7) Add rate-limit/lockout columns to admin_on_site
ALTER TABLE IF EXISTS public.admin_on_site
  ADD COLUMN IF NOT EXISTS failed_pin_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz NULL;

-- 8) Trigger function to insert audit logs (generic)
CREATE OR REPLACE FUNCTION public.fn_audit_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs(user_id, device_id, event_type, event_payload, ip, user_agent, created_at)
  VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    COALESCE(NEW.device_id, OLD.device_id),
    TG_ARGV[0],
    to_jsonb(COALESCE(NEW, OLD)),
    inet_client_addr()::text,
    current_setting('request.headers')::text,
    now()
  );
  RETURN NEW;
END;
$$;

-- 9) Example triggers: on devices_v2 inserts/updates and on orders insert
DROP TRIGGER IF EXISTS devices_v2_audit_trig ON public.devices_v2;
CREATE TRIGGER devices_v2_audit_trig
AFTER INSERT OR UPDATE ON public.devices_v2
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_insert('device_change');

DROP TRIGGER IF EXISTS orders_audit_trig ON public.orders;
CREATE TRIGGER orders_audit_trig
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_insert('order_change');

-- 10) Lockout helper function: increment and check
CREATE OR REPLACE FUNCTION public.record_pin_failure(p_admin_on_site_id uuid) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.admin_on_site
  SET failed_pin_attempts = COALESCE(failed_pin_attempts,0) + 1
  WHERE id = p_admin_on_site_id;

  IF (SELECT failed_pin_attempts FROM public.admin_on_site WHERE id = p_admin_on_site_id) >= 3 THEN
    UPDATE public.admin_on_site SET locked_until = now() + interval '15 minutes' WHERE id = p_admin_on_site_id;
  END IF;
END;
$$;

-- Grant necessary privileges
GRANT SELECT ON public.devices_view TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO supabase_auth_admin;

