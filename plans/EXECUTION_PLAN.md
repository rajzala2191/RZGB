# Global Parts Supplier Portal — Execution Plan

> **Last updated: 2026-03-12**
> ✅ = Implemented & committed | 🔲 = Not yet started

---

## Phase 1: Quick Wins ✅ COMPLETE

### Step 1 — Notification Centre ✅
- `notifications` table with RLS in DB
- `NotificationBell.jsx` component with Supabase Realtime
- Embedded in `ControlCentreLayout.jsx`, `SupplierHubLayout.jsx`, `ClientDashboardLayout.jsx`
- `createNotification.js` helper for inserting notification rows
- Used wherever status changes fire (BidComparisonPage, etc.)

### Step 2 — Global Search ✅
- `SearchBar.jsx` component
- Queries `orders` on part_name, ghost_public_name, id and `profiles` on company_name
- Embedded in all three layout files

### Step 3 — Repeat Order Templates ✅
- `OrdersOverviewPage.jsx` — "Re-order" button per row navigates to `/client-dashboard/create-order` with order as `state.reorder`
- `ClientOrderCreationPage.jsx` — reads `location.state?.reorder` on mount and pre-fills formData

---

## Phase 2: Supplier Capability Matrix ✅ COMPLETE

### Step 4 — DB Schema ✅
- Migration: `supabase/migrations/20260312000200_supplier_capabilities.sql`
- Table: `supplier_capabilities` (supplier_id FK, processes[], materials[], certifications[], min/max_order_qty, lead_time_days, country, region)
- RLS: supplier manages own row; admins read all

### Step 5 — Supplier Declares Capabilities ✅
- `src/pages/SupplierCapabilitiesPage.jsx` — multi-select toggles for processes/materials/certifications + numeric inputs
- Route `/supplier-hub/capabilities` added to `App.jsx`
- "My Capabilities" nav link added to `SupplierHubLayout.jsx`

### Step 6 — Admin Views Capabilities ✅
- `SupplierManagementPage.jsx` — expandable row showing capabilities per supplier
- `SupplierPoolPage.jsx` — capability filter (process + material) when viewing supplier pool

---

## Phase 3: Per-Order Threaded Messaging ✅ COMPLETE

### Step 7 — DB Schema ✅
- Migration: `supabase/migrations/20260312000100_order_messages.sql`
- Table: `order_messages` (order_id FK, sender_id FK, sender_role, body, created_at, read_by uuid[])
- RLS: order participants (client/supplier/admin) can view + insert

### Step 8 — Build the Message Thread Component ✅
- `src/components/OrderMessageThread.jsx` — chat-style UI with sender role badge, timestamp, Realtime subscription
- Embedded in `ClientOrderDetailsView.jsx` (sidebar panel)
- Embedded in `AdminDocumentReview.jsx` (order side panel)
- Embedded in `SupplierOrderManager.jsx` (per-order detail)

---

## Phase 4: Supplier Performance Scorecard ✅ COMPLETE

### Step 9 — Supabase View ✅
- Migration: `supabase/migrations/20260312000300_supplier_scorecard.sql`
- View: `supplier_scorecard` — on_time_pct, ncr_count, ncr_rate_pct, total_bids, won_bids per supplier

### Step 10 — Scorecard UI ✅
- `src/pages/SupplierScorecardPage.jsx` — admin-only table with colour-coded KPI columns (green/amber/red)
- Route `/control-centre/supplier-scorecard` added to `App.jsx`
- "Supplier Scorecard" nav link added to `ControlCentreLayout.jsx`
- "View Scorecard" link added per row in `SupplierManagementPage.jsx`

---

## Phase 5: Certificate & MTR Management ✅ COMPLETE

### Step 11 — DB Schema ✅
- Migration: `supabase/migrations/20260312000400_job_certificates.sql`
- Table: `job_certificates` (order_id FK, supplier_id FK, cert_type, file_path, file_name, uploaded_by, approved_by, status, rejection_note)
- RLS: supplier manages own certs; admins manage all; clients view approved certs for their orders

