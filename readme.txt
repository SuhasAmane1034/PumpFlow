# Project: PumpFlow – Submersible Pump Dealer Management System

Act as a senior full-stack software engineer, SaaS product architect, UI/UX designer, and database engineer.

I want to build a complete, production-ready, responsive web application for a submersible pump dealership based in Solapur, Maharashtra, India.

The application should be similar in functionality and quality to a professional inventory and quotation management system like Ashok Vidyut, but customized for a submersible pump dealer.

The software must work seamlessly on:
- Mobile phones (Android and iPhone)
- Tablets
- Laptops
- Desktop computers

The application should be installable as a PWA so the dealer can access it like a mobile app.

## 1. Technology Stack

Use a modern, maintainable, and deployment-friendly architecture.

Preferred stack:
- Frontend: Next.js 15+ with TypeScript
- Styling: Tailwind CSS
- UI Components: shadcn/ui
- Icons: Lucide React
- Backend: Next.js server-side APIs
- Database: PostgreSQL (Supabase)
- Authentication: Supabase Auth
- File Storage: Supabase Storage
- PDF Generation: Professional PDF generation library
- Charts: Recharts
- Deployment: Vercel + Supabase

Avoid MongoDB.

Keep the architecture simple, secure, modular, and easy to maintain.

## 2. Application Design and User Experience

Create a professional, modern business management dashboard.

Design requirements:
- Clean and minimal interface.
- Professional business software appearance.
- Responsive layouts for mobile and desktop.
- Desktop sidebar navigation.
- Mobile bottom navigation or collapsible menu.
- Light theme as the default.
- Consistent typography and spacing.
- Easy-to-read financial information.
- Fast loading and smooth interactions.
- Search, filters, sorting, and pagination wherever required.

The application should be easy enough for a shop owner or salesperson with basic computer knowledge.

Support English and Marathi language options.

## 3. Dashboard

Create a comprehensive business dashboard.

Display the following summary cards:

1. Total Sales
2. Today's Sales
3. Monthly Sales
4. Total Outstanding Payments
5. Payments Received
6. Total Inventory Value
7. Low Stock Products
8. Overdue Payments

Add the following visualizations:

- Monthly sales graph.
- Daily sales overview.
- Payment collection graph.
- Outstanding payment analysis.
- Top-selling products.
- Best-performing brands.
- Recent transactions.

Add a Recent Activities section displaying:
- New sales.
- New quotations.
- Payments received.
- New customers.
- Stock updates.
- Overdue payment alerts.

Dashboard filters:
- Today
- Yesterday
- Last 7 days
- This month
- Last month
- Custom date range

All dashboard figures must be calculated from actual database records, not dummy values.

## 4. Inventory Management

Build a complete inventory management module specifically for submersible pump dealers.

Each product should support:

- Product name
- Product category
- Brand
- Model number
- Product code / SKU
- Product description
- HP (Horsepower)
- Voltage
- Phase (Single Phase / Three Phase)
- Pump type
- Discharge capacity
- Head range
- Bore size
- Serial number (where applicable)
- HSN code
- GST percentage
- Purchase price
- Selling price
- MRP
- Available quantity
- Minimum stock quantity
- Supplier
- Product image

Product categories should include:
- Submersible Pumps
- Submersible Motors
- Openwell Pumps
- Monoblock Pumps
- Control Panels
- Pipes
- Cables
- Starters
- Accessories
- Spare Parts
- Other Products

Features:

- Add, edit, delete and view products.
- Search products by name, model, SKU or brand.
- Filter by category and brand.
- Track stock quantity.
- Low-stock alerts.
- Stock-in and stock-out management.
- Manual stock adjustments with reasons.
- Stock movement history.
- Inventory valuation.
- Product-wise sales history.
- Track individual serial numbers when applicable.
- Import products through Excel/CSV.
- Export inventory to Excel.

Prevent accidental negative inventory and validate stock availability before creating a sale.

Maintain an audit history for inventory changes.

## 5. Customer Management

Create a customer database.

Customer details:

- Customer name
- Mobile number
- WhatsApp number
- Email (optional)
- Address
- Village / City
- District
- State
- GSTIN (optional)
- Customer type (Retailer / Farmer / Dealer / Contractor / Other)
- Opening balance
- Notes

Features:

- Add and edit customers.
- Search by name and mobile number.
- View complete customer purchase history.
- View customer quotations.
- View invoices.
- View payment history.
- View outstanding balance.
- View overdue invoices.
- Download customer account statement.
- Send payment reminders.

