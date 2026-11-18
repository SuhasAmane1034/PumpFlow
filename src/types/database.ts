// Type definitions for PumpFlow - Submersible Pump Dealer System

export type UserRole = 'admin' | 'manager' | 'salesperson';

export type PumpPhase = 'single_phase' | 'three_phase';

export type CustomerType = 'retailer' | 'farmer' | 'dealer' | 'contractor' | 'other';

export type InvoiceStatus = 'paid' | 'partially_paid' | 'pending' | 'overdue' | 'cancelled';

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'credit';

export type StockMovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'return_in'
  | 'damage_out'
  | 'manual_adjustment'
  | 'quotation_converted';

export interface BusinessSettings {
  id: string;
  shop_name: string;
  shop_owner: string;
  tagline: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  contact_number: string;
  alternate_number?: string;
  whatsapp_number: string;
  email: string;
  gstin: string;
  state_code: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_branch: string;
  upi_id: string;
  upi_qr_url?: string;
  logo_url?: string;
  invoice_prefix: string;
  quotation_prefix: string;
  receipt_prefix: string;
  invoice_terms: string;
  quotation_terms: string;
  whatsapp_api_enabled: boolean;
  whatsapp_api_key?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_business_account_id?: string;
  whatsapp_template_name?: string;
  whatsapp_quiet_hours_start?: string;
  whatsapp_quiet_hours_end?: string;
  default_credit_days: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  auth_user_id?: string;
  full_name: string;
  username: string;
  email?: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  password_hash?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  customer_name: string;
  mobile_number: string;
  whatsapp_number?: string;
  email?: string;
  address: string;
  village_city: string;
  taluka: string;
  district: string;
  state: string;
  gstin?: string;
  customer_type: CustomerType;
  credit_limit: number;
  opening_balance: number;
  current_outstanding: number;
  reminder_opt_out: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  contact_person?: string;
  contact_number: string;
  whatsapp_number?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  gstin?: string;
  opening_balance: number;
  current_outstanding: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  marathi_name: string;
  description?: string;
  icon_name: string;
  display_order: number;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
}

export interface Product {
  id: string;
  product_name: string;
  category_id: string;
  category_name?: string;
  brand_id: string;
  brand_name?: string;
  model_number: string;
  sku: string;
  description?: string;
  hp?: string;
  voltage?: string;
  phase?: PumpPhase;
  pump_type?: string;
  discharge_capacity?: string;
  head_range?: string;
  bore_size?: string;
  stages?: number;
  hsn_code: string;
  gst_percentage: number;
  purchase_price: number;
  selling_price: number;
  mrp: number;
  available_quantity: number;
  minimum_stock_quantity: number;
  supplier_id?: string;
  image_url?: string;
  is_active: boolean;
  serial_numbers?: string[];
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string;
  reference_number?: string;
  reason?: string;
  created_by_name?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id?: string;
  product_id: string;
  product_name: string;
  hsn_code: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  taxable_amount: number;
  gst_percentage: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total_tax: number;
  total_amount: number;
  serial_numbers?: string[];
}

export interface Sale {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_village?: string;
  customer_gstin?: string;
  quotation_id?: string;
  subtotal: number;
  item_discount_total: number;
  invoice_discount: number;
  taxable_amount: number;
  is_interstate: boolean;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  round_off: number;
  grand_total: number;
  amount_paid: number;
  outstanding_balance: number;
  payment_status: InvoiceStatus;
  primary_payment_mode: PaymentMode;
  notes?: string;
  terms_conditions?: string;
  items: SaleItem[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotationItem {
  id: string;
  quotation_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  gst_percentage: number;
  tax_amount: number;
  total_amount: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  quotation_date: string;
  expiry_date: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  customer_village?: string;
  status: QuotationStatus;
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  total_tax: number;
  grand_total: number;
  converted_sale_id?: string;
  converted_at?: string;
  notes?: string;
  terms_conditions?: string;
  items: QuotationItem[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  receipt_number: string;
  payment_date: string;
  customer_id: string;
  customer_name?: string;
  sale_id?: string;
  invoice_number?: string;
  amount: number;
  payment_mode: PaymentMode;
  transaction_ref?: string;
  cheque_bank?: string;
  cheque_date?: string;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  purchase_price: number;
  gst_percentage: number;
  tax_amount: number;
  total_amount: number;
}

export interface Purchase {
  id: string;
  purchase_invoice_number: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_date: string;
  total_amount: number;
  amount_paid: number;
  outstanding_balance: number;
  payment_status: string;
  payment_mode: PaymentMode;
  notes?: string;
  items: PurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customer_id: string;
  entry_date: string;
  entry_type: 'invoice' | 'payment' | 'return' | 'opening_balance';
  reference_id?: string;
  reference_number?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  sale_id?: string;
  customer_id: string;
  customer_name?: string;
  channel: 'whatsapp' | 'sms' | 'email';
  recipient_phone: string;
  message_content: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'read';
  provider_message_id?: string;
  error_message?: string;
  sent_at: string;
}
