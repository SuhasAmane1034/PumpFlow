"use client";

import React, { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Package,
  Calendar,
  Building2,
  CheckCircle2,
  X,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, formatDate } from "@/lib/utils";
import { Purchase, PurchaseItem, PaymentMode } from "@/types/database";
import { toast } from "sonner";

export default function PurchasesPage() {
  const { language, suppliers, products, adjustStock } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Purchases list state (initialized with real supplier records)
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: "pur-1",
      purchase_invoice_number: "PUR-KBL-8821",
      supplier_id: "sup-1",
      supplier_name: "Kirloskar Brothers Regional Depot",
      purchase_date: "2026-02-01",
      total_amount: 147000,
      amount_paid: 82000,
      outstanding_balance: 65000,
      payment_status: "partially_paid",
      payment_mode: "bank_transfer",
      notes: "Stock delivery of 6 sets of 5 HP KS4 pumps",
      items: [
        {
          id: "pitem-1",
          purchase_id: "pur-1",
          product_id: "prod-1",
          product_name: "Kirloskar KS4-5012 5.0 HP Submersible Pump Set",
          quantity: 6,
          purchase_price: 24500,
          gst_percentage: 18,
          tax_amount: 26460,
          total_amount: 173460,
        },
      ],
      created_at: "2026-02-01T11:00:00Z",
      updated_at: "2026-02-01T11:00:00Z",
    },
    {
      id: "pur-2",
      purchase_invoice_number: "PUR-CRI-9042",
      supplier_id: "sup-2",
      supplier_name: "CRI Pumps Western Maharashtra Hub",
      purchase_date: "2026-02-15",
      total_amount: 144000,
      amount_paid: 144000,
      outstanding_balance: 0,
      payment_status: "paid",
      payment_mode: "bank_transfer",
      notes: "4 sets of 7.5 HP V6 pumps",
      items: [
        {
          id: "pitem-2",
          purchase_id: "pur-2",
          product_id: "prod-2",
          product_name: "CRI 7.5 HP V6 Heavy Duty Borewell Submersible Pump",
          quantity: 4,
          purchase_price: 36000,
          gst_percentage: 18,
          tax_amount: 25920,
          total_amount: 169920,
        },
      ],
      created_at: "2026-02-15T10:30:00Z",
      updated_at: "2026-02-15T10:30:00Z",
    },
  ]);

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || "");
  const [purchaseInvoiceNumber, setPurchaseInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [quantity, setQuantity] = useState(5);
  const [purchasePrice, setPurchasePrice] = useState(products[0]?.purchase_price || 20000);
  const [amountPaid, setAmountPaid] = useState(0);
  const [purchaseNotes, setPurchaseNotes] = useState("");

  const filteredPurchases = purchases.filter((p) => {
    return (
      p.purchase_invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const totalPurchaseValue = purchases.reduce((sum, p) => sum + p.total_amount, 0);
  const totalSupplierDue = purchases.reduce((sum, p) => sum + p.outstanding_balance, 0);

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseInvoiceNumber) {
      toast.error("कृपया खरेदी बिल क्रमांक भरा.");
      return;
    }

    const supp = suppliers.find((s) => s.id === supplierId);
    const prod = products.find((p) => p.id === productId);

    const total = quantity * purchasePrice;
    const outstanding = Math.max(0, total - amountPaid);
    const status = outstanding === 0 ? "paid" : amountPaid > 0 ? "partially_paid" : "pending";

    const newPurchase: Purchase = {
      id: "pur-" + Date.now(),
      purchase_invoice_number: purchaseInvoiceNumber,
      supplier_id: supplierId,
      supplier_name: supp?.supplier_name,
      purchase_date: purchaseDate,
      total_amount: total,
      amount_paid: amountPaid,
      outstanding_balance: outstanding,
      payment_status: status,
      payment_mode: "bank_transfer",
      notes: purchaseNotes,
      items: [
        {
          id: "pitem-" + Date.now(),
          product_id: productId,
          product_name: prod?.product_name,
          quantity,
          purchase_price: purchasePrice,
          gst_percentage: 18,
          tax_amount: total * 0.18,
          total_amount: total * 1.18,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Auto increment stock in inventory!
    adjustStock(
      productId,
      quantity,
      "purchase_in",
      `Purchase invoice ${purchaseInvoiceNumber}`,
      purchaseInvoiceNumber
    );

    setPurchases([newPurchase, ...purchases]);
    toast.success(
      `खरेदी नोंद यशस्वी! ${prod?.product_name} चा साठा +${quantity} नगाने वाढवला आहे.`
    );
    setIsModalOpen(false);
    setPurchaseInvoiceNumber("");
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "खरेदी नोंद व स्टॉक-इन (Purchases)" : "Purchases & Stock In"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {purchases.length} पावत्या
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "कंपनीकडून किंवा सप्लायर्सकडून आलेल्या पंपांची नोंद करा; साठा आपोआप वाढेल"
              : "Record manufacturer stock deliveries and automatically increase inventory"}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{language === "mr" ? "नवीन खरेदी नोंदवा (Stock In)" : "New Purchase Entry"}</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण खरेदी मूल्य (Total Purchases)</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatINR(totalPurchaseValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">सप्लायर्सना देणे बाकी (Payable Due)</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatINR(totalSupplierDue)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">नोंदणीकृत सप्लायर्स</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{suppliers.length} कंपन्या/एजन्सी</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="खरेदी बिल क्र. किंवा सप्लायर नाव शोधा..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
          />
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">खरेदी बिल क्र.</th>
                <th className="px-4 py-3">तारीख</th>
                <th className="px-4 py-3">सप्लायर / कंपनी</th>
                <th className="px-4 py-3">पंप प्रॉडक्ट</th>
                <th className="px-4 py-3 text-center">संख्या (Qty)</th>
                <th className="px-4 py-3 text-right">एकूण खरेदी रक्कम</th>
                <th className="px-4 py-3 text-right">कंपनीस देणे बाकी</th>
                <th className="px-4 py-3 text-center">स्थिती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-sky-700 font-mono">
                    {p.purchase_invoice_number}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.purchase_date)}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{p.supplier_name}</td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                    {p.items.map((i) => i.product_name).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600">
                    +{p.items.reduce((sum, i) => sum + i.quantity, 0)} नग
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {formatINR(p.total_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-rose-600">
                    {p.outstanding_balance > 0 ? formatINR(p.outstanding_balance) : "निरंक"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        p.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.payment_status === "paid" ? "पूर्ण भरले" : "बाकी"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">नवीन खरेदी नोंद (Stock In Entry)</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  सप्लायर / कंपनी निवडा *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplier_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    खरेदी बिल क्रमांक *
                  </label>
                  <input
                    type="text"
                    required
                    value={purchaseInvoiceNumber}
                    onChange={(e) => setPurchaseInvoiceNumber(e.target.value)}
                    placeholder="उदा. PUR-KBL-9920"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">खरेदी तारीख</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  पंप / प्रॉडक्ट निवडा *
                </label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    const pr = products.find((p) => p.id === e.target.value);
                    if (pr) setPurchasePrice(pr.purchase_price);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    आलेला साठा (Qty) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    खरेदी दर (Rate ₹) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  कंपनीस दिलेली रक्कम (Paid Amount ₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex justify-between text-xs font-bold text-emerald-800">
                <span>एकूण खरेदी मूल्य:</span>
                <span>{formatINR(quantity * purchasePrice)}</span>
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
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm"
                >
                  खरेदी नोंदवा व साठा वाढवा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

