"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  ShoppingCart,
  FileText,
  UserPlus,
  CreditCard,
  Bell,
  Languages,
  Store,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/context/store-context";

export const Header: React.FC = () => {
  const router = useRouter();
  const { language, toggleLanguage, settings, sales, customers, products } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const overdueSales = sales.filter(
    (s) => s.payment_status === "overdue" || (new Date(s.due_date) < new Date() && s.outstanding_balance > 0)
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();

    // Check if query matches customer name/mobile
    const matchedCust = customers.find(
      (c) => c.customer_name.toLowerCase().includes(q) || c.mobile_number.includes(q)
    );
    if (matchedCust) {
      router.push(`/customers/${matchedCust.id}`);
      setSearchQuery("");
      return;
    }

    // Check if query matches invoice number
    const matchedSale = sales.find((s) => s.invoice_number.toLowerCase().includes(q));
    if (matchedSale) {
      router.push(`/sales/${matchedSale.id}`);
      setSearchQuery("");
      return;
    }

    // Default to inventory search
    router.push(`/inventory?search=${encodeURIComponent(searchQuery)}`);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm no-print">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        {/* Left: Mobile Title & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <div className="lg:hidden flex items-center gap-2">
            <span className="font-bold text-sky-600 text-lg">PumpFlow</span>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative flex-1 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "mr"
                  ? "ग्राहक, पंप मॉडेल, बिल किंवा फोन नंबर शोधा..."
                  : "Search customer, pump model, invoice or mobile..."
              }
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-900"
            />
          </form>
        </div>

        {/* Right: Quick Action Buttons & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Solapur Dealership Badge */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-100 text-sky-900 text-xs font-medium">
            <Store className="h-3.5 w-3.5 text-sky-600" />
            <span>Market Yard, Solapur (413002)</span>
          </div>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            title="Toggle Language"
          >
            <Languages className="h-3.5 w-3.5 text-sky-600" />
            <span>{language === "mr" ? "मराठी" : "EN"}</span>
          </button>

          {/* Quick Action Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-600/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === "mr" ? "नवीन कृती" : "Quick Action"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </button>

            {showQuickMenu && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowQuickMenu(false)}
              >
                <Link
                  href="/sales/new"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600"
                >
                  <ShoppingCart className="h-4 w-4 text-sky-600" />
                  <span>{language === "mr" ? "नवीन विक्री / बिल" : "New Sale / Invoice"}</span>
                </Link>
                <Link
                  href="/quotations?action=new"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600"
                >
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>{language === "mr" ? "नवीन कोटेशन" : "New Quotation"}</span>
                </Link>
                <Link
                  href="/customers?action=new"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600"
                >
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                  <span>{language === "mr" ? "नवीन शेतकरी/ग्राहक" : "Add Customer"}</span>
                </Link>
                <Link
                  href="/payments?action=new"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600"
                >
                  <CreditCard className="h-4 w-4 text-amber-600" />
                  <span>{language === "mr" ? "पेमेंट जमा नोंदवा" : "Receive Payment"}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Overdue Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              title="Notifications & Overdue Alerts"
            >
              <Bell className="h-4 w-4" />
              {overdueSales.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {overdueSales.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900">
                    {language === "mr" ? "मुदत संपलेली पेमेंट्स" : "Overdue Payment Alerts"}
                  </h4>
                  <span className="text-[11px] text-rose-600 font-semibold">
                    {overdueSales.length} {language === "mr" ? "बाकी" : "pending"}
                  </span>
                </div>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {overdueSales.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                      {language === "mr" ? "सर्व पेमेंट्स वेळेवर आहेत!" : "No overdue invoices!"}
                    </p>
                  ) : (
                    overdueSales.map((sale) => (
                      <Link
                        key={sale.id}
                        href="/outstanding"
                        onClick={() => setShowNotifications(false)}
                        className="block p-2 rounded-lg bg-rose-50/50 hover:bg-rose-50 border border-rose-100 text-xs transition-colors"
                      >
                        <div className="flex justify-between font-semibold text-slate-900">
                          <span className="truncate">{sale.customer_name}</span>
                          <span className="text-rose-600">₹{sale.outstanding_balance.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                          <span>{sale.invoice_number}</span>
                          <span>मुदत: {sale.due_date}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 text-center">
                  <Link
                    href="/outstanding"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700"
                  >
                    {language === "mr" ? "सर्व बाकी पेमेंट्स पहा →" : "View All Receivables →"}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

