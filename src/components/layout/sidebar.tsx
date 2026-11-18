"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  AlertCircle,
  CreditCard,
  Users,
  Truck,
  Building2,
  BarChart3,
  Settings,
  Languages,
  Zap,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { cn, i18n } from "@/lib/utils";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { language, toggleLanguage, products, sales, settings } = useStore();

  const lowStockCount = products.filter(
    (p) => p.is_active && p.available_quantity <= p.minimum_stock_quantity
  ).length;

  const overdueCount = sales.filter(
    (s) => s.payment_status === "overdue" || (new Date(s.due_date) < new Date() && s.outstanding_balance > 0)
  ).length;

  const t = i18n[language];

  const navigation = [
    {
      name: t.dashboard,
      marathi: "डॅशबोर्ड",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: t.inventory,
      marathi: "इन्व्हेंटरी (स्टॉक)",
      href: "/inventory",
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      name: t.sales,
      marathi: "विक्री व बिलिंग",
      href: "/sales",
      icon: ShoppingCart,
    },
    {
      name: t.quotations,
      marathi: "कोटेशन्स",
      href: "/quotations",
      icon: FileText,
    },
    {
      name: t.outstanding,
      marathi: "बाकी येणे (वसुली)",
      href: "/outstanding",
      icon: AlertCircle,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: "bg-rose-500 text-white animate-pulse",
    },
    {
      name: t.payments,
      marathi: "पेमेंट जमा",
      href: "/payments",
      icon: CreditCard,
    },
    {
      name: t.customers,
      marathi: "ग्राहक व खातेवही",
      href: "/customers",
      icon: Users,
    },
    {
      name: t.purchases,
      marathi: "खरेदी नोंद",
      href: "/purchases",
      icon: Truck,
    },
    {
      name: t.suppliers,
      marathi: "सप्लायर्स",
      href: "/suppliers",
      icon: Building2,
    },
    {
      name: t.reports,
      marathi: "अहवाल व जीएसटी",
      href: "/reports",
      icon: BarChart3,
    },
    {
      name: t.settings,
      marathi: "दुकान सेटिंग्ज",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 border-r border-slate-800 text-slate-100 z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-slate-950/60">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
          <Zap className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            PumpFlow
            <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              Solapur
            </span>
          </h1>
          <p className="text-xs text-slate-400 truncate font-medium">
            {settings.shop_name}
          </p>
        </div>
      </div>

      {/* Language Switcher Bar */}
      <div className="px-4 py-2.5 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
          <Languages className="h-3.5 w-3.5 text-sky-400" />
          {language === "mr" ? "मराठी भाषा" : "English Mode"}
        </span>
        <button
          onClick={toggleLanguage}
          className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-sky-300 transition-colors border border-slate-700"
        >
          {language === "mr" ? "Switch to English" : "मराठी मध्ये बदला"}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all",
                isActive
                  ? "bg-sky-600 text-white shadow-sm shadow-sky-600/30 font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-sky-400"
                  )}
                />
                <span className="truncate">
                  {language === "mr" ? item.marathi : item.name}
                </span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center leading-none",
                    item.badgeColor || "bg-sky-500 text-white"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Dealer Footer Card */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
          <p className="font-semibold text-slate-200 truncate">{settings.shop_owner}</p>
          <p className="text-slate-400 text-[11px] truncate">Market Yard, Solapur</p>
          <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-slate-700/60 text-[10px] text-slate-400">
            <span>GST: {settings.gstin.slice(0, 8)}...</span>
            <span className="text-emerald-400 font-medium">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

