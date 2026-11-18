"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Clock,
  Send,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  X,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate, generateWhatsAppReminderMessage, getDaysOverdue } from "@/lib/utils";
import { PaymentMode } from "@/types/database";
import { toast } from "sonner";

export default function OutstandingPage() {
  const { language, sales, customers, settings, recordPayment } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "overdue" | "this_week" | "partially_paid">("all");

  // Payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<typeof sales[0] | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>("cash");
  const [payRef, setPayRef] = useState<string>("");

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const oneWeekLater = new Date(now.getTime() + 7 * 86400000);

  // Filter only sales with outstanding balance > 0
  const outstandingSales = sales.filter((s) => {
    if (s.payment_status === "cancelled" || s.outstanding_balance <= 0) return false;

    const matchesSearch =
      s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.customer_phone && s.customer_phone.includes(searchQuery));

    const dueDateObj = new Date(s.due_date);
    dueDateObj.setHours(0, 0, 0, 0);

    let matchesFilter = true;
    if (filterType === "overdue") {
      matchesFilter = dueDateObj < now || s.payment_status === "overdue";
    } else if (filterType === "this_week") {
      matchesFilter = dueDateObj >= now && dueDateObj <= oneWeekLater;
    } else if (filterType === "partially_paid") {
      matchesFilter = s.payment_status === "partially_paid";
    }

    return matchesSearch && matchesFilter;
  });

  // Analytics
  const totalOutstanding = sales
    .filter((s) => s.payment_status !== "cancelled")
    .reduce((sum, s) => sum + s.outstanding_balance, 0);

  const overdueSales = sales.filter(
    (s) =>
      s.payment_status !== "cancelled" &&
      s.outstanding_balance > 0 &&
      (new Date(s.due_date) < now || s.payment_status === "overdue")
  );

  const overdueAmount = overdueSales.reduce((sum, s) => sum + s.outstanding_balance, 0);

  const dueThisWeekSales = sales.filter((s) => {
    if (s.payment_status === "cancelled" || s.outstanding_balance <= 0) return false;
    const d = new Date(s.due_date);
    d.setHours(0, 0, 0, 0);
    return d >= now && d <= oneWeekLater;
  });

  const dueThisWeekAmount = dueThisWeekSales.reduce((sum, s) => sum + s.outstanding_balance, 0);

  // Open Payment Modal
  const handleOpenPayment = (sale: typeof sales[0]) => {
    setSelectedSale(sale);
    setPayAmount(sale.outstanding_balance);
    setPayMode("cash");
    setPayRef("");
    setIsPayModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale || payAmount <= 0) return;

    recordPayment({
      customerId: selectedSale.customer_id,
      saleId: selectedSale.id,
      amount: payAmount,
      paymentMode: payMode,
      transactionRef: payRef || "OUTSTANDING-SETTLEMENT",
      notes: `Outstanding payment for ${selectedSale.invoice_number}`,
    });

    toast.success(`पेमेंट यशस्वीरीत्या जमा झाले! ₹${payAmount.toLocaleString("en-IN")}`);
    setIsPayModalOpen(false);
    setSelectedSale(null);
  };

  // WhatsApp Reminder
  const handleSendReminder = (sale: typeof sales[0]) => {
    const cust = customers.find((c) => c.id === sale.customer_id);
    const phone = sale.customer_phone || cust?.mobile_number;
    if (!phone) {
      toast.error("ग्राहक फोन नंबर उपलब्ध नाही.");
      return;
    }

    const message = generateWhatsAppReminderMessage({
      customerName: sale.customer_name || cust?.customer_name || "ग्राहक",
      shopName: settings.shop_name,
      invoiceNumber: sale.invoice_number,
      outstandingAmount: sale.outstanding_balance,
      dueDate: sale.due_date,
      contactNumber: settings.contact_number,
      upiId: settings.upi_id,
      language: language,
    });

    const clean = phone.replace(/[^0-9]/g, "");
    const formatted = clean.length === 10 ? `91${clean}` : clean;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(message)}`, "_blank");
    toast.success("व्हॉट्सअ‍ॅप मेसेज विंडो उघडली!");
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "उधारी व बाकी पेमेंट्स वसुली" : "Outstanding & Overdue Dues"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              {outstandingSales.length} येणे बाकी
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "उधारीवर विकलेला माल, मुदत संपलेली खाती व एका क्लिकवर मराठी व्हॉट्सअ‍ॅप तगादा"
              : "Track credit accounts, overdue ageing, and send Marathi WhatsApp reminders"}
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण बाकी येणे (Total Outstanding)</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatINR(totalOutstanding)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{outstandingSales.length} बिले शिल्लक आहेत</p>
        </div>

        <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-800 font-bold">मुदत संपलेली बाकी (Overdue)</span>
            <Clock className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-1">{formatINR(overdueAmount)}</p>
          <p className="text-[11px] text-rose-600 mt-0.5 font-medium">
            {overdueSales.length} ग्राहकांना त्वरित तगादा आवश्यक
          </p>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-800 font-bold">या आठवड्यात येणे (Due This Week)</span>
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-1">{formatINR(dueThisWeekAmount)}</p>
          <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
            {dueThisWeekSales.length} बिले मुदत जवळ आली आहे
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="बिल क्र., शेतकरी नाव किंवा फोन नंबर शोधा..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterType === "all" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            सर्व बाकी ({sales.filter((s) => s.outstanding_balance > 0).length})
          </button>
          <button
            onClick={() => setFilterType("overdue")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterType === "overdue" ? "bg-rose-600 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            मुदत संपलेले ({overdueSales.length})
          </button>
          <button
            onClick={() => setFilterType("this_week")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterType === "this_week" ? "bg-amber-600 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            या आठवड्यात ({dueThisWeekSales.length})
          </button>
          <button
            onClick={() => setFilterType("partially_paid")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              filterType === "partially_paid" ? "bg-sky-600 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            काही भरलेले
          </button>
        </div>
      </div>

      {/* Outstanding Dues Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">बिल क्र.</th>
                <th className="px-4 py-3">शेतकरी / ग्राहक</th>
                <th className="px-4 py-3">गाव व तालुका</th>
                <th className="px-4 py-3">बिल तारीख</th>
                <th className="px-4 py-3">अंतिम मुदत (Due Date)</th>
                <th className="px-4 py-3 text-right">एकूण बिल</th>
                <th className="px-4 py-3 text-right">जमा रक्कम</th>
                <th className="px-4 py-3 text-right">शिल्लक बाकी (Due)</th>
                <th className="px-4 py-3 text-center">तगादा स्थिती</th>
                <th className="px-4 py-3 text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outstandingSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    कोणतीही बाकी येणे शिल्लक नाही. सर्व खाती जमा आहेत!
                  </td>
                </tr>
              ) : (
                outstandingSales.map((sale) => {
                  const daysOverdue = getDaysOverdue(sale.due_date);
                  const isOver = daysOverdue > 0;

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-sky-600">
                        <Link href={`/sales/${sale.id}`}>{sale.invoice_number}</Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/customers/${sale.customer_id}`}
                          className="font-bold text-slate-900 hover:text-sky-600 transition-colors"
                        >
                          {sale.customer_name}
                        </Link>
                        <p className="text-[11px] text-slate-400 font-mono">{sale.customer_phone}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{sale.customer_village || "Solapur"}</td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(sale.invoice_date)}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{formatDate(sale.due_date)}</span>
                        {isOver && (
                          <p className="text-[10px] text-rose-600 font-bold">
                            {daysOverdue} दिवस मुदत संपली
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {formatINR(sale.grand_total)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                        {formatINR(sale.amount_paid)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-rose-600 text-sm">
                        {formatINR(sale.outstanding_balance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOver
                              ? "bg-rose-100 text-rose-700 animate-pulse"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isOver ? "मुदत संपली" : "मुदत बाकी"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleSendReminder(sale)}
                          className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                          title="Send WhatsApp Marathi Payment Reminder"
                        >
                          <Send className="h-3 w-3" />
                          <span>तगादा पाठवा</span>
                        </button>
                        <button
                          onClick={() => handleOpenPayment(sale)}
                          className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors"
                        >
                          पेमेंट घ्या
                        </button>
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
                  {selectedSale.invoice_number} – {selectedSale.customer_name}
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
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between">
                <span className="text-xs text-rose-800 font-semibold">बाकी येणे:</span>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">पेमेंट पद्धत</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="cash">रोख (Cash)</option>
                  <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="bank_transfer">बँक ट्रान्सफर (NEFT / RTGS)</option>
                  <option value="cheque">धनादेश (Cheque)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  UPI संदर्भ / ट्रॅन्झॅक्शन क्र.
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="उदा. UPI/382910482910"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
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

