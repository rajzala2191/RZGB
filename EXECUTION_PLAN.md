# Global Parts Supplier Portal — Execution Plan

## Phase 1: Quick Wins (No new DB tables needed)

### Step 1 — Notification Centre
- Add `notifications` table: `id, user_id, type, message, order_id (nullable), read (bool), created_at`
- Create `NotificationBell.jsx` component
- Drop into `ControlCentreLayout.jsx`, `SupplierHubLayout.jsx`, `ClientDashboardLayout.jsx`
- Insert notification rows wherever status changes fire (e.g. `ReleaseToSuppliersModal.jsx`, `SubmitOrderModal.jsx`)
- Use Supabase Realtime to subscribe per user for live updates

### Step 2 — Global Search
- Create `SearchBar.jsx` component
- Query `orders` on `part_name`, `ghost_public_name`, `id` and `profiles` on `company_name`
- Drop into all three layout files
- Dropdown results grouped by: Orders / Suppliers / Documents

### Step 3 — Repeat Order Templates
- In `ClientOrderHistoryPage.jsx` add a "Re-order" button per row
- Navigate to `/client-dashboard/create-order` with previous order data via React Router `state`
- In `ClientOrderCreationPage.jsx` read `location.state` on mount and pre-fill `formData`
- No DB change needed

---

## Phase 2: Supplier Capability Matrix

### Step 4 — DB Schema
```
supplier_capabilities
  id, supplier_id (FK -> profiles.id),
  processes text[], materials text[], certifications text[],
  min_order_qty int, max_order_qty int,
  lead_time_days int, country text, region text,
  updated_at timestamptz
```

### Step 5 — Supplier Declares Capabilities
- New route `/supplier-hub/capabilities` in `App.jsx`
- Create `SupplierCapabilitiesPage.jsx` with multi-select for processes/materials/certifications
- Add "My Capabilities" nav link in `SupplierHubLayout.jsx`
- On submit, upsert into `supplier_capabilities` using `currentUser.id`

### Step 6 — Admin Views Capabilities
- In `SupplierManagementPage.jsx`, expandable row showing capabilities per supplier
- In `SupplierPoolPage.jsx`, add capability filter when releasing orders to suppliers

---

## Phase 3: Per-Order Threaded Messaging

### Step 7 — DB Schema
```
order_messages
  id, order_id (FK -> orders.id),
  sender_id (FK -> profiles.id), sender_role text,
  body text, created_at timestamptz, read_by uuid[]
```

### Step 8 — Build the Message Thread Component
- Create `OrderMessageThread.jsx` (chat-style UI with sender name, role badge, timestamp)
- Embed as collapsible panel in:
  - `ClientOrderDetailsPage.jsx`
  - `AdminDocumentReview.jsx`
  - `SupplierProjectManager.jsx`
- Use Supabase Realtime subscribed on `order_id`
- New messages also insert into `notifications` for all other parties on the order

---

## Phase 4: Supplier Performance Scorecard

### Step 9 — Supabase View
Create `supplier_scorecard` view calculating per supplier:
- On-Time Delivery % (orders completed before deadline / total completed)
- NCR Rate (ncr_reports count / total jobs delivered)
- Bid Response Rate (bids submitted / tenders invited to)
- Jobs Won Rate (awarded / total bids)

### Step 10 — Scorecard UI
- Create `SupplierScorecardPage.jsx` (admin only) at `/control-centre/supplier-scorecard`
- Table with KPI columns and colour-coded indicators (green/amber/red)
- "View Scorecard" link per row in `SupplierManagementPage.jsx`
- Optional read-only supplier view at `/supplier-hub/scorecard`

---

## Phase 5: Certificate & MTR Management

### Step 11 — DB Schema
```
job_certificates
  id, order_id (FK), supplier_id (FK),
  cert_type text (MTR, CoC, Inspection Report, Test Certificate),
  file_path text, uploaded_by uuid, approved_by uuid (nullable),
  status text (pending_review, approved, rejected),
  created_at timestamptz
```

### Step 12 — Supplier Uploads Certs
- In `SupplierProjectManager.jsx` add "Upload Certificate" button per job/stage
- Store file in Supabase Storage, insert row into `job_certificates`

### Step 13 — Admin Reviews & Client Downloads
- In `AdminDocumentReview.jsx` add "Certificates" tab with approve/reject actions
- In `ClientOrderDetailsPage.jsx` add "Compliance Pack" button for bulk ZIP download
- In `QualityVaultPage.jsx` show certs grouped by order

---

## Phase 6: Digital PO & Quote Acceptance

### Step 14 — DB Schema
Add to `orders` / `bid_submissions`:
```
quote_accepted_by uuid, quote_accepted_at timestamptz,
po_signed_by uuid, po_signed_at timestamptz, po_reference text
```

### Step 15 — Build the Acceptance Flow
- In `BidComparisonPage.jsx` winning bid selection triggers an Award Letter summary modal
- Supplier sees "Accept Job" in `TenderDetailsPage.jsx` — sets `po_signed_at`, writes to `audit_logs`
- Client sees "Confirm Order" in `ClientOrderDetailsPage.jsx` before production begins

---

## Phase 7: Supplier Onboarding Workflow

### Step 16 — DB Schema
Add to `profiles`:
```
onboarding_status text (invited, profile_complete, docs_submitted, under_review, approved, rejected)
onboarding_notes text
```

### Step 17 — Build the Onboarding Flow
- Check `onboarding_status !== 'approved'` in `ProtectedRoute.jsx`, redirect to `/supplier-hub/onboarding`
- Create `SupplierOnboardingPage.jsx` using existing `JourneyStepper.jsx`:
  - Step 1: Company Info
  - Step 2: Capabilities (links to Phase 2)
  - Step 3: Upload Certifications
  - Step 4: T&C Acceptance
  - Step 5: Submitted
- In `SupplierManagementPage.jsx` add "Onboarding Queue" tab for admin approve/reject

---

## Phase 8: Global Platform Features

### Step 18 — Multi-Currency Bid Support
- Add `currency text` and `exchange_rate_at_submission numeric` to `bid_submissions`
- Currency selector in `TenderDetailsPage.jsx` bid form
- Normalize bids to base currency in `BidComparisonPage.jsx`

### Step 19 — Two-Factor Authentication (2FA)
- Enable TOTP in Supabase Auth settings
- Add 2FA setup in `SettingsPage.jsx` using `supabase.auth.mfa.enroll()`
- Enforce for admin via `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` in `ProtectedRoute.jsx`

### Step 20 — ERP Webhook Integration Layer
- Add `webhooks` table: `id, tenant_id, event_type, endpoint_url, secret, active`
- Supabase Edge Function `dispatch-webhook` triggered on order status changes
- Admin can register webhook endpoints in `SettingsPage.jsx`

---

## Summary Table

| Phase | Steps | Complexity | Value     |
|-------|-------|------------|-----------|
| 1 — Quick Wins            | 1, 2, 3       | Low        | High      |
| 2 — Capability Matrix     | 4, 5, 6       | Medium     | Very High |
| 3 — Per-Order Messaging   | 7, 8          | Medium     | High      |
| 4 — Scorecard             | 9, 10         | Low-Medium | High      |
| 5 — Certificates          | 11, 12, 13    | Medium     | Very High |
| 6 — Digital PO            | 14, 15        | Medium     | High      |
| 7 — Onboarding            | 16, 17        | Medium     | High      |
| 8 — Global Features       | 18, 19, 20    | High       | Strategic |
