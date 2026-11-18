"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Printer,
  Calendar,
  X,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate } from "@/lib/utils";
import { generateReceiptPDF } from "@/lib/pdf-generator";
import { Payment, PaymentMode } from "@/types/database";
import { toast } from "sonner";

export default function PaymentsPage() {
  const { language, payments, customers, sales, settings, recordPayment } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<string>("all");

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || "");
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");
  const [amount, setAmount] = useState<number>(5000);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [txnRef, setTxnRef] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Customer's open sales
  const customerSales = sales.filter(
    (s) => s.customer_id === selectedCustomerId && s.outstanding_balance > 0
  );

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customer_name && p.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.transaction_ref && p.transaction_ref.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMode = modeFilter === "all" || p.payment_mode === modeFilter;
    return matchesSearch && matchesMode;
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("कृपया योग्य रक्कम भरा.");
      return;
    }

    const newPayment = recordPayment({
      customerId: selectedCustomerId,
      saleId: selectedSaleId || undefined,
      amount,
      paymentMode,
      transactionRef: txnRef,
      notes,
      paymentDate: payDate,
    });

    toast.success(`पावती जमा झाली! ${newPayment.receipt_number} – ₹${amount.toLocaleString("en-IN")}`);
    setIsModalOpen(false);
    setAmount(5000);
    setTxnRef("");
    setNotes("");
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "पेमेंट जमा व अधिकृत पावत्या" : "Payment Receipts"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {payments.length} पावत्या
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "रोख, यूपीआय व धनादेशाद्वारे ग्राहकांकडून जमा झालेल्या रकमेची नोंद"
              : "Track all collections, cash receipts, and generate printed vouchers"}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{language === "mr" ? "पेमेंट जमा नोंदवा" : "Receive Payment"}</span>
        </button>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण जमा रक्कम (Total Collected)</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(totalCollected)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण पावत्या (Total Receipts)</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{payments.length} पावत्या</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">UPI व बँक जमा</span>
          <p className="text-2xl font-bold text-sky-600 mt-1">
            {formatINR(
              payments
                .filter((p) => p.payment_mode === "upi" || p.payment_mode === "bank_transfer")
                .reduce((sum, p) => sum + p.amount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="पावती क्र. (REC-2026-...), शेतकरी किंवा UPI संदर्भ शोधा..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          {["all", "cash", "upi", "bank_transfer", "cheque"].map((mode) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={`px-3 py-1.5 rounded-md transition-all uppercase ${
                modeFilter === mode
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {mode === "all" ? "सर्व पद्धती" : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">पावती क्रमांक</th>
                <th className="px-4 py-3">तारीख</th>
                <th className="px-4 py-3">शेतकरी / ग्राहक</th>
                <th className="px-4 py-3">संबंधित बिल क्र.</th>
                <th className="px-4 py-3">पद्धत (Mode)</th>
                <th className="px-4 py-3">संदर्भ / Txn Ref</th>
                <th className="px-4 py-3 text-right">जमा रक्कम (₹)</th>
                <th className="px-4 py-3 text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    कोणतीही पावती सापडली नाही.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const cust = customers.find((c) => c.id === p.customer_id);
                  const sale = sales.find((s) => s.id === p.sale_id);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-bold text-emerald-600 font-mono">
                        {p.receipt_number}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/customers/${p.customer_id}`}
                          className="font-bold text-slate-900 hover:text-sky-600 transition-colors"
                        >
                          {p.customer_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {p.invoice_number ? (
                          <Link
                            href={`/sales/${p.sale_id}`}
                            className="font-semibold text-sky-600 hover:underline"
                          >
                            {p.invoice_number}
                          </Link>
                        ) : (
                          <span className="text-slate-400">खातेवही जमा</span>
                        )}
                      </td>
                      <td className="px-4 py-3 uppercase font-semibold text-slate-700">
                        {p.payment_mode}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {p.transaction_ref || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-600 text-sm">
                        {formatINR(p.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => generateReceiptPDF(p, settings, cust, sale)}
                          className="p-1.5 rounded text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                          title="Download Receipt PDF"
                        >
                          <Download className="h-4 w-4" />
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">नवीन पेमेंट पावती बनवा</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ग्राहक / शेतकरी निवडा *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    setSelectedSaleId("");
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name} (बाकी: ₹{c.current_outstanding})
                    </option>
                  ))}
                </select>
              </div>

              {customerSales.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    संबंधित बिल (ऐच्छिक)
                  </label>
                  <select
                    value={selectedSaleId}
                    onChange={(e) => setSelectedSaleId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">सर्वसाधारण खातेवहीत जमा करा</option>
                    {customerSales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.invoice_number} – बाकी ₹{s.outstanding_balance}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    जमा रक्कम (₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">पावती तारीख</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">पेमेंट पद्धत</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
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
                  नोंद / UPI ट्रॅन्झॅक्शन संदर्भ
                </label>
                <input
                  type="text"
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  placeholder="उदा. UPI-382910482910"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-sm"
                >
                  पावती सेव्ह करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

