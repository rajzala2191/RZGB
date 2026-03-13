# Zaproc — Master Implementation Plan

> **Zaproc** is the product name. **RZ Global Solutions** is the company that builds it.

Each phase is self-contained. We tackle them in order — no phase depends on a later one. Within each phase, steps are numbered and sequenced.

---

## Phase 0 — Bug Fixes & Code Debt (do first, unblocks everything)

**Step 0.1 — Fix `fetchBidSavings` inconsistent return type**
- File: `src/services/spendAnalyticsService.js:99`
- Change `if (!data) return []` → `return { totalSaved: 0, ordersWithSavings: 0 }`
- Update `spendAnalyticsService.test.js` null-case assertion to match
- Risk: any UI component that currently does `savings.length` check will need updating

**Step 0.2 — Fix `awardBid` random ID — use the sequential generator**
- File: `src/services/bidService.js:72`
- Remove `Math.floor(1000 + Math.random() * 9000)` inline ID
- Call `generateRZJobId()` (already exists in `src/lib/generateRZJobId.js`)
- Note: `generateRZJobId` uses `supabase` (public client); `awardBid` runs as admin — verify the public client has `SELECT` on `orders.rz_job_id` or switch to `supabaseAdmin` in the generator
- Update `bidService.test.js` rzJobId regex to `^RZ-JOB-\d{4}-\d{3}$`

**Step 0.3 — Fix `makeDecision` delegation null-safety**
- File: `src/services/approvalService.js:106`
- Extract the inner `await` into a named variable before using it as a `.eq()` argument
- Add a guard: if `workflow_id` comes back null, throw a descriptive error instead of silently updating all rows
- Add a test for the `delegated` decision path

**Step 0.4 — Create a shared `ORDER_STATUSES` constants module**
- New file: `src/lib/constants.js`
- Extract `['AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED']` (currently duplicated in 3+ service files) into named exports: `ACTIVE_STATUSES`, `COMPLETED_STATUSES`, `ALL_PRODUCTION_STATUSES`
- Update `spendAnalyticsService.js`, `orderService.js`, `invoiceService.js` to import from it

**Step 0.5 — Fix random ID generation in `invoiceService` and `poService`**
- Files: `src/services/invoiceService.js:7-9`, `src/services/poService.js:7-9`
- Replace `Math.random()` with a DB-backed sequential generator (same pattern as `generateRZJobId`) — new functions `generateInvoiceNumber()` and `generatePONumber()` in `src/lib/`
- Makes all reference numbers auditable, sortable, and collision-free

**Step 0.6 — Expand test coverage to untested services**
- Add tests for: `invoiceService` (createInvoice payload, stats aggregation, overdue logic), `poService` (createPurchaseOrder, issuePO, acknowledgePO), `asyncUtils` (retryAsync retry count, safeAsync fallback), `slackService` (message text format, no-webhook early return)
- Target: bring total tests from 62 → ~110

---

## Phase 1 — Supplier Intelligence Layer

**Step 1.1 — Build supplier performance scorecard service**
- New file: `src/services/supplierScoreService.js`
- Function `calculateSupplierScore(supplierId)` aggregates from existing DB data:
  - On-time delivery rate: orders where `order_status = DELIVERED` vs expected delivery date
  - NCR frequency: `audit_logs` where `action = ncr_reported` grouped by `supplier_id`
  - Bid competitiveness: ratio of awarded bids to submitted bids
  - Response time: average hours from `OPEN_FOR_BIDDING` to first bid submitted
- Returns a `0–100` composite score with a per-dimension breakdown
- Write tests for the aggregation logic

**Step 1.2 — Persist scores to DB**
- New Supabase table: `supplier_scores` (`supplier_id`, `score`, `on_time_rate`, `ncr_rate`, `bid_win_rate`, `avg_response_hours`, `calculated_at`)
- New function `refreshSupplierScore(supplierId)` — upserts to `supplier_scores`
- Call it automatically: after order delivered, after NCR logged, after bid awarded

**Step 1.3 — Surface scores on bid comparison**
- Update `BidComparisonPage.jsx` to fetch and display the supplier score badge next to each bid
- Show the score breakdown on hover/expand
- Sort bids by score as an optional secondary sort (default remains price)

**Step 1.4 — Score-weighted supplier recommendation**
- Update `fetchRecommendedSuppliers` in `supplierDiscoveryService.js` to JOIN with `supplier_scores`
- Sort recommendations by: `capability_match × score` (not just `featured` flag)
- Display score on `SupplierDiscoveryPage`

---

## Phase 2 — AI DFM Analysis at Order Intake

**Step 2.1 — Extend the Edge Function to return DFM data**
- The existing `scrub-drawing` Supabase Edge Function already calls Claude vision
- Extend its prompt to also return a structured DFM report alongside the redaction report
- DFM report JSON shape: `{ issues: [{ type, severity, description, location }], overall_risk: 'low|medium|high', recommendations: string[] }`
- Keep the scrubbing and DFM in one call (same file upload, richer response)

