"use client";

import React, { useState } from "react";
import {
  Settings,
  Store,
  CreditCard,
  FileText,
  MessageSquare,
  Save,
  RotateCcw,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { BusinessSettings } from "@/types/database";
import { toast } from "sonner";

export default function SettingsPage() {
  const { language, settings, updateSettings, resetToDefault } = useStore();
  const [activeTab, setActiveTab] = useState<"shop" | "bank" | "billing" | "whatsapp">("shop");
  const [formData, setFormData] = useState<BusinessSettings>(settings);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    toast.success("दुकान सेटिंग्ज यशस्वीरीत्या जतन केल्या!");
  };

  const handleReset = () => {
    if (confirm("तुम्हाला खात्री आहे का? सर्व डेटा पूर्वस्थितीत (Initial Mock Data) येईल.")) {
      resetToDefault();
      toast.success("डेटा पूर्वस्थितीत रिसेट झाला.");
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "दुकान व बिलिंग सेटिंग्ज (Business Settings)" : "Business Settings"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "दुकान तपशील, बँक खाती, जीएसटी, बिल अटी व व्हॉट्सअ‍ॅप मेसेज टेम्प्लेट्स"
              : "Configure shop address, GSTIN, bank details, invoice terms, and WhatsApp templates"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            <span>डेटा रिसेट</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>बदल जतन करा</span>
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("shop")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "shop"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>दुकान माहिती (Shop Profile)</span>
        </button>

        <button
          onClick={() => setActiveTab("bank")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "bank"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>बँक व UPI खाती</span>
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "billing"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>बिलिंग व अटी (Invoice Terms)</span>
        </button>

        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "whatsapp"
              ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>व्हॉट्सअ‍ॅप तगादा टेम्प्लेट</span>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* 1. Shop Profile */}
        {activeTab === "shop" && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              दुकान व संपर्क माहिती (Shop Details)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  दुकान / एजन्सीचे नाव *
                </label>
                <input
                  type="text"
                  required
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  मालक / व्यवस्थापक नाव *
                </label>
                <input
                  type="text"
                  required
                  value={formData.shop_owner}
                  onChange={(e) => setFormData({ ...formData, shop_owner: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">टॅगलाईन (Tagline)</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">पत्ता (Address) *</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">शहर / जिल्हा</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">पिनकोड</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  दुकान फोन नंबर *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  व्हॉट्सअ‍ॅप नंबर *
                </label>
                <input
                  type="text"
                  required
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN नंबर *</label>
                <input
                  type="text"
                  required
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  राज्य कोड (State Code)
                </label>
                <input
                  type="text"
                  value={formData.state_code}
                  onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Bank Details */}
        {activeTab === "bank" && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              बँक खाते व UPI तपशील (बिल प्रिंटवर दिसतील)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">बँकेचे नाव *</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  खाते क्रमांक (Account No) *
                </label>
                <input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC कोड *</label>
                <input
                  type="text"
                  value={formData.bank_ifsc}
                  onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">शाखा (Branch)</label>
                <input
                  type="text"
                  value={formData.bank_branch}
                  onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">UPI आयडी (VPA) *</label>
                <input
                  type="text"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                  placeholder="उदा. samarthpumps@sbi"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sky-700 font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Billing & Terms */}
        {activeTab === "billing" && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              बिलिंग प्रीफिक्स व हमी (Warranty) अटी
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  बिल क्रमांक प्रीफिक्स
                </label>
                <input
                  type="text"
                  value={formData.invoice_prefix}
                  onChange={(e) => setFormData({ ...formData, invoice_prefix: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  कोटेशन प्रीफिक्स
                </label>
                <input
                  type="text"
                  value={formData.quotation_prefix}
                  onChange={(e) => setFormData({ ...formData, quotation_prefix: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  डीफॉल्ट उधारी मुदत (दिवस)
                </label>
                <input
                  type="number"
                  value={formData.default_credit_days}
                  onChange={(e) => setFormData({ ...formData, default_credit_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  बिलावरील अटी व शर्ती (Invoice Terms)
                </label>
                <textarea
                  rows={4}
                  value={formData.invoice_terms}
                  onChange={(e) => setFormData({ ...formData, invoice_terms: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. WhatsApp Template */}
        {activeTab === "whatsapp" && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              मराठी व्हॉट्सअ‍ॅप तगादा संदेश पूर्वावलोकन (Preview)
            </h3>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800 font-mono whitespace-pre-line space-y-1">
              <p className="font-bold text-emerald-900">नमस्कार [ग्राहक नाव] जी,</p>
              <br />
              <p>
                आपण *{formData.shop_name}* येथून खरेदी केलेल्या मालाचे *[बाकी रक्कम]* इतके पेमेंट बाकी
                आहे.
              </p>
              <br />
              <p>📄 *बिल क्रमांक:* INV-2026-00101</p>
              <p>📅 *अंतिम देय तारीख:* 25 Feb 2026</p>
              <p>💳 *UPI ID:* {formData.upi_id}</p>
              <br />
              <p>कृपया आपले बाकी असलेले पेमेंट लवकरात लवकर पूर्ण करावे ही नम्र विनंती.</p>
              <p>पेमेंट झाल्यानंतर कृपया पोच पावती किंवा स्क्रीनशॉट पाठवावा.</p>
              <br />
              <p>धन्यवाद!</p>
              <p>*{formData.shop_name}*</p>
              <p>📞 संपर्क: {formData.contact_number}</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition-all active:scale-98"
          >
            <Save className="h-4 w-4" />
            <span>सेटिंग्ज जतन करा (Save Settings)</span>
          </button>
        </div>
      </form>
    </div>
  );
}

