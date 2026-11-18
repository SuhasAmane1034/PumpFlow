"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Plus,
  Search,
  Download,
  Printer,
  Send,
  CreditCard,
  Eye,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate, generateWhatsAppReminderMessage, getDaysOverdue } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { InvoiceStatus, PaymentMode } from "@/types/database";
import { toast } from "sonner";

export default function SalesPage() {
  const { language, sales, customers, settings, recordPayment } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");

  // Payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<typeof sales[0] | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>("cash");
  const [payRef, setPayRef] = useState<string>("");
  const [payNotes, setPayNotes] = useState<string>("");

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customer_phone && s.customer_phone.includes(searchQuery));

    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "overdue") {
        matchesStatus =
          s.payment_status === "overdue" ||
          (new Date(s.due_date) < new Date() && s.outstanding_balance > 0 && s.payment_status !== "cancelled");
      } else {
        matchesStatus = s.payment_status === statusFilter;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const totalBilled = sales.reduce((sum, s) => sum + (s.payment_status !== "cancelled" ? s.grand_total : 0), 0);
  const totalPaid = sales.reduce((sum, s) => sum + (s.payment_status !== "cancelled" ? s.amount_paid : 0), 0);
  const totalOutstanding = sales.reduce((sum, s) => sum + (s.payment_status !== "cancelled" ? s.outstanding_balance : 0), 0);

  // Open Payment Modal
  const handleOpenPayment = (sale: typeof sales[0]) => {
    setSelectedSale(sale);
    setPayAmount(sale.outstanding_balance);
    setPayMode("cash");
    setPayRef("");
    setPayNotes(`Payment against invoice ${sale.invoice_number}`);
    setIsPayModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || payAmount <= 0) {
      toast.error("कृपया योग्य रक्कम भरा.");
      return;
    }

    recordPayment({
      customerId: selectedSale.customer_id,
      saleId: selectedSale.id,
      amount: payAmount,
      paymentMode: payMode,
      transactionRef: payRef || "SHOP-RECEIPT",
      notes: payNotes,
    });

    toast.success(`पावती यशस्वीरीत्या जमा झाली! ₹${payAmount.toLocaleString("en-IN")}`);
    setIsPayModalOpen(false);
    setSelectedSale(null);
  };

  // WhatsApp Share Invoice
  const handleShareWhatsApp = (sale: typeof sales[0]) => {
    const cust = customers.find((c) => c.id === sale.customer_id);
    const phone = sale.customer_phone || cust?.mobile_number;
    if (!phone) {
      toast.error("ग्राहक फोन नंबर उपलब्ध नाही.");
      return;
    }

    const message = `नमस्कार ${sale.customer_name} जी,

*${settings.shop_name}* कडून आपले बिल तपशील खालीलप्रमाणे आहेत:

📄 *बिल क्रमांक:* ${sale.invoice_number}
📅 *तारीख:* ${formatDate(sale.invoice_date)}
💵 *एकूण रक्कम:* ${formatINR(sale.grand_total)}
✅ *जमा रक्कम:* ${formatINR(sale.amount_paid)}
⚠️ *बाकी रक्कम:* ${formatINR(sale.outstanding_balance)}
📅 *अंतिम देय तारीख:* ${formatDate(sale.due_date)}
${settings.upi_id ? `💳 *UPI ID:* ${settings.upi_id}\n` : ""}
धन्यवाद!
*${settings.shop_name}*, सोलापूर
📞 फोन: ${settings.contact_number}`;

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
    toast.success("व्हॉट्सअ‍ॅप विंडो उघडली आहे!");
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "विक्री व GST बिलिंग व्यवस्थापन" : "Sales & GST Invoices"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              {sales.length} बिले
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "काऊंटर बिलिंग, उधारी बिले, जीएसटी इन्व्हॉईस व पेमेंट ट्रॅकिंग"
              : "Generate professional tax invoices, track credit sales, and print bills"}
          </p>
        </div>

        <Link
          href="/sales/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{language === "mr" ? "नवीन बिल बनवा" : "New Invoice"}</span>
        </Link>
      </div>

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण विक्री (Total Billed)</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalBilled)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">जमा झालेली रक्कम (Received)</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatINR(totalPaid)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
          <span className="text-xs text-amber-700 font-medium">शिल्लक बाकी (Balance Outstanding)</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatINR(totalOutstanding)}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="बिल क्रमांक (INV-2026-...), शेतकरी नाव किंवा फोन नंबर शोधा..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              statusFilter === "all" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            सर्व बिले ({sales.length})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              statusFilter === "paid" ? "bg-emerald-600 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            पूर्ण भरले
          </button>
          <button
            onClick={() => setStatusFilter("partially_paid")}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              statusFilter === "partially_paid" ? "bg-amber-600 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            काही भरले
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              statusFilter === "pending" ? "bg-slate-700 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            बाकी
          </button>
          <button
            onClick={() => setStatusFilter("overdue")}
            className={`px-2.5 py-1.5 rounded-md transition-all ${
              statusFilter === "overdue" ? "bg-rose-600 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            मुदत संपली
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">बिल क्रमांक</th>
                <th className="px-4 py-3">तारीख</th>
                <th className="px-4 py-3">शेतकरी / ग्राहक</th>
                <th className="px-4 py-3">पंप तपशील</th>
                <th className="px-4 py-3 text-right">एकूण रक्कम</th>
                <th className="px-4 py-3 text-right">जमा रक्कम</th>
                <th className="px-4 py-3 text-right">बाकी येणे</th>
                <th className="px-4 py-3">मुदत तारीख</th>
                <th className="px-4 py-3 text-center">स्थिती</th>
                <th className="px-4 py-3 text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    कोणतेही बिल सापडले नाही.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isOverdue =
                    sale.payment_status === "overdue" ||
                    (new Date(sale.due_date) < new Date() && sale.outstanding_balance > 0);
                  const days = getDaysOverdue(sale.due_date);

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-sky-600">
                        <Link href={`/sales/${sale.id}`}>{sale.invoice_number}</Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(sale.invoice_date)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{sale.customer_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {sale.customer_village || "सोलापूर"} • {sale.customer_phone || ""}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {sale.items.map((i) => `${i.product_name} (${i.quantity} नग)`).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatINR(sale.grand_total)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600">
                        {formatINR(sale.amount_paid)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        {sale.outstanding_balance > 0 ? formatINR(sale.outstanding_balance) : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p>{formatDate(sale.due_date)}</p>
                        {isOverdue && sale.outstanding_balance > 0 && (
                          <span className="text-[10px] text-rose-600 font-bold">({days} दिवस संपले)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sale.payment_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : isOverdue
                              ? "bg-rose-100 text-rose-800 animate-pulse"
                              : sale.payment_status === "partially_paid"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {sale.payment_status === "paid"
                            ? "पूर्ण भरले"
                            : isOverdue
                            ? "मुदत संपली"
                            : sale.payment_status === "partially_paid"
                            ? "काही भरले"
                            : "बाकी"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => void generateInvoicePDF(sale, settings, customers.find((customer) => customer.id === sale.customer_id), language)}
                          className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                          title="Download Tax Invoice PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(sale)}
                          className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                          title="Share Invoice on WhatsApp"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        {sale.outstanding_balance > 0 && (
                          <button
                            onClick={() => handleOpenPayment(sale)}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
                            title="Record Payment"
                          >
                            पेमेंट घ्या
                          </button>
                        )}
                        <Link
                          href={`/sales/${sale.id}`}
                          className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100 inline-block transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">पेमेंट जमा नोंदवा</h3>
                <p className="text-xs text-slate-500">
                  {selectedSale.invoice_number} • {selectedSale.customer_name}
                </p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-3.5">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                <span className="text-xs text-amber-800 font-semibold">शिल्लक बाकी रक्कम:</span>
                <span className="text-base font-bold text-rose-600">
                  {formatINR(selectedSale.outstanding_balance)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  जमा रक्कम (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedSale.outstanding_balance}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  पेमेंट पद्धत (Payment Mode)
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="cash">रोख (Cash)</option>
                  <option value="upi">UPI (PhonePe / Google Pay / Paytm)</option>
                  <option value="bank_transfer">बँक ट्रान्सफर (NEFT / RTGS / IMPS)</option>
                  <option value="cheque">धनादेश (Cheque)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  संदर्भ क्रमांक / UPI Txn Ref
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="उदा. UPI/382910482910 किंवा Cheque No"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">नोंद (Notes)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm"
                >
                  पावती जमा करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

