"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Edit,
  Trash2,
  SlidersHorizontal,
  X,
  History,
} from "lucide-react";
import { useStore } from "@/context/store-context";
import { formatINR, i18n } from "@/lib/utils";
import { Product, ProductCategory, Brand, StockMovementType, PumpPhase } from "@/types/database";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function InventoryPage() {
  const {
    language,
    products,
    categories,
    brands,
    suppliers,
    movements,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [stockStatus, setStockStatus] = useState<"all" | "low" | "in_stock">("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Stock adjust form
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<StockMovementType>("purchase_in");
  const [adjustReason, setAdjustReason] = useState<string>("");

  // Product Form State
  const initialFormState: Omit<Product, "id" | "created_at" | "updated_at"> = {
    product_name: "",
    category_id: categories[0]?.id || "",
    brand_id: brands[0]?.id || "",
    model_number: "",
    sku: "",
    description: "",
    hp: "5.0 HP",
    voltage: "415 V",
    phase: "three_phase",
    pump_type: "V4 Water Filled Submersible",
    discharge_capacity: "150 - 350 LPM",
    head_range: "45 - 90 Meters",
    bore_size: "100 mm (4 inch)",
    stages: 10,
    hsn_code: "84137010",
    gst_percentage: 18,
    purchase_price: 20000,
    selling_price: 25000,
    mrp: 30000,
    available_quantity: 5,
    minimum_stock_quantity: 2,
    supplier_id: suppliers[0]?.id || "",
    is_active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (!p.is_active) return false;
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    const matchesBrand = selectedBrand === "all" || p.brand_id === selectedBrand;
    const matchesPhase = selectedPhase === "all" || p.phase === selectedPhase;

    let matchesStock = true;
    if (stockStatus === "low") {
      matchesStock = p.available_quantity <= p.minimum_stock_quantity;
    } else if (stockStatus === "in_stock") {
      matchesStock = p.available_quantity > p.minimum_stock_quantity;
    }

    return matchesSearch && matchesCategory && matchesBrand && matchesPhase && matchesStock;
  });

  const lowStockCount = products.filter(
    (p) => p.is_active && p.available_quantity <= p.minimum_stock_quantity
  ).length;

  const totalStockUnits = products.reduce((acc, p) => acc + (p.is_active ? p.available_quantity : 0), 0);
  const totalStockValuation = products.reduce(
    (acc, p) => acc + (p.is_active ? p.available_quantity * p.purchase_price : 0),
    0
  );

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredProducts.map((p) => ({
      "Product Name": p.product_name,
      Category: categories.find((c) => c.id === p.category_id)?.name || p.category_name,
      Brand: brands.find((b) => b.id === p.brand_id)?.name || p.brand_name,
      Model: p.model_number,
      SKU: p.sku,
      HP: p.hp || "-",
      Phase: p.phase === "three_phase" ? "3 Phase" : "Single Phase",
      "Available Stock": p.available_quantity,
      "Min Stock": p.minimum_stock_quantity,
      "Purchase Price": p.purchase_price,
      "Selling Price": p.selling_price,
      MRP: p.mrp,
      HSN: p.hsn_code,
      GST: `${p.gst_percentage}%`,
      "Total Value": p.available_quantity * p.purchase_price,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `PumpFlow_Inventory_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel फाईल यशस्वीरीत्या डाउनलोड झाली!");
  };

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      product_name: p.product_name,
      category_id: p.category_id,
      brand_id: p.brand_id,
      model_number: p.model_number,
      sku: p.sku,
      description: p.description || "",
      hp: p.hp || "",
      voltage: p.voltage || "",
      phase: p.phase,
      pump_type: p.pump_type || "",
      discharge_capacity: p.discharge_capacity || "",
      head_range: p.head_range || "",
      bore_size: p.bore_size || "",
      stages: p.stages || 0,
      hsn_code: p.hsn_code,
      gst_percentage: p.gst_percentage,
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      mrp: p.mrp,
      available_quantity: p.available_quantity,
      minimum_stock_quantity: p.minimum_stock_quantity,
      supplier_id: p.supplier_id || "",
      is_active: p.is_active,
    });
    setIsAddModalOpen(true);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name || !formData.model_number || !formData.sku) {
      toast.error("कृपया प्रॉडक्ट नाव, मॉडेल नंबर आणि SKU भरा.");
      return;
    }

    const cat = categories.find((c) => c.id === formData.category_id);
    const br = brands.find((b) => b.id === formData.brand_id);

    const payload = {
      ...formData,
      category_name: cat?.name,
      brand_name: br?.name,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      toast.success("पंप तपशील अद्ययावत केले!");
    } else {
      addProduct(payload);
      toast.success("नवीन पंप यशस्वीरीत्या इन्व्हेंटरीमध्ये जोडला!");
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
    setFormData(initialFormState);
  };

  // Open Stock Adjust Modal
  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustQty(1);
    setAdjustType("purchase_in");
    setAdjustReason("Stock replenishment");
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const delta = adjustType === "purchase_in" || adjustType === "return_in" ? adjustQty : -adjustQty;

    if (adjustingProduct.available_quantity + delta < 0) {
      toast.error("स्टॉक उणे (Negative) होऊ शकत नाही! उपलब्ध साठ्यापेक्षा जास्त वजा करता येत नाही.");
      return;
    }

    adjustStock(adjustingProduct.id, delta, adjustType, adjustReason || "Manual adjustment");
    toast.success(`स्टॉक अपडेट झाला! नवीन शिल्लक: ${adjustingProduct.available_quantity + delta}`);
    setIsAdjustModalOpen(false);
    setAdjustingProduct(null);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>{language === "mr" ? "इन्व्हेंटरी व पंप स्टॉक व्यवस्थापन" : "Inventory & Pump Stock"}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
              {products.length} प्रॉडक्ट्स
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {language === "mr"
              ? "सबमर्सिबल पंप, मोटर्स, केबल्स, स्टार्टर व कॉलम पाईप्सचा थेट साठा"
              : "Track submersible pump sets, motors, cables, panels, and column pipes"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMovementsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <History className="h-4 w-4 text-slate-500" />
            <span>{language === "mr" ? "स्टॉक हालचाली" : "Movements"}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData(initialFormState);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{language === "mr" ? "नवीन पंप जोडा" : "Add Product"}</span>
          </button>
        </div>
      </div>

      {/* Mini Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण मॉडेल्स</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">एकूण उपलब्ध युनिट्स</span>
          <p className="text-xl font-bold text-sky-600 mt-1">{totalStockUnits}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">स्टॉकचे एकूण मूल्य</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalStockValuation)}</p>
        </div>
        <div
          onClick={() => setStockStatus(stockStatus === "low" ? "all" : "low")}
          className={`p-3.5 rounded-xl border shadow-sm cursor-pointer transition-colors ${
            stockStatus === "low"
              ? "bg-amber-100/70 border-amber-400"
              : lowStockCount > 0
              ? "bg-amber-50 border-amber-200 hover:bg-amber-100/50"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">कमी साठा अलर्ट</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-800 mt-1">{lowStockCount} मॉडेल्स</p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="पंप नाव, मॉडेल (उदा. KS4-5012), SKU किंवा ब्रँड शोधा..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Stock Status Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium shrink-0">
            <button
              onClick={() => setStockStatus("all")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                stockStatus === "all" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              सर्व ({products.length})
            </button>
            <button
              onClick={() => setStockStatus("low")}
              className={`px-3 py-1.5 rounded-md transition-all ${
                stockStatus === "low" ? "bg-amber-600 text-white shadow-sm font-semibold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              कमी साठा ({lowStockCount})
            </button>
          </div>
        </div>

        {/* Categories & Brands Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            कॅटेगरी:
          </span>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === "all" ? "bg-sky-600 text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            सर्व कॅटेगरीज
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat.id ? "bg-sky-600 text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {language === "mr" ? cat.marathi_name : cat.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="font-semibold text-slate-500">ब्रँड:</span>
          <button
            onClick={() => setSelectedBrand("all")}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedBrand === "all" ? "bg-slate-800 text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            सर्व ब्रँड्स
          </button>
          {brands.map((br) => (
            <button
              key={br.id}
              onClick={() => setSelectedBrand(br.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedBrand === br.id ? "bg-slate-800 text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {br.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">पंप / प्रॉडक्ट तपशील</th>
                <th className="px-4 py-3">ब्रँड व कॅटेगरी</th>
                <th className="px-4 py-3">HP / फेज / व्होल्टेज</th>
                <th className="px-4 py-3">हेड व डिस्चार्ज</th>
                <th className="px-4 py-3 text-center">उपलब्ध साठा</th>
                <th className="px-4 py-3 text-right">खरेदी किंमत</th>
                <th className="px-4 py-3 text-right">विक्री किंमत</th>
                <th className="px-4 py-3 text-right">नफा (मार्जिन)</th>
                <th className="px-4 py-3 text-right">कृती</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    कोणतेही प्रॉडक्ट सापडले नाही. कृपया फिल्टर तपासा.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.available_quantity <= p.minimum_stock_quantity;
                  const margin = p.selling_price - p.purchase_price;
                  const marginPct = p.purchase_price > 0 ? ((margin / p.purchase_price) * 100).toFixed(1) : "0";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <p className="font-bold text-slate-900">{p.product_name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          SKU: <span className="font-mono">{p.sku}</span> • मॉडेल: {p.model_number}
                        </p>
                        {p.serial_numbers && p.serial_numbers.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100 w-fit">
                            <span>S/N: {p.serial_numbers.slice(0, 2).join(", ")}</span>
                            {p.serial_numbers.length > 2 && <span>+{p.serial_numbers.length - 2} आणखी</span>}
                          </div>
                        )}
                      </td>

                      {/* Brand & Category */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{p.brand_name || "-"}</span>
                        <p className="text-[11px] text-slate-500">{p.category_name || "-"}</p>
                      </td>

                      {/* HP, Phase, Voltage */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-sky-700">{p.hp || "-"}</span>
                        <p className="text-[11px] text-slate-500">
                          {p.phase === "three_phase" ? "3 Phase (415V)" : "Single Phase (220V)"}
                        </p>
                      </td>

                      {/* Head & Discharge */}
                      <td className="px-4 py-3 text-slate-600">
                        <p>{p.head_range || "-"}</p>
                        <p className="text-[11px] text-slate-500">{p.discharge_capacity || "-"}</p>
                      </td>

                      {/* Available Stock */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                            isLow
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isLow && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                          {p.available_quantity} नग
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">किमान: {p.minimum_stock_quantity}</p>
                      </td>

                      {/* Purchase Price */}
                      <td className="px-4 py-3 text-right font-medium text-slate-600">
                        {formatINR(p.purchase_price)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatINR(p.selling_price)}
                        <p className="text-[10px] text-slate-400">MRP: {formatINR(p.mrp)}</p>
                      </td>

                      {/* Margin */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-emerald-600">+{formatINR(margin)}</span>
                        <p className="text-[10px] text-emerald-700">({marginPct}%)</p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                          title="Stock Adjustment (स्टॉक कमी/जास्त करा)"
                        >
                          साठा बदल
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? "पंप तपशील सुधारा" : "नवीन सबमर्सिबल पंप / प्रॉडक्ट जोडा"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    प्रॉडक्ट नाव *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="उदा. Kirloskar KS4-5012 5.0 HP Submersible Pump Set"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">कॅटेगरी *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.marathi_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ब्रँड *</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    मॉडेल नंबर *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model_number}
                    onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                    placeholder="उदा. KS4-5012"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU कोड *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="उदा. KBL-KS4-5012"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                {/* Submersible Technical Specifications */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HP (हॉर्सपॉवर)</label>
                  <input
                    type="text"
                    value={formData.hp}
                    onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
                    placeholder="उदा. 3.0 HP, 5.0 HP, 7.5 HP"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">फेज (Phase)</label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({ ...formData, phase: e.target.value as PumpPhase })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="three_phase">3-Phase (415V - Three Phase)</option>
                    <option value="single_phase">Single Phase (220V - Single Phase)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">हेड रेंज (Head Range)</label>
                  <input
                    type="text"
                    value={formData.head_range}
                    onChange={(e) => setFormData({ ...formData, head_range: e.target.value })}
                    placeholder="उदा. 30 - 90 Meters"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">डिस्चार्ज क्षमता</label>
                  <input
                    type="text"
                    value={formData.discharge_capacity}
                    onChange={(e) => setFormData({ ...formData, discharge_capacity: e.target.value })}
                    placeholder="उदा. 200 - 450 LPM"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Pricing & Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">खरेदी किंमत (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">विक्री किंमत (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-sky-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MRP (छापील किंमत)</label>
                  <input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HSN कोड</label>
                  <input
                    type="text"
                    value={formData.hsn_code}
                    onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">उपलब्ध साठा (Qty) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.available_quantity}
                    onChange={(e) => setFormData({ ...formData, available_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">किमान साठा अलर्ट (Min Qty)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.minimum_stock_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_stock_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm"
                >
                  {editingProduct ? "बदल जतन करा" : "पंप साठा जतन करा"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">स्टॉक अ‍ॅडजस्टमेंट (साठा बदल)</h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">{adjustingProduct.product_name}</p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="mt-4 space-y-3.5">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600">सध्या उपलब्ध साठा:</span>
                <span className="text-sm font-bold text-slate-900">{adjustingProduct.available_quantity} नग</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">हालचालीचा प्रकार</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="purchase_in">+ नवीन माल आला (Stock In / Purchase)</option>
                  <option value="return_in">+ ग्राहकाकडून परत आला (Customer Return)</option>
                  <option value="damage_out">- खराब / तुटफूट (Damage Out)</option>
                  <option value="manual_adjustment">मॅन्युअल सुधारणा (Physical Audit Adjustment)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">नग संख्या (Quantity)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">कारण / संदर्भ</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="उदा. कंपनीकडून नवीन ट्रकमधून माल आला"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white shadow-sm"
                >
                  साठा अपडेट करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Audit Log Modal */}
      {isMovementsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">इन्व्हेंटरी ऑडिट हालचाली (Stock Movements Ledger)</h3>
                <p className="text-xs text-slate-500">प्रत्येक विक्री, खरेदी व मॅन्युअल साठा नोंदींचा पारदर्शक इतिहास</p>
              </div>
              <button
                onClick={() => setIsMovementsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 mt-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2">तारीख व वेळ</th>
                    <th className="px-3 py-2">प्रॉडक्ट</th>
                    <th className="px-3 py-2">प्रकार</th>
                    <th className="px-3 py-2 text-center">बदल (Qty)</th>
                    <th className="px-3 py-2 text-center">नवीन साठा</th>
                    <th className="px-3 py-2">कारण / बिल क्र.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                        {m.created_at.replace("T", " ").slice(0, 16)}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">{m.product_name}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-slate-700 capitalize">
                          {m.movement_type.replace("_", " ")}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2 text-center font-bold ${
                          m.quantity > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-slate-800">{m.new_stock} नग</td>
                      <td className="px-3 py-2 text-slate-600">{m.reason || m.reference_number || "-"}</td>
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

