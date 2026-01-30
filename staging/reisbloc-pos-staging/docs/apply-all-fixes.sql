-- ============================================================================
-- SOLUCIÓN INTEGRAL: FIX DE FLUJO POS + PUSH NOTIFICATIONS
-- ============================================================================

BEGIN;

-- 1. CREACIÓN DE TABLAS FALTANTES (Si no existen)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text,
  priority text DEFAULT 'normal',
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;


-- 2. LIMPIEZA DE POLÍTICAS PREVIAS (Para evitar conflictos)
-- Eliminamos las políticas que causan recursión infinita
DROP POLICY IF EXISTS "orders_cocina_update" ON orders;
DROP POLICY IF EXISTS "orders_capitan_update" ON orders;
DROP POLICY IF EXISTS "orders_mesero_read" ON orders;
DROP POLICY IF EXISTS "orders_mesero_insert" ON orders;
DROP POLICY IF EXISTS "orders_cocina_read" ON orders;
DROP POLICY IF EXISTS "orders_capitan_read" ON orders;
DROP POLICY IF EXISTS "orders_admin_all" ON orders;

-- Limpieza de políticas del fix anterior
DROP POLICY IF EXISTS "POS_flow_insert_orders" ON orders;
DROP POLICY IF EXISTS "POS_flow_select_orders" ON orders;
DROP POLICY IF EXISTS "POS_flow_update_orders" ON orders;
DROP POLICY IF EXISTS "POS_flow_insert_sales" ON sales;
DROP POLICY IF EXISTS "POS_flow_select_sales" ON sales;
DROP POLICY IF EXISTS "Allow anon to manage push subscriptions" ON push_subscriptions;

-- 3. PERMISOS PARA ÓRDENES (Permite que el Front anónimo guarde y vea datos)
CREATE POLICY "POS_flow_insert_orders" ON orders
  FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = created_by AND active = true));

CREATE POLICY "POS_flow_select_orders" ON orders
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "POS_flow_update_orders" ON orders
  FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- 4. PERMISOS PARA VENTAS (Persistencia de cobros)
CREATE POLICY "POS_flow_insert_sales" ON sales
  FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = waiter_id AND active = true));

CREATE POLICY "POS_flow_select_sales" ON sales
  FOR SELECT TO anon
  USING (true);

-- 5. LÓGICA DE NOTIFICACIONES AUTOMÁTICAS
-- Esta función crea una notificación cada vez que entra una orden nueva
CREATE OR REPLACE FUNCTION public.on_new_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, title, body, type, priority, data)
  SELECT id, 
         '🍳 Nueva Comanda: Mesa ' || NEW.table_number, 
         'Hay ' || COALESCE(jsonb_array_length(NEW.items), 0) || ' productos nuevos. ¡Manos a la obra!', 
         'order', -- Cambiado para que coincida con el icono de Package en el front
         'high',  -- Prioridad alta para que salga con borde rojo
         jsonb_build_object('order_id', NEW.id, 'table', NEW.table_number)
  FROM users 
  WHERE role IN ('cocina', 'bar', 'admin') 
    AND active = true 
    AND id != NEW.created_by; -- No notificar al que creó la orden
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que dispara la función anterior
DROP TRIGGER IF EXISTS tr_notify_new_order ON orders;
CREATE TRIGGER tr_notify_new_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_order_notification();

-- 6. SUSCRIPCIONES PUSH Y NOTIFICACIONES
-- Permite que el navegador guarde el token de notificaciones
CREATE POLICY "Allow anon to manage push subscriptions" ON push_subscriptions
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon to read notifications" ON notifications
  FOR SELECT TO anon USING (true);

-- 7. HABILITAR REALTIME (Asegurarnos que las tablas avisen al Front)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

COMMIT;
-- ============================================================================
{
    "isAuthenticated": true,
    "device": {
        "id": "f36c02a3-c39d-4aaa-b4d3-107ff746c040",
        "userId": "54b145c1-6fb1-446b-99c8-01c28bd952fb",
        "macAddress": "00:00:0F:96:64:01",
        "deviceName": "Linux Device",
        "network": "mobile",
        "os": null,
        "browser": null,
        "deviceType": "tablet",
        "fingerprint": null,
        "registeredAt": "2026-01-27T07:44:23.099Z",
        "lastAccess": "2026-01-28T05:25:47.633Z",
        "isApproved": true,
        "isRejected": false
    },
    "needsApproval": false
}{
    "isAuthenticated": true,
    "device": {
        "id": "f36c02a3-c39d-4aaa-b4d3-107ff746c040",
        "userId": "54b145c1-6fb1-446b-99c8-01c28bd952fb",
        "macAddress": "00:00:0F:96:64:01",
        "deviceName": "Linux Device",
        "network": "mobile",
        "os": null,
        "browser": null,
        "deviceType": "tablet",
        "fingerprint": null,
        "registeredAt": "2026-01-27T07:44:23.099Z",
        "lastAccess": "2026-01-28T05:25:47.633Z",
        "isApproved": true,
        "isRejected": false
    },
    "needsApproval": false