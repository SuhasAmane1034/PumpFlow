"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  UserPlus,
  Printer,
  Send,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  Building2,
  ArrowLeft,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, calculateGST, i18n } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { Customer, Product, SaleItem, PaymentMode } from "@/types/database";
import { toast } from "sonner";

export default function NewSalePage() {
  const router = useRouter();
  const { customers, products, settings, createSale, addCustomer, language } =
    useStore();
  const t = i18n[language];

  // Selected customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || "",
  );
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);

  // New Customer Form
  const [newCustName, setNewCustName] = useState("");
  const [newCustMobile, setNewCustMobile] = useState("");
  const [newCustVillage, setNewCustVillage] = useState("");
  const [newCustType, setNewCustType] =
    useState<Customer["customer_type"]>("farmer");

  // Invoice parameters
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const defaultDueDate = new Date(
    Date.now() + (settings.default_credit_days || 15) * 86400000,
  )
    .toISOString()
    .split("T")[0];
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [isInterstate, setIsInterstate] = useState(false);

  // Line Items
  interface BillingLineItem {
    tempId: string;
    product_id: string;
    product_name: string;
    hsn_code: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    gst_percentage: number;
    available_stock: number;
    serial_number?: string;
  }

  const [items, setItems] = useState<BillingLineItem[]>([
    {
      tempId: "1",
      product_id: products[0]?.id || "",
      product_name: products[0]?.product_name || "",
      hsn_code: products[0]?.hsn_code || "84137010",
      quantity: 1,
      unit_price: products[0]?.selling_price || 0,
      discount_amount: 0,
      gst_percentage: products[0]?.gst_percentage || 18,
      available_stock: products[0]?.available_quantity || 0,
    },
  ]);

  // Payment at billing
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [invoiceNotes, setInvoiceNotes] = useState<string>("");

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Customer search text
  const [customerSearch, setCustomerSearch] = useState(
    customers[0]?.customer_name || "",
  );

  useEffect(() => {
    if (!customerSearch && customers.length > 0) {
      setCustomerSearch(customers[0].customer_name);
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers]);

  // Calculate Subtotals & GST
  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const totalItemDiscount = items.reduce(
    (sum, item) => sum + (item.discount_amount || 0),
    0,
  );
  const taxableAmount = Math.max(0, subtotal - totalItemDiscount);

  // GST Breakdown
  const gstBreakdown = calculateGST(taxableAmount, 18, isInterstate);
  const grossTotal = taxableAmount + gstBreakdown.totalTax;
  const grandTotal = Math.round(grossTotal);
  const roundOff = Number((grandTotal - grossTotal).toFixed(2));
  const outstandingBalance = Math.max(0, grandTotal - amountPaid);

  // Add Item Line
  const handleAddItem = () => {
    const firstProd = products[0];
    if (!firstProd) return;
    setItems((prev) => [
      ...prev,
      {
        tempId: String(Date.now()),
        product_id: firstProd.id,
        product_name: firstProd.product_name,
        hsn_code: firstProd.hsn_code,
        quantity: 1,
        unit_price: firstProd.selling_price,
        discount_amount: 0,
        gst_percentage: firstProd.gst_percentage,
        available_stock: firstProd.available_quantity,
      },
    ]);
  };

  // Change Item Product
  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              product_id: prod.id,
              product_name: prod.product_name,
              hsn_code: prod.hsn_code,
              unit_price: prod.selling_price,
              gst_percentage: prod.gst_percentage,
              available_stock: prod.available_quantity,
            }
          : item,
      ),
    );
  };

  // Update item field
  const handleItemFieldChange = (
    index: number,
    field: keyof BillingLineItem,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  // Remove Item Line
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error(t.selectProductRequired);
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Auto fill full payment button
  const handleSetFullPayment = () => {
    setAmountPaid(grandTotal);
  };

  // Handle Quick Add Customer
  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustMobile) {
      toast.error(t.customerRequired);
      return;
    }
    const created = addCustomer({
      customer_name: newCustName,
      mobile_number: newCustMobile,
      village_city: newCustVillage || "Solapur",
      taluka: "Solapur",
      district: "Solapur",
      state: "Maharashtra",
      address: newCustVillage || "Solapur",
      customer_type: newCustType,
      credit_limit: 100000,
      opening_balance: 0,
      current_outstanding: 0,
      reminder_opt_out: false,
    });
    setSelectedCustomerId(created.id);
    setIsNewCustModalOpen(false);
    setNewCustName("");
    setNewCustMobile("");
    setNewCustVillage("");
    toast.success(t.customerAdded);
  };

  // Submit Invoice
  const handleSubmitInvoice = (shouldPrint: boolean = false) => {
    let invoiceCustomerId = selectedCustomerId;
    let invoiceCustomer = selectedCustomer;

    if (!invoiceCustomerId && customerSearch.trim()) {
      invoiceCustomer = addCustomer({
        customer_name: customerSearch.trim(),
        mobile_number: "",
        whatsapp_number: "",
        email: "",
        address: "",
        village_city: "Solapur",
        taluka: "Solapur",
        district: "Solapur",
        state: "Maharashtra",
        gstin: "",
        customer_type: "farmer",
        credit_limit: 100000,
        opening_balance: 0,
        current_outstanding: 0,
        reminder_opt_out: false,
        notes: "",
      });
      invoiceCustomerId = invoiceCustomer.id;
      setSelectedCustomerId(invoiceCustomer.id);
    }

    if (!invoiceCustomerId) {
      toast.error(t.selectCustomerRequired);
      return;
    }

    if (items.length === 0) {
      toast.error(t.selectProductRequired);
      return;
    }

    // Validate available stock
    for (const itm of items) {
      if (itm.quantity > itm.available_stock) {
        toast.error(
          `साठा अपुरा आहे! "${itm.product_name}" चा उपलब्ध साठा फक्त ${itm.available_stock} नग आहे.`,
        );
        return;
      }
    }

    const unmatchedProduct = items.find((item) => !item.product_id);
    if (unmatchedProduct) {
      toast.error(t.selectProductRequired);
      return;
    }

    const saleItems: SaleItem[] = items.map((itm, idx) => {
      const itmTaxable = itm.unit_price * itm.quantity - itm.discount_amount;
      const gst = calculateGST(itmTaxable, itm.gst_percentage, isInterstate);
      return {
        id: "item-" + Date.now() + "-" + idx,
        product_id: itm.product_id,
        product_name: itm.product_name,
        hsn_code: itm.hsn_code,
        quantity: itm.quantity,
        unit_price: itm.unit_price,
        discount_percent: 0,
        discount_amount: itm.discount_amount,
        taxable_amount: itmTaxable,
        gst_percentage: itm.gst_percentage,
        cgst_rate: gst.cgstRate,
        cgst_amount: gst.cgstAmount,
        sgst_rate: gst.sgstRate,
        sgst_amount: gst.sgstAmount,
        igst_rate: gst.igstRate,
        igst_amount: gst.igstAmount,
        total_tax: gst.totalTax,
        total_amount: itmTaxable + gst.totalTax,
        serial_numbers: itm.serial_number ? [itm.serial_number] : undefined,
      };
    });

    const paymentStatus =
      outstandingBalance === 0
        ? "paid"
        : amountPaid > 0
          ? "partially_paid"
          : "pending";

    const createdSale = createSale(
      {
        invoice_date: invoiceDate,
        due_date: dueDate,
        customer_id: invoiceCustomerId,
        customer_name: invoiceCustomer?.customer_name || customerSearch.trim(),
        customer_phone: invoiceCustomer?.mobile_number,
        customer_village: `${invoiceCustomer?.village_city || ""}, ${invoiceCustomer?.taluka || ""}`,
        customer_gstin: invoiceCustomer?.gstin,
        subtotal,
        item_discount_total: totalItemDiscount,
        invoice_discount: 0,
        taxable_amount: taxableAmount,
        is_interstate: isInterstate,
        cgst_amount: gstBreakdown.cgstAmount,
        sgst_amount: gstBreakdown.sgstAmount,
        igst_amount: gstBreakdown.igstAmount,
        total_tax: gstBreakdown.totalTax,
        round_off: roundOff,
        grand_total: grandTotal,
        amount_paid: amountPaid,
        outstanding_balance: outstandingBalance,
        payment_status: paymentStatus,
        primary_payment_mode: paymentMode,
        notes: invoiceNotes,
        terms_conditions: settings.invoice_terms,
        items: saleItems,
      },
      amountPaid > 0
        ? { amount: amountPaid, paymentMode, transactionRef: paymentRef }
        : undefined,
    );

    toast.success(`बिल यशस्वीरीत्या बनवले! ${createdSale.invoice_number}`);

    if (shouldPrint) {
      generateInvoicePDF(createdSale, settings, invoiceCustomer, language);
    }

    router.push(`/sales/${createdSale.id}`);
  };

  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{t.newInvoice}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                {t.posCounter}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              सबमर्सिबल पंप, मोटर्स व पाईप्ससाठी कर बीजक (Tax Invoice)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSubmitInvoice(false)}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-sm"
          >
            फक्त जतन करा
          </button>
          <button
            onClick={() => handleSubmitInvoice(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>{t.saveAndPrint}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Line Items */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer Selection Card */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. {t.customerDetails}
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ {t.addCustomer}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.selectCustomer} *
                </label>
                <input
                  list="invoice-customer-options"
                  value={customerSearch}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomerSearch(value);
                    const matched = customers.find(
                      (customer) =>
                        customer.customer_name.toLowerCase() ===
                        value.trim().toLowerCase(),
                    );
                    setSelectedCustomerId(matched?.id || "");
                  }}
                  placeholder={t.customerName}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                />
                <datalist id="invoice-customer-options">
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.customer_name}>
                      {customer.mobile_number}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.invoiceDate} *
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>

            {/* Selected Customer Details Strip */}
            {selectedCustomer && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900">
                    {selectedCustomer.customer_name}
                  </span>
                  <span className="text-slate-500 ml-2">
                    {selectedCustomer.village_city}, {selectedCustomer.taluka}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-600">
                    फोन:{" "}
                    <strong className="font-mono">
                      {selectedCustomer.mobile_number}
                    </strong>
                  </span>
                  <span className="text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded font-semibold">
                    सध्याची येणे बाकी:{" "}
                    {formatINR(selectedCustomer.current_outstanding)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Product Items Table Card */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. {t.productsAndPumps}
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ {t.addMorePumps}</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineTaxable =
                  item.unit_price * item.quantity - item.discount_amount;
                const isOverStock = item.quantity > item.available_stock;

                return (
                  <div
                    key={item.tempId}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        आइटम #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5">
                      {/* Product Selector */}
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          {t.selectPumpOrProduct} *
                        </label>
                        <input
                          list={`invoice-product-options-${idx}`}
                          value={item.product_name}
                          onChange={(e) => {
                            const value = e.target.value;
                            const matched = products.find(
                              (product) =>
                                product.product_name.toLowerCase() ===
                                value.trim().toLowerCase(),
                            );
                            if (matched) {
                              handleProductChange(idx, matched.id);
                            } else {
                              setItems((previous) =>
                                previous.map((line, lineIndex) =>
                                  lineIndex === idx
                                    ? {
                                        ...line,
                                        product_id: "",
                                        product_name: value,
                                      }
                                    : line,
                                ),
                              );
                            }
                          }}
                          placeholder={t.selectProduct}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-medium"
                        />
                        <datalist id={`invoice-product-options-${idx}`}>
                          {products.map((product) => (
                            <option
                              key={product.id}
                              value={product.product_name}
                            >
                              ₹{product.selling_price.toLocaleString("en-IN")}
                            </option>
                          ))}
                        </datalist>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span
                            className={
                              isOverStock
                                ? "text-rose-600 font-bold"
                                : "text-emerald-700"
                            }
                          >
                            शिल्लक साठा: {item.available_stock} नग
                          </span>
                          <span className="text-slate-400">
                            HSN: {item.hsn_code}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          नग (Qty) *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className={`w-full px-2.5 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-center ${
                            isOverStock
                              ? "border-rose-500 bg-rose-50 text-rose-700"
                              : "border-slate-200"
                          }`}
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          दर (Rate ₹) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              "unit_price",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                        />
                      </div>

                      {/* Line Discount */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          सूट (Disc ₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.discount_amount}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              "discount_amount",
                              Number(e.target.value),
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-amber-700 font-medium"
                        />
                      </div>
                    </div>

                    {/* Serial Number & Line Total */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-500">
                          {t.pumpSerialNumber}:
                        </label>
                        <input
                          type="text"
                          value={item.serial_number || ""}
                          onChange={(e) =>
                            handleItemFieldChange(
                              idx,
                              "serial_number",
                              e.target.value,
                            )
                          }
                          placeholder="उदा. KBL26A0012"
                          className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-slate-500">आइटम एकूण: </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {formatINR(
                            lineTaxable * (1 + item.gst_percentage / 100),
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          ({item.gst_percentage}% GST सह)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Bill Summary, Taxes, Payment Terms */}
        <div className="space-y-5">
          {/* Bill Financial Summary Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              3. एकूण हिशोब व कर (Bill Summary)
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>एकूण साहित्य किंमत (Subtotal):</span>
                <span className="font-medium text-slate-900">
                  {formatINR(subtotal)}
                </span>
              </div>

              {totalItemDiscount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>सूट (Discount):</span>
                  <span>- {formatINR(totalItemDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>करपात्र रक्कम (Taxable):</span>
                <span className="font-medium text-slate-900">
                  {formatINR(taxableAmount)}
                </span>
              </div>

              {/* Interstate Toggle */}
              <div className="py-2 border-y border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-600">
                  महाराष्ट्राबाहेर विक्री? (IGST)
                </span>
                <input
                  type="checkbox"
                  checked={isInterstate}
                  onChange={(e) => setIsInterstate(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
                />
              </div>

              {isInterstate ? (
                <div className="flex justify-between">
                  <span>IGST (18%):</span>
                  <span className="font-medium text-slate-900">
                    {formatINR(gstBreakdown.igstAmount)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>CGST (9%):</span>
                    <span className="font-medium text-slate-900">
                      {formatINR(gstBreakdown.cgstAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (9%):</span>
                    <span className="font-medium text-slate-900">
                      {formatINR(gstBreakdown.sgstAmount)}
                    </span>
                  </div>
                </>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span>{formatINR(roundOff)}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">
                  एकूण बिल (Grand Total):
                </span>
                <span className="text-xl font-bold text-sky-700">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Section */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  काउंटरवर जमा रक्कम:
                </label>
                <button
                  type="button"
                  onClick={handleSetFullPayment}
                  className="text-[11px] text-emerald-600 font-bold hover:underline"
                >
                  पूर्ण भरले ({formatINR(grandTotal)})
                </button>
              </div>

              <input
                type="number"
                min={0}
                max={grandTotal}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-emerald-700"
              />

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    पेमेंट पद्धत
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) =>
                      setPaymentMode(e.target.value as PaymentMode)
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="cash">रोख (Cash)</option>
                    <option value="upi">UPI (PhonePe / GPay)</option>
                    <option value="bank_transfer">बँक ट्रान्सफर</option>
                    <option value="cheque">धनादेश (Cheque)</option>
                    <option value="credit">उधारी (Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    अंतिम देय तारीख (Due Date)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Outstanding remaining */}
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-800">
                  बाकी येणे (Balance Due):
                </span>
                <span className="text-sm font-bold text-rose-700">
                  {formatINR(outstandingBalance)}
                </span>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-3 space-y-2">
              <button
                type="button"
                onClick={() => handleSubmitInvoice(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all active:scale-98"
              >
                <Printer className="h-4 w-4" />
                <span>बिल सेव्ह करा व प्रिंट पावती द्या</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitInvoice(false)}
                className="w-full py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                फक्त जतन करा
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {isNewCustModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                नवीन ग्राहक / शेतकरी जोडा
              </h3>
              <button
                onClick={() => setIsNewCustModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleQuickAddCustomer}
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  शेतकरी / ग्राहकाचे पूर्ण नाव *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="उदा. विठ्ठलराव नामदेव पाटील"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  मोबाईल नंबर (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  placeholder="उदा. 9822012345"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  गाव / शहर
                </label>
                <input
                  type="text"
                  value={newCustVillage}
                  onChange={(e) => setNewCustVillage(e.target.value)}
                  placeholder="उदा. आंगर (मोहोळ), सोलापूर"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ग्राहक प्रकार
                </label>
                <select
                  value={newCustType}
                  onChange={(e) =>
                    setNewCustType(e.target.value as Customer["customer_type"])
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="farmer">शेतकरी (Farmer)</option>
                  <option value="retailer">किरकोळ विक्रेता (Retailer)</option>
                  <option value="contractor">
                    बोअरवेल कंत्राटदार (Contractor)
                  </option>
                  <option value="dealer">डीलर (Dealer)</option>
                  <option value="other">इतर (Other)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm"
                >
                  ग्राहक जोडा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
