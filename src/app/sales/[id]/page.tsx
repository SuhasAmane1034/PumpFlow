"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Download,
  Send,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate, getDaysOverdue } from "@/lib/utils";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { PaymentMode } from "@/types/database";
import { toast } from "sonner";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { sales, customers, settings, payments, recordPayment } = useStore();

  const saleId = params.id as string;
  const sale = sales.find((s) => s.id === saleId);
  const customer = customers.find((c) => c.id === sale?.customer_id);

  // Associated payments
  const invoicePayments = payments.filter((p) => p.sale_id === saleId);

  // Payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>("cash");
  const [payRef, setPayRef] = useState<string>("");

  if (!sale) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">बिल सापडले नाही.</p>
        <Link href="/sales" className="text-xs font-semibold text-sky-600 hover:underline">
          ← सर्व विक्री बिले पहा
        </Link>
      </div>
    );
  }

  const isOverdue =
    sale.payment_status === "overdue" ||
    (new Date(sale.due_date) < new Date() && sale.outstanding_balance > 0);
  const daysOverdue = getDaysOverdue(sale.due_date);

  const handleOpenPayment = () => {
    setPayAmount(sale.outstanding_balance);
    setPayMode("cash");
    setPayRef("");
    setIsPayModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    recordPayment({
      customerId: sale.customer_id,
      saleId: sale.id,
      amount: payAmount,
      paymentMode: payMode,
      transactionRef: payRef || "SHOP-COUNTER",
      notes: `Payment for invoice ${sale.invoice_number}`,
    });

    toast.success(`पावती जमा झाली! ₹${payAmount.toLocaleString("en-IN")}`);
    setIsPayModalOpen(false);
  };

  const handleShareWhatsApp = () => {
    const phone = sale.customer_phone || customer?.mobile_number;
    if (!phone) {
      toast.error("ग्राहक फोन नंबर उपलब्ध नाही.");
      return;
    }

    const message = `नमस्कार ${sale.customer_name} जी,

*${settings.shop_name}* कडून आपले बिल तपशील:

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
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/sales"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{sale.invoice_number}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  sale.payment_status === "paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : isOverdue
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {sale.payment_status === "paid"
                  ? "पूर्ण भरले (Paid)"
                  : isOverdue
                  ? `मुदत संपली (${daysOverdue} दिवस)`
                  : "बाकी (Pending)"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              बिल तारीख: {formatDate(sale.invoice_date)} • मुदत तारीख: {formatDate(sale.due_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="h-4 w-4" />
            <span>प्रिंट</span>
          </button>

          <button
            onClick={() => generateInvoicePDF(sale, settings, customer)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="h-4 w-4 text-sky-600" />
            <span>PDF डाउनलोड</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-emerald-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <Send className="h-4 w-4 text-emerald-600" />
            <span>व्हॉट्सअ‍ॅप पाठवा</span>
          </button>

          {sale.outstanding_balance > 0 && (
            <button
              onClick={handleOpenPayment}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              <span>पेमेंट घ्या (₹{sale.outstanding_balance.toLocaleString("en-IN")})</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Paper Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-10 max-w-4xl mx-auto text-slate-800">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800">
              TAX INVOICE / कर बीजक
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {settings.shop_name}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">{settings.tagline}</p>
            <p className="text-xs text-slate-500 mt-1">
              {settings.address}, {settings.city} - {settings.pincode}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              GSTIN: <strong>{settings.gstin}</strong> • राज्य कोड: {settings.state_code}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              फोन: {settings.contact_number} | {settings.whatsapp_number}
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1 text-xs">
            <p className="text-sm font-bold text-sky-700 font-mono">{sale.invoice_number}</p>
            <p className="text-slate-600">
              तारीख: <strong>{formatDate(sale.invoice_date)}</strong>
            </p>
            <p className="text-slate-600">
              अंतिम मुदत: <strong>{formatDate(sale.due_date)}</strong>
            </p>
            <p className="text-slate-600">
              पेमेंट पद्धत: <strong className="capitalize">{sale.primary_payment_mode}</strong>
            </p>
          </div>
        </div>

        {/* Bill To Customer Section */}
        <div className="py-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 text-xs">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400">ग्राहक / खरेदीदार:</span>
            <h3 className="text-sm font-bold text-slate-900 mt-1">{sale.customer_name}</h3>
            <p className="text-slate-600 mt-0.5">
              {customer?.address || sale.customer_village || "Solapur"}
            </p>
            <p className="text-slate-600 mt-0.5 font-mono">
              मोबाईल: {sale.customer_phone || customer?.mobile_number || "-"}
            </p>
            <p className="text-slate-500 mt-0.5">
              GSTIN: {sale.customer_gstin || customer?.gstin || "URP (अनोंदणीकृत)"}
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">स्थिती व बाकी:</span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              एकूण बिल: {formatINR(sale.grand_total)}
            </p>
            <p className="text-emerald-600 font-semibold">
              जमा रक्कम: {formatINR(sale.amount_paid)}
            </p>
            <p className="text-rose-600 font-bold text-sm">
              शिल्लक बाकी: {formatINR(sale.outstanding_balance)}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">पंप / मालाचे वर्णन</th>
                <th className="py-2.5 px-3 text-center">HSN</th>
                <th className="py-2.5 px-3 text-center">नग (Qty)</th>
                <th className="py-2.5 px-3 text-right">दर (Rate)</th>
                <th className="py-2.5 px-3 text-right">सूट (Disc)</th>
                <th className="py-2.5 px-3 text-right">करपात्र (Taxable)</th>
                <th className="py-2.5 px-3 text-center">GST</th>
                <th className="py-2.5 px-3 text-right">एकूण रक्कम</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{item.product_name}</p>
                    {item.serial_numbers && item.serial_numbers.length > 0 && (
                      <p className="text-[11px] text-sky-700 font-mono mt-0.5">
                        सिरीयल नंबर: {item.serial_numbers.join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500">{item.hsn_code}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-medium">{formatINR(item.unit_price)}</td>
                  <td className="py-3 px-3 text-right text-slate-500">
                    {item.discount_amount > 0 ? formatINR(item.discount_amount) : "-"}
                  </td>
                  <td className="py-3 px-3 text-right font-medium text-slate-800">
                    {formatINR(item.taxable_amount)}
                  </td>
                  <td className="py-3 px-3 text-center">{item.gst_percentage}%</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatINR(item.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary & Bank Details */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          {/* Bank & UPI Info */}
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              बँक व UPI पेमेंट तपशील
            </p>
            <p className="text-slate-600">
              बँक नाव: <strong>{settings.bank_name}</strong>
            </p>
            <p className="text-slate-600">
              खाते क्रमांक: <strong className="font-mono">{settings.bank_account_number}</strong>
            </p>
            <p className="text-slate-600">
              IFSC कोड: <strong className="font-mono">{settings.bank_ifsc}</strong> ({settings.bank_branch})
            </p>
            <p className="text-slate-600">
              UPI आयडी: <strong className="font-mono text-sky-700">{settings.upi_id}</strong>
            </p>
          </div>

          {/* Tax Breakdown */}
          <div className="space-y-1.5 text-right">
            <div className="flex justify-between text-slate-600">
              <span>करपात्र रक्कम (Taxable):</span>
              <span className="font-medium text-slate-800">{formatINR(sale.taxable_amount)}</span>
            </div>
            {sale.is_interstate ? (
              <div className="flex justify-between text-slate-600">
                <span>IGST (18%):</span>
                <span className="font-medium text-slate-800">{formatINR(sale.igst_amount)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (9%):</span>
                  <span className="font-medium text-slate-800">{formatINR(sale.cgst_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST (9%):</span>
                  <span className="font-medium text-slate-800">{formatINR(sale.sgst_amount)}</span>
                </div>
              </>
            )}
            {sale.round_off !== 0 && (
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Round Off:</span>
                <span>{formatINR(sale.round_off)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>एकूण बिल (Grand Total):</span>
              <span className="text-base text-sky-700">{formatINR(sale.grand_total)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>जमा रक्कम (Paid):</span>
              <span>{formatINR(sale.amount_paid)}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold text-sm">
              <span>बाकी येणे (Balance Due):</span>
              <span>{formatINR(sale.outstanding_balance)}</span>
            </div>
          </div>
        </div>

        {/* Terms and Signatures */}
        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              अटी व शर्ती (Terms & Conditions):
            </p>
            <p className="text-slate-500 whitespace-pre-line text-[11px] mt-1">
              {sale.terms_conditions || settings.invoice_terms}
            </p>
          </div>

          <div className="sm:text-right pt-6 sm:pt-0">
            <p className="font-bold text-slate-800">{settings.shop_name} करिता</p>
            <div className="h-12" />
            <p className="text-slate-500 text-[11px]">अधिकृत स्वाक्षरी / Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Invoice Payment History Ledger */}
      {invoicePayments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 max-w-4xl mx-auto no-print">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            या बिलावरील जमा पावत्यांचा इतिहास (Payment Receipts)
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-3 py-2">पावती क्र.</th>
                  <th className="px-3 py-2">तारीख</th>
                  <th className="px-3 py-2">पद्धत</th>
                  <th className="px-3 py-2">संदर्भ (Txn Ref)</th>
                  <th className="px-3 py-2 text-right">जमा रक्कम</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoicePayments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-bold text-sky-600">{p.receipt_number}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(p.payment_date)}</td>
                    <td className="px-3 py-2 uppercase font-semibold text-slate-700">{p.payment_mode}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{p.transaction_ref || "-"}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-600">
                      {formatINR(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">पेमेंट जमा नोंदवा</h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-3.5">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                <span className="text-xs text-amber-800 font-semibold">शिल्लक बाकी:</span>
                <span className="text-base font-bold text-rose-600">
                  {formatINR(sale.outstanding_balance)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  जमा रक्कम (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={sale.outstanding_balance}
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
                  <option value="upi">UPI (PhonePe / GPay)</option>
                  <option value="bank_transfer">बँक ट्रान्सफर (RTGS/NEFT)</option>
                  <option value="cheque">धनादेश (Cheque)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  संदर्भ / Txn Ref
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