**Step 2.2 — Create `dfmService.js`**
- New file: `src/services/dfmService.js`
- `runDFMAnalysis(file, orderMeta)` — calls the extended Edge Function
- `saveDFMReport(orderId, report)` — saves to new `dfm_reports` table
- `fetchDFMReport(orderId)` — retrieves it

**Step 2.3 — Add DFM trigger at admin document review**
- In `AdminDocumentReview.jsx`: after a drawing is uploaded/received, auto-trigger DFM analysis
- Show a colour-coded risk badge: 🟢 Low / 🟡 Medium / 🔴 High
- Expand to show issue list before admin sends the order to suppliers

**Step 2.4 — Show DFM warnings to client at order creation**
- In `ClientOrderCreationPage.jsx`: after drawing upload, run DFM analysis immediately
- Show non-blocking warnings ("Possible thin wall at Section A — confirm with supplier")
- Allow client to acknowledge and proceed, or revise the drawing

---

## Phase 3 — Bid Intelligence Copilot

**Step 3.1 — Create `bidAnalysisService.js`**
- New file: `src/services/bidAnalysisService.js`
- `analyseBidSet(orderId)` — fetches all bids for the order, then calls a Supabase Edge Function (or Claude API directly) with:
  - Bid amounts, lead times, supplier scores, supplier history with this client
  - Order context: material, process, quantity, tolerance requirements
- Returns structured analysis:
  ```js
  {
    recommendation: 'bid-id-here',
    rationale: string,
    outliers: [{ bidId, reason }],
    riskFlags: [{ bidId, flag }],
    estimatedMarketRate: number,
    savingsVsHighest: number,
  }
  ```

**Step 3.2 — Build Bid Copilot panel in `BidComparisonPage.jsx`**
- Add an "AI Analysis" collapsible panel
- Shows: recommended bid (highlighted), rationale in plain English, outlier flags, estimated market rate context
- One-click "Award recommended bid" button that pre-selects the AI suggestion (human still confirms)

**Step 3.3 — Add historical bid context to the analysis**
- Feed `fetchBidSavings` data and supplier score history into the prompt
- "Supplier X has won 4 of your last 6 bids. Their on-time rate for CASTING jobs is 87%. This bid is 12% above their last winning bid for similar parts."

---

## Phase 4 — Natural Language Order Creation

**Step 4.1 — Create `orderIntakeService.js`**
- New file: `src/services/orderIntakeService.js`
- `parseOrderFromText(text)` — calls Claude API (via Edge Function) with the user's natural language input
- Returns structured JSON matching the order form schema:
  ```js
  {
    part_name, material, quantity, tolerance,
    surface_finish, process_suggestions,
    delivery_deadline, notes,
    confidence: { part_name: 0.95, material: 0.8, ... }
  }
  ```
- Fields with `confidence < 0.7` are flagged for human review

**Step 4.2 — Add conversational intake mode to `ClientOrderCreationPage.jsx`**
- Add a toggle: "Describe your part" vs "Fill form manually"
- Conversational mode: free-text input + drawing upload
- On submit, call `parseOrderFromText`, pre-fill the form
- Low-confidence fields highlighted in amber — user must confirm before proceeding

**Step 4.3 — Multi-turn follow-up**
- If required fields are missing or ambiguous after initial parse, surface targeted questions: "What tolerance do you need on the bore diameter?"
- This replaces the current 5-step form for straightforward orders

---

## Phase 5 — Automated PO/Invoice Three-Way Matching

**Step 5.1 — Build the matching engine**
- New file: `src/lib/invoiceMatcher.js`
- `matchInvoiceToPO(invoiceId)`:
  - Fetch invoice, its linked PO, and the order's current `order_status`
  - Check 1: invoice `total_amount` is within 2% of PO `total_amount`
  - Check 2: order is in `DISPATCH` or `DELIVERED` status (goods received)
  - Check 3: invoice `supplier_id` matches PO `supplier_id`
  - Returns: `{ matched: bool, autoApprove: bool, discrepancies: [{ field, expected, actual }] }`
- Write tests for all match/mismatch combinations

**Step 5.2 — Auto-approve matched invoices**
- In `AdminInvoicesPage.jsx` (and via background trigger): when an invoice is submitted, run `matchInvoiceToPO`
- If `autoApprove: true` → call `updateInvoiceStatus(invoiceId, 'approved')` automatically, log to audit trail
- If discrepancy → mark invoice as `flagged`, surface the specific mismatch to admin

**Step 5.3 — Discrepancy escalation**
- Route flagged invoices into the existing approval workflow (`approvalService.submitForApproval`)
- Show discrepancy detail in the approval request context

---

## Phase 6 — Predictive Lead Time

**Step 6.1 — Build delivery history dataset**
- New function `fetchDeliveryHistory()` in `orderService.js`
- Aggregates from `orders`: `supplier_id`, `material`, process stages (`selected_processes`), `quantity`, `created_at`, and actual delivery date (last milestone timestamp in `job_updates` where `stage = DELIVERED`)
- Returns per-`(supplier_id, primary_process)` statistics: median lead time, p10, p90, sample count

