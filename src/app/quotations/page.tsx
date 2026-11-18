"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  Download,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Trash2,
  X,
  Printer,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate } from "@/lib/utils";
import { generateQuotationPDF } from "@/lib/pdf-generator";
import { Quotation, QuotationItem, QuotationStatus, PaymentMode } from "@/types/database";
import { toast } from "sonner";

export default function QuotationsPage() {
  const {
    language,
    quotations,
    customers,
    products,
    settings,
    createQuotation,
    updateQuotationStatus,
    convertQuotationToSale,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuotationStatus>("all");

  // Create Quotation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || "");
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );
  const [quoteNotes, setQuoteNotes] = useState("");

  // Convert Modal
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingQuote, setConvertingQuote] = useState<Quotation | null>(null);
  const [convertPaymentMode, setConvertPaymentMode] = useState<PaymentMode>("cash");
  const [convertAmountPaid, setConvertAmountPaid] = useState<number>(0);

  // Quote Line Items
  interface QuoteLine {
    tempId: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    gst_percentage: number;
  }

  const [quoteItems, setQuoteItems] = useState<QuoteLine[]>([
    {
      tempId: "1",
      product_id: products[0]?.id || "",
      product_name: products[0]?.product_name || "",
      quantity: 1,
      unit_price: products[0]?.selling_price || 0,
      discount_amount: 0,
      gst_percentage: products[0]?.gst_percentage || 18,
    },
  ]);

  const filteredQuotes = quotations.filter((q) => {
    const matchesSearch =
      q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customer_name && q.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.customer_phone && q.customer_phone.includes(searchQuery));

    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate quote totals
  const subtotal = quoteItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalDiscount = quoteItems.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
  const taxable = Math.max(0, subtotal - totalDiscount);
  const totalTax = taxable * 0.18;
  const grandTotal = Math.round(taxable + totalTax);

  // Add Item to Quotation
  const handleAddItem = () => {
    const first = products[0];
    if (!first) return;
    setQuoteItems((prev) => [
      ...prev,
      {
        tempId: String(Date.now()),
        product_id: first.id,
        product_name: first.product_name,
        quantity: 1,
        unit_price: first.selling_price,
        discount_amount: 0,
        gst_percentage: first.gst_percentage,
      },
    ]);
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setQuoteItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              product_id: prod.id,
              product_name: prod.product_name,
              unit_price: prod.selling_price,
              gst_percentage: prod.gst_percentage,
            }
          : item
      )
    );
  };

  const handleFieldChange = (index: number, field: keyof QuoteLine, val: any) => {
    setQuoteItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    if (quoteItems.length === 1) return;
    setQuoteItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit New Quotation
  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) {
      toast.error("कृपया ग्राहक निवडा.");
      return;
    }

    const items: QuotationItem[] = quoteItems.map((itm) => {
      const lineTaxable = itm.unit_price * itm.quantity - itm.discount_amount;
      const lineTax = (lineTaxable * itm.gst_percentage) / 100;
      return {
        id: "qitem-" + Date.now(),
        product_id: itm.product_id,
        product_name: itm.product_name,
        quantity: itm.quantity,
        unit_price: itm.unit_price,
        discount_amount: itm.discount_amount,
        gst_percentage: itm.gst_percentage,
        tax_amount: lineTax,
        total_amount: lineTaxable + lineTax,
      };
    });

    const newQuote = createQuotation({
      quotation_date: quoteDate,
      expiry_date: expiryDate,
      customer_id: cust.id,
      customer_name: cust.customer_name,
      customer_phone: cust.mobile_number,
      customer_village: `${cust.village_city}, ${cust.taluka}`,
      status: "sent",
      subtotal,
      discount_amount: totalDiscount,
      taxable_amount: taxable,
      total_tax: totalTax,
      grand_total: grandTotal,
      notes: quoteNotes,
      terms_conditions: settings.quotation_terms,
      items,
    });

    toast.success(`कोटेशन यशस्वीरीत्या तयार झाले! ${newQuote.quotation_number}`);
    setIsCreateModalOpen(false);
  };

  // Open Convert Modal
  const handleOpenConvert = (quote: Quotation) => {
    setConvertingQuote(quote);
    setConvertAmountPaid(0);
    setConvertPaymentMode("credit");
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = () => {
    if (!convertingQuote) return;
    const sale = convertQuotationToSale(convertingQuote.id, convertPaymentMode, convertAmountPaid);
    if (sale) {
      toast.success(
        `कोटेशन ${convertingQuote.quotation_number} चे बिलामध्ये (${sale.invoice_number}) रूपांतर झाले!`
      );
      setIsConvertModalOpen(false);
      setConvertingQuote(null);
    }
  };

  // WhatsApp Share Quotation
  const handleShareWhatsApp = (quote: Quotation) => {
    const cust = customers.find((c) => c.id === quote.customer_id);
    const phone = quote.customer_phone || cust?.mobile_number;
    if (!phone) return;

    const message = `नमस्कार ${quote.customer_name} जी,

*${settings.shop_name}* कडून आपले अंदाजपत्रक (Quotation) तपशील खालीलप्रमाणे आहेत:

📄 *कोटेशन क्र:* ${quote.quotation_number}
📅 *तारीख:* ${formatDate(quote.quotation_date)}
💵 *अंदाजे एकूण रक्कम:* ${formatINR(quote.grand_total)}
📅 *वैधता मुदत:* ${formatDate(quote.expiry_date)}

पंप साहित्य:
${quote.items.map((i) => `• ${i.product_name} x ${i.quantity}`).join("\n")}

धन्यवाद!
*${settings.shop_name}*, सोलापूर
📞 फोन: ${settings.contact_number}`;

    const clean = phone.replace(/[^0-9]/g, "");
    const formatted = clean.length === 10 ? `91${clean}` : clean;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "कोटेशन्स व अंदाजपत्रक व्यवस्थापन" : "Quotations & Estimates"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {quotations.length} कोटेशन्स
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "शेतकऱ्यांसाठी सबमर्सिबल पंप अंदाजपत्रक बनवा आणि एका क्लिकवर बिलामध्ये रूपांतर करा"
              : "Prepare quotations and convert accepted estimates into invoices with automatic stock deduction"}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{language === "mr" ? "नवीन कोटेशन बनवा" : "Create Quotation"}</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="कोटेशन क्र. (QUO-2026-...), शेतकरी किंवा फोन नंबर शोधा..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          {(["all", "draft", "sent", "accepted", "converted"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md transition-all capitalize ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st === "all" ? "सर्व" : st === "converted" ? "बिलात रूपांतरित" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">कोटेशन क्रमांक</th>
                <th className="px-4 py-3">तारीख</th>
                <th className="px-4 py-3">शेतकरी / ग्राहक</th>
                <th className="px-4 py-3">पंप साहित्य तपशील</th>
                <th className="px-4 py-3 text-right">अंदाजे रक्कम</th>
                <th className="px-4 py-3">वैधता तारीख</th>
                <th className="px-4 py-3 text-center">स्थिती</th>
                <th className="px-4 py-3 text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    कोणतेही कोटेशन सापडले नाही.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-600">{q.quotation_number}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(q.quotation_date)}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{q.customer_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {q.customer_village || "सोलापूर"} • {q.customer_phone || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {q.items.map((i) => `${i.product_name} (${i.quantity})`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatINR(q.grand_total)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(q.expiry_date)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          q.status === "converted"
                            ? "bg-emerald-100 text-emerald-800"
                            : q.status === "accepted"
                            ? "bg-sky-100 text-sky-800"
                            : q.status === "sent"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {q.status === "converted"
                          ? "बिलात रूपांतरित"
                          : q.status === "accepted"
                          ? "स्वीकारले"
                          : q.status === "sent"
                          ? "पाठवले"
                          : q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => generateQuotationPDF(q, settings)}
                        className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                        title="Download Quotation PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(q)}
                        className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                        title="Share on WhatsApp"
                      >
                        <Send className="h-4 w-4" />
                      </button>

                      {q.status !== "converted" && (
                        <button
                          onClick={() => handleOpenConvert(q)}
                          className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors inline-flex items-center gap-1"
                          title="Convert directly to Sale Invoice"
                        >
                          <span>बिलात बदला</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convert to Invoice Modal */}
      {isConvertModalOpen && convertingQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">कोटेशनचे बिलामध्ये रूपांतर करा</h3>
                <p className="text-xs text-slate-500">{convertingQuote.quotation_number}</p>
              </div>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-sky-50 border border-sky-100 space-y-1">
                <p className="font-bold text-sky-950">{convertingQuote.customer_name}</p>
                <p className="text-sky-800">एकूण बिल रक्कम: {formatINR(convertingQuote.grand_total)}</p>
                <p className="text-[11px] text-sky-700">
                  {convertingQuote.items.length} आयटम थेट इन्व्हेंटरीमधून वजा केले जातील.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  पेमेंट पद्धत
                </label>
                <select
                  value={convertPaymentMode}
                  onChange={(e) => setConvertPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="cash">रोख (Cash)</option>
                  <option value="upi">UPI (GPay / PhonePe)</option>
                  <option value="credit">उधारी (Credit)</option>
                  <option value="bank_transfer">बँक ट्रान्सफर</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  आत्ता जमा झालेली रक्कम (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={convertingQuote.grand_total}
                  value={convertAmountPaid}
                  onChange={(e) => setConvertAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConvert}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm"
                >
                  बिल जनरेट करा व स्टॉक वजा करा
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Quotation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">नवीन कोटेशन / अंदाजपत्रक बनवा</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuotation} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ग्राहक *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customer_name} ({c.village_city || "Solapur"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    वैधता मुदत तारीख
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">पंप साहित्य यादी:</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-sky-600 hover:underline"
                  >
                    + आयटम जोडा
                  </button>
                </div>

                {quoteItems.map((itm, idx) => (
                  <div
                    key={itm.tempId}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex flex-wrap items-center gap-2 text-xs"
                  >
                    <select
                      value={itm.product_id}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="flex-1 min-w-[200px] px-2 py-1.5 border border-slate-200 rounded bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.product_name} – ₹{p.selling_price}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={itm.quantity}
                      onChange={(e) => handleFieldChange(idx, "quantity", Number(e.target.value))}
                      className="w-16 px-2 py-1.5 border border-slate-200 rounded text-center"
                    />

                    <input
                      type="number"
                      placeholder="Rate"
                      value={itm.unit_price}
                      onChange={(e) => handleFieldChange(idx, "unit_price", Number(e.target.value))}
                      className="w-24 px-2 py-1.5 border border-slate-200 rounded text-right"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Card */}
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-900">अंदाजे एकूण रक्कम (GST 18% सह):</span>
                <span className="text-base font-bold text-indigo-700">{formatINR(grandTotal)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">नोंद / सूचना</label>
                <input
                  type="text"
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="उदा. बोरवेलमध्ये पंप बसवणे व 500 फूट फिटिंग"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm"
                >
                  कोटेशन जतन करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
