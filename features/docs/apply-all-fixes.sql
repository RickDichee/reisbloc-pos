-- ============================================================================
-- SOLUCIÓN INTEGRAL: FIX DE FLUJO POS + PUSH NOTIFICATIONS
-- ============================================================================

BEGIN;

-- 0. ASEGURAR COLUMNAS CRÍTICAS (Fix Error 42703)
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

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

-- Limpieza de políticas de seguridad por dispositivo
DROP POLICY IF EXISTS "Device_based_select_orders" ON orders;
DROP POLICY IF EXISTS "Device_based_insert_orders" ON orders;
DROP POLICY IF EXISTS "Device_based_select_sales" ON sales;
DROP POLICY IF EXISTS "Device_based_select_products" ON products;

-- 3. SEGURIDAD PARA LA TABLA DEVICES (Necesario para LoginPin.tsx)
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow_device_management" ON public.devices
  FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);

-- 4. POLÍTICAS ZERO TRUST (Basadas en Dispositivo Aprobado)

-- Órdenes: Solo dispositivos aprobados del usuario creador pueden ver/insertar
CREATE POLICY "Device_based_select_orders" ON public.orders
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE public.devices.user_id = orders.created_by 
      AND public.devices.is_approved = true
    )
  );

CREATE POLICY "Device_based_insert_orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE public.devices.user_id = created_by 
      AND public.devices.is_approved = true
    )
  );

-- Ventas: Solo dispositivos aprobados pueden registrar cobros
CREATE POLICY "Device_based_select_sales" ON public.sales
  FOR ALL TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE public.devices.user_id = sales.waiter_id 
      AND public.devices.is_approved = true
    )
  );

-- Productos: Solo dispositivos aprobados pueden ver el catálogo
CREATE POLICY "Device_based_select_products" ON public.products
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.devices 
      WHERE public.devices.is_approved = true
    )
  );

-- 5. LÓGICA DE NOTIFICACIONES AUTOMÁTICAS
-- Esta función crea una notificación cada vez que entra una orden nueva
CREATE OR REPLACE FUNCTION public.on_new_order_notification()
RETURNS TRIGGER AS $notify_func$
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
$notify_func$ LANGUAGE plpgsql;

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
DO $realtime_setup$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $realtime_setup$;

COMMIT;