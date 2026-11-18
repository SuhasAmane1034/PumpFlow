"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingUp,
  CreditCard,
  Package,
  Layers,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function ReportsPage() {
  const { language, sales, payments, products, customers, settings } = useStore();
  const [reportType, setReportType] = useState<"daybook" | "gstr1" | "stock" | "customer_dues">("daybook");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Daybook Filter (for selected date)
  const daySales = sales.filter((s) => s.invoice_date === selectedDate && s.payment_status !== "cancelled");
  const dayPayments = payments.filter((p) => p.payment_date === selectedDate);
  const daySalesTotal = daySales.reduce((sum, s) => sum + s.grand_total, 0);
  const dayCashCollected = dayPayments.filter((p) => p.payment_mode === "cash").reduce((sum, p) => sum + p.amount, 0);
  const dayUpiCollected = dayPayments.filter((p) => p.payment_mode === "upi").reduce((sum, p) => sum + p.amount, 0);
  const dayBankCollected = dayPayments.filter((p) => p.payment_mode === "bank_transfer").reduce((sum, p) => sum + p.amount, 0);
  const dayTotalCollected = dayPayments.reduce((sum, p) => sum + p.amount, 0);

  // GSTR-1 HSN Summary Aggregation
  const hsnMap: { [hsn: string]: { hsn: string; desc: string; qty: number; taxable: number; cgst: number; sgst: number; igst: number; total: number } } = {};

  sales.forEach((s) => {
    if (s.payment_status === "cancelled") return;
    s.items.forEach((item) => {
      const hsn = item.hsn_code || "84137010";
      if (!hsnMap[hsn]) {
        hsnMap[hsn] = {
          hsn,
          desc: hsn === "84137010" ? "Submersible & Monoblock Pumps" : hsn === "85444990" ? "3-Core Submersible Cables" : hsn === "39172310" ? "UPVC Column Pipes" : "Motors & Electricals",
          qty: 0,
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total: 0,
        };
      }
      hsnMap[hsn].qty += item.quantity;
      hsnMap[hsn].taxable += item.taxable_amount;
      hsnMap[hsn].cgst += item.cgst_amount;
      hsnMap[hsn].sgst += item.sgst_amount;
      hsnMap[hsn].igst += item.igst_amount;
      hsnMap[hsn].total += item.total_amount;
    });
  });

  const hsnSummaryList = Object.values(hsnMap);

  // Export Daybook to Excel
  const handleExportDaybook = () => {
    const data = [
      { Category: "Today Total Sales", Amount: daySalesTotal },
      { Category: "Cash Received (रोख जमा)", Amount: dayCashCollected },
      { Category: "UPI Received (फोनपे/जीपे)", Amount: dayUpiCollected },
      { Category: "Bank Transfer (NEFT/RTGS)", Amount: dayBankCollected },
      { Category: "Total Collections (एकूण जमा)", Amount: dayTotalCollected },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daybook");
    XLSX.writeFile(wb, `Daybook_${selectedDate}.xlsx`);
    toast.success("डेबुक रिपोर्ट Excel मध्ये डाउनलोड झाला!");
  };

  // Export GSTR-1 to Excel
  const handleExportGSTR1 = () => {
    const data = hsnSummaryList.map((h) => ({
      "HSN / SAC": h.hsn,
      Description: h.desc,
      "Total Quantity": h.qty,
      "Taxable Value (₹)": h.taxable,
      "CGST (₹)": h.cgst,
      "SGST (₹)": h.sgst,
      "IGST (₹)": h.igst,
      "Total Amount (₹)": h.total,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GSTR-1_HSN");
    XLSX.writeFile(wb, `GSTR1_HSN_Summary_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("GSTR-1 HSN रिपोर्ट Excel मध्ये डाउनलोड झाला!");
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "अहवाल व जीएसटी अनालिटिक्स (Reports)" : "Reports & GST Analytics"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              GSTR-1 Ready
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "दैनिक डेबूक, जीएसटी HSN अहवाल, साठा मूल्यांकन व खातेदार बाकी अहवाल"
              : "Generate Daily Daybook registers, GSTR-1 HSN summaries, and stock valuations"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {reportType === "daybook" && (
            <button
              onClick={handleExportDaybook}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>डेबूक Excel डाउनलोड</span>
            </button>
          )}

          {reportType === "gstr1" && (
            <button
              onClick={handleExportGSTR1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>GSTR-1 HSN Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportType("daybook")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === "daybook"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>दैनिक डेबूक (Daily Daybook)</span>
        </button>

        <button
          onClick={() => setReportType("gstr1")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === "gstr1"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>GSTR-1 HSN कर अहवाल</span>
        </button>

        <button
          onClick={() => setReportType("stock")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === "stock"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>साठा मूल्यांकन अहवाल (Stock Valuation)</span>
        </button>

        <button
          onClick={() => setReportType("customer_dues")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === "customer_dues"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>ग्राहक बाकी विश्लेषण (Receivables)</span>
        </button>
      </div>

      {/* 1. Daily Daybook Tab View */}
      {reportType === "daybook" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">तारीख निवडा:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
              />
            </div>
            <p className="text-xs text-slate-500">
              तारीख: <strong>{formatDate(selectedDate)}</strong> चा हिशोब रजिस्टर
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">आजची एकूण विक्री</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(daySalesTotal)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{daySales.length} बिले</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">रोख जमा (Cash)</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">{formatINR(dayCashCollected)}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">UPI जमा (Online)</span>
              <p className="text-xl font-bold text-sky-600 mt-1">{formatINR(dayUpiCollected)}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm">
              <span className="text-xs text-emerald-800 font-bold">एकूण जमा रक्कम (Total In)</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">{formatINR(dayTotalCollected)}</p>
            </div>
          </div>

          {/* Day Sales Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase">
                आज जनरेट झालेली विक्री बिले ({daySales.length})
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">बिल क्र.</th>
                    <th className="px-4 py-2.5">ग्राहक</th>
                    <th className="px-4 py-2.5">पंप साहित्य</th>
                    <th className="px-4 py-2.5 text-right">एकूण रक्कम</th>
                    <th className="px-4 py-2.5 text-right">जमा</th>
                    <th className="px-4 py-2.5 text-right">उधारी बाकी</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daySales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        या तारखेस कोणतेही बिल जनरेट झाले नाही.
                      </td>
                    </tr>
                  ) : (
                    daySales.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-sky-600">{s.invoice_number}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">{s.customer_name}</td>
                        <td className="px-4 py-2.5 text-slate-600 truncate max-w-xs">
                          {s.items.map((i) => i.product_name).join(", ")}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                          {formatINR(s.grand_total)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">
                          {formatINR(s.amount_paid)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-600 font-bold">
                          {formatINR(s.outstanding_balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. GSTR-1 HSN Summary Tab View */}
      {reportType === "gstr1" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
            <div>
              <p className="font-bold">GSTR-1 Table 12 – HSN Summary of Outward Supplies</p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                सीए किंवा जीएसटी पोर्टलवर (GST Portal) थेट अपलोड करण्यासाठी तयार सारांश
              </p>
            </div>
            <span className="font-mono font-bold text-indigo-800">GSTIN: {settings.gstin}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">HSN Code</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-center">Total Qty (UQC: NOS)</th>
                    <th className="px-4 py-3 text-right">करपात्र मूल्य (Taxable ₹)</th>
                    <th className="px-4 py-3 text-right">CGST (9% ₹)</th>
                    <th className="px-4 py-3 text-right">SGST (9% ₹)</th>
                    <th className="px-4 py-3 text-right">एकूण GST कर</th>
                    <th className="px-4 py-3 text-right">एकूण पुरवठा मूल्य (Total ₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hsnSummaryList.map((h) => (
                    <tr key={h.hsn} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-sky-700">{h.hsn}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{h.desc}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{h.qty}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatINR(h.taxable)}</td>
                      <td className="px-4 py-3 text-right">{formatINR(h.cgst)}</td>
                      <td className="px-4 py-3 text-right">{formatINR(h.sgst)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {formatINR(h.cgst + h.sgst + h.igst)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatINR(h.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Stock Valuation Tab View */}
      {reportType === "stock" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">खरेदी मूल्यावर साठा (Cost Value)</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatINR(
                  products.reduce((acc, p) => acc + (p.is_active ? p.available_quantity * p.purchase_price : 0), 0)
                )}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">विक्री मूल्यावर साठा (Retail Value)</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatINR(
                  products.reduce((acc, p) => acc + (p.is_active ? p.available_quantity * p.selling_price : 0), 0)
                )}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs text-slate-500 font-medium">अपेक्षित एकूण नफा (Potential Margin)</span>
              <p className="text-2xl font-bold text-sky-600 mt-1">
                {formatINR(
                  products.reduce(
                    (acc, p) => acc + (p.is_active ? p.available_quantity * (p.selling_price - p.purchase_price) : 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">पंप प्रॉडक्ट</th>
                    <th className="px-4 py-3">ब्रँड</th>
                    <th className="px-4 py-3 text-center">शिल्लक साठा</th>
                    <th className="px-4 py-3 text-right">खरेदी दर</th>
                    <th className="px-4 py-3 text-right">विक्री दर</th>
                    <th className="px-4 py-3 text-right">एकूण खरेदी मूल्य</th>
                    <th className="px-4 py-3 text-right">एकूण विक्री मूल्य</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{p.product_name}</td>
                      <td className="px-4 py-3 text-slate-600">{p.brand_name || "-"}</td>
                      <td className="px-4 py-3 text-center font-bold text-slate-800">
                        {p.available_quantity} नग
                      </td>
                      <td className="px-4 py-3 text-right">{formatINR(p.purchase_price)}</td>
                      <td className="px-4 py-3 text-right">{formatINR(p.selling_price)}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {formatINR(p.available_quantity * p.purchase_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        {formatINR(p.available_quantity * p.selling_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Customer Receivables Aging */}
      {reportType === "customer_dues" && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">शेतकरी / खातेदार</th>
                    <th className="px-4 py-3">गाव व तालुका</th>
                    <th className="px-4 py-3">मोबाईल नंबर</th>
                    <th className="px-4 py-3 text-right">उधारी मर्यादा</th>
                    <th className="px-4 py-3 text-right">सध्याची बाकी येणे</th>
                    <th className="px-4 py-3 text-right">कृती</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers
                    .filter((c) => c.current_outstanding > 0)
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{c.customer_name}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {c.village_city}, {c.taluka}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{c.mobile_number}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatINR(c.credit_limit)}</td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          {formatINR(c.current_outstanding)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/customers/${c.id}`}
                            className="text-xs font-semibold text-sky-600 hover:underline"
                          >
                            खातेवही उतारा →
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