### Step 12 — Supplier Uploads Certs ✅
- `SupplierOrderManager.jsx` — "Upload Certificate" button per awarded order opens dialog with cert_type selector + file upload; stores in Supabase Storage (`certificates` bucket) and inserts into `job_certificates`

### Step 13 — Admin Reviews & Client Downloads ✅
- `AdminDocumentReview.jsx` — "Certificates" section in side panel lists certs with Approve/Reject actions
- `ClientOrderDetailsView.jsx` — "Compliance Pack" button bulk-downloads all approved certs via JSZip

---

## Phase 6: Digital PO & Quote Acceptance ✅ COMPLETE

### Step 14 — DB Schema ✅
- Migration: `supabase/migrations/20260312000500_digital_po.sql`
- Added to `orders`: `quote_accepted_by`, `quote_accepted_at`, `po_signed_by`, `po_signed_at`, `po_reference`

### Step 15 — Build the Acceptance Flow ✅
- `BidComparisonPage.jsx` — Award Letter summary modal shown before confirming bid award
- `SupplierBiddingPage.jsx` — "Accept Job" button for awarded bids (sets po_signed_at, po_signed_by, writes audit log)
- `ClientOrderDetailsView.jsx` — "Confirm Order" button when status is AWARDED and quote_accepted_at is null

---

## Phase 7: Supplier Onboarding Workflow ✅ COMPLETE

### Step 16 — DB Schema ✅
- Migration: `supabase/migrations/20260312000600_supplier_onboarding.sql`
- Added to `profiles`: `onboarding_status` (default 'approved'), `onboarding_notes`
- Existing suppliers defaulted to 'approved'

### Step 17 — Build the Onboarding Flow ✅
- `src/pages/SupplierOnboardingPage.jsx` — 5-step wizard: Company Info → Capabilities → Upload Certs → T&C → Submitted
- `ProtectedRoute.jsx` — for supplier role, checks `onboarding_status`; redirects non-approved to `/supplier-hub/onboarding`
- Route `/supplier-hub/onboarding` added to `App.jsx` with `skipOnboardingCheck` prop
- `SupplierManagementPage.jsx` — "Onboarding Queue" tab for docs_submitted/under_review suppliers with Approve/Reject

---

## Phase 8: Global Platform Features ✅ COMPLETE

### Step 18 — Multi-Currency Bid Support ✅
- Migration: `supabase/migrations/20260312000700_multi_currency.sql`
- Added to `bid_submissions`: `currency` (default 'GBP'), `exchange_rate_at_submission`
- `SupplierBiddingPage.jsx` — currency selector (GBP, USD, EUR) in bid form
- `BidComparisonPage.jsx` — displays currency per bid; flags mixed-currency comparisons

### Step 19 — Two-Factor Authentication (2FA) ✅
- `SettingsPage.jsx` — 2FA toggle enhanced: when enabled, calls `supabase.auth.mfa.enroll({ factorType: 'totp' })` and displays QR code for scanning

### Step 20 — ERP Webhook Integration Layer ✅
- Migration: `supabase/migrations/20260312000800_webhooks.sql`
- Table: `webhooks` (tenant_id, event_type, endpoint_url, secret, active)
- `SettingsPage.jsx` — "Webhook Integrations" section: list, add (event_type + URL + secret), toggle active, delete

---

## Summary Table

| Phase | Steps | Status |
|-------|-------|--------|
| 1 — Quick Wins            | 1, 2, 3    | ✅ Complete |
| 2 — Capability Matrix     | 4, 5, 6    | ✅ Complete |
| 3 — Per-Order Messaging   | 7, 8       | ✅ Complete |
| 4 — Scorecard             | 9, 10      | ✅ Complete |
| 5 — Certificates          | 11, 12, 13 | ✅ Complete |
| 6 — Digital PO            | 14, 15     | ✅ Complete |
| 7 — Onboarding            | 16, 17     | ✅ Complete |
| 8 — Global Features       | 18, 19, 20 | ✅ Complete |