Create a dedicated customer profile page with a complete ledger.

## 6. Sales and Billing Management

Create a professional sales and billing module.

The dealer should be able to generate an invoice quickly.

Invoice details:

- Automatic invoice number.
- Invoice date.
- Customer details.
- Product selection.
- Product quantity.
- Unit price.
- Discount.
- GST.
- CGST and SGST for applicable intra-state transactions.
- IGST for applicable inter-state transactions.
- Subtotal.
- Total tax.
- Grand total.
- Amount paid.
- Remaining balance.
- Payment due date.
- Payment method.
- Additional notes.

Features:

- Add multiple products to an invoice.
- Search products instantly.
- Automatically fetch product prices and GST.
- Automatically calculate totals.
- Apply item-wise and invoice-level discounts.
- Support cash, UPI, bank transfer, cheque and credit sales.
- Support full payment and partial payment.
- Support credit sales with due dates.
- Generate professional GST invoices in PDF.
- Print invoices.
- Download invoices.
- Share invoices through WhatsApp.
- Convert completed quotations into invoices.
- Maintain invoice history.
- Edit or cancel invoices with proper audit logs and stock adjustments.

The invoice should have configurable business details, including:
- Shop name
- Logo
- Address
- Contact number
- GSTIN
- Bank details
- UPI ID
- Invoice terms and conditions

Use Indian currency formatting (₹).

## 7. Outstanding Payment Management

This is one of the most important modules of the application.

Create a dedicated Outstanding Payments section.

The dealer should be able to track all customers who have purchased products on credit.

Display:

- Customer name
- Invoice number
- Invoice date
- Total invoice amount
- Amount paid
- Outstanding balance
- Due date
- Number of overdue days
- Payment status

Payment statuses:
- Paid
- Partially Paid
- Pending
- Overdue

Create filters for:
- All outstanding payments
- Due today
- Due this week
- Overdue payments
- Partially paid
- Customer-wise outstanding

Payment collection features:

- Record payment against an invoice.
- Allow partial payments.
- Record payment date.
- Record payment method.
- Add transaction reference number.
- Generate payment receipt PDF.
- Update outstanding balance automatically.
- Maintain complete payment history.
- Generate customer-wise outstanding reports.
- Generate total outstanding reports.

Important: Never delete historical payment records when an invoice is updated or cancelled. Maintain proper accounting records and audit logs.

## 8. Automatic Payment Reminder Notifications

Build an automated payment reminder system.

This feature is extremely important.

When an invoice passes its due date and the customer still has an outstanding balance, the application should automatically generate a payment reminder.

Notification schedule should be configurable:

- Before due date: Optional reminder.
- On due date: Payment due notification.
- 1 day after due date: First overdue reminder.
- 3 days after due date: Second reminder.
- 7 days after due date: Follow-up reminder.
- Further reminders: Configurable by the dealer.

Primary channel: WhatsApp.

Use the official WhatsApp Business Cloud API or a supported WhatsApp Business API provider.

Also support optional SMS and email integrations.

Example WhatsApp reminder:

"नमस्कार {{customer_name}},

आपण {{shop_name}} येथून खरेदी केलेल्या वस्तूंचे ₹{{outstanding_amount}} इतके पेमेंट बाकी आहे.

Invoice Number: {{invoice_number}}
Due Date: {{due_date}}

कृपया आपले बाकी पेमेंट लवकरात लवकर पूर्ण करावे.

पेमेंट केल्यानंतर कृपया आम्हाला कळवा.

धन्यवाद!
{{shop_name}}
{{contact_number}}"

Also provide an English template.

Requirements:

- Automatically identify overdue invoices.
- Send reminders only when outstanding balance is greater than zero.
- Avoid sending duplicate reminders.
- Store notification history.
- Track sent, delivered and failed statuses where supported.
- Allow the dealer to manually send a reminder.
- Allow the dealer to disable reminders for individual customers.
- Allow customizable message templates.
- Support Marathi and English.
- Add a configurable reminder frequency and quiet hours.
- Do not send messages until the required WhatsApp API configuration, customer consent and approved templates are available.
- Provide a manual WhatsApp fallback when automated API integration is not configured.

Implement a secure scheduled background process using a supported scheduler or cron service. Do not depend on the user keeping the website open.

## 9. Quotation Management