**Step 6.2 — Lead time prediction service**
- New file: `src/services/leadTimeService.js`
- `predictLeadTime({ supplierId, material, processes, quantity })`:
  - Phase 1 (rule-based): look up historical median for that supplier × primary process combination
  - Confidence: show range (p10–p90) when sample count > 5, otherwise flag "insufficient data"
- Returns: `{ estimatedDays: number, rangeMin, rangeMax, confidence: 'high|medium|low', basedOnSamples: number }`

**Step 6.3 — Surface at bid comparison and order creation**
- `BidComparisonPage.jsx`: show predicted lead time next to each supplier's stated lead time — flag if stated is significantly lower than historical
- `ClientOrderCreationPage.jsx`: show estimated delivery range as soon as a supplier is tentatively selected

---

## Phase 7 — Spend Intelligence Upgrades

**Step 7.1 — AI-generated spend narrative**
- New function `generateSpendNarrative(spendData)` in `spendAnalyticsService.js`
- Calls Claude API (via Edge Function) with the current period's aggregated spend data
- Returns 2–3 sentences of plain-English insight: "Your MACHINING spend increased 34% vs last quarter, driven by 3 large orders from Acme. Steel remains your highest-spend material at 58% of total."
- Render at top of `SpendAnalyticsPage.jsx`

**Step 7.2 — Anomaly detection**
- New function `detectSpendAnomalies(orders)` in `spendAnalyticsService.js`
- Flags orders where `buy_price` is more than 2 standard deviations from the median for that `material × primary_process` combination
- Display as an "Anomalies" card on `SpendAnalyticsPage.jsx`

**Step 7.3 — Quarter-over-quarter comparison**
- Add a QoQ comparison view: spend this quarter vs same quarter last year
- Breakdown by supplier and material
- Highlight new suppliers added this quarter

---

## Phase 8 — Agentic Workflows

**Step 8.1 — RFQ zero-bid alert agent**
- New Supabase Edge Function: `rfq-monitor` (runs on a cron schedule)
- Checks: orders with `order_status = OPEN_FOR_BIDDING`, `bid_deadline` within 48 hours, and `bid_count = 0`
- Actions: re-send Slack notification with wider supplier list suggestion, create a `notifications` record for admin
- Respects `slackService` existing integration

**Step 8.2 — Approval SLA escalation**
- Extend `approvalService.js`: `escalateOverdueApprovals()`
- Finds `approval_requests` where `status = in_progress`, `updated_at` older than `escalation_hours` defined on the step
- Automatically emails/Slacks the approver's manager (fetched from `profiles`)
- Logs escalation to `audit_logs`

**Step 8.3 — Supplier milestone update via inbound email/webhook**
- New Supabase Edge Function: `milestone-inbound`
- Suppliers email a dedicated address or hit a webhook URL with a photo + text
- Claude parses the message: extracts `rz_job_id`, `stage`, and description
- Auto-creates a `job_updates` record and attaches evidence URL
- Admin gets a Slack notification to review and confirm

---

## Branding Reference

| Layer | Name |
|---|---|
| Company | RZ Global Solutions |
| Product | **Zaproc** |
| Product domain | `zaproc.co.uk` |
| Company domain | `rzglobalsolutions.co.uk` |
| Product tagline | *"Manufacturing procurement intelligence"* |
| Internal repo | RZGB (codename, keep as-is) |

---

## Phase 9 — Infrastructure & Security Hardening

**Step 9.1 — Move privileged operations to Edge Functions**
- Current risk: `supabaseAdmin` (service role key) is bundled in the browser JS
- Priority targets: `awardBid`, `makeDecision`, `generateOrderStepProgress`, `createPurchaseOrder`
- Wrap each in a Supabase Edge Function; frontend calls the Edge Function with the user's JWT; Edge Function verifies role then performs the admin operation
- `customSupabaseClient.js` only, no `supabaseAdmin` in browser bundle

**Step 9.2 — Add Supabase RLS policies audit**
- Review and document all tables that currently rely on `supabaseAdmin` bypass
- Write RLS policies for each so operations can eventually be done via the public client

**Step 9.3 — Context and hook test coverage**
- Add tests for `AuthContext.jsx`: role resolution, demo mode flag, company info loading
- Add tests for `useEmailVerification.js` and `useVersionCheck.js`
- Target: every public hook and context has at least a smoke test

---

## Sequencing Summary

```
Phase 0  ──► Phase 1  ──► Phase 2  ──► Phase 3
 Bugs &          Supplier       DFM at        Bid
 Debt            Scores         Upload        Copilot
                    │
                    ▼
              Phase 4  ──► Phase 5  ──► Phase 6
               NL Order     Invoice       Predictive
               Intake        Matching      Lead Time
                    │
                    ▼
              Phase 7  ──► Phase 8  ──► Phase 9
               Spend          Agentic       Security
               Intelligence   Workflows     Hardening
```

Phases 0–3 deliver visible product improvements quickly.
Phases 4–6 are the primary competitive differentiators.
Phases 7–9 compound the value and harden the platform for scale.
