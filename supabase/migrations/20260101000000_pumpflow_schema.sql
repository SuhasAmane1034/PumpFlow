-- ==============================================================================
-- PUMPFLOW - Submersible Pump Dealer Management System (Solapur, Maharashtra)
-- Complete PostgreSQL / Supabase Production Database Schema & Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUMS & DOMAINS
-- -----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('admin', 'manager', 'salesperson');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE pump_phase_enum AS ENUM ('single_phase', 'three_phase');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_type_enum AS ENUM ('retailer', 'farmer', 'dealer', 'contractor', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status_enum AS ENUM ('paid', 'partially_paid', 'pending', 'overdue', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status_enum AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_mode_enum AS ENUM ('cash', 'upi', 'bank_transfer', 'cheque', 'credit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE stock_movement_type_enum AS ENUM ('purchase_in', 'sale_out', 'return_in', 'damage_out', 'manual_adjustment', 'quotation_converted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel_enum AS ENUM ('whatsapp', 'sms', 'email');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status_enum AS ENUM ('queued', 'sent', 'delivered', 'failed', 'read');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. BUSINESS SETTINGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name VARCHAR(255) NOT NULL DEFAULT 'Shree Samarth Pumps & Electricals',
  shop_owner VARCHAR(255) DEFAULT 'Solapur Pump Dealer',
  tagline VARCHAR(255) DEFAULT 'Complete Submersible, Monoblock & Agriculture Solutions',
  address TEXT NOT NULL DEFAULT 'Shop No. 12, Market Yard, Solapur - 413002',
  city VARCHAR(100) DEFAULT 'Solapur',
  district VARCHAR(100) DEFAULT 'Solapur',
  state VARCHAR(100) DEFAULT 'Maharashtra',
  pincode VARCHAR(20) DEFAULT '413002',
  contact_number VARCHAR(20) NOT NULL DEFAULT '+91 98220 12345',
  alternate_number VARCHAR(20) DEFAULT '+91 94220 67890',
  whatsapp_number VARCHAR(20) NOT NULL DEFAULT '+91 98220 12345',
  email VARCHAR(255) DEFAULT 'samarthpumps.solapur@gmail.com',
  gstin VARCHAR(50) DEFAULT '27AABCS1429B1Z2',
  state_code VARCHAR(10) DEFAULT '27',
  bank_name VARCHAR(150) DEFAULT 'State Bank of India',
  bank_account_number VARCHAR(50) DEFAULT '38291048291',
  bank_ifsc VARCHAR(50) DEFAULT 'SBIN0000483',
  bank_branch VARCHAR(100) DEFAULT 'Market Yard Solapur',
  upi_id VARCHAR(100) DEFAULT 'samarthpumps@sbi',
  upi_qr_url TEXT,
  logo_url TEXT,
  invoice_prefix VARCHAR(20) DEFAULT 'INV-',
  quotation_prefix VARCHAR(20) DEFAULT 'QUO-',
  receipt_prefix VARCHAR(20) DEFAULT 'REC-',
  invoice_terms TEXT DEFAULT '1. Goods once sold will not be taken back without original bill. 2. Motor pump warranty as per manufacturer policy. 3. Overdue interest @18% p.a. charged after due date.',
  quotation_terms TEXT DEFAULT '1. Quotation valid for 15 days from issue date. 2. GST and delivery extra as applicable.',
  whatsapp_api_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_api_key TEXT,
  whatsapp_phone_number_id TEXT,
  whatsapp_business_account_id TEXT,
  whatsapp_template_name VARCHAR(100) DEFAULT 'payment_reminder_marathi',
  whatsapp_quiet_hours_start TIME DEFAULT '21:00:00',
  whatsapp_quiet_hours_end TIME DEFAULT '09:00:00',
  default_credit_days INTEGER DEFAULT 15,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. USERS & ROLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE, -- References supabase.auth.users
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'salesperson',
  is_active BOOLEAN DEFAULT TRUE,
  password_hash TEXT, -- For custom auth fallback
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. CUSTOMERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  village_city VARCHAR(150),
  taluka VARCHAR(100),
  district VARCHAR(100) DEFAULT 'Solapur',
  state VARCHAR(100) DEFAULT 'Maharashtra',
  gstin VARCHAR(50),
  customer_type customer_type_enum DEFAULT 'farmer',
  credit_limit NUMERIC(12, 2) DEFAULT 100000.00,
  opening_balance NUMERIC(12, 2) DEFAULT 0.00,
  current_outstanding NUMERIC(12, 2) DEFAULT 0.00,
  reminder_opt_out BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_outstanding ON customers(current_outstanding);

-- -----------------------------------------------------------------------------
-- 5. SUPPLIERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  contact_number VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100) DEFAULT 'Maharashtra',
  gstin VARCHAR(50),
  opening_balance NUMERIC(12, 2) DEFAULT 0.00,
  current_outstanding NUMERIC(12, 2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. PRODUCT CATEGORIES & BRANDS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  marathi_name VARCHAR(150),
  description TEXT,
  icon_name VARCHAR(50) DEFAULT 'Package',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. PRODUCTS (Submersible pump specific attributes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  model_number VARCHAR(100) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  -- Submersible technical specs
  hp VARCHAR(20),               -- e.g. '5.0 HP', '7.5 HP', '10.0 HP'
  voltage VARCHAR(50),          -- e.g. '220V', '415V'
  phase pump_phase_enum DEFAULT 'three_phase',
  pump_type VARCHAR(100),       -- e.g. 'V4 Water Filled', 'V6 Oil Filled', 'Openwell Submersible'
  discharge_capacity VARCHAR(100), -- e.g. '200 - 450 LPM'
  head_range VARCHAR(100),      -- e.g. '30 - 90 meters'
  bore_size VARCHAR(50),        -- e.g. '100mm (4 inch)', '150mm (6 inch)'
  stages INTEGER,               -- e.g. 5, 8, 10
  hsn_code VARCHAR(20) DEFAULT '84137010',
  gst_percentage NUMERIC(5, 2) DEFAULT 18.00,
  purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  mrp NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  minimum_stock_quantity INTEGER NOT NULL DEFAULT 3,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(available_quantity);

-- -----------------------------------------------------------------------------
-- 8. PRODUCT SERIAL NUMBERS (For pump sets & motors)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_serials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  serial_number VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'in_stock', -- in_stock, sold, returned, defective
  sale_id UUID,
  purchase_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. INVENTORY MOVEMENTS (Stock audit ledger)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  movement_type stock_movement_type_enum NOT NULL,
  quantity INTEGER NOT NULL, -- positive for in, negative for out
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_id UUID, -- sale_id or purchase_id
  reference_number VARCHAR(100),
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_created ON inventory_movements(created_at);

-- -----------------------------------------------------------------------------
-- 10. SALES / INVOICES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  quotation_id UUID,
  -- Billing financials (precision NUMERIC)
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  item_discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  invoice_discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  taxable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  is_interstate BOOLEAN DEFAULT FALSE,
  cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  igst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  round_off NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_status invoice_status_enum NOT NULL DEFAULT 'pending',
  primary_payment_mode payment_mode_enum DEFAULT 'cash',
  notes TEXT,
  terms_conditions TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_num ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_due ON sales(due_date);

-- -----------------------------------------------------------------------------
-- 11. SALE ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  hsn_code VARCHAR(50),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) DEFAULT 0.00,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  taxable_amount NUMERIC(12, 2) NOT NULL,
  gst_percentage NUMERIC(5, 2) NOT NULL,
  cgst_rate NUMERIC(5, 2) DEFAULT 0.00,
  cgst_amount NUMERIC(12, 2) DEFAULT 0.00,
  sgst_rate NUMERIC(5, 2) DEFAULT 0.00,
  sgst_amount NUMERIC(12, 2) DEFAULT 0.00,
  igst_rate NUMERIC(5, 2) DEFAULT 0.00,
  igst_amount NUMERIC(12, 2) DEFAULT 0.00,
  total_tax NUMERIC(12, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  serial_numbers TEXT[], -- Array of serial numbers sold
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- -----------------------------------------------------------------------------
-- 12. QUOTATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number VARCHAR(100) UNIQUE NOT NULL,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  status quotation_status_enum NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  taxable_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  converted_sale_id UUID REFERENCES sales(id),
  converted_at TIMESTAMPTZ,
  notes TEXT,
  terms_conditions TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) DEFAULT 0.00,
  gst_percentage NUMERIC(5, 2) NOT NULL,
  tax_amount NUMERIC(12, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 13. PAYMENTS & TRANSACTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  sale_id UUID REFERENCES sales(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode payment_mode_enum NOT NULL DEFAULT 'cash',
  transaction_ref VARCHAR(100), -- UPI Ref / Cheque No / Bank UTR
  cheque_bank VARCHAR(100),
  cheque_date DATE,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_sale ON payments(sale_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- -----------------------------------------------------------------------------
-- 14. PURCHASES (Stock in from manufacturers)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_invoice_number VARCHAR(100) NOT NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  payment_status VARCHAR(50) DEFAULT 'paid',
  payment_mode payment_mode_enum DEFAULT 'bank_transfer',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  purchase_price NUMERIC(12, 2) NOT NULL,
  gst_percentage NUMERIC(5, 2) DEFAULT 18.00,
  tax_amount NUMERIC(12, 2) DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 15. CUSTOMER LEDGER (Permanent double-entry records)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type VARCHAR(50) NOT NULL, -- 'invoice', 'payment', 'return', 'opening_balance'
  reference_id UUID,
  reference_number VARCHAR(100),
  description TEXT,
  debit NUMERIC(12, 2) DEFAULT 0.00,   -- Money owed by customer (invoices)
  credit NUMERIC(12, 2) DEFAULT 0.00,  -- Money paid by customer (payments)
  balance NUMERIC(12, 2) NOT NULL,     -- Cumulative balance after entry
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_ledger_cust ON customer_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_ledger_date ON customer_ledger(entry_date);

-- -----------------------------------------------------------------------------
-- 16. NOTIFICATION TEMPLATES & LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  channel notification_channel_enum NOT NULL DEFAULT 'whatsapp',
  language VARCHAR(20) NOT NULL DEFAULT 'mr', -- mr (Marathi), en (English)
  content TEXT NOT NULL,
  variables TEXT[], -- e.g. ['customer_name', 'outstanding_amount', 'invoice_number', 'due_date']
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  channel notification_channel_enum NOT NULL DEFAULT 'whatsapp',
  recipient_phone VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  status notification_status_enum NOT NULL DEFAULT 'sent',
  provider_message_id VARCHAR(100),
  error_message TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_customer ON notification_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_sale ON notification_logs(sale_id);

-- -----------------------------------------------------------------------------
-- 17. AUDIT LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 18. DATABASE VIEWS FOR INSTANT DASHBOARD REPORTING
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW view_dealer_dashboard_summary AS
SELECT
  (SELECT COALESCE(SUM(grand_total), 0) FROM sales WHERE payment_status != 'cancelled') AS total_sales,
  (SELECT COALESCE(SUM(grand_total), 0) FROM sales WHERE invoice_date = CURRENT_DATE AND payment_status != 'cancelled') AS today_sales,
  (SELECT COALESCE(SUM(grand_total), 0) FROM sales WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE) AND payment_status != 'cancelled') AS monthly_sales,
  (SELECT COALESCE(SUM(outstanding_balance), 0) FROM sales WHERE payment_status != 'cancelled') AS total_outstanding,
  (SELECT COALESCE(SUM(amount), 0) FROM payments) AS payments_received,
  (SELECT COALESCE(SUM(available_quantity * purchase_price), 0) FROM products WHERE is_active = TRUE) AS inventory_value,
  (SELECT COUNT(*) FROM products WHERE available_quantity <= minimum_stock_quantity AND is_active = TRUE) AS low_stock_count,
  (SELECT COUNT(*) FROM sales WHERE due_date < CURRENT_DATE AND outstanding_balance > 0 AND payment_status != 'cancelled') AS overdue_invoices_count,
  (SELECT COALESCE(SUM(outstanding_balance), 0) FROM sales WHERE due_date < CURRENT_DATE AND outstanding_balance > 0 AND payment_status != 'cancelled') AS overdue_amount;

-- -----------------------------------------------------------------------------
-- 19. ATOMIC STORED FUNCTIONS
-- -----------------------------------------------------------------------------

-- Trigger function: Update timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_quotations_updated BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
CREATE TRIGGER trg_business_settings_updated BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- Function: Recalculate invoice payment status and outstanding
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_sale_id UUID := NEW.sale_id;
  v_total_paid NUMERIC(12, 2);
  v_grand_total NUMERIC(12, 2);
  v_due_date DATE;
  v_customer_id UUID;
  v_new_balance NUMERIC(12, 2);
  v_new_status invoice_status_enum;
  v_cust_total_outstanding NUMERIC(12, 2);
BEGIN
  IF v_sale_id IS NOT NULL THEN
    SELECT grand_total, due_date, customer_id INTO v_grand_total, v_due_date, v_customer_id
    FROM sales WHERE id = v_sale_id;

    SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
    FROM payments WHERE sale_id = v_sale_id;

    v_new_balance := GREATEST(0, v_grand_total - v_total_paid);

    IF v_new_balance = 0 THEN
      v_new_status := 'paid';
    ELSIF v_due_date < CURRENT_DATE THEN
      v_new_status := 'overdue';
    ELSIF v_total_paid > 0 THEN
      v_new_status := 'partially_paid';
    ELSE
      v_new_status := 'pending';
    END IF;

    UPDATE sales
    SET amount_paid = v_total_paid,
        outstanding_balance = v_new_balance,
        payment_status = v_new_status,
        updated_at = NOW()
    WHERE id = v_sale_id;

    -- Update Customer's current overall outstanding balance
    SELECT COALESCE(SUM(outstanding_balance), 0) INTO v_cust_total_outstanding
    FROM sales WHERE customer_id = v_customer_id AND payment_status != 'cancelled';

    UPDATE customers
    SET current_outstanding = v_cust_total_outstanding,
        updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_update_invoice
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();