Build a complete quotation generation module.

The dealer should be able to prepare quotations for customers before confirming sales.

Quotation features:

- Automatic quotation number.
- Quotation date.
- Expiry date.
- Customer details.
- Product selection.
- Quantity.
- Unit price.
- Discount.
- GST.
- Subtotal.
- Grand total.
- Terms and conditions.
- Additional notes.

Features:

- Create quotation.
- Edit quotation.
- Duplicate quotation.
- Download quotation PDF.
- Print quotation.
- Share quotation on WhatsApp.
- Search quotation history.
- Track quotation status.

Quotation statuses:
- Draft
- Sent
- Accepted
- Rejected
- Expired
- Converted to Invoice

Important feature:

Provide a Convert to Invoice button.

When the customer accepts a quotation, the dealer should be able to convert it into a sales invoice without manually entering all the products again.

Ensure that converting a quotation does not create duplicate stock deductions or duplicate invoices.

## 10. Purchase and Supplier Management

Build a purchase management module.

Supplier details:
- Supplier name
- Contact number
- WhatsApp number
- Address
- GSTIN
- Email
- Notes

Purchase entry:
- Purchase invoice number
- Supplier
- Purchase date
- Product
- Quantity
- Purchase price
- GST
- Total amount
- Payment status
- Amount paid
- Outstanding supplier balance

Features:
- Record purchases.
- Automatically increase inventory.
- Track supplier payments.
- Track supplier outstanding balances.
- View supplier purchase history.
- Generate purchase reports.

## 11. Reports and Analytics

Create a dedicated reporting section.

Reports should include:

Sales:
- Daily sales report.
- Monthly sales report.
- Yearly sales report.
- Product-wise sales.
- Customer-wise sales.
- Brand-wise sales.

Payments:
- Total collections.
- Outstanding payments.
- Overdue payments.
- Customer-wise ledger.
- Payment collection history.

Inventory:
- Current stock.
- Low-stock products.
- Stock valuation.
- Stock movement.
- Fast-moving products.
- Slow-moving products.

Purchases:
- Purchase history.
- Supplier-wise purchases.
- Supplier outstanding.

Allow export to Excel, CSV and PDF.

All reports should support date filters.

## 12. User and Access Management

Create secure authentication.

Roles:

1. Admin / Owner
   - Full access.
   - Manage users.
   - Manage products.
   - Manage sales.
   - Manage payments.
   - View reports.
   - Configure business settings.

2. Manager
   - Manage inventory.
   - Manage customers.
   - Manage sales.
   - Manage quotations.
   - Manage payments.

3. Salesperson
   - Create quotations.
   - Create sales.
   - View customers.
   - Record permitted payments.

Permissions should be configurable.

Do not provide public registration.

The admin should be able to create and deactivate employee accounts.

Use proper server-side authorization and database-level security.

## 13. Settings

Create a complete settings page.

Sections:

Business Settings:
- Business name.
- Logo.
- Address.
- Contact number.
- GSTIN.
- State.
- Bank details.
- UPI details.

Invoice Settings:
- Invoice numbering.
- Prefix and suffix.
- GST configuration.
- Default payment terms.
- Invoice notes.
- PDF branding.

Quotation Settings:
- Quotation numbering.
- Expiry duration.
- Default terms and conditions.

Notification Settings:
- WhatsApp API configuration.
- SMS configuration.
- Reminder schedules.
- Message templates.
- Notification language.

Inventory Settings:
- Low-stock threshold.
- Default GST rates.
- Product categories.

User Settings:
- Employee management.
- Role permissions.
- Account settings.

## 14. Database Architecture

Design a properly normalized PostgreSQL database.

Create appropriate tables for:

- users
- user_roles
- business_settings
- customers
- suppliers
- product_categories
- brands
- products
- inventory_movements
- purchases
- purchase_items
- sales
- sale_items
- quotations
- quotation_items
- payments
- customer_ledger
- supplier_ledger
- notification_logs
- notification_templates
- audit_logs

Use:
- UUID primary keys.
- Proper foreign keys.
- Database indexes.
- Created and updated timestamps.
- Transaction-safe financial operations.
- Row Level Security.
- Appropriate unique constraints.

Use database transactions for invoice creation, payment recording, stock deduction and quotation conversion.

Never calculate financial balances using unreliable frontend-only logic.

## 15. Important Business Logic

Implement these rules carefully:

