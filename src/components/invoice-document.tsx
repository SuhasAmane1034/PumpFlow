"use client";

import React, { forwardRef } from "react";
import { BusinessSettings, Customer, Sale } from "@/types/database";
import { formatINR, formatDate } from "@/lib/utils";

interface InvoiceDocumentProps {
  sale: Sale;
  settings: BusinessSettings;
  customer?: Customer;
  language: "mr" | "en";
}

function numberToIndianWords(amount: number, language: "mr" | "en") {
  const whole = Math.round(amount);
  const en = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => n < 20 ? en[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? `-${en[n % 10]}` : ""}`;
  const three = (n: number): string => n >= 100 ? `${en[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${two(n % 100)}` : ""}` : two(n);
  if (whole === 0) return language === "mr" ? "शून्य रुपये" : "Zero Rupees";
  let n = whole;
  const parts: string[] = [];
  const crores = Math.floor(n / 10000000); n %= 10000000;
  const lakhs = Math.floor(n / 100000); n %= 100000;
  const thousands = Math.floor(n / 1000); n %= 1000;
  if (crores) parts.push(`${three(crores)} Crore`);
  if (lakhs) parts.push(`${three(lakhs)} Lakh`);
  if (thousands) parts.push(`${three(thousands)} Thousand`);
  if (n) parts.push(three(n));
  const words = `${parts.join(" ")} Rupees`;
  return language === "mr" ? `${words} (रुपये)` : words;
}

export const InvoiceDocument = forwardRef<HTMLDivElement, InvoiceDocumentProps>(
  ({ sale, settings, customer, language }, ref) => {
    const mr = language === "mr";
    const customerAddress = customer
      ? [customer.address, customer.village_city, customer.taluka, customer.district].filter(Boolean).join(", ")
      : sale.customer_village || settings.city;

    return (
      <div ref={ref} id="pumpflow-invoice-document" className="invoice-document bg-white text-slate-900" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", padding: "12mm", fontFamily: "Noto Sans Devanagari, Arial, sans-serif", fontSize: "11px", boxSizing: "border-box" }}>
        <div style={{ border: "1px solid #cbd5e1", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#0284c7", color: "white", padding: "12px 16px" }}>
            {settings.logo_url && <img src={settings.logo_url} alt="Logo" style={{ width: "48px", height: "48px", objectFit: "contain", background: "white", borderRadius: "4px", padding: "2px" }} />}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "19px", fontWeight: 800 }}>{settings.shop_name}</div>
              <div style={{ fontSize: "10px", marginTop: "2px" }}>{settings.tagline}</div>
              <div style={{ fontSize: "9px", marginTop: "2px" }}>{settings.address}, {settings.city} - {settings.pincode}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
            <div>
              <div style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: "9px" }}>{mr ? "विक्रेता तपशील" : "Dealer Details"}</div>
              <div style={{ marginTop: "5px" }}>GSTIN: <strong>{settings.gstin}</strong> • {mr ? "राज्य कोड" : "State Code"}: {settings.state_code}</div>
              <div>{mr ? "फोन" : "Phone"}: {settings.contact_number} | {settings.whatsapp_number}</div>
              {settings.email && <div>Email: {settings.email}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#0369a1" }}>{mr ? "कर बीजक / TAX INVOICE" : "TAX INVOICE"}</div>
              <div style={{ marginTop: "5px", fontWeight: 800 }}>{mr ? "बिल क्रमांक" : "Invoice No"}: {sale.invoice_number}</div>
              <div>{mr ? "दिनांक" : "Date"}: {formatDate(sale.invoice_date)}</div>
              <div>{mr ? "देय तारीख" : "Due Date"}: {formatDate(sale.due_date)}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>
            <div>
              <div style={{ color: "#64748b", fontWeight: 700, fontSize: "9px", textTransform: "uppercase" }}>{mr ? "ग्राहक / खरेदीदार" : "Bill To"}</div>
              <div style={{ fontSize: "13px", fontWeight: 800, marginTop: "4px" }}>{sale.customer_name || customer?.customer_name || (mr ? "रोख ग्राहक" : "Cash Customer")}</div>
              <div>{customerAddress}</div>
              <div>{mr ? "मोबाईल" : "Mobile"}: {sale.customer_phone || customer?.mobile_number || "-"}</div>
              <div>GSTIN: {sale.customer_gstin || customer?.gstin || "URP"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div><strong>{mr ? "भरणा स्थिती" : "Payment Status"}:</strong> {sale.payment_status}</div>
              <div><strong>{mr ? "पेमेंट पद्धत" : "Payment Method"}:</strong> {sale.primary_payment_mode}</div>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr style={{ background: "#e0f2fe", color: "#0f172a", fontSize: "9px" }}>
                <th style={{ width: "4%", border: "1px solid #cbd5e1", padding: "7px 3px" }}>#</th>
                <th style={{ width: "30%", border: "1px solid #cbd5e1", padding: "7px 5px", textAlign: "left" }}>{mr ? "मालाचे वर्णन" : "Description"}</th>
                <th style={{ width: "8%", border: "1px solid #cbd5e1", padding: "7px 3px" }}>HSN</th>
                <th style={{ width: "7%", border: "1px solid #cbd5e1", padding: "7px 3px" }}>{mr ? "नग" : "Qty"}</th>
                <th style={{ width: "12%", border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "right" }}>{mr ? "दर" : "Rate"}</th>
                <th style={{ width: "10%", border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "right" }}>{mr ? "सूट" : "Disc."}</th>
                <th style={{ width: "12%", border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "right" }}>{mr ? "करपात्र" : "Taxable"}</th>
                <th style={{ width: "7%", border: "1px solid #cbd5e1", padding: "7px 3px" }}>GST</th>
                <th style={{ width: "10%", border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "right" }}>{mr ? "एकूण" : "Total"}</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={item.id} style={{ fontSize: "9px" }}>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "center" }}>{index + 1}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 5px", wordBreak: "break-word" }}><strong>{item.product_name}</strong>{item.serial_numbers?.length ? <div style={{ color: "#0369a1", fontFamily: "monospace", fontSize: "8px" }}>{mr ? "सिरीयल" : "Serial"}: {item.serial_numbers.join(", ")}</div> : null}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "center" }}>{item.hsn_code}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "center", fontWeight: 700 }}>{item.quantity}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "right" }}>{formatINR(item.unit_price)}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "right" }}>{item.discount_amount ? formatINR(item.discount_amount) : "-"}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "right" }}>{formatINR(item.taxable_amount)}</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "center" }}>{item.gst_percentage}%</td>
                  <td style={{ border: "1px solid #cbd5e1", padding: "7px 3px", textAlign: "right", fontWeight: 700 }}>{formatINR(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "12px 16px" }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "9px" }}>
              <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: "9px" }}>{mr ? "बँक व UPI तपशील" : "Bank & UPI Details"}</div>
              <div>{mr ? "बँक" : "Bank"}: {settings.bank_name}</div>
              <div>{mr ? "खाते क्रमांक" : "Account"}: {settings.bank_account_number}</div>
              <div>IFSC: {settings.bank_ifsc} ({settings.bank_branch})</div>
              <div>UPI: {settings.upi_id}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>{mr ? "करपात्र रक्कम" : "Taxable Amount"}</span><strong>{formatINR(sale.taxable_amount)}</strong></div>
              {sale.is_interstate ? <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>IGST</span><strong>{formatINR(sale.igst_amount)}</strong></div> : <><div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>CGST</span><strong>{formatINR(sale.cgst_amount)}</strong></div><div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>SGST</span><strong>{formatINR(sale.sgst_amount)}</strong></div></>}
              {sale.round_off !== 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span>{mr ? "परिपूर्णांकन" : "Round Off"}</span><strong>{formatINR(sale.round_off)}</strong></div>}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #cbd5e1", marginTop: "4px", padding: "7px 0", fontSize: "13px", fontWeight: 800, color: "#0369a1" }}><span>{mr ? "एकूण बिल" : "Grand Total"}</span><span>{formatINR(sale.grand_total)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#059669", padding: "2px 0" }}><span>{mr ? "जमा रक्कम" : "Amount Paid"}</span><strong>{formatINR(sale.amount_paid)}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#e11d48", fontWeight: 800, padding: "2px 0" }}><span>{mr ? "बाकी येणे" : "Balance Due"}</span><strong>{formatINR(sale.outstanding_balance)}</strong></div>
            </div>
          </div>

          <div style={{ padding: "0 16px 10px", fontSize: "9px" }}><strong>{mr ? "अक्षरी रक्कम" : "Amount in words"}:</strong> {numberToIndianWords(sale.grand_total, language)}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", borderTop: "1px solid #e2e8f0", padding: "12px 16px" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "9px", textTransform: "uppercase" }}>{mr ? "अटी व शर्ती" : "Terms & Conditions"}</div>
              <div style={{ whiteSpace: "pre-line", marginTop: "4px", fontSize: "9px", color: "#475569" }}>{sale.terms_conditions || settings.invoice_terms}</div>
            </div>
            <div style={{ textAlign: "right", paddingTop: "5px" }}>
              <div style={{ fontWeight: 800 }}>{settings.shop_name}</div>
              <div style={{ height: "32px" }} />
              <div style={{ fontSize: "9px" }}>{mr ? "अधिकृत स्वाक्षरी / Authorized Signatory" : "Authorized Signatory"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

InvoiceDocument.displayName = "InvoiceDocument";
