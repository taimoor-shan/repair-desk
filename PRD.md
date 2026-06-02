PRD: Mobile Shop Management System
Version 1.0 | Single-user | Local / Offline | 1-week delivery

1. Project Summary
A local desktop web app for a single-operator mobile accessories and repair shop. Runs entirely in the browser on one computer — no server, no hosting, no internet required. Data persists via localStorage / IndexedDB. Built with plain HTML + Vanilla JS or React (your call), packaged optionally as an Electron app for a cleaner desktop feel.

2. Scope Boundaries
In ScopeOut of ScopeCustomer managementMulti-branch supportRepair job managementCloud/online hostingSales (mobiles + accessories)Barcode scanningInventory trackingStaff accounts / rolesReceipt printing (browser print)SMS/email notificationsDashboardPOS hardware integration

3. Tech Stack Decision
Recommended: React + Vite + TailwindCSS + IndexedDB (via Dexie.js)
LayerChoiceWhyUIReact + ViteFast dev, component reuseStylingTailwind CSSUtility-first, no design debtStorageDexie.js (IndexedDB)Handles large local data reliablyPrintBrowser window.print()Zero setup, works with any printerPackagingElectron (optional)Makes it feel like a real desktop app

Skip Electron for week 1. Deliver as a browser app. Client opens index.html or runs npm run dev. Electron can be added in V2.


4. Data Models
Customer
id, name, phone*, address?, email?, createdAt, updatedAt
Repair Job
id, customerId, mobileBrand, mobileModel, imei?, problemDescription,
repairNotes?, estimatedCost, finalCost?, status[Pending|InProgress|Ready|Delivered],
receivedAt, deliveredAt?, receiptNumber
Sale
id, customerId?, saleType[Mobile|Accessory], items[], totalAmount,
discount?, paymentMethod[Cash|Card|BankTransfer], createdAt, receiptNumber
Sale Item
productId, productName, quantity, unitPrice
Product / Inventory
id, name, category[Mobile|Accessory|RepairPart], sku?, stock,
costPrice, sellingPrice, lowStockThreshold, createdAt
Receipt (generated, not stored separately — derived from Sale or Repair)

5. Module Breakdown
M1 — Dashboard

Today's sales total
Pending + In-Progress repair count
Total revenue (this month)
Low stock alert list
Recent 5 sales + 5 repairs

M2 — Customer Management

Add / Edit / Delete customer
Search by name or phone
Customer detail view: visit history, all receipts

M3 — Repair Management

Create repair job (links to customer)
Update status
Edit repair details and final cost
Print initial receipt (job received)
Print final receipt (job delivered + payment)

M4 — Sales Management

New sale form (select customer optional, add items)
Pulls products from inventory
Discount field, payment method
Auto-generates receipt on save
Auto-decrements stock

M5 — Inventory Management

Add / Edit / Delete products
View stock levels
Manual stock adjustment
Low stock threshold per product
Category filter

M6 — Receipt System

Printable receipt component (shared by Sales + Repair)
Shop header: name, phone, address
Customer info block
Items / repair details
Total, discount, payment method
Receipt number + date
Print via window.print() with @media print CSS


6. UI/UX Requirements

Single-page app with sidebar navigation
Mobile-friendly layout (client may use tablet)
Status badges with color coding (Pending = yellow, In Progress = blue, Ready = green, Delivered = grey)
Confirmation dialogs before delete
Form validation with inline errors
Toast notifications for save/delete/print actions


7. Receipt Number Format
REP-YYYYMMDD-XXXX for repairs
SAL-YYYYMMDD-XXXX for sales
Auto-incremented, stored in DB.


Development Roadmap — 7 Days
Day 1 — Project Setup + Data Layer

 Init Vite + React + Tailwind
 Install Dexie.js, setup DB schema (all 5 tables)
 Create DB service layer (db.js — CRUD functions per table)
 Build sidebar layout shell + routing (React Router or simple state-based)
 Confirm all navigation screens render (empty)

Deliverable: Skeleton app with navigation, DB initialized.

Day 2 — Inventory Module (build this first, others depend on it)

 Product list view with category filter + search
 Add/Edit product form
 Delete with confirmation
 Low stock badge
 Stock adjustment modal

Deliverable: Fully working inventory module.

Day 3 — Customer Module + Repair Module (Part 1)

 Customer list + search
 Add/Edit customer form
 Customer detail page (visit history placeholder)
 Repair job form (create + link to customer)
 Repair list view with status badges

Deliverable: Customers searchable, repair jobs creatable.

Day 4 — Repair Module (Part 2) + Receipt System

 Repair status update
 Edit repair details / final cost
 Receipt component (shared)
 Print initial repair receipt
 Print final delivery receipt
 Receipt number generation

Deliverable: Full repair workflow end-to-end including printing.

Day 5 — Sales Module

 New sale form
 Product picker (from inventory)
 Quantity + price + discount fields
 Payment method selector
 Auto stock decrement on sale save
 Print sale receipt

Deliverable: Full sales workflow end-to-end.

Day 6 — Dashboard + Customer History

 Dashboard stats (today's sales, pending repairs, revenue, low stock)
 Recent activity lists
 Customer detail: pull all sales + repairs linked to customer
 Print receipt from history

Deliverable: Dashboard live, customer history complete.

Day 7 — Polish, Testing, Handoff

 End-to-end workflow test (full customer journey)
 Print layout QA (@media print CSS)
 Empty states (no customers yet, no products, etc.)
 Error handling for missing data
 Write a 1-page "How to Use" guide for the client
 Package: either npm run build → static folder, or simple npm start instructions
 Optional: wrap in Electron if time permits

Deliverable: Shippable product.

Risk Register
RiskMitigationIndexedDB data loss on browser clearWarn client; add JSON export button on Day 7Print layout broken on client's printerTest @media print early on Day 4Scope creep mid-weekLock requirements now; defer everything to V2Electron packaging delaysKeep it optional; ship browser app first

V2 Scope (post-delivery, do not build now)

Cloud/online hosting with login
Barcode scanner
Multi-branch
Automated backups
WhatsApp receipt sharing


One-line summary for the client: A browser-based shop management system that runs offline on one computer — no internet, no server, manages customers, repairs, sales, inventory, and prints receipts.