-- ================================================
-- VERIFICAR SCHEMA DE TABLA SALES EN SUPABASE
-- ================================================

-- 1. Ver estructura de tabla sales
\d sales

-- 2. Ver todas las columnas y tipos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sales'
ORDER BY ordinal_position;

-- 3. Ver constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'sales';

-- 4. Ver foreign keys
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'sales';

-- 5. Intentar insertar un registro de prueba
INSERT INTO sales (
  order_id,
  waiter_id,
  table_number,
  items,
  subtotal,
  tip_amount,
  tip_percentage,
  total,
  payment_method,
  device_id
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,  -- NULL es válido
  '00000000-0000-0000-0000-000000000000'::uuid,  -- NULL es válido
  1,
  '[]'::jsonb,
  100.00,
  10.00,
  10,
  110.00,
  'cash',
  NULL
);

-- 6. Ver registros recientes
SELECT * FROM sales ORDER BY created_at DESC LIMIT 10;
