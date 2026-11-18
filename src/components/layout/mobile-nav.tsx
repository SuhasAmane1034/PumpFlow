"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  AlertCircle,
  Menu,
  X,
  CreditCard,
  FileText,
  Users,
  Building2,
  Truck,
  BarChart3,
  Settings,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { cn } from "@/lib/utils";

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { language, sales, products } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const overdueCount = sales.filter(
    (s) => s.payment_status === "overdue" || (new Date(s.due_date) < new Date() && s.outstanding_balance > 0)
  ).length;

  const lowStockCount = products.filter(
    (p) => p.is_active && p.available_quantity <= p.minimum_stock_quantity
  ).length;

  const navItems = [
    {
      label: language === "mr" ? "डॅशबोर्ड" : "Home",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: language === "mr" ? "स्टॉक" : "Stock",
      href: "/inventory",
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      label: language === "mr" ? "नवीन बिल" : "Billing",
      href: "/sales/new",
      icon: ShoppingCart,
      isPrimary: true,
    },
    {
      label: language === "mr" ? "बाकी" : "Dues",
      href: "/outstanding",
      icon: AlertCircle,
      badge: overdueCount > 0 ? overdueCount : undefined,
    },
    {
      label: language === "mr" ? "मेनू" : "Menu",
      action: () => setIsMenuOpen(true),
      icon: Menu,
    },
  ];

  return (
    <>
      {/* Bottom Sticky Navigation Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 py-1.5 px-3 shadow-lg no-print">
        <div className="flex items-center justify-around">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            if (item.action) {
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center py-1 px-2 text-slate-600 hover:text-sky-600 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium mt-1">{item.label}</span>
                </button>
              );
            }

            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href || "");

            if (item.isPrimary) {
              return (
                <Link
                  key={idx}
                  href={item.href || "/sales/new"}
                  className="relative -top-4 flex flex-col items-center justify-center h-13 w-13 rounded-full bg-sky-600 text-white shadow-lg shadow-sky-600/40 p-2.5 transition-transform active:scale-95"
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-[9px] font-bold mt-0.5 tracking-tight">
                    {language === "mr" ? "बिल" : "POS"}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={idx}
                href={item.href || "/"}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1 px-2 transition-colors",
                  isActive ? "text-sky-600 font-bold" : "text-slate-500 hover:text-slate-800"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 h-3.5 min-w-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Full Screen Slide-over Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="fixed inset-y-0 right-0 w-4/5 max-w-xs bg-slate-900 p-5 text-white flex flex-col justify-between shadow-2xl animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-bold text-sky-400 text-base">PumpFlow Solapur</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1.5">
                {[
                  { name: language === "mr" ? "डॅशबोर्ड" : "Dashboard", href: "/", icon: LayoutDashboard },
                  { name: language === "mr" ? "इन्व्हेंटरी (स्टॉक)" : "Inventory", href: "/inventory", icon: Package },
                  { name: language === "mr" ? "विक्री व बिलिंग" : "Sales & Invoices", href: "/sales", icon: ShoppingCart },
                  { name: language === "mr" ? "कोटेशन्स" : "Quotations", href: "/quotations", icon: FileText },
                  { name: language === "mr" ? "बाकी येणे" : "Outstanding Dues", href: "/outstanding", icon: AlertCircle },
                  { name: language === "mr" ? "पेमेंट जमा" : "Payments", href: "/payments", icon: CreditCard },
                  { name: language === "mr" ? "ग्राहक व खातेवही" : "Customers", href: "/customers", icon: Users },
                  { name: language === "mr" ? "खरेदी नोंद" : "Purchases", href: "/purchases", icon: Truck },
                  { name: language === "mr" ? "सप्लायर्स" : "Suppliers", href: "/suppliers", icon: Building2 },
                  { name: language === "mr" ? "अहवाल व रिपोर्ट्स" : "Reports", href: "/reports", icon: BarChart3 },
                  { name: language === "mr" ? "दुकान सेटिंग्ज" : "Settings", href: "/settings", icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-sky-400" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
              <p className="font-semibold text-slate-300">Shree Samarth Pumps</p>
              <p>Solapur, Maharashtra</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

