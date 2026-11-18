-- Production access for the current shared, unauthenticated application.
-- TODO: replace these policies with authenticated, organization-scoped policies
-- before adding public sign-up or exposing the service outside the dealership.

ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'business_settings','customers','suppliers','product_categories','brands','products',
    'inventory_movements','sales','sale_items','quotations','quotation_items','payments',
    'customer_ledger','purchases','purchase_items'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS public_shared_access ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY public_shared_access ON %I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)',
      table_name
    );
  END LOOP;
END $$;

INSERT INTO business_settings (id)
VALUES ('b0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Realtime publications must include the tables used by the shared UI.
ALTER PUBLICATION supabase_realtime ADD TABLE
  customers,
  suppliers,
  product_categories,
  brands,
  products,
  inventory_movements,
  sales,
  sale_items,
  quotations,
  quotation_items,
  payments,
  customer_ledger,
  business_settings;
