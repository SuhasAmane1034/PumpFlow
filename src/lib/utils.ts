import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers as Indian Rupee Currency (e.g. ₹ 1,25,000.00)
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date string (YYYY-MM-DD) to friendly Indian format (DD/MM/YYYY or DD MMM YYYY)
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculate days overdue against current date
 */
export function getDaysOverdue(dueDateString: string | undefined | null): number {
  if (!dueDateString) return 0;
  const due = new Date(dueDateString);
  const now = new Date();
  // Strip time parts
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calculate GST Breakdown based on whether the buyer is interstate or within Maharashtra (State code 27)
 */
export function calculateGST(
  taxableAmount: number,
  gstRate: number = 18,
  isInterstate: boolean = false
) {
  const totalTax = (taxableAmount * gstRate) / 100;
  if (isInterstate) {
    return {
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRate,
      igstAmount: totalTax,
      totalTax,
    };
  } else {
    const halfRate = gstRate / 2;
    const halfTax = totalTax / 2;
    return {
      cgstRate: halfRate,
      cgstAmount: halfTax,
      sgstRate: halfRate,
      sgstAmount: halfTax,
      igstRate: 0,
      igstAmount: 0,
      totalTax,
    };
  }
}

/**
 * Generate formatted WhatsApp Payment Reminder Message (Marathi & English)
 */
export function generateWhatsAppReminderMessage({
  customerName,
  shopName,
  invoiceNumber,
  outstandingAmount,
  dueDate,
  contactNumber,
  upiId,
  language = "mr",
}: {
  customerName: string;
  shopName: string;
  invoiceNumber: string;
  outstandingAmount: number;
  dueDate: string;
  contactNumber: string;
  upiId?: string;
  language?: "mr" | "en";
}): string {
  const formattedAmount = formatINR(outstandingAmount);
  const formattedDate = formatDate(dueDate);

  if (language === "mr") {
    return `नमस्कार ${customerName} जी,

आपण *${shopName}* येथून खरेदी केलेल्या मालाचे *${formattedAmount}* इतके पेमेंट बाकी आहे.

📄 *बिल क्रमांक:* ${invoiceNumber}
📅 *अंतिम देय तारीख:* ${formattedDate}
${upiId ? `💳 *UPI ID:* ${upiId}\n` : ""}
कृपया आपले बाकी असलेले पेमेंट लवकरात लवकर पूर्ण करावे ही नम्र विनंती. 
पेमेंट झाल्यानंतर कृपया पोच पावती किंवा स्क्रीनशॉट पाठवावा.

धन्यवाद!
*${shopName}*
📞 संपर्क: ${contactNumber}`;
  }

  return `Dear ${customerName},

Greetings from *${shopName}*.

This is a gentle reminder that an outstanding payment of *${formattedAmount}* is pending against your invoice.

📄 *Invoice No:* ${invoiceNumber}
📅 *Due Date:* ${formattedDate}
${upiId ? `💳 *UPI ID:* ${upiId}\n` : ""}
Kindly clear the balance at your earliest convenience. If already paid, please ignore this message or share the payment screenshot.

Thank you for your business!
*${shopName}*
📞 Phone: ${contactNumber}`;
}

/**
 * Language dictionary for Marathi / English UI strings
 */
export const i18n = {
  mr: {
    dashboard: "डॅशबोर्ड",
    inventory: "इन्व्हेंटरी (स्टॉक)",
    customers: "ग्राहक (खातेदार)",
    suppliers: "सप्लायर्स",
    sales: "विक्री व बिलिंग",
    quotations: "कोटेशन्स",
    outstanding: "बाकी पेमेंट्स",
    payments: "पेमेंट जमा",
    purchases: "खरेदी (Purchase)",
    reports: "अहवाल व रिपोर्ट्स",
    settings: "सेटिंग्ज",
    totalSales: "एकूण विक्री",
    todaySales: "आजची विक्री",
    monthlySales: "या महिन्याची विक्री",
    totalOutstanding: "एकूण बाकी येणे",
    paymentsReceived: "जमा झालेली रक्कम",
    inventoryValue: "स्टॉकचे एकूण मूल्य",
    lowStock: "कमी स्टॉक अलर्ट",
    overduePayments: "मुदत संपलेली बाकी",
    newSale: "नवीन बिल बनवा",
    newQuotation: "नवीन कोटेशन",
    addCustomer: "नवीन ग्राहक",
    addProduct: "नवीन पंप/प्रॉडक्ट",
    recordPayment: "पेमेंट जमा करा",
    search: "शोधा...",
    save: "जतन करा",
    cancel: "रद्द करा",
    print: "प्रिंट करा",
    shareWhatsApp: "व्हॉट्सअ‍ॅपवर पाठवा",
    downloadPDF: "PDF डाउनलोड",
    status: "स्थिती",
    actions: "कृती",
    paid: "पूर्ण भरले",
    partiallyPaid: "काही भरले",
    pending: "बाकी",
    overdue: "मुदत संपली",
    settingsSaved: "दुकान सेटिंग्ज यशस्वीरीत्या जतन केल्या!",
    resetConfirm: "तुम्हाला खात्री आहे का? सर्व डेटा पूर्वस्थितीत येईल.",
    resetSuccess: "डेटा पूर्वस्थितीत रिसेट झाला.",
    resetData: "डेटा रिसेट",
    saveChanges: "बदल जतन करा",
    shopProfile: "दुकान माहिती",
    bankAccounts: "बँक व UPI खाती",
    invoiceTerms: "बिलिंग व अटी",
    whatsappTemplate: "व्हॉट्सअ‍ॅप तगादा टेम्प्लेट",
    businessSettings: "दुकान व बिलिंग सेटिंग्ज",
    configureShopDetails: "दुकान तपशील, बँक खाती, जीएसटी, बिल अटी व व्हॉट्सअ‍ॅप मेसेज टेम्प्लेट",
    bankDetails: "बँक व UPI तपशील",
    shopDetails: "दुकान व संपर्क माहिती",
    shopName: "दुकान / एजन्सीचे नाव",
    ownerManagerName: "मालक / व्यवस्थापक नाव",
    tagline: "टॅगलाईन",
    address: "पत्ता",
    cityDistrict: "शहर / जिल्हा",
    pincode: "पिनकोड",
    shopPhoneNumber: "दुकान फोन नंबर",
    whatsappNumber: "व्हॉट्सअ‍ॅप नंबर",
    gstinNumber: "GSTIN नंबर",
    stateCode: "राज्य कोड",
    bankAccountUpiDetails: "बँक खाते व UPI तपशील",
    bankName: "बँकेचे नाव",
    accountNumber: "खाते क्रमांक",
    required: "आवश्यक",
    ifscCode: "IFSC कोड",
    branch: "शाखा",
    upiId: "UPI आयडी",
    billingPrefixWarranty: "बिलिंग प्रीफिक्स व अटी",
    invoiceNumberPrefix: "बिल क्रमांक प्रीफिक्स",
    quotationPrefix: "कोटेशन प्रीफिक्स",
    defaultCreditDays: "डीफॉल्ट उधारी मुदत (दिवस)",
    whatsappTemplatePreview: "मराठी व्हॉट्सअ‍ॅप तगादा संदेश पूर्वावलोकन",
    saveSettings: "सेटिंग्ज जतन करा",
    newInvoice: "नवीन विक्री व GST बिलिंग",
    posCounter: "POS काउंटर",
    saveOnly: "फक्त जतन करा",
    saveAndPrint: "जतन करून PDF प्रिंट करा",
    customerDetails: "ग्राहक / शेतकरी तपशील",
    selectCustomer: "ग्राहक निवडा",
    invoiceDate: "बिल तारीख",
    dueDate: "देय तारीख",
    productDetails: "पंप / मालाची यादी",
    selectProduct: "प्रॉडक्ट निवडा",
    quantity: "नग",
    unitPrice: "दर",
    discount: "सूट",
    gst: "GST",
    subtotal: "एकूण साहित्य किंमत",
    taxableAmount: "करपात्र रक्कम",
    roundOff: "परिपूर्णांकन",
    grandTotal: "एकूण बिल",
    amountPaid: "जमा रक्कम",
    balanceDue: "बाकी येणे",
    paymentMethod: "पेमेंट पद्धत",
    counterPaid: "काउंटरवर जमा रक्कम",
    cash: "रोख",
    upi: "UPI",
    bankTransfer: "बँक ट्रान्सफर",
    cheque: "धनादेश",
    credit: "उधारी",
    notes: "नोंद / सूचना",
    termsConditions: "अटी व शर्ती",
    customerName: "ग्राहकाचे नाव",
    mobileNumber: "मोबाईल नंबर",
    emailAddress: "ईमेल पत्ता",
    villageCity: "गाव / शहर",
    taluka: "तालुका",
    customerType: "ग्राहक प्रकार",
    farmer: "शेतकरी",
    retailer: "किरकोळ विक्रेता",
    contractor: "बोअरवेल कंत्राटदार",
    dealer: "डीलर",
    other: "इतर",
    openingBalance: "प्रारंभिक बाकी",
    creditLimit: "उधारी मर्यादा",
    saveCustomer: "ग्राहक जतन करा",
    addCustomerTitle: "नवीन ग्राहक / शेतकरी जोडा",
    customerRequired: "कृपया ग्राहक नाव आणि मोबाईल नंबर भरा.",
    selectCustomerRequired: "कृपया ग्राहक निवडा.",
    selectProductRequired: "बिलामध्ये किमान एक प्रॉडक्ट जोडा.",
    stockInsufficient: "साठा अपुरा आहे.",
    invoiceCreated: "बिल यशस्वीरीत्या तयार झाले",
    customerAdded: "नवीन ग्राहक यशस्वीरीत्या जोडला गेला!",
    paymentRecorded: "पावती यशस्वीरीत्या जमा झाली",
    paymentAmountRequired: "कृपया योग्य रक्कम भरा.",
    phoneRequired: "ग्राहक फोन नंबर उपलब्ध नाही.",
    outstandingTitle: "उधारी व बाकी पेमेंट्स वसुली",
    outstandingSearch: "बिल क्रमांक, ग्राहक नाव किंवा फोन नंबर शोधा...",
    allOutstanding: "सर्व बाकी",
    overdueOnly: "मुदत संपलेले",
    dueThisWeek: "या आठवड्यात",
    partiallyPaidFilter: "काही भरलेले",
    invoiceNumber: "बिल क्रमांक",
    outstandingAmount: "शिल्लक बाकी",
    followUpStatus: "तगादा स्थिती",
    sendReminder: "तगादा पाठवा",
    recordPaymentTitle: "पेमेंट जमा नोंदवा",
    receivePayment: "पेमेंट घ्या",
    transactionReference: "संदर्भ क्रमांक",
    receiptDate: "पावती तारीख",
    noOutstanding: "कोणतीही बाकी देयके आढळली नाहीत.",
    customerSearch: "ग्राहक नाव, मोबाईल नंबर किंवा गाव शोधा...",
    customerLedgerTitle: "ग्राहक व खातेवही",
    customerCount: "खातेदार",
    addressLabel: "पत्ता",
    viewLedger: "खातेवही पहा",
    editCustomer: "ग्राहक संपादित करा",
    productName: "प्रॉडक्टचे नाव",
    modelNumber: "मॉडेल नंबर",
    skuCode: "SKU कोड",
    category: "कॅटेगरी",
    brand: "ब्रँड",
    purchasePrice: "खरेदी किंमत",
    sellingPrice: "विक्री किंमत",
    availableStock: "उपलब्ध साठा",
    minimumStock: "किमान साठा अलर्ट",
    stockAdjustment: "साठा बदल",
    stockSearch: "पंप नाव, मॉडेल, SKU किंवा ब्रँड शोधा...",
    productsAndPumps: "Products & Pump Items",
    addMorePumps: "Add More Product",
    selectPumpOrProduct: "Select Pump or Product",
    pumpSerialNumber: "Pump Serial Number",
    itemNumber: "Item",
    removeItem: "Remove item",
    remainingStock: "Remaining Stock",
    itemTotal: "Item Total",
    billSummary: "Bill Summary & Tax",
    outsideMaharashtra: "Sale Outside Maharashtra",
    fullPaid: "Paid in Full",
    saveInvoiceAndPrint: "Save Invoice & Print",
    addCustomerModal: "Add New Customer",
  },
  en: {
    dashboard: "Dashboard",
    inventory: "Inventory",
    customers: "Customers",
    suppliers: "Suppliers",
    sales: "Sales & Invoices",
    quotations: "Quotations",
    outstanding: "Outstanding Payments",
    payments: "Payments Received",
    purchases: "Purchases",
    reports: "Reports & Analytics",
    settings: "Settings",
    totalSales: "Total Sales",
    todaySales: "Today's Sales",
    monthlySales: "Monthly Sales",
    totalOutstanding: "Total Outstanding",
    paymentsReceived: "Payments Received",
    inventoryValue: "Total Inventory Value",
    lowStock: "Low Stock Alert",
    overduePayments: "Overdue Payments",
    newSale: "New Sale / Invoice",
    newQuotation: "New Quotation",
    addCustomer: "Add Customer",
    addProduct: "Add Product",
    recordPayment: "Receive Payment",
    search: "Search...",
    save: "Save",
    cancel: "Cancel",
    print: "Print",
    shareWhatsApp: "Share on WhatsApp",
    downloadPDF: "Download PDF",
    status: "Status",
    actions: "Actions",
    paid: "Paid",
    partiallyPaid: "Partially Paid",
    pending: "Pending",
    overdue: "Overdue",
    settingsSaved: "Business settings saved successfully!",
    resetConfirm: "Are you sure? All data will be restored to defaults.",
    resetSuccess: "Data reset to defaults.",
    resetData: "Reset Data",
    saveChanges: "Save Changes",
    shopProfile: "Shop Profile",
    bankAccounts: "Bank & UPI Accounts",
    invoiceTerms: "Billing & Terms",
    whatsappTemplate: "WhatsApp Reminder Template",
    businessSettings: "Business Settings",
    configureShopDetails: "Configure shop address, GSTIN, bank details, invoice terms, and WhatsApp templates",
    bankDetails: "Bank & UPI Details",
    shopDetails: "Shop & Contact Information",
    shopName: "Shop / Agency Name",
    ownerManagerName: "Owner / Manager Name",
    tagline: "Tagline",
    address: "Address",
    cityDistrict: "City / District",
    pincode: "PIN Code",
    shopPhoneNumber: "Shop Phone Number",
    whatsappNumber: "WhatsApp Number",
    gstinNumber: "GSTIN Number",
    stateCode: "State Code",
    bankAccountUpiDetails: "Bank Account & UPI Details",
    bankName: "Bank Name",
    accountNumber: "Account Number",
    required: "Required",
    ifscCode: "IFSC Code",
    branch: "Branch",
    upiId: "UPI ID",
    billingPrefixWarranty: "Billing Prefixes & Terms",
    invoiceNumberPrefix: "Invoice Number Prefix",
    quotationPrefix: "Quotation Prefix",
    defaultCreditDays: "Default Credit Period (Days)",
    whatsappTemplatePreview: "WhatsApp Reminder Message Preview",
    saveSettings: "Save Settings",
    newInvoice: "New Sales & GST Invoice",
    posCounter: "POS Counter",
    saveOnly: "Save Only",
    saveAndPrint: "Save & Print PDF",
    customerDetails: "Customer / Farmer Details",
    selectCustomer: "Select Customer",
    invoiceDate: "Invoice Date",
    dueDate: "Due Date",
    productDetails: "Pump / Product Items",
    selectProduct: "Select Product",
    quantity: "Quantity",
    unitPrice: "Unit Price",
    discount: "Discount",
    gst: "GST",
    subtotal: "Subtotal",
    taxableAmount: "Taxable Amount",
    roundOff: "Round Off",
    grandTotal: "Grand Total",
    amountPaid: "Amount Paid",
    balanceDue: "Balance Due",
    paymentMethod: "Payment Method",
    counterPaid: "Amount Paid at Counter",
    cash: "Cash",
    upi: "UPI",
    bankTransfer: "Bank Transfer",
    cheque: "Cheque",
    credit: "Credit",
    notes: "Notes",
    termsConditions: "Terms & Conditions",
    customerName: "Customer Name",
    mobileNumber: "Mobile Number",
    emailAddress: "Email Address",
    villageCity: "Village / City",
    taluka: "Taluka",
    customerType: "Customer Type",
    farmer: "Farmer",
    retailer: "Retailer",
    contractor: "Contractor",
    dealer: "Dealer",
    other: "Other",
    openingBalance: "Opening Balance",
    creditLimit: "Credit Limit",
    saveCustomer: "Save Customer",
    addCustomerTitle: "Add New Customer",
    customerRequired: "Please enter the customer name and mobile number.",
    selectCustomerRequired: "Please select a customer.",
    selectProductRequired: "Please add at least one product to the invoice.",
    stockInsufficient: "Insufficient stock.",
    invoiceCreated: "Invoice created successfully",
    customerAdded: "Customer added successfully!",
    paymentRecorded: "Payment recorded successfully",
    paymentAmountRequired: "Please enter a valid payment amount.",
    phoneRequired: "Customer phone number is unavailable.",
    outstandingTitle: "Outstanding & Overdue Dues",
    outstandingSearch: "Search by invoice number, customer name, or phone...",
    allOutstanding: "All Outstanding",
    overdueOnly: "Overdue",
    dueThisWeek: "Due This Week",
    partiallyPaidFilter: "Partially Paid",
    invoiceNumber: "Invoice Number",
    outstandingAmount: "Outstanding Amount",
    followUpStatus: "Follow-up Status",
    sendReminder: "Send Reminder",
    recordPaymentTitle: "Record Payment",
    receivePayment: "Receive Payment",
    transactionReference: "Transaction Reference",
    receiptDate: "Receipt Date",
    noOutstanding: "No outstanding dues found.",
    customerSearch: "Search customer name, mobile number, or village...",
    customerLedgerTitle: "Customer Ledger",
    customerCount: "customers",
    addressLabel: "Address",
    viewLedger: "View Ledger",
    editCustomer: "Edit Customer",
    productName: "Product Name",
    modelNumber: "Model Number",
    skuCode: "SKU Code",
    category: "Category",
    brand: "Brand",
    purchasePrice: "Purchase Price",
    sellingPrice: "Selling Price",
    availableStock: "Available Stock",
    minimumStock: "Minimum Stock Alert",
    stockAdjustment: "Stock Adjustment",
    stockSearch: "Search pump name, model, SKU, or brand...",
    productsAndPumps: "Products & Pump Items",
    addMorePumps: "Add More Product",
    selectPumpOrProduct: "Select Pump or Product",
    pumpSerialNumber: "Pump Serial Number",
    itemNumber: "Item",
    removeItem: "Remove item",
    remainingStock: "Remaining Stock",
    itemTotal: "Item Total",
    billSummary: "Bill Summary & Tax",
    outsideMaharashtra: "Sale Outside Maharashtra",
    fullPaid: "Paid in Full",
    saveInvoiceAndPrint: "Save Invoice & Print",
    addCustomerModal: "Add New Customer",
  },
};
