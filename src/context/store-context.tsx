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

  // Initialize from LocalStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.brands) setBrands(parsed.brands);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.quotations) setQuotations(parsed.quotations);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.movements) setMovements(parsed.movements);
        if (parsed.ledger) setLedger(parsed.ledger);
        if (parsed.language) setLanguage(parsed.language);
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToPersist = {
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
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
  }, [
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
  ]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "mr" ? "en" : "mr"));
  };

  // Customers CRUD
  const addCustomer = (customerData: Omit<Customer, "id" | "created_at" | "updated_at">): Customer => {
    const newCustomer: Customer = {
      ...customerData,
      id: "cust-" + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);

    // If opening balance > 0, record in ledger
    if (newCustomer.opening_balance > 0) {
      const ledgerEntry: CustomerLedgerEntry = {
        id: "led-" + Date.now(),
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
    }

    return newCustomer;
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...customerData, updated_at: new Date().toISOString() } : c))
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Products CRUD
  const addProduct = (productData: Omit<Product, "id" | "created_at" | "updated_at">): Product => {
    const newProduct: Product = {
      ...productData,
      id: "prod-" + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);

    // Record initial inventory movement if quantity > 0
    if (newProduct.available_quantity > 0) {
      const movement: InventoryMovement = {
        id: "mov-" + Date.now(),
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
    }

    return newProduct;
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...productData, updated_at: new Date().toISOString() } : p))
    );
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
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

          const movement: InventoryMovement = {
            id: "mov-" + Date.now(),
            product_id: p.id,
            product_name: p.product_name,
            movement_type: movementType,
            quantity: quantityDelta,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_number: referenceNumber,
            reason: reason,
            created_by_name: "Admin",
            created_at: new Date().toISOString(),
          };
          setMovements((prevMov) => [movement, ...prevMov]);

          return { ...p, available_quantity: newStock, updated_at: new Date().toISOString() };
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

    const newSaleId = "sale-" + Date.now();
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
      id: "led-" + Date.now(),
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
        id: "pay-" + Date.now(),
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
    }

    setSales((prev) => [newSale, ...prev]);
    return newSale;
  };

  const updateSaleStatus = (saleId: string, status: Sale["payment_status"]) => {
    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, payment_status: status, updated_at: new Date().toISOString() } : s))
    );
  };

  // Quotations
  const createQuotation = (
    quoteData: Omit<Quotation, "id" | "quotation_number" | "created_at" | "updated_at">
  ): Quotation => {
    const quoteSeq = 40 + quotations.length + 1;
    const quotationNumber = `${settings.quotation_prefix}${quoteSeq}`;
    const newQuote: Quotation = {
      ...quoteData,
      id: "quo-" + Date.now(),
      quotation_number: quotationNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setQuotations((prev) => [newQuote, ...prev]);
    return newQuote;
  };

  const updateQuotationStatus = (id: string, status: Quotation["status"]) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status, updated_at: new Date().toISOString() } : q))
    );
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
      }
    }

    const newPayment: Payment = {
      id: "pay-" + Date.now(),
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

    // Update Customer outstanding
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === data.customerId) {
          const currentOut = Math.max(0, (c.current_outstanding || 0) - data.amount);
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
      id: "led-" + Date.now(),
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

    return newPayment;
  };

  // Suppliers CRUD
  const addSupplier = (supplierData: Omit<Supplier, "id" | "created_at" | "updated_at">): Supplier => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: "sup-" + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id: string, supplierData: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...supplierData, updated_at: new Date().toISOString() } : s))
    );
  };

  // Settings
  const updateSettings = (newSettings: Partial<BusinessSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
      updated_at: new Date().toISOString(),
    }));
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
    localStorage.removeItem(STORAGE_KEY);
  };

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

