import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BusinessSettings, Customer, Payment, Quotation, Sale } from "@/types/database";
import { formatINR, formatDate } from "./utils";

/**
 * Generate and download or open Tax Invoice PDF
 */
export function generateInvoicePDF(
  sale: Sale,
  settings: BusinessSettings,
  customer?: Customer
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 14;

  // Header Box
  doc.setFillColor(2, 132, 199); // Primary Blue
  doc.rect(14, currentY, pageWidth - 28, 22, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.shop_name.toUpperCase(), pageWidth / 2, currentY + 9, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(settings.tagline || "Authorized Submersible Pump & Agriculture Dealership", pageWidth / 2, currentY + 16, {
    align: "center",
  });

  currentY += 28;

  // Title: TAX INVOICE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(2, 132, 199);
  doc.text("TAX INVOICE / कर बीजक", pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // Dealer Details (Left) vs Invoice Details (Right)
  const colLeft = 14;
  const colRight = pageWidth / 2 + 5;
  const topBlockY = currentY;

  // Dealer Info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("DEALER DETAILS / विक्रेता:", colLeft, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`${settings.address}, ${settings.city}`, colLeft, currentY);
  currentY += 4;
  doc.text(`Phone / WhatsApp: ${settings.contact_number} | ${settings.whatsapp_number}`, colLeft, currentY);
  currentY += 4;
  doc.text(`GSTIN: ${settings.gstin} | State Code: ${settings.state_code}`, colLeft, currentY);
  currentY += 4;
  doc.text(`Email: ${settings.email}`, colLeft, currentY);

  // Invoice & Customer Info (Right)
  let rightY = topBlockY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("INVOICE INFO:", colRight, rightY);
  rightY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Invoice No: ${sale.invoice_number}`, colRight, rightY);
  rightY += 4;
  doc.text(`Date: ${formatDate(sale.invoice_date)}`, colRight, rightY);
  rightY += 4;
  doc.text(`Payment Due Date: ${formatDate(sale.due_date)}`, colRight, rightY);
  rightY += 4;
  doc.text(`Payment Status: ${sale.payment_status.toUpperCase()}`, colRight, rightY);

  currentY = Math.max(currentY, rightY) + 6;

  // Bill To (Customer)
  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("BILL TO / ग्राहक तपशील:", colLeft, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(sale.customer_name || customer?.customer_name || "Cash Customer", colLeft, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const custAddr = customer ? `${customer.address}, ${customer.village_city}, ${customer.taluka}, Solapur` : sale.customer_village || "Solapur";
  doc.text(`Address: ${custAddr}`, colLeft, currentY);
  currentY += 4;
  doc.text(`Mobile: ${sale.customer_phone || customer?.mobile_number || "-"} | GSTIN: ${sale.customer_gstin || customer?.gstin || "URP (Unregistered)"}`, colLeft, currentY);
  currentY += 6;

  // Table of Items
  const tableRows = sale.items.map((item, idx) => [
    idx + 1,
    `${item.product_name}${item.serial_numbers && item.serial_numbers.length > 0 ? `\n(S/N: ${item.serial_numbers.join(", ")})` : ""}`,
    item.hsn_code || "84137010",
    item.quantity,
    `Rs. ${item.unit_price.toFixed(2)}`,
    item.discount_amount > 0 ? `Rs. ${item.discount_amount.toFixed(2)}` : "-",
    `Rs. ${item.taxable_amount.toFixed(2)}`,
    `${item.gst_percentage}%`,
    `Rs. ${item.total_amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["#", "Product Description", "HSN", "Qty", "Rate", "Disc", "Taxable", "GST", "Total"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
      halign: "center",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 62 },
      2: { halign: "center", cellWidth: 20 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", cellWidth: 20 },
      5: { halign: "right", cellWidth: 16 },
      6: { halign: "right", cellWidth: 22 },
      7: { halign: "center", cellWidth: 14 },
      8: { halign: "right", cellWidth: 24 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Tax and Total Summary (Right) vs Bank & UPI Details (Left)
  const summaryLeft = pageWidth / 2 + 10;
  let sumY = finalY;

  // Bank Info (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text("BANK & UPI PAYMENT DETAILS:", 14, sumY);
  sumY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Bank Name: ${settings.bank_name}`, 14, sumY);
  sumY += 3.8;
  doc.text(`A/C Number: ${settings.bank_account_number}`, 14, sumY);
  sumY += 3.8;
  doc.text(`IFSC Code: ${settings.bank_ifsc} (${settings.bank_branch})`, 14, sumY);
  sumY += 3.8;
  doc.text(`UPI ID: ${settings.upi_id}`, 14, sumY);

  // Financial Breakdown (Right)
  let rightSumY = finalY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const drawRow = (label: string, value: string, isBold: boolean = false, isHighlight: boolean = false) => {
    if (isHighlight) {
      doc.setFillColor(240, 249, 255);
      doc.rect(summaryLeft - 4, rightSumY - 3, pageWidth - summaryLeft - 10, 6, "F");
      doc.setTextColor(2, 132, 199);
    } else {
      doc.setTextColor(51, 65, 85);
    }
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.text(label, summaryLeft, rightSumY);
    doc.text(value, pageWidth - 14, rightSumY, { align: "right" });
    rightSumY += 5;
  };

  drawRow("Taxable Amount:", formatINR(sale.taxable_amount));
  if (sale.is_interstate) {
    drawRow("IGST (18%):", formatINR(sale.igst_amount));
  } else {
    drawRow("CGST (9%):", formatINR(sale.cgst_amount));
    drawRow("SGST (9%):", formatINR(sale.sgst_amount));
  }
  if (sale.round_off !== 0) {
    drawRow("Round Off:", formatINR(sale.round_off));
  }
  drawRow("Grand Total (एकूण रक्कम):", formatINR(sale.grand_total), true, true);
  drawRow("Amount Paid (जमा):", formatINR(sale.amount_paid));
  drawRow("Balance Due (बाकी येणे):", formatINR(sale.outstanding_balance), true);

  // Terms and Signatory Box
  const bottomY = Math.max(sumY, rightSumY) + 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, bottomY, pageWidth - 14, bottomY);

  let termY = bottomY + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("TERMS & CONDITIONS / अटी व शर्ती:", 14, termY);
  termY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const terms = settings.invoice_terms.split("\n");
  terms.forEach((t) => {
    doc.text(t, 14, termY);
    termY += 3.5;
  });

  // Authorized Signatory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${settings.shop_name}`, pageWidth - 14, bottomY + 12, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Authorized Signatory / अधिकृत स्वाक्षरी", pageWidth - 14, bottomY + 24, { align: "right" });

  doc.save(`${sale.invoice_number}.pdf`);
}

/**
 * Generate and download Quotation PDF
 */
export function generateQuotationPDF(
  quote: Quotation,
  settings: BusinessSettings,
  customer?: Customer
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 14;

  // Header Box
  doc.setFillColor(37, 99, 235); // Brand Blue
  doc.rect(14, currentY, pageWidth - 28, 22, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.shop_name.toUpperCase(), pageWidth / 2, currentY + 9, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Submersible Pumps, Openwell & Agricultural Fitting Quotation", pageWidth / 2, currentY + 16, {
    align: "center",
  });

  currentY += 28;

  // Title: ESTIMATE / QUOTATION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(37, 99, 235);
  doc.text("PRICE ESTIMATE & QUOTATION / अंदाजपत्रक", pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // Shop Info & Quote Info
  const colLeft = 14;
  const colRight = pageWidth / 2 + 5;
  const topBlockY = currentY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("DEALER / विक्रेता:", colLeft, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`${settings.address}, ${settings.city}`, colLeft, currentY);
  currentY += 4;
  doc.text(`Phone: ${settings.contact_number}`, colLeft, currentY);
  currentY += 4;
  doc.text(`GSTIN: ${settings.gstin}`, colLeft, currentY);

  let rightY = topBlockY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("QUOTATION DETAILS:", colRight, rightY);
  rightY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Quote No: ${quote.quotation_number}`, colRight, rightY);
  rightY += 4;
  doc.text(`Date: ${formatDate(quote.quotation_date)}`, colRight, rightY);
  rightY += 4;
  doc.text(`Valid Until: ${formatDate(quote.expiry_date)}`, colRight, rightY);
  rightY += 4;
  doc.text(`Status: ${quote.status.toUpperCase()}`, colRight, rightY);

  currentY = Math.max(currentY, rightY) + 6;

  // Customer Info
  doc.setDrawColor(226, 232, 240);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text("PREPARED FOR / ग्राहक:", colLeft, currentY);
  currentY += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(quote.customer_name || customer?.customer_name || "Customer", colLeft, currentY);
  currentY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Village / City: ${quote.customer_village || customer?.village_city || "Solapur"} | Mobile: ${quote.customer_phone || customer?.mobile_number || "-"}`, colLeft, currentY);
  currentY += 6;

  // Items Table
  const tableRows = quote.items.map((item, idx) => [
    idx + 1,
    item.product_name,
    item.quantity,
    `Rs. ${item.unit_price.toFixed(2)}`,
    item.discount_amount > 0 ? `Rs. ${item.discount_amount.toFixed(2)}` : "-",
    `${item.gst_percentage}%`,
    `Rs. ${item.total_amount.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["#", "Product Description", "Qty", "Unit Price", "Discount", "GST", "Total Amount"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 80 },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "right", cellWidth: 24 },
      4: { halign: "right", cellWidth: 18 },
      5: { halign: "center", cellWidth: 16 },
      6: { halign: "right", cellWidth: 28 },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Total
  const summaryLeft = pageWidth / 2 + 10;
  let sumY = finalY;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Taxable Value:", summaryLeft, sumY);
  doc.text(formatINR(quote.taxable_amount), pageWidth - 14, sumY, { align: "right" });
  sumY += 5;
  doc.text("GST Amount:", summaryLeft, sumY);
  doc.text(formatINR(quote.total_tax), pageWidth - 14, sumY, { align: "right" });
  sumY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(37, 99, 235);
  doc.text("Estimated Grand Total:", summaryLeft, sumY);
  doc.text(formatINR(quote.grand_total), pageWidth - 14, sumY, { align: "right" });

  // Terms
  const bottomY = sumY + 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, bottomY, pageWidth - 14, bottomY);

  let termY = bottomY + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("TERMS & CONDITIONS:", 14, termY);
  termY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const terms = (quote.terms_conditions || settings.quotation_terms).split("\n");
  terms.forEach((t) => {
    doc.text(t, 14, termY);
    termY += 3.5;
  });

  doc.save(`${quote.quotation_number}.pdf`);
}

/**
 * Generate and download Payment Receipt PDF
 */
export function generateReceiptPDF(
  payment: Payment,
  settings: BusinessSettings,
  customer?: Customer,
  sale?: Sale
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 12;

  // Header Box
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(10, currentY, pageWidth - 20, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.shop_name.toUpperCase(), pageWidth / 2, currentY + 7.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Payment Receipt / अधिकृत पावती", pageWidth / 2, currentY + 13.5, { align: "center" });

  currentY += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Receipt No: ${payment.receipt_number}`, 12, currentY);
  doc.text(`Date: ${formatDate(payment.payment_date)}`, pageWidth - 12, currentY, { align: "right" });
  currentY += 6;

  doc.setDrawColor(226, 232, 240);
  doc.line(10, currentY, pageWidth - 10, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Received with thanks from:", 12, currentY);
  currentY += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(payment.customer_name || customer?.customer_name || "Customer", 12, currentY);
  currentY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (customer?.village_city) {
    doc.text(`Village/City: ${customer.village_city}, ${customer.taluka || "Solapur"} | Mobile: ${customer.mobile_number}`, 12, currentY);
    currentY += 5;
  }

  // Amount Box
  currentY += 3;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.rect(12, currentY, pageWidth - 24, 16, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105);
  doc.text(`AMOUNT RECEIVED: ${formatINR(payment.amount)}`, pageWidth / 2, currentY + 10.5, { align: "center" });
  currentY += 21;

  // Mode and Reference
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Payment Mode: ${payment.payment_mode.toUpperCase()}`, 12, currentY);
  if (payment.transaction_ref) {
    doc.text(`Ref / Txn No: ${payment.transaction_ref}`, pageWidth - 12, currentY, { align: "right" });
  }
  currentY += 4.5;

  if (payment.invoice_number) {
    doc.text(`Against Invoice: ${payment.invoice_number}`, 12, currentY);
    currentY += 4.5;
  }

  if (payment.notes) {
    doc.text(`Notes: ${payment.notes}`, 12, currentY);
    currentY += 4.5;
  }

  // Outstanding Balance
  if (customer) {
    currentY += 2;
    doc.setFont("helvetica", "bold");
    doc.text(`Current Balance Remaining: ${formatINR(customer.current_outstanding)}`, 12, currentY);
    currentY += 6;
  }

  // Signatory
  currentY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`For ${settings.shop_name}`, pageWidth - 12, currentY, { align: "right" });
  currentY += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Authorized Signatory", pageWidth - 12, currentY, { align: "right" });

  doc.save(`${payment.receipt_number}.pdf`);
}

