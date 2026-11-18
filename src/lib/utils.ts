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
  },
};
