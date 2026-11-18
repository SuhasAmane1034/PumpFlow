"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  Package,
  Calendar,
  Clock,
  ArrowUpRight,
  FileText,
  UserPlus,
  Send,
  Zap,
  Building2,
  Phone,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate, generateWhatsAppReminderMessage, getDaysOverdue, i18n } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

export default function DashboardPage() {
  const { language, sales, payments, products, customers, settings } = useStore();
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "month">("all");
  const t = i18n[language];

  // Calculated Metrics from real live data
  const totalSalesAmount = sales
    .filter((s) => s.payment_status !== "cancelled")
    .reduce((sum, s) => sum + s.grand_total, 0);

  const todayStr = new Date().toISOString().split("T")[0];
  const currentMonthStr = todayStr.slice(0, 7);

  const todaySalesAmount = sales
    .filter((s) => s.invoice_date === todayStr && s.payment_status !== "cancelled")
    .reduce((sum, s) => sum + s.grand_total, 0);

  const monthlySalesAmount = sales
    .filter((s) => s.invoice_date.startsWith(currentMonthStr) && s.payment_status !== "cancelled")
    .reduce((sum, s) => sum + s.grand_total, 0);

  const totalOutstanding = sales
    .filter((s) => s.payment_status !== "cancelled")
    .reduce((sum, s) => sum + s.outstanding_balance, 0);

  const paymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  const inventoryValue = products
    .filter((p) => p.is_active)
    .reduce((sum, p) => sum + p.available_quantity * p.purchase_price, 0);

  const lowStockCount = products.filter(
    (p) => p.is_active && p.available_quantity <= p.minimum_stock_quantity
  ).length;

  const overdueSales = sales.filter(
    (s) =>
      s.payment_status === "overdue" ||
      (new Date(s.due_date) < new Date() && s.outstanding_balance > 0 && s.payment_status !== "cancelled")
  );
  const overdueAmount = overdueSales.reduce((sum, s) => sum + s.outstanding_balance, 0);

  // Sales Trend Chart Data
  const salesChartData = [
    { name: "Oct", sales: 185000, collections: 160000 },
    { name: "Nov", sales: 220000, collections: 195000 },
    { name: "Dec", sales: 310000, collections: 270000 },
    { name: "Jan", sales: 290000, collections: 240000 },
    { name: "Feb", sales: 162550, collections: 110000 },
    { name: "Mar", sales: totalSalesAmount > 200000 ? totalSalesAmount : 204270, collections: paymentsReceived },
  ];

  // Brand Distribution Data
  const brandData = [
    { name: "Kirloskar", value: 42, color: "#0284c7" },
    { name: "CRI Pumps", value: 28, color: "#0ea5e9" },
    { name: "Texmo (Taro)", value: 16, color: "#38bdf8" },
    { name: "Crompton", value: 10, color: "#6366f1" },
    { name: "Lubi / Others", value: 4, color: "#94a3b8" },
  ];

  // Send WhatsApp Reminder Handler
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

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    toast.success("व्हॉट्सअ‍ॅप मेसेज विंडो उघडली आहे!");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Welcome & Quick Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{settings.shop_name}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              सोलापूर
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "पाणबुडी पंप, मोटर्स व कृषी फिटिंग्ज व्यवसाय व्यवस्थापन प्रणाली"
              : "Submersible Pump & Agricultural Equipment Dealership Management"}
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-lg self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setDateFilter("all")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              dateFilter === "all" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {language === "mr" ? "एकूण" : "All Time"}
          </button>
          <button
            onClick={() => setDateFilter("month")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              dateFilter === "month" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {language === "mr" ? "हा महिना" : "This Month"}
          </button>
          <button
            onClick={() => setDateFilter("today")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              dateFilter === "today" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {language === "mr" ? "आजची विक्री" : "Today"}
          </button>
        </div>
      </div>

      {/* 8 Essential Business Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Sales */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {language === "mr" ? "एकूण विक्री" : "Total Sales"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900">
              {formatINR(totalSalesAmount)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <span>{sales.length}</span>
              <span>{language === "mr" ? "बिल जनरेट झाले" : "Invoices generated"}</span>
            </p>
          </div>
        </div>

        {/* 2. Today's Sales */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {language === "mr" ? "आजची विक्री" : "Today's Sales"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900">
              {formatINR(todaySalesAmount)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {language === "mr" ? "आज काऊंटर विक्री" : "Daily counter sales"}
            </p>
          </div>
        </div>

        {/* 3. Monthly Sales */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {language === "mr" ? "या महिन्याची विक्री" : "Monthly Sales"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900">
              {formatINR(monthlySalesAmount)}
            </h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
              {language === "mr" ? "सध्याचा महिना" : "Current Month"}
            </p>
          </div>
        </div>

        {/* 4. Total Outstanding (येणे बाकी) */}
        <Link
          href="/outstanding"
          className="bg-white rounded-xl p-4 sm:p-5 border border-amber-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              {language === "mr" ? "एकूण बाकी येणे" : "Total Outstanding"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-2xl font-bold text-amber-600">
              {formatINR(totalOutstanding)}
            </h3>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5 flex items-center justify-between">
              <span>{customers.filter((c) => c.current_outstanding > 0).length} खातेदार</span>
              <span className="text-sky-600">पहा →</span>
            </p>
          </div>
        </Link>

        {/* 5. Payments Received (जमा रक्कम) */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {language === "mr" ? "जमा झालेली रक्कम" : "Payments Received"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-2xl font-bold text-emerald-600">
              {formatINR(paymentsReceived)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {payments.length} {language === "mr" ? "पावत्या जमा" : "Receipts cleared"}
            </p>
          </div>
        </div>

        {/* 6. Total Inventory Value */}
        <Link
          href="/inventory"
          className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-sky-300 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              {language === "mr" ? "स्टॉकचे एकूण मूल्य" : "Total Stock Value"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900">
              {formatINR(inventoryValue)}
            </h3>
            <p className="text-[11px] text-sky-600 font-medium mt-0.5 flex items-center justify-between">
              <span>{products.reduce((acc, p) => acc + p.available_quantity, 0)} युनिट्स साठा</span>
              <span>तपशील →</span>
            </p>
          </div>
        </Link>

        {/* 7. Low Stock Alerts */}
        <Link
          href="/inventory?filter=low"
          className={`rounded-xl p-4 sm:p-5 border shadow-sm transition-all group ${
            lowStockCount > 0
              ? "bg-amber-50/60 border-amber-300 hover:bg-amber-50"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              {language === "mr" ? "कमी स्टॉक अलर्ट" : "Low Stock Alert"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-2xl font-bold text-amber-800">
              {lowStockCount} {language === "mr" ? "मॉडेल्स" : "items"}
            </h3>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5 flex items-center justify-between">
              <span>ऑर्डर करणे आवश्यक</span>
              <span className="underline">रिऑर्डर →</span>
            </p>
          </div>
        </Link>

        {/* 8. Overdue Payments */}
        <Link
          href="/outstanding"
          className={`rounded-xl p-4 sm:p-5 border shadow-sm transition-all group ${
            overdueSales.length > 0
              ? "bg-rose-50/70 border-rose-300 hover:bg-rose-50"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              {language === "mr" ? "मुदत संपलेली बाकी" : "Overdue Dues"}
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-lg sm:text-2xl font-bold text-rose-700">
              {formatINR(overdueAmount)}
            </h3>
            <p className="text-[11px] text-rose-700 font-medium mt-0.5 flex items-center justify-between">
              <span>{overdueSales.length} बिले मुदत संपली</span>
              <span className="font-bold underline">तगादा लावा →</span>
            </p>
          </div>
        </Link>
      </div>

      {/* Quick Actions Bar (Mobile First) */}
      <div className="bg-gradient-to-r from-sky-700 to-sky-900 rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-sky-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-sky-300" />
              <span>{language === "mr" ? "त्वरित कृती (Quick Actions)" : "Quick Actions"}</span>
            </h2>
            <p className="text-xs text-sky-100">
              {language === "mr"
                ? "काऊंटरवर नवीन बिल बनवा, कोटेशन द्या किंवा पेमेंट नोंदवा"
                : "Create bill, provide quotation or record collection"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <Link
            href="/sales/new"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10 text-white font-semibold text-xs sm:text-sm active:scale-95"
          >
            <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span>{language === "mr" ? "नवीन बिल बनवा" : "New Sale Bill"}</span>
          </Link>

          <Link
            href="/quotations?action=new"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10 text-white font-semibold text-xs sm:text-sm active:scale-95"
          >
            <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span>{language === "mr" ? "नवीन कोटेशन" : "New Quotation"}</span>
          </Link>

          <Link
            href="/customers?action=new"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10 text-white font-semibold text-xs sm:text-sm active:scale-95"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <span>{language === "mr" ? "नवीन ग्राहक जोडा" : "Add Customer"}</span>
          </Link>

          <Link
            href="/payments?action=new"
            className="flex items-center gap-2.5 p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10 text-white font-semibold text-xs sm:text-sm active:scale-95"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <span>{language === "mr" ? "पेमेंट जमा करा" : "Record Payment"}</span>
          </Link>
        </div>
      </div>

      {/* Visualizations Grid: Sales Trend + Brand Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Collections Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {language === "mr" ? "विक्री व वसुली आलेख (महिनानिहाय)" : "Monthly Sales vs Collections"}
              </h3>
              <p className="text-xs text-slate-500">गेल्या ६ महिन्यांची आर्थिक प्रगती</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
                विक्री
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                वसुली (जमा)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val))}
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                />
                <Bar dataKey="sales" name="विक्री" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collections" name="वसुली" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Share Donut Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === "mr" ? "ब्रँडनुसार विक्री वाटा" : "Sales by Pump Brand"}
            </h3>
            <p className="text-xs text-slate-500">किर्लोस्कर, सीआरआय व टेक्स्टमो वाटा</p>

            <div className="h-48 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `${val}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {brandData.map((b) => (
              <div key={b.name} className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.name}
                </span>
                <span className="font-semibold text-slate-900">{b.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Overdue Payment Alerts Bar with One-click WhatsApp Marathi Reminder */}
      {overdueSales.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {language === "mr" ? "मुदत संपलेली खाती – त्वरित तगादा" : "Overdue Invoices – Payment Follow-up"}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === "mr"
                    ? "खालील ग्राहकांची मुदत संपली आहे. एका क्लिकवर मराठी व्हॉट्सअ‍ॅप मेसेज पाठवा."
                    : "Send instant Marathi WhatsApp reminders to overdue farmers and contractors"}
                </p>
              </div>
            </div>
            <Link
              href="/outstanding"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              <span>सर्व {overdueSales.length} खाती पहा</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {overdueSales.slice(0, 3).map((sale) => {
              const days = getDaysOverdue(sale.due_date);
              return (
                <div
                  key={sale.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {sale.customer_name}
                      </p>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {days} दिवस मुदत संपली
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      बिल क्र: {sale.invoice_number} • मुदत तारीख: {formatDate(sale.due_date)} • गाव: {sale.customer_village || "सोलापूर"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <p className="text-sm font-bold text-rose-600">
                        {formatINR(sale.outstanding_balance)}
                      </p>
                      <p className="text-[10px] text-slate-400">एकूण बिल: {formatINR(sale.grand_total)}</p>
                    </div>

                    <button
                      onClick={() => handleSendReminder(sale)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                      title="Send WhatsApp Reminder in Marathi"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>व्हॉट्सअ‍ॅप तगादा</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {language === "mr" ? "अलीकडील विक्री बिले (Recent Invoices)" : "Recent Invoices"}
            </h3>
            <p className="text-xs text-slate-500">काऊंटर व उधारीवर विक्रीची नोंद</p>
          </div>
          <Link
            href="/sales"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            <span>सर्व बिले पहा</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">बिल क्रमांक</th>
                <th className="px-4 py-3">तारीख</th>
                <th className="px-4 py-3">शेतकरी / ग्राहक</th>
                <th className="px-4 py-3">पंप तपशील</th>
                <th className="px-4 py-3 text-right">एकूण रक्कम</th>
                <th className="px-4 py-3 text-right">जमा</th>
                <th className="px-4 py-3 text-right">बाकी येणे</th>
                <th className="px-4 py-3 text-center">स्थिती</th>
                <th className="px-4 py-3 text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-semibold text-sky-600">
                    <Link href={`/sales/${sale.id}`}>{sale.invoice_number}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(sale.invoice_date)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{sale.customer_name}</p>
                    <p className="text-[11px] text-slate-400">{sale.customer_village || "सोलापूर"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {sale.items.map((i) => i.product_name).join(", ")}
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
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sale.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : sale.payment_status === "overdue"
                          ? "bg-rose-100 text-rose-800"
                          : sale.payment_status === "partially_paid"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {sale.payment_status === "paid"
                        ? "पूर्ण भरले"
                        : sale.payment_status === "overdue"
                        ? "मुदत संपली"
                        : sale.payment_status === "partially_paid"
                        ? "काही भरले"
                        : "बाकी"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/sales/${sale.id}`}
                      className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-semibold text-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>पहा</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

