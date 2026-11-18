"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  Phone,
  Send,
  Download,
  CreditCard,
  FileText,
  ShoppingCart,
  Printer,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  History,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate, generateWhatsAppReminderMessage } from "@/lib/utils";
import { PaymentMode } from "@/types/database";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, sales, payments, ledger, quotations, settings, recordPayment } = useStore();

  const customerId = params.id as string;
  const customer = customers.find((c) => c.id === customerId);

  // Associated records
  const customerSales = sales.filter((s) => s.customer_id === customerId);
  const customerPayments = payments.filter((p) => p.customer_id === customerId);
  const customerQuotes = quotations.filter((q) => q.customer_id === customerId);
  const customerLedger = ledger
    .filter((l) => l.customer_id === customerId)
    .sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());

  // Payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>("cash");
  const [payRef, setPayRef] = useState<string>("");
  const [payNotes, setPayNotes] = useState<string>("");

  if (!customer) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-700">ग्राहक सापडला नाही.</p>
        <Link href="/customers" className="text-xs font-semibold text-sky-600 hover:underline">
          ← सर्व खातेदार यादी पहा
        </Link>
      </div>
    );
  }

  const totalBilled = customerSales.reduce((acc, s) => acc + s.grand_total, 0);
  const totalPaid = customerPayments.reduce((acc, p) => acc + p.amount, 0);

  const handleOpenPayment = () => {
    setPayAmount(customer.current_outstanding);
    setPayMode("cash");
    setPayRef("");
    setPayNotes(`Khata settlement for ${customer.customer_name}`);
    setIsPayModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    recordPayment({
      customerId: customer.id,
      amount: payAmount,
      paymentMode: payMode,
      transactionRef: payRef || "KHATA-PAYMENT",
      notes: payNotes,
    });

    toast.success(`पेमेंट यशस्वीरीत्या जमा झाले! ₹${payAmount.toLocaleString("en-IN")}`);
    setIsPayModalOpen(false);
  };

  // WhatsApp Marathi Payment Reminder
  const handleSendReminder = () => {
    const phone = customer.whatsapp_number || customer.mobile_number;
    if (!phone) {
      toast.error("फोन नंबर उपलब्ध नाही.");
      return;
    }

    const message = generateWhatsAppReminderMessage({
      customerName: customer.customer_name,
      shopName: settings.shop_name,
      invoiceNumber: customerSales[0]?.invoice_number || "खातेवही बाकी",
      outstandingAmount: customer.current_outstanding,
      dueDate: customerSales[0]?.due_date || new Date().toISOString().split("T")[0],
      contactNumber: settings.contact_number,
      upiId: settings.upi_id,
      language: "mr",
    });

    const clean = phone.replace(/[^0-9]/g, "");
    const formatted = clean.length === 10 ? `91${clean}` : clean;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Download Khata Statement PDF
  const handleDownloadLedgerPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 14;

    // Header
    doc.setFillColor(2, 132, 199);
    doc.rect(14, currentY, pageWidth - 28, 20, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(settings.shop_name.toUpperCase(), pageWidth / 2, currentY + 8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("CUSTOMER KHATA ACCOUNT STATEMENT / खातेवही उतारा", pageWidth / 2, currentY + 14, {
      align: "center",
    });

    currentY += 26;

    // Customer & Shop Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text("CUSTOMER DETAILS:", 14, currentY);
    currentY += 4.5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(customer.customer_name, 14, currentY);
    currentY += 4.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Village: ${customer.village_city}, ${customer.taluka}, Solapur | Mobile: ${customer.mobile_number}`, 14, currentY);
    currentY += 4.5;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(225, 29, 72);
    doc.text(`Current Outstanding Due: ${formatINR(customer.current_outstanding)}`, 14, currentY);

    currentY += 6;

    // Ledger Table
    const tableData = customerLedger.map((row, idx) => [
      idx + 1,
      formatDate(row.entry_date),
      row.reference_number || "-",
      row.description,
      row.debit > 0 ? `Rs. ${row.debit.toFixed(2)}` : "-",
      row.credit > 0 ? `Rs. ${row.credit.toFixed(2)}` : "-",
      `Rs. ${row.balance.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Date", "Ref No", "Particulars / Description", "Debit (नावे)", "Credit (जमा)", "Balance"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [2, 132, 199],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: "bold",
      },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "center", cellWidth: 22 },
        2: { halign: "center", cellWidth: 24 },
        3: { cellWidth: 60 },
        4: { halign: "right", cellWidth: 24 },
        5: { halign: "right", cellWidth: 24 },
        6: { halign: "right", cellWidth: 24 },
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Khata_${customer.customer_name.replace(/\s+/g, "_")}.pdf`);
    toast.success("खातेवही उतारा PDF तयार झाली!");
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>{customer.customer_name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 capitalize">
                {customer.customer_type}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              गाव: {customer.village_city}, तालुका: {customer.taluka} • फोन: {customer.mobile_number}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleDownloadLedgerPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="h-4 w-4 text-sky-600" />
            <span>खातेवही उतारा (PDF)</span>
          </button>

          {customer.current_outstanding > 0 && (
            <>
              <button
                onClick={handleSendReminder}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-emerald-700 text-xs font-semibold shadow-sm transition-colors"
              >
                <Send className="h-4 w-4 text-emerald-600" />
                <span>व्हॉट्सअ‍ॅप तगादा</span>
              </button>

              <button
                onClick={handleOpenPayment}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                <span>पेमेंट जमा करा</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">सध्याची येणे बाकी</span>
          <p
            className={`text-xl font-bold mt-1 ${
              customer.current_outstanding > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {formatINR(customer.current_outstanding)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण खरेदी (Total Purchases)</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalBilled)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण जमा रक्कम (Paid)</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatINR(totalPaid)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">उधारी मर्यादा (Credit Limit)</span>
          <p className="text-xl font-bold text-indigo-600 mt-1">{formatINR(customer.credit_limit)}</p>
        </div>
      </div>

      {/* Khata Ledger: Chronological Running Balance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-sky-600" />
              <span>ग्राहक खातेवही (Complete Running Ledger)</span>
            </h3>
            <p className="text-xs text-slate-500">नावे व जमा नोंदींचा कालक्रमानुसार हिशोब</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">तारीख</th>
                <th className="px-4 py-3">प्रकार</th>
                <th className="px-4 py-3">संदर्भ क्र. (Ref No)</th>
                <th className="px-4 py-3">तपशील / वर्णन</th>
                <th className="px-4 py-3 text-right">नावे (Debit / खरेदी ₹)</th>
                <th className="px-4 py-3 text-right">जमा (Credit / पावती ₹)</th>
                <th className="px-4 py-3 text-right">शिल्लक बाकी (Balance ₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    अद्याप कोणत्याही नोंदी नाहीत.
                  </td>
                </tr>
              ) : (
                customerLedger.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-600">
                      {formatDate(row.entry_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          row.entry_type === "invoice"
                            ? "bg-rose-50 text-rose-700 border border-rose-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        {row.entry_type === "invoice" ? "बिल (Debit)" : "जमा (Credit)"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-sky-700">
                      {row.reference_number || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium max-w-sm">
                      {row.description}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600">
                      {row.debit > 0 ? formatINR(row.debit) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                      {row.credit > 0 ? formatINR(row.credit) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 text-sm">
                      {formatINR(row.balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                पेमेंट जमा नोंदवा – {customer.customer_name}
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-3.5">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
                <span className="text-xs text-amber-800 font-semibold">सध्याची येणे बाकी:</span>
                <span className="text-base font-bold text-rose-600">
                  {formatINR(customer.current_outstanding)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  जमा रक्कम (₹) *
                </label>
                <input
                  type="number"
                  min={1}
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
                  <option value="upi">UPI (GPay / PhonePe)</option>
                  <option value="bank_transfer">बँक ट्रान्सफर (NEFT/RTGS)</option>
                  <option value="cheque">धनादेश (Cheque)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  नोंद किंवा UPI संदर्भ
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="उदा. UPI-382910482910"
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

