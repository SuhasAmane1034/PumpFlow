"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  AlertCircle,
  Eye,
  FileText,
  CreditCard,
  X,
  Send,
  Building2,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR } from "@/lib/utils";
import { Customer, CustomerType } from "@/types/database";
import { toast } from "sonner";

export default function CustomersPage() {
  const { language, customers, addCustomer, settings } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CustomerType>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const initialFormState: Omit<Customer, "id" | "created_at" | "updated_at"> = {
    customer_name: "",
    mobile_number: "",
    whatsapp_number: "",
    email: "",
    address: "",
    village_city: "",
    taluka: "Solapur",
    district: "Solapur",
    state: "Maharashtra",
    gstin: "",
    customer_type: "farmer",
    credit_limit: 100000,
    opening_balance: 0,
    current_outstanding: 0,
    reminder_opt_out: false,
    notes: "",
  };

  const [formData, setFormData] = useState(initialFormState);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile_number.includes(searchQuery) ||
      (c.village_city && c.village_city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.taluka && c.taluka.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === "all" || c.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.current_outstanding || 0), 0);
  const totalFarmers = customers.filter((c) => c.customer_type === "farmer").length;
  const totalRetailers = customers.filter((c) => c.customer_type === "retailer").length;

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.mobile_number) {
      toast.error("कृपया नाव व मोबाईल नंबर भरा.");
      return;
    }

    addCustomer({
      ...formData,
      current_outstanding: formData.opening_balance || 0,
    });

    toast.success("नवीन खातेदार यशस्वीरीत्या जोडला!");
    setIsAddModalOpen(false);
    setFormData(initialFormState);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "शेतकरी व ग्राहक खातेवही (Khata Directory)" : "Customers & Khata"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {customers.length} खातेदार
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "सोलापूर व परिसरातील शेतकरी, रिटेलर्स व बोअरवेल कंत्राटदारांचे खाते व्यवस्थापन"
              : "Manage farmer credit accounts, customer ledgers, and transaction histories"}
          </p>
        </div>

        <button
          onClick={() => {
            setFormData(initialFormState);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>{language === "mr" ? "नवीन खातेदार जोडा" : "Add Customer"}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण खातेदार</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">शेतकरी ग्राहक (Farmers)</span>
          <p className="text-xl font-bold text-emerald-600 mt-1">{totalFarmers}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">रिटेलर्स व डीलर्स</span>
          <p className="text-xl font-bold text-indigo-600 mt-1">{totalRetailers}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm">
          <span className="text-xs text-amber-800 font-semibold">एकूण येणे बाकी (Receivable)</span>
          <p className="text-xl font-bold text-amber-600 mt-1">{formatINR(totalOutstanding)}</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="शेतकरी नाव, फोन नंबर किंवा गाव (उदा. आंगर, पंढरपूर, बार्शी) शोधा..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          {(["all", "farmer", "retailer", "contractor", "dealer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md transition-all capitalize ${
                typeFilter === t
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "all"
                ? "सर्व खातेदार"
                : t === "farmer"
                ? "शेतकरी"
                : t === "retailer"
                ? "किरकोळ"
                : t === "contractor"
                ? "कंत्राटदार"
                : "डीलर"}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">शेतकरी / खातेदार नाव</th>
                <th className="px-4 py-3">मोबाईल नंबर</th>
                <th className="px-4 py-3">गाव व तालुका</th>
                <th className="px-4 py-3">प्रकार</th>
                <th className="px-4 py-3 text-right">उधारी मर्यादा (Limit)</th>
                <th className="px-4 py-3 text-right">सध्याची बाकी येणे</th>
                <th className="px-4 py-3 text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    कोणतेही खातेदार सापडले नाही.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/customers/${cust.id}`}
                        className="font-bold text-slate-900 hover:text-sky-600 transition-colors"
                      >
                        {cust.customer_name}
                      </Link>
                      {cust.gstin && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">GST: {cust.gstin}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      {cust.mobile_number}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="font-medium text-slate-800">{cust.village_city || "-"}</span>
                      <p className="text-[11px] text-slate-400">{cust.taluka || "Solapur"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 capitalize">
                        {cust.customer_type === "farmer"
                          ? "शेतकरी (Farmer)"
                          : cust.customer_type === "retailer"
                          ? "किरकोळ (Retailer)"
                          : cust.customer_type === "contractor"
                          ? "बोअरवेल कंत्राटदार"
                          : cust.customer_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {formatINR(cust.credit_limit)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {cust.current_outstanding > 0 ? (
                        <span className="text-rose-600">{formatINR(cust.current_outstanding)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">निरंक (₹0.00)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Link
                        href={`/customers/${cust.id}`}
                        className="px-2.5 py-1 rounded bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-xs inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>खातेवही पहा</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">नवीन ग्राहक / शेतकरी जोडा</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  शेतकरी / ग्राहकाचे पूर्ण नाव *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="उदा. विठ्ठलराव नामदेव पाटील"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    मोबाईल नंबर *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile_number}
                    onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                    placeholder="उदा. 9822456781"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    व्हॉट्सअ‍ॅप नंबर
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="उदा. 9822456781"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">गाव / शहर *</label>
                  <input
                    type="text"
                    required
                    value={formData.village_city}
                    onChange={(e) => setFormData({ ...formData, village_city: e.target.value })}
                    placeholder="उदा. आंगर, मोहोळ"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">तालुका</label>
                  <select
                    value={formData.taluka}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Mohol">मोहोळ (Mohol)</option>
                    <option value="Barshi">बार्शी (Barshi)</option>
                    <option value="Pandharpur">पंढरपूर (Pandharpur)</option>
                    <option value="Akkalkot">अक्कलकोट (Akkalkot)</option>
                    <option value="Karmala">करमाळा (Karmala)</option>
                    <option value="Solapur North">उत्तर सोलापूर (North Solapur)</option>
                    <option value="Solapur South">दक्षिण सोलापूर (South Solapur)</option>
                    <option value="Sangola">सांगोला (Sangola)</option>
                    <option value="Malshiras">माळशिरस (Malshiras)</option>
                    <option value="Mangalwedha">मंगळवेढा (Mangalwedha)</option>
                    <option value="Madha">माढा (Madha)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ग्राहक प्रकार</label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as CustomerType })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="farmer">शेतकरी (Farmer)</option>
                    <option value="retailer">किरकोळ विक्रेता (Retailer)</option>
                    <option value="contractor">बोअरवेल कंत्राटदार (Contractor)</option>
                    <option value="dealer">डीलर (Dealer)</option>
                    <option value="other">इतर</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    आरंभीची बाकी (Opening Bal ₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">पत्ता (Address)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="उदा. मु. पो. आंगर, ग्रामपंचायत कार्यालयाजवळ"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  नोंद (शेती, बोरवेल खोली, इत्यादी)
                </label>
                <input
                  type="text"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="उदा. 450 फूट बोरवेल, ऊस बागायतदार"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm"
                >
                  खातेदार जतन करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

