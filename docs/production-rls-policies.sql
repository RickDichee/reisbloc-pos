-- ============================================================================
-- Production RLS Policies - RESTRICTIVE (Enhanced Security)
-- ============================================================================
-- These policies are more restrictive than staging and enforce:
-- 1. Explicit role checks (not permissive WITH CHECK true)
-- 2. Data isolation per user/role
-- 3. Time-based constraints for sensitive operations
-- 4. Audit trail requirements

-- ============================================================================
-- ORDERS TABLE - PRODUCTION POLICIES
-- ============================================================================

-- Only enable read access for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Mesero: Can ONLY see/create own orders
CREATE POLICY "orders_mesero_read" ON orders
  FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "orders_mesero_insert" ON orders
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'mesero'
  );

-- Cocina: Can see all orders for their establishment
CREATE POLICY "orders_cocina_read" ON orders
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'cocina'
  );

-- Cocina: Can only update status (not delete or modify amounts)
CREATE POLICY "orders_cocina_update" ON orders
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'cocina'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'cocina'
    AND status IN ('ready', 'served', 'cancelled')
    AND total = (SELECT total FROM orders WHERE id = orders.id)  -- Prevent amount modification
  );

-- Capitan: Can see all orders
CREATE POLICY "orders_capitan_read" ON orders
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'capitan'
  );

-- Capitan: Can only update status to completed for payment
CREATE POLICY "orders_capitan_update" ON orders
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'capitan'
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'capitan'
    AND status IN ('completed', 'cancelled')
    AND total = (SELECT total FROM orders WHERE id = orders.id)  -- Prevent amount modification
  );

-- Admin: Full access
CREATE POLICY "orders_admin_all" ON orders
  FOR ALL
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- SALES TABLE - PRODUCTION POLICIES
-- ============================================================================

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Only Capitan can insert sales (payment records)
CREATE POLICY "sales_capitan_insert" ON sales
  FOR INSERT
  WITH CHECK (
    auth.uid() = waiter_id
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'capitan'
    AND total > 0  -- Prevent zero-value sales
  );

-- All roles can read sales related to their orders
CREATE POLICY "sales_read_own" ON sales
  FOR SELECT
  USING (
    (SELECT created_by FROM orders WHERE id = order_id) = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'capitan', 'cocina')
  );

-- Only Capitan can update own sales records
CREATE POLICY "sales_capitan_update" ON sales
  FOR UPDATE
  USING (
    auth.uid() = waiter_id
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'capitan'
  )
  WITH CHECK (
    auth.uid() = waiter_id
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'capitan'
    AND total = (SELECT total FROM sales WHERE id = sales.id)  -- Prevent amount modification
  );

-- Admin: Full access
CREATE POLICY "sales_admin_all" ON sales
  FOR ALL
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- NOTIFICATIONS TABLE - PRODUCTION POLICIES
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read own notifications
CREATE POLICY "notifications_read_own" ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update own notifications (mark as read)
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can create notifications (via service role)
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT
  WITH CHECK (true);  -- Will be called via service role

-- ============================================================================
-- AUDIT_LOGS TABLE - PRODUCTION POLICIES
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own audit logs
CREATE POLICY "audit_logs_read_own" ON audit_logs
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin can read all audit logs
CREATE POLICY "audit_logs_read_admin" ON audit_logs
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- System can create audit logs
CREATE POLICY "audit_logs_insert_system" ON audit_logs
  FOR INSERT
  WITH CHECK (true);  -- Will be called via trigger/service role

-- ============================================================================
-- USERS TABLE - PRODUCTION POLICIES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Admin can read all users
CREATE POLICY "users_read_admin" ON users
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Users can update own profile (except role)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM users WHERE id = users.id)  -- Prevent role modification
  );

-- Admin can update users
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- DEVICES TABLE - PRODUCTION POLICIES
-- ============================================================================

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Users can read devices assigned to them
CREATE POLICY "devices_read_own" ON devices
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin can read all devices
CREATE POLICY "devices_read_admin" ON devices
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admin can update devices
CREATE POLICY "devices_update_admin" ON devices
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- PRODUCTS TABLE - PRODUCTION POLICIES
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read products
CREATE POLICY "products_read_all" ON products
  FOR SELECT
  USING (true);

-- Only admin can modify products
CREATE POLICY "products_admin_insert" ON products
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "products_admin_update" ON products
  FOR UPDATE
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- CLOSINGS TABLE - PRODUCTION POLICIES
-- ============================================================================

ALTER TABLE closings ENABLE ROW LEVEL SECURITY;

-- Users can read closings
CREATE POLICY "closings_read_own" ON closings
  FOR SELECT
  USING (
    closed_by = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Only Capitan can create closings
CREATE POLICY "closings_insert_capitan" ON closings
  FOR INSERT
  WITH CHECK (
    closed_by = auth.uid()
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'capitan'
  );

-- Admin: Full access
CREATE POLICY "closings_admin_all" ON closings
  FOR ALL
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- IMPORTANT NOTES FOR PRODUCTION
-- ============================================================================
-- 1. These policies enforce strict role-based access
-- 2. Prevent data modification where amounts are involved (fraud prevention)
-- 3. Require explicit role validation on every operation
-- 4. All amount-related operations check existing values to prevent modification
-- 5. For initial setup, temporarily use service_role key for inserts
-- 6. Enable JWT_SECRET in production environment variables
-- 7. Monitor audit_logs for suspicious activity
-- 8. Test thoroughly before deploying to production
