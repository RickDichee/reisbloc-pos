-- ==========================================
-- VERIFICAR CONFIGURACIÓN SUPABASE REALTIME
-- ==========================================

-- 1. Verificar publicaciones existentes
SELECT * FROM pg_publication;

-- 2. Verificar qué tablas están en la publicación supabase_realtime
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 3. Si NO aparece 'orders', AGREGAR LA TABLA:
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 4. Verificar que quedó agregada
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 5. OPCIONAL: Si quieres agregar TODAS las tablas a Realtime:
-- ALTER PUBLICATION supabase_realtime ADD TABLE users;
-- ALTER PUBLICATION supabase_realtime ADD TABLE products;
-- ALTER PUBLICATION supabase_realtime ADD TABLE sales;
-- ALTER PUBLICATION supabase_realtime ADD TABLE devices;
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
-- ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- ==========================================
-- NOTA IMPORTANTE:
-- ==========================================
-- Si la publicación 'supabase_realtime' no existe, créala así:
-- CREATE PUBLICATION supabase_realtime FOR TABLE orders, users, products, sales;
--
-- Luego REINICIA las conexiones Realtime desde tu app (refresca el navegador)