1. Every confirmed sale should update inventory.
2. Every purchase should increase inventory.
3. Every payment should update the outstanding balance.
4. Partial payments must be supported.
5. An invoice should automatically become overdue after its due date if a balance remains.
6. Fully paid invoices should never receive payment reminders.
7. Cancelled invoices should not count toward outstanding balances.
8. Quotation conversion must not create duplicate invoices.
9. Stock movements must maintain a traceable history.
10. Financial records must be auditable.
11. All calculations must be performed and validated on the server.
12. Financial amounts should use precise decimal arithmetic, not floating-point calculations.

## 16. Mobile Application Experience

Mobile usability is a major priority.

The application must not simply shrink the desktop interface.

Design a dedicated mobile experience:

- Responsive dashboard.
- Easy product search.
- Quick customer search.
- Large action buttons.
- Mobile-friendly invoice creation.
- Easy quotation generation.
- One-tap payment recording.
- Outstanding payment list.
- Quick WhatsApp reminders.
- Camera-based product image upload.
- Responsive tables converted into readable cards.
- Touch-friendly navigation.

Create a mobile-first Quick Actions section:

- New Sale
- New Quotation
- Add Customer
- Add Product
- Receive Payment
- View Outstanding

Support PWA installation with an app icon and proper manifest.

## 17. UI Pages and Navigation

Create the following application structure:

1. Login
2. Dashboard
3. Inventory
   - All Products
   - Add Product
   - Categories
   - Stock Movements
   - Low Stock
4. Customers
   - Customer List
   - Customer Details
   - Customer Ledger
5. Sales
   - New Sale
   - All Invoices
   - Invoice Details
6. Quotations
   - New Quotation
   - All Quotations
7. Payments
   - Receive Payment
   - Payment History
   - Outstanding Payments
   - Overdue Payments
8. Purchases
   - New Purchase
   - Purchase History
9. Suppliers
10. Reports
11. Notifications
12. Employees
13. Settings

## 18. Development and Quality Requirements

Build this as a real production-ready application.

Do not create only a frontend prototype.

Development must follow these stages:

Phase 1:
- Project setup.
- Database schema.
- Authentication.
- Dashboard layout.
- Responsive navigation.

Phase 2:
- Product and inventory management.
- Customer management.
- Supplier management.

Phase 3:
- Sales and billing.
- PDF invoice generation.
- Quotation generation.
- Quotation-to-invoice conversion.

Phase 4:
- Payment collection.
- Customer ledger.
- Outstanding payment management.
- Overdue calculations.

Phase 5:
- WhatsApp notification integration.
- Automated payment reminders.
- Notification history.

Phase 6:
- Reports and analytics.
- Employee permissions.
- Business settings.

Phase 7:
- Testing.
- Security checks.
- Mobile responsiveness.
- Performance optimization.
- Production deployment.

After every phase:
- Verify functionality.
- Fix errors.
- Test database operations.
- Test responsive layouts.
- Do not leave broken buttons or placeholder actions.

## 19. Testing Requirements

Test the complete business workflow:

1. Admin logs in.
2. Adds products and opening stock.
3. Adds a customer.
4. Creates a quotation.
5. Converts quotation into an invoice.
6. Verifies stock deduction.
7. Records a partial payment.
8. Verifies outstanding balance.
9. Changes or simulates the invoice due date.
10. Verifies overdue status.
11. Tests the WhatsApp reminder workflow.
12. Records the remaining payment.
13. Verifies that further reminders are stopped.
14. Generates customer ledger and reports.

Also test:
- Duplicate invoice prevention.
- Invalid payments.
- Negative inventory prevention.
- Permission restrictions.
- Failed notification handling.
- Mobile and desktop layouts.

## 20. Final Deliverable

Deliver a complete, functional, professional submersible pump dealership management system.

The application should make it easy for the dealer to manage the entire business from one place:

- Products and inventory.
- Customers.
- Sales and billing.
- Quotations.
- Purchases.
- Outstanding payments.
- Automated payment reminders.
- Reports and analytics.

Prioritize reliability, simplicity, security, and usability over unnecessary complexity.

Start by inspecting the existing project workspace. If it is empty, initialize the application. If a project already exists, preserve its existing structure and avoid unnecessarily renaming or deleting files.

First, prepare the project architecture, database schema, and implementation plan. Then start building the actual application, implementing and testing each phase before moving to the next.

Do not stop after generating a plan or static UI. Continue implementing the functional application.