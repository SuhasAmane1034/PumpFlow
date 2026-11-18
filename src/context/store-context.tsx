"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  BusinessSettings,
  Customer,
  Supplier,
  ProductCategory,
  Brand,
  Product,
  Sale,
  SaleItem,
  Quotation,
  QuotationItem,
  Payment,
  InventoryMovement,
  CustomerLedgerEntry,
  CustomerType,
  PaymentMode,
  StockMovementType,
} from "@/types/database";
import {
  initialBusinessSettings,
  initialCategories,
  initialBrands,
  initialSuppliers,
  initialCustomers,
  initialProducts,
  initialSales,
  initialQuotations,
  initialPayments,
  initialInventoryMovements,
  initialCustomerLedger,
} from "@/lib/data/mock-initial-data";
import { supabase } from "@/lib/supabase";

interface StoreContextType {
  // Data
  settings: BusinessSettings;
  categories: ProductCategory[];
  brands: Brand[];
  suppliers: Supplier[];
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  quotations: Quotation[];
  payments: Payment[];
  movements: InventoryMovement[];
  ledger: CustomerLedgerEntry[];
  language: "mr" | "en";
  isLoaded: boolean;

  // Language
  toggleLanguage: () => void;
  setLanguage: (lang: "mr" | "en") => void;

  // Actions - Customers
  addCustomer: (customer: Omit<Customer, "id" | "created_at" | "updated_at">) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Actions - Products & Stock
  addProduct: (product: Omit<Product, "id" | "created_at" | "updated_at">) => Product;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (
    productId: string,
    quantityDelta: number,
    movementType: StockMovementType,
    reason: string,
    referenceNumber?: string
  ) => void;

  // Actions - Sales & Billing
  createSale: (
    saleData: Omit<Sale, "id" | "invoice_number" | "created_at" | "updated_at">,
    initialPayment?: { amount: number; paymentMode: PaymentMode; transactionRef?: string }
  ) => Sale;
  updateSaleStatus: (saleId: string, status: Sale["payment_status"]) => void;

  // Actions - Quotations
  createQuotation: (
    quoteData: Omit<Quotation, "id" | "quotation_number" | "created_at" | "updated_at">
  ) => Quotation;
  updateQuotationStatus: (id: string, status: Quotation["status"]) => void;
  convertQuotationToSale: (quotationId: string, paymentMode?: PaymentMode, amountPaid?: number) => Sale | null;

  // Actions - Payments
  recordPayment: (paymentData: {
    customerId: string;
    saleId?: string;
    amount: number;
    paymentMode: PaymentMode;
    transactionRef?: string;
    chequeBank?: string;
    chequeDate?: string;
    notes?: string;
    paymentDate?: string;
  }) => Payment;

  // Actions - Suppliers
  addSupplier: (supplier: Omit<Supplier, "id" | "created_at" | "updated_at">) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;

  // Actions - Settings
  updateSettings: (newSettings: Partial<BusinessSettings>) => void;

  // Reset to initial mock data
  resetToDefault: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = "pumpflow_state_v1";

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BusinessSettings>(initialBusinessSettings);
  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [movements, setMovements] = useState<InventoryMovement[]>(initialInventoryMovements);
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>(initialCustomerLedger);
  const [language, setLanguage] = useState<"mr" | "en">("mr");
  const [isLoaded, setIsLoaded] = useState(false);

  // Browser-local persistence has been replaced by Supabase.
  // refreshData() loads shared data and subscribes to realtime changes.

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "mr" ? "en" : "mr"));
  };

  // Customers CRUD
  const addCustomer = (customerData: Omit<Customer, "id" | "created_at" | "updated_at">): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    if (supabase) {
      void supabase.from("customers").insert({
        id: newCustomer.id,
        customer_name: newCustomer.customer_name,
        mobile_number: newCustomer.mobile_number,
        whatsapp_number: newCustomer.whatsapp_number,
        email: newCustomer.email,
        address: newCustomer.address,
        village_city: newCustomer.village_city,
        taluka: newCustomer.taluka,
        district: newCustomer.district,
        state: newCustomer.state,
        gstin: newCustomer.gstin,
        customer_type: newCustomer.customer_type,
        credit_limit: newCustomer.credit_limit,
        opening_balance: newCustomer.opening_balance,
        current_outstanding: newCustomer.current_outstanding,
        reminder_opt_out: newCustomer.reminder_opt_out,
        notes: newCustomer.notes,
      }).then(({ error }) => {
        if (error) console.error("Supabase customer insert failed:", error);
      });
    }

    if (newCustomer.opening_balance > 0) {
      const ledgerEntry: CustomerLedgerEntry = {
        id: crypto.randomUUID(),
        customer_id: newCustomer.id,
        entry_date: new Date().toISOString().split("T")[0],
        entry_type: "opening_balance",
        description: "Opening Balance",
        debit: newCustomer.opening_balance,
        credit: 0,
        balance: newCustomer.opening_balance,
        created_at: new Date().toISOString(),
      };
      setLedger((prev) => [...prev, ledgerEntry]);
      if (supabase) void supabase.from("customer_ledger").insert(ledgerEntry);
    }

    return newCustomer;
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    const updated_at = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...customerData, updated_at } : c))
    );
    if (supabase) {
      const dbData: Record<string, unknown> = { updated_at };
      const fieldMap: Record<string, string> = {
        customer_name: "customer_name", mobile_number: "mobile_number", whatsapp_number: "whatsapp_number",
        email: "email", address: "address", village_city: "village_city", taluka: "taluka",
        district: "district", state: "state", gstin: "gstin", customer_type: "customer_type",
        credit_limit: "credit_limit", opening_balance: "opening_balance",
        current_outstanding: "current_outstanding", reminder_opt_out: "reminder_opt_out", notes: "notes",
      };
      Object.entries(customerData).forEach(([key, value]) => {
        if (fieldMap[key]) dbData[fieldMap[key]] = value;
      });
      void supabase.from("customers").update(dbData).eq("id", id).then(({ error }) => {
        if (error) console.error("Supabase customer update failed:", error);
      });
    }
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    if (supabase) void supabase.from("customers").delete().eq("id", id);
  };

  // Products CRUD
  const addProduct = (productData: Omit<Product, "id" | "created_at" | "updated_at">): Product => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);

    if (supabase) {
      void supabase.from("products").insert({
        id: newProduct.id,
        product_name: newProduct.product_name,
        category_id: newProduct.category_id,
        brand_id: newProduct.brand_id,
        model_number: newProduct.model_number,
        sku: newProduct.sku,
        description: newProduct.description,
        hp: newProduct.hp,
        voltage: newProduct.voltage,
        phase: newProduct.phase,
        pump_type: newProduct.pump_type,
        discharge_capacity: newProduct.discharge_capacity,
        head_range: newProduct.head_range,
        bore_size: newProduct.bore_size,
        stages: newProduct.stages,
        hsn_code: newProduct.hsn_code,
        gst_percentage: newProduct.gst_percentage,
        purchase_price: newProduct.purchase_price,
        selling_price: newProduct.selling_price,
        mrp: newProduct.mrp,
        available_quantity: newProduct.available_quantity,
        minimum_stock_quantity: newProduct.minimum_stock_quantity,
        supplier_id: newProduct.supplier_id || null,
        image_url: newProduct.image_url,
        is_active: newProduct.is_active,
      });
    }

    if (newProduct.available_quantity > 0) {
      const movement: InventoryMovement = {
        id: crypto.randomUUID(),
        product_id: newProduct.id,
        product_name: newProduct.product_name,
        movement_type: "purchase_in",
        quantity: newProduct.available_quantity,
        previous_stock: 0,
        new_stock: newProduct.available_quantity,
        reason: "Initial Stock Entry",
        created_by_name: "Admin",
        created_at: new Date().toISOString(),
      };
      setMovements((prev) => [movement, ...prev]);
      if (supabase) void supabase.from("inventory_movements").insert({
        id: movement.id,
        product_id: movement.product_id,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        previous_stock: movement.previous_stock,
        new_stock: movement.new_stock,
        reference_number: movement.reference_number,
        reason: movement.reason,
      });
    }

    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    const updated_at = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...productData, updated_at } : p))
    );
    if (supabase) {
      const dbData: Record<string, unknown> = { updated_at };
      Object.entries(productData).forEach(([key, value]) => {
        if (!["id", "category_name", "brand_name", "serial_numbers", "created_at", "updated_at"].includes(key)) {
          dbData[key] = value;
        }
      });
      void supabase.from("products").update(dbData).eq("id", id);
    }
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (supabase) void supabase.from("products").delete().eq("id", id);
  };

  const adjustStock = (
    productId: string,
    quantityDelta: number,
    movementType: StockMovementType,
    reason: string,
    referenceNumber?: string
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const previousStock = p.available_quantity;
          const newStock = Math.max(0, previousStock + quantityDelta);
          const updatedAt = new Date().toISOString();
          const movement: InventoryMovement = {
            id: crypto.randomUUID(),
            product_id: p.id,
            product_name: p.product_name,
            movement_type: movementType,
            quantity: quantityDelta,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_number: referenceNumber,
            reason,
            created_by_name: "Admin",
            created_at: updatedAt,
          };
          setMovements((prevMov) => [movement, ...prevMov]);

          if (supabase) {
            void supabase.from("products").update({ available_quantity: newStock, updated_at: updatedAt }).eq("id", p.id);
            void supabase.from("inventory_movements").insert({
              id: movement.id,
              product_id: movement.product_id,
              movement_type: movement.movement_type,
              quantity: movement.quantity,
              previous_stock: movement.previous_stock,
              new_stock: movement.new_stock,
              reference_number: movement.reference_number,
              reason: movement.reason,
            });
          }
          return { ...p, available_quantity: newStock, updated_at: updatedAt };
        }
        return p;
      })
    );
  };

  // Sales & Billing
  const createSale = (
    saleData: Omit<Sale, "id" | "invoice_number" | "created_at" | "updated_at">,
    initialPayment?: { amount: number; paymentMode: PaymentMode; transactionRef?: string }
  ): Sale => {
    const invoiceSeq = 100 + sales.length + 1;
    const invoiceNumber = `${settings.invoice_prefix}${invoiceSeq}`;

    const newSaleId = crypto.randomUUID();
    const createdDate = new Date().toISOString();

    const newSale: Sale = {
      ...saleData,
      id: newSaleId,
      invoice_number: invoiceNumber,
      created_at: createdDate,
      updated_at: createdDate,
    };

    // Deduct stock for each sale item & log inventory movement
    newSale.items.forEach((item) => {
      adjustStock(item.product_id, -item.quantity, "sale_out", `Sale ${invoiceNumber}`, invoiceNumber);
    });

    // Update Customer outstanding
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === newSale.customer_id) {
          const currentOut = cust.current_outstanding || 0;
          return {
            ...cust,
            current_outstanding: currentOut + newSale.outstanding_balance,
            updated_at: new Date().toISOString(),
          };
        }
        return cust;
      })
    );

    // Add to Customer Ledger (Invoice Debit)
    const matchingCustomer = customers.find((c) => c.id === newSale.customer_id);
    const prevBalance = matchingCustomer?.current_outstanding || 0;
    const invoiceLedgerEntry: CustomerLedgerEntry = {
      id: crypto.randomUUID(),
      customer_id: newSale.customer_id,
      entry_date: newSale.invoice_date,
      entry_type: "invoice",
      reference_id: newSaleId,
      reference_number: invoiceNumber,
      description: `Invoice ${invoiceNumber} (${newSale.items.map((i) => i.product_name).join(", ")})`,
      debit: newSale.grand_total,
      credit: 0,
      balance: prevBalance + newSale.grand_total,
      created_at: createdDate,
    };
    setLedger((prev) => [...prev, invoiceLedgerEntry]);

    // Process Initial Payment if provided
    if (initialPayment && initialPayment.amount > 0) {
      const receiptSeq = 80 + payments.length + 1;
      const receiptNumber = `${settings.receipt_prefix}${receiptSeq}`;

      const paymentRecord: Payment = {
        id: crypto.randomUUID(),
        receipt_number: receiptNumber,
        payment_date: newSale.invoice_date,
        customer_id: newSale.customer_id,
        customer_name: newSale.customer_name,
        sale_id: newSaleId,
        invoice_number: invoiceNumber,
        amount: initialPayment.amount,
        payment_mode: initialPayment.paymentMode,
        transaction_ref: initialPayment.transactionRef || "COUNTER-PAYMENT",
        notes: `Immediate payment at billing for ${invoiceNumber}`,
        created_at: createdDate,
      };

      setPayments((prev) => [paymentRecord, ...prev]);

      if (supabase) {
        void supabase.from("payments").insert({
          id: paymentRecord.id,
          receipt_number: paymentRecord.receipt_number,
          payment_date: paymentRecord.payment_date,
          customer_id: paymentRecord.customer_id,
          sale_id: paymentRecord.sale_id,
          amount: paymentRecord.amount,
          payment_mode: paymentRecord.payment_mode,
          transaction_ref: paymentRecord.transaction_ref,
          notes: paymentRecord.notes,
        });
      }

      // Add Payment Credit to Ledger
      const paymentLedgerEntry: CustomerLedgerEntry = {
        id: "led-pay-" + Date.now(),
        customer_id: newSale.customer_id,
        entry_date: newSale.invoice_date,
        entry_type: "payment",
        reference_id: paymentRecord.id,
        reference_number: receiptNumber,
        description: `Payment Receipt ${receiptNumber} (${initialPayment.paymentMode.toUpperCase()})`,
        debit: 0,
        credit: initialPayment.amount,
        balance: prevBalance + newSale.grand_total - initialPayment.amount,
        created_at: createdDate,
      };
      setLedger((prev) => [...prev, paymentLedgerEntry]);
      if (supabase) {
        void supabase.from("customer_ledger").insert({
          id: paymentLedgerEntry.id,
          customer_id: paymentLedgerEntry.customer_id,
          entry_date: paymentLedgerEntry.entry_date,
          entry_type: paymentLedgerEntry.entry_type,
          reference_id: paymentLedgerEntry.reference_id,
          reference_number: paymentLedgerEntry.reference_number,
          description: paymentLedgerEntry.description,
          debit: paymentLedgerEntry.debit,
          credit: paymentLedgerEntry.credit,
          balance: paymentLedgerEntry.balance,
        });
      }
    }

    if (supabase) {
      void supabase.from("sales").insert({
        id: newSale.id,
        invoice_number: newSale.invoice_number,
        invoice_date: newSale.invoice_date,
        due_date: newSale.due_date,
        customer_id: newSale.customer_id,
        quotation_id: newSale.quotation_id || null,
        subtotal: newSale.subtotal,
        item_discount_total: newSale.item_discount_total,
        invoice_discount: newSale.invoice_discount,
        taxable_amount: newSale.taxable_amount,
        is_interstate: newSale.is_interstate,
        cgst_amount: newSale.cgst_amount,
        sgst_amount: newSale.sgst_amount,
        igst_amount: newSale.igst_amount,
        total_tax: newSale.total_tax,
        round_off: newSale.round_off,
        grand_total: newSale.grand_total,
        amount_paid: newSale.amount_paid,
        outstanding_balance: newSale.outstanding_balance,
        payment_status: newSale.payment_status,
        primary_payment_mode: newSale.primary_payment_mode,
        notes: newSale.notes,
        terms_conditions: newSale.terms_conditions,
      }).then(({ error }) => {
        if (error) console.error("Supabase invoice insert failed:", error);
      });

      void supabase.from("sale_items").insert(
        newSale.items.map((item) => {
          return {
            id: crypto.randomUUID(),
            sale_id: newSale.id,
            product_id: item.product_id,
            product_name: item.product_name,
            hsn_code: item.hsn_code,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_percent: item.discount_percent,
            discount_amount: item.discount_amount,
            taxable_amount: item.taxable_amount,
            gst_percentage: item.gst_percentage,
            cgst_rate: item.cgst_rate,
            cgst_amount: item.cgst_amount,
            sgst_rate: item.sgst_rate,
            sgst_amount: item.sgst_amount,
            igst_rate: item.igst_rate,
            igst_amount: item.igst_amount,
            total_tax: item.total_tax,
            total_amount: item.total_amount,
            serial_numbers: item.serial_numbers || null,
          };
        })
      );

      void supabase.from("customer_ledger").insert({
        id: invoiceLedgerEntry.id,
        customer_id: invoiceLedgerEntry.customer_id,
        entry_date: invoiceLedgerEntry.entry_date,
        entry_type: invoiceLedgerEntry.entry_type,
        reference_id: invoiceLedgerEntry.reference_id,
        reference_number: invoiceLedgerEntry.reference_number,
        description: invoiceLedgerEntry.description,
        debit: invoiceLedgerEntry.debit,
        credit: invoiceLedgerEntry.credit,
        balance: invoiceLedgerEntry.balance,
      });

      void supabase.from("customers").update({
        current_outstanding: prevBalance + newSale.outstanding_balance,
        updated_at: createdDate,
      }).eq("id", newSale.customer_id);
    }

    setSales((prev) => [newSale, ...prev]);
    return newSale;
  };

  const updateSaleStatus = (saleId: string, status: Sale["payment_status"]) => {
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, payment_status: status, updated_at: new Date().toISOString() } : s))
    );
    if (supabase) {
      void supabase.from("sales").update({
        payment_status: status,
        updated_at: new Date().toISOString(),
      }).eq("id", saleId);
    }
  };

  // Quotations
  const createQuotation = (
    quoteData: Omit<Quotation, "id" | "quotation_number" | "created_at" | "updated_at">
  ): Quotation => {
    const quoteSeq = 40 + quotations.length + 1;
    const quotationNumber = `${settings.quotation_prefix}${quoteSeq}`;
    const newQuote: Quotation = {
      ...quoteData,
      id: crypto.randomUUID(),
      quotation_number: quotationNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setQuotations((prev) => [newQuote, ...prev]);

    if (supabase) {
      void supabase.from("quotations").insert({
        id: newQuote.id,
        quotation_number: newQuote.quotation_number,
        quotation_date: newQuote.quotation_date,
        expiry_date: newQuote.expiry_date,
        customer_id: newQuote.customer_id,
        status: newQuote.status,
        subtotal: newQuote.subtotal,
        discount_amount: newQuote.discount_amount,
        taxable_amount: newQuote.taxable_amount,
        total_tax: newQuote.total_tax,
        grand_total: newQuote.grand_total,
        converted_sale_id: newQuote.converted_sale_id || null,
        converted_at: newQuote.converted_at || null,
        notes: newQuote.notes,
        terms_conditions: newQuote.terms_conditions,
      });
      void supabase.from("quotation_items").insert(newQuote.items.map((item) => ({
        id: crypto.randomUUID(),
        quotation_id: newQuote.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        gst_percentage: item.gst_percentage,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount,
      })));
    }
    return newQuote;
  };

  const updateQuotationStatus = (id: string, status: Quotation["status"]) => {
    const updated_at = new Date().toISOString();
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status, updated_at } : q))
    );
    if (supabase) void supabase.from("quotations").update({ status, updated_at }).eq("id", id);
  };

  const convertQuotationToSale = (
    quotationId: string,
    paymentMode: PaymentMode = "credit",
    amountPaid: number = 0
  ): Sale | null => {
    const quote = quotations.find((q) => q.id === quotationId);
    if (!quote) return null;

    const saleItems: SaleItem[] = quote.items.map((item, idx) => ({
      id: "item-" + Date.now() + "-" + idx,
      product_id: item.product_id,
      product_name: item.product_name,
      hsn_code: "84137010",
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: 0,
      discount_amount: item.discount_amount,
      taxable_amount: item.unit_price * item.quantity - item.discount_amount,
      gst_percentage: item.gst_percentage,
      cgst_rate: item.gst_percentage / 2,
      cgst_amount: item.tax_amount / 2,
      sgst_rate: item.gst_percentage / 2,
      sgst_amount: item.tax_amount / 2,
      igst_rate: 0,
      igst_amount: 0,
      total_tax: item.tax_amount,
      total_amount: item.total_amount,
    }));

    const outstanding = Math.max(0, quote.grand_total - amountPaid);
    const paymentStatus =
      outstanding === 0 ? "paid" : amountPaid > 0 ? "partially_paid" : "pending";

    const newSale = createSale(
      {
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + settings.default_credit_days * 86400000)
          .toISOString()
          .split("T")[0],
        customer_id: quote.customer_id,
        customer_name: quote.customer_name,
        customer_phone: quote.customer_phone,
        customer_village: quote.customer_village,
        quotation_id: quote.id,
        subtotal: quote.subtotal,
        item_discount_total: quote.discount_amount,
        invoice_discount: 0,
        taxable_amount: quote.taxable_amount,
        is_interstate: false,
        cgst_amount: quote.total_tax / 2,
        sgst_amount: quote.total_tax / 2,
        igst_amount: 0,
        total_tax: quote.total_tax,
        round_off: 0,
        grand_total: quote.grand_total,
        amount_paid: amountPaid,
        outstanding_balance: outstanding,
        payment_status: paymentStatus,
        primary_payment_mode: paymentMode,
        notes: `Converted from Quotation ${quote.quotation_number}. ${quote.notes || ""}`,
        terms_conditions: quote.terms_conditions || settings.invoice_terms,
        items: saleItems,
      },
      amountPaid > 0 ? { amount: amountPaid, paymentMode } : undefined
    );

    // Update quotation status to converted
    updateQuotationStatus(quote.id, "converted");

    return newSale;
  };

  // Record Payment
  const recordPayment = (data: {
    customerId: string;
    saleId?: string;
    amount: number;
    paymentMode: PaymentMode;
    transactionRef?: string;
    chequeBank?: string;
    chequeDate?: string;
    notes?: string;
    paymentDate?: string;
  }): Payment => {
    const receiptSeq = 80 + payments.length + 1;
    const receiptNumber = `${settings.receipt_prefix}${receiptSeq}`;
    const pDate = data.paymentDate || new Date().toISOString().split("T")[0];
    const customer = customers.find((c) => c.id === data.customerId);

    let invoiceNumber: string | undefined;
    if (data.saleId) {
      const sale = sales.find((s) => s.id === data.saleId);
      if (sale) {
        invoiceNumber = sale.invoice_number;
        const newPaid = sale.amount_paid + data.amount;
        const newBalance = Math.max(0, sale.grand_total - newPaid);
        const newStatus =
          newBalance === 0
            ? "paid"
            : new Date(sale.due_date) < new Date()
            ? "overdue"
            : "partially_paid";

        setSales((prev) =>
          prev.map((s) =>
            s.id === data.saleId
              ? {
                  ...s,
                  amount_paid: newPaid,
                  outstanding_balance: newBalance,
                  payment_status: newStatus,
                  updated_at: new Date().toISOString(),
                }
              : s
          )
        );
        if (supabase) {
          void supabase.from("sales").update({
            amount_paid: newPaid,
            outstanding_balance: newBalance,
            payment_status: newStatus,
            updated_at: new Date().toISOString(),
          }).eq("id", data.saleId);
        }
      }
    }

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      receipt_number: receiptNumber,
      payment_date: pDate,
      customer_id: data.customerId,
      customer_name: customer?.customer_name,
      sale_id: data.saleId,
      invoice_number: invoiceNumber,
      amount: data.amount,
      payment_mode: data.paymentMode,
      transaction_ref: data.transactionRef,
      cheque_bank: data.chequeBank,
      cheque_date: data.chequeDate,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);

    if (supabase) {
      void supabase.from("payments").insert({
        id: newPayment.id,
        receipt_number: newPayment.receipt_number,
        payment_date: newPayment.payment_date,
        customer_id: newPayment.customer_id,
        sale_id: newPayment.sale_id || null,
        amount: newPayment.amount,
        payment_mode: newPayment.payment_mode,
        transaction_ref: newPayment.transaction_ref,
        cheque_bank: newPayment.cheque_bank,
        cheque_date: newPayment.cheque_date,
        notes: newPayment.notes,
      });
    }

    // Update Customer outstanding
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === data.customerId) {
          const currentOut = Math.max(0, (c.current_outstanding || 0) - data.amount);
          if (supabase) {
            void supabase.from("customers").update({
              current_outstanding: currentOut,
              updated_at: new Date().toISOString(),
            }).eq("id", c.id);
          }
          return {
            ...c,
            current_outstanding: currentOut,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    // Ledger Credit Entry
    const currentCustomerBal = customer?.current_outstanding || 0;
    const paymentLedgerEntry: CustomerLedgerEntry = {
      id: crypto.randomUUID(),
      customer_id: data.customerId,
      entry_date: pDate,
      entry_type: "payment",
      reference_id: newPayment.id,
      reference_number: receiptNumber,
      description: `Payment Received ${receiptNumber} (${data.paymentMode.toUpperCase()}${
        invoiceNumber ? ` for ${invoiceNumber}` : ""
      })`,
      debit: 0,
      credit: data.amount,
      balance: Math.max(0, currentCustomerBal - data.amount),
      created_at: new Date().toISOString(),
    };
    setLedger((prev) => [...prev, paymentLedgerEntry]);
    if (supabase) {
      void supabase.from("customer_ledger").insert({
        id: paymentLedgerEntry.id,
        customer_id: paymentLedgerEntry.customer_id,
        entry_date: paymentLedgerEntry.entry_date,
        entry_type: paymentLedgerEntry.entry_type,
        reference_id: paymentLedgerEntry.reference_id,
        reference_number: paymentLedgerEntry.reference_number,
        description: paymentLedgerEntry.description,
        debit: paymentLedgerEntry.debit,
        credit: paymentLedgerEntry.credit,
        balance: paymentLedgerEntry.balance,
      });
    }

    return newPayment;
  };

  // Suppliers CRUD
  const addSupplier = (supplierData: Omit<Supplier, "id" | "created_at" | "updated_at">): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    if (supabase) {
      void supabase.from("suppliers").insert({
        id: newSupplier.id,
        supplier_name: newSupplier.supplier_name,
        contact_person: newSupplier.contact_person,
        contact_number: newSupplier.contact_number,
        whatsapp_number: newSupplier.whatsapp_number,
        email: newSupplier.email,
        address: newSupplier.address,
        city: newSupplier.city,
        state: newSupplier.state,
        gstin: newSupplier.gstin,
        opening_balance: newSupplier.opening_balance,
        current_outstanding: newSupplier.current_outstanding,
        notes: newSupplier.notes,
      });
    }
    return newSupplier;
  };

  const updateSupplier = (id: string, supplierData: Partial<Supplier>) => {
    const updated_at = new Date().toISOString();
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...supplierData, updated_at } : s))
    );
    if (supabase) {
      const dbData: Record<string, unknown> = { updated_at };
      Object.entries(supplierData).forEach(([key, value]) => {
        if (!["id", "created_at", "updated_at"].includes(key)) dbData[key] = value;
      });
      void supabase.from("suppliers").update(dbData).eq("id", id);
    }
  };

  // Settings
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
      updated_at: new Date().toISOString(),
    };
    setSettings(updatedSettings);
    if (supabase) {
      void supabase.from("business_settings").upsert(updatedSettings).then(({ error }) => {
        if (error) console.error("Supabase settings update failed:", error);
      });
    }
  };

  const resetToDefault = () => {
    setSettings(initialBusinessSettings);
    setCategories(initialCategories);
    setBrands(initialBrands);
    setSuppliers(initialSuppliers);
    setCustomers(initialCustomers);
    setProducts(initialProducts);
    setSales(initialSales);
    setQuotations(initialQuotations);
    setPayments(initialPayments);
    setMovements(initialInventoryMovements);
    setLedger(initialCustomerLedger);
  };

  const refreshData = async () => {
    if (!supabase) {
      setIsLoaded(true);
      return;
    }

    const [settingsRes, categoriesRes, brandsRes, suppliersRes, customersRes, productsRes, movementsRes, salesRes, saleItemsRes, quotationsRes, quotationItemsRes, paymentsRes, ledgerRes] =
      await Promise.all([
        supabase.from("business_settings").select("*").limit(1).maybeSingle(),
        supabase.from("product_categories").select("*").order("display_order"),
        supabase.from("brands").select("*").order("name"),
        supabase.from("suppliers").select("*"),
        supabase.from("customers").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("inventory_movements").select("*").order("created_at", { ascending: false }),
        supabase.from("sales").select("*").order("created_at", { ascending: false }),
        supabase.from("sale_items").select("*"),
        supabase.from("quotations").select("*").order("created_at", { ascending: false }),
        supabase.from("quotation_items").select("*"),
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("customer_ledger").select("*").order("created_at", { ascending: true }),
      ]);

    if (settingsRes.data) setSettings(settingsRes.data as unknown as BusinessSettings);

    if (categoriesRes.data) setCategories(categoriesRes.data as unknown as ProductCategory[]);
    if (brandsRes.data) setBrands(brandsRes.data as unknown as Brand[]);
    if (suppliersRes.data) setSuppliers(suppliersRes.data as unknown as Supplier[]);

    const dbCustomers = (customersRes.data || []) as unknown as Customer[];
    if (customersRes.data?.length) setCustomers(dbCustomers);

    const dbCategories = (categoriesRes.data || []) as Array<{ id: string; name: string }>;
    const dbBrands = (brandsRes.data || []) as Array<{ id: string; name: string }>;
    const dbProducts = (productsRes.data || []) as unknown as Product[];
    if (productsRes.data?.length) {
      setProducts(dbProducts.map((product) => ({
        ...product,
        category_name: dbCategories.find((item) => item.id === product.category_id)?.name,
        brand_name: dbBrands.find((item) => item.id === product.brand_id)?.name,
      })));
    }

    const dbMovements = (movementsRes.data || []) as unknown as InventoryMovement[];
    if (movementsRes.data?.length) setMovements(dbMovements);

    const customerMap = new Map(dbCustomers.map((customer) => [customer.id, customer]));
    const dbSales = (salesRes.data || []) as unknown as Sale[];
    const saleItems = (saleItemsRes.data || []) as unknown as SaleItem[];
    if (salesRes.data?.length) {
      setSales(dbSales.map((sale) => {
        const customer = customerMap.get(sale.customer_id);
        return {
          ...sale,
          customer_name: customer?.customer_name,
          customer_phone: customer?.mobile_number,
          customer_village: customer?.village_city,
          customer_gstin: customer?.gstin,
          items: saleItems.filter((item) => item.sale_id === sale.id),
        };
      }));
    }

    const dbQuotations = (quotationsRes.data || []) as unknown as Quotation[];
    const quotationItems = (quotationItemsRes.data || []) as unknown as QuotationItem[];
    if (quotationsRes.data?.length) {
      setQuotations(dbQuotations.map((quotation) => {
        const customer = customerMap.get(quotation.customer_id);
        return {
          ...quotation,
          customer_name: customer?.customer_name,
          customer_phone: customer?.mobile_number,
          customer_village: customer?.village_city,
          items: quotationItems.filter((item) => item.quotation_id === quotation.id),
        };
      }));
    }

    const dbPayments = (paymentsRes.data || []) as unknown as Payment[];
    if (paymentsRes.data?.length) {
      setPayments(dbPayments.map((payment) => {
        const customer = customerMap.get(payment.customer_id);
        const sale = dbSales.find((item) => item.id === payment.sale_id);
        return {
          ...payment,
          customer_name: customer?.customer_name,
          invoice_number: sale?.invoice_number,
        };
      }));
    }

    if (ledgerRes.data) setLedger(ledgerRes.data as unknown as CustomerLedgerEntry[]);
    setIsLoaded(true);
  };

  useEffect(() => {
    void refreshData();

    if (!supabase) return;

    const liveClient = supabase;
    const channel = liveClient.channel("pumpflow-live");
    const tables = [
      "business_settings", "customers", "suppliers", "product_categories", "brands", "products",
      "inventory_movements", "sales", "sale_items", "quotations", "quotation_items", "payments", "customer_ledger",
    ];

    tables.forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        window.clearTimeout((window as Window & { pumpflowRefreshTimer?: number }).pumpflowRefreshTimer);
        (window as Window & { pumpflowRefreshTimer?: number }).pumpflowRefreshTimer = window.setTimeout(() => {
          void refreshData();
        }, 150);
      });
    });

    void channel.subscribe();
    return () => {
      void liveClient.removeChannel(channel);
    };
  }, []);

  return (
    <StoreContext.Provider
      value={{
        settings,
        categories,
        brands,
        suppliers,
        customers,
        products,
        sales,
        quotations,
        payments,
        movements,
        ledger,
        language,
        isLoaded,
        toggleLanguage,
        setLanguage,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        createSale,
        updateSaleStatus,
        createQuotation,
        updateQuotationStatus,
        convertQuotationToSale,
        recordPayment,
        addSupplier,
        updateSupplier,
        updateSettings,
        resetToDefault,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

