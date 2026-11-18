"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  X,
  CreditCard,
  Truck,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR } from "@/lib/utils";
import { Supplier } from "@/types/database";
import { toast } from "sonner";

export default function SuppliersPage() {
  const { language, suppliers, addSupplier } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const initialForm: Omit<Supplier, "id" | "created_at" | "updated_at"> = {
    supplier_name: "",
    contact_person: "",
    contact_number: "",
    whatsapp_number: "",
    email: "",
    address: "",
    city: "Solapur",
    state: "Maharashtra",
    gstin: "",
    opening_balance: 0,
    current_outstanding: 0,
    notes: "",
  };

  const [formData, setFormData] = useState(initialForm);

  const filteredSuppliers = suppliers.filter((s) => {
    return (
      s.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.contact_number.includes(searchQuery)
    );
  });

  const totalOutstandingToSuppliers = suppliers.reduce((sum, s) => sum + s.current_outstanding, 0);

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_name || !formData.contact_number) {
      toast.error("कृपया सप्लायर नाव व मोबाईल नंबर भरा.");
      return;
    }

    addSupplier({
      ...formData,
      current_outstanding: formData.opening_balance || 0,
    });

    toast.success("नवीन सप्लायर यशस्वीरीत्या जोडला!");
    setIsModalOpen(false);
    setFormData(initialForm);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "सप्लायर्स व पंप उत्पादक कंपन्या" : "Suppliers & Manufacturers"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              {suppliers.length} सप्लायर्स
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "किर्लोस्कर, सीआरआय, टेक्स्टमो व पाईप कंपन्यांचे वितरक व्यवस्थापन"
              : "Manage regional depots, manufacturers, distributors, and payables"}
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(initialForm);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{language === "mr" ? "नवीन सप्लायर जोडा" : "Add Supplier"}</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण सप्लायर्स</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length} कंपन्या</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
          <span className="text-xs text-rose-800 font-bold">एकूण देणे बाकी (Payable Due)</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatINR(totalOutstandingToSuppliers)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">मुख्य ब्रँड पुरवठादार</span>
          <p className="text-base font-bold text-sky-700 mt-1">KBL, CRI, Finolex, Texmo</p>
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
            placeholder="सप्लायर नाव, संपर्क व्यक्ती किंवा फोन नंबर शोधा..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">सप्लायर / कंपनी नाव</th>
                <th className="px-4 py-3">संपर्क व्यक्ती</th>
                <th className="px-4 py-3">फोन / व्हॉट्सअ‍ॅप</th>
                <th className="px-4 py-3">पत्ता व शहर</th>
                <th className="px-4 py-3">GSTIN</th>
                <th className="px-4 py-3 text-right">देणे बाकी (Payable ₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{s.supplier_name}</p>
                    <p className="text-[11px] text-slate-500">{s.notes || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{s.contact_person || "-"}</td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-700">{s.contact_number}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.address}, {s.city}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-500">{s.gstin || "-"}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    {s.current_outstanding > 0 ? (
                      <span className="text-rose-600">{formatINR(s.current_outstanding)}</span>
                    ) : (
                      <span className="text-emerald-600">निरंक (₹0.00)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">नवीन सप्लायर / पुरवठादार जोडा</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  कंपनी / सप्लायर नाव *
                </label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="उदा. Texmo Pipes & Pump Distributors"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    संपर्क व्यक्ती
                  </label>
                  <input
                    type="text"
                    value={formData.contact_person || ""}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="उदा. महेश गांधी"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    मोबाईल नंबर *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    placeholder="उदा. 9822012345"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">शहर</label>
                  <input
                    type="text"
                    value={formData.city || "Solapur"}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={formData.gstin || ""}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                    placeholder="27AAACK1234P1Z4"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  आरंभीची देणे बाकी (Opening Payable ₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.opening_balance}
                  onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm"
                >
                  सप्लायर जतन करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

