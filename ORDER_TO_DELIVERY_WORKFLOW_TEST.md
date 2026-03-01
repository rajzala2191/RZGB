# Complete Button & Workflow Test Guide

## ✅ Theme System Fix
- **Status:** COMPLETE
- **Changes Made:**
  - Removed ThemeToggle button from all layouts (Supplier, Admin, Client)
  - Portal now remains dark-only (no broken light mode)
  - Cleaned up unnecessary theme context usage
  - **Deployed:** Production (www.portal.rzglobalsolutions.co.uk)

---

## 🔘 COMPREHENSIVE BUTTON TESTING WORKFLOW

This guide tests EVERY button in the complete order-to-delivery workflow. Follow this sequential checklist to verify all buttons work correctly.

---

## PHASE 1️⃣: CLIENT PORTAL - CREATE ORDER

**URL:** `https://www.portal.rzglobalsolutions.co.uk/client-dashboard/create-order`  
**Page:** `ClientOrderCreationPage.jsx`  
**Layout:** ClientDashboardLayout with sidebar

### Form Fields & Upload
- [ ] **Project Name input** - Type test text: "Test Aluminum Enclosure"
- [ ] **Description textarea** - Type multi-line description
- [ ] **Material dropdown** - Select any material (Aluminum 6061, Stainless Steel 304, etc.)
- [ ] **Quantity input** - Enter number: "100"
- [ ] **Tolerance input** - Enter: "+/- 0.05mm"
- [ ] **Surface Finish dropdown** - Select any option
- [ ] **Special Requirements textarea** - Type requirements

### File Upload
- [ ] **Click drag-drop zone** - Should open file picker
- [ ] **Drag & drop files** - Should accept files (test with .pdf, .txt)
- [ ] **Remove file button (X icon)** - Should remove uploaded file from list
- [ ] **File list shows** - Files should display with size in MB and green checkmark

### Form Submission
- [ ] **Cancel button** - Should navigate back (-1) to previous page
- [ ] **Submit Project button** - Should:
  - Show "Processing..." with loading spinner while submitting
  - Validate all required fields (part_name, material, quantity)
  - Create order with status `PENDING_ADMIN_SCRUB`
  - Upload files to Supabase storage
  - Show success toast notification
  - Navigate to `/client-dashboard/projects/{orderId}/tracking`

---

## PHASE 2️⃣: ADMIN PORTAL - SANITIZATION GATE

**URL:** `https://www.portal.rzglobalsolutions.co.uk/control-centre/sanitisation-gate`  
**Page:** `SanitisationGatePage.jsx`  
**Status:** ⚠️ STYLING ISSUE - Uses light mode CSS (needs dark mode update)

### Table Display
- [ ] **Page loads** - Shows table with orders in `PENDING_ADMIN_SCRUB` status
- [ ] **Table columns** - Displays: Order ID, Client, Part Name, Material, Status, Action
- [ ] **No orders message** - Shows "No pending orders" if empty

### Button Testing
- [ ] **Review button** - Clicks should navigate to `/control-centre/sanitisation-gate/review/{orderId}`

---

## PHASE 2B️⃣: ADMIN PORTAL - SANITIZATION REVIEW

**URL:** `https://www.portal.rzglobalsolutions.co.uk/control-centre/sanitisation-gate/review/{orderId}`  
**Page:** `SanitisationReviewPage.jsx`

### Display & Form
- [ ] **Order data loads** - Shows original part name, material, buy price
- [ ] **Ghost Public Name input** - Auto-populated with "RZ-PRJ-{random}", editable
- [ ] **Ghost Description input** - Auto-populated with material info, editable
- [ ] **Target Sell Price input** - Auto-calculated (buy_price × 1.2), editable

### Verification Checkboxes
- [ ] **Files renamed checkbox** - Can check/uncheck
- [ ] **Ghost identity checkbox** - Can check/uncheck
- [ ] **Margins calculated checkbox** - Can check/uncheck

### Button Testing
- [ ] **AUTHORISE FOR TENDER button** - Should:
  - Be DISABLED if any checkbox unchecked
  - Update order with ghost_public_name, ghost_description, target_sell_price
  - Change order_status to `SANITIZED`
  - Create entry in sanitization_records table
  - Show success toast: "Order sanitized successfully!"
  - Navigate to `/control-centre/supplier-pool`

---

## PHASE 3️⃣: ADMIN PORTAL - RELEASE TO BIDDING (Supplier Pool)

**URL:** `https://www.portal.rzglobalsolutions.co.uk/control-centre/supplier-pool`  
**Page:** `SupplierPoolPage.jsx`

### Expected Functionality
- [ ] **Page loads** - Shows sanitized orders
- [ ] **Release button** - Changes order_status from `SANITIZED` → `OPEN_FOR_BIDDING`
- [ ] **Confirmation** - Shows toast confirmation

---

## PHASE 4️⃣: SUPPLIER PORTAL - VIEW AVAILABLE JOBS

**URL:** `https://www.portal.rzglobalsolutions.co.uk/supplier-hub/jobs`  
**Page:** `SupplierJobsPage.jsx`

### Search & Filter
- [ ] **Search input** - Type to search by ghost_public_name or order ID
- [ ] **Filter button** - Visual only (can add functionality)
- [ ] **Table displays** - Shows orders with status `OPEN_FOR_BIDDING`

### Column Data
- [ ] **Tender ID** - Shows first 8 chars of order ID
- [ ] **Ghost Name** - Shows ghost_public_name
- [ ] **Material** - Shows material type
- [ ] **Quantity** - Shows quantity
- [ ] **Released Date** - Shows updated_at date

### Button Testing
- [ ] **View & Bid button** - Clicks should navigate to `/supplier-hub/jobs/{tenderId}`
- [ ] **Empty state** - Shows "No open tenders found" if no bidding orders

---

## PHASE 5️⃣: SUPPLIER PORTAL - SUBMIT BID

**URL:** `https://www.portal.rzglobalsolutions.co.uk/supplier-hub/jobs/{tenderId}`  
**Page:** `TenderDetailsPage.jsx`

### Left Panel - Tender Details
- [ ] **Tender specs display** - Shows ghost_public_name, description
- [ ] **Download button** - Links to download sanitized documents
- [ ] **Tender info cards** - Shows material, quantity, status, release date
- [ ] **Back to Tenders link** - Navigates to `/supplier-hub/jobs`

### Right Panel - Bid Form
- [ ] **COGS Price input** - Type numeric value: "3500"
- [ ] **Lead Time input** - Type numeric days: "30"
- [ ] **Notes textarea** - Type conditions/notes (optional)

### Button Testing
- [ ] **Submit Official Bid button** - Should:
  - Be DISABLED if price or leadTime empty
  - Create entry in bid_submissions table
  - Set status to `SUBMITTED`
  - Show success toast: "Bid submitted successfully"
  - Allow updating existing bid if supplier already bid

- [ ] **Update Bid button** (if bid exists) - Should:
  - Update existing bid_submissions entry
  - Show success toast: "Bid updated successfully"
  - Display "✓ Bid currently active and under review"

---

## PHASE 6️⃣: ADMIN PORTAL - MANAGE BIDS

**URL:** `https://www.portal.rzglobalsolutions.co.uk/control-centre/bid-management`  
**Page:** `AdminBidManagement.jsx`

### Filter Tabs
- [ ] **Open for Bidding tab** - Shows orders with status `OPEN_FOR_BIDDING` or `BIDDING`
- [ ] **Awarded tab** - Shows orders with status `AWARDED`
- [ ] **Tab count** - Shows correct count for each status
- [ ] **Tab click** - Changes filter display

### Order Cards
- [ ] **Order details display** - Shows order ID, ghost_public_name, material, quantity
- [ ] **Bid count badge** - Shows number of bids received
- [ ] **Status badge** - Shows "BIDDING OPEN" or "✓ AWARDED"
- [ ] **Card expand** - Click to expand bid details

### Button Testing  
- [ ] **View Bid Comparison button** - Should navigate to `/control-centre/bid-comparison/{orderId}`

---

## PHASE 7️⃣: ADMIN PORTAL - AWARD CONTRACT

**URL:** `https://www.portal.rzglobalsolutions.co.uk/control-centre/bid-comparison/{orderId}`  
**Page:** `BidComparisonPage.jsx`

### Summary Cards
- [ ] **Target Price card** - Displays order target_sell_price
- [ ] **Quantity card** - Displays order quantity
- [ ] **Bids Received card** - Displays count of bids

### Bid Selection Table
- [ ] **Radio button selection** - Click to select a bid
- [ ] **Supplier column** - Shows supplier company_name or email
- [ ] **Quote Price column** - Shows price (green if ≤ target, amber if > target)
- [ ] **Lead Time column** - Shows lead_time_days
- [ ] **Notes column** - Shows bidder notes or N/A
- [ ] **Row highlight** - Selected bid row should highlight
- [ ] **Empty state** - Shows "No bids received yet" if none

### Button Testing
- [ ] **AWARD CONTRACT button** - Should:
  - Be DISABLED if no bid selected or no bids exist
  - Update order with:
    - order_status: `AWARDED`
    - supplier_id: selected bid supplier_id
    - buy_price: selected bid quote_price
    - rz_job_id: generated RZ-JOB-{random}
  - Create entry in supplier_order_link table
  - Show success toast: "Contract awarded successfully"
  - Navigate to `/control-centre/bid-analysis`

---

## PHASE 8️⃣: SUPPLIER PORTAL - VIEW AWARDED PROJECTS

**URL:** `https://www.portal.rzglobalsolutions.co.uk/supplier-hub/projects`  
**Page:** `SupplierProjectManager.jsx`  
**Status:** ✅ FIXED - fetchAwardedProjects properly defined

### Project List
- [ ] **Page loads** - Shows projects where supplier_id = currentUser.id and status in AWARDED/MATERIAL/etc.
- [ ] **Project cards display** - Shows:
  - Order ID (first 8 chars)
  - Part name
  - Client name
  - Material
  - Current stage badge

### Card Expansion
- [ ] **Click card** - Expands to show stage controls
- [ ] **Click again** - Collapses card
- [ ] **Empty state** - Shows "No awarded projects yet" if none

---

## PHASE 8B️⃣: SUPPLIER PORTAL - UPDATE PROJECT STATUS

**In:** `SupplierProjectManager.jsx` (expanded card)

### Stage Progression Buttons
- [ ] **MATERIAL button** - Available after AWARDED, moves to MATERIAL
- [ ] **CASTING button** - Available after MATERIAL, moves to CASTING
- [ ] **MACHINING button** - Available after CASTING, moves to MACHINING
- [ ] **QC button** - Available after MACHINING, moves to QC
- [ ] **DISPATCH button** - Available after QC, moves to DISPATCH
- [ ] **DELIVERED button** - Available after DISPATCH, moves to DELIVERED
- [ ] **Past stage buttons** - Should appear greyed out/disabled
- [ ] **DELIVERED stage** - No more buttons available

### Button Testing (Each Stage)
When clicking a stage button, it should:
- Show "Processing..." with spinner
- Update order_status in orders table to new stage
- Create entry in job_updates table
- Set supplier_doc_status to `pending_admin_review`
- Show success toast
- Refresh project list

### Document Upload
- [ ] **Click upload zone** - Opens file picker
- [ ] **Upload file** - Should:
  - Upload to Supabase storage: `supplier-docs/{projectId}-{timestamp}.{ext}`
  - Create document record in documents table
  - Set doc_type to `supplier_submission`
  - Set status to `pending_admin_review`
  - Show success message
  - Refresh project list

### Notes Textarea
- [ ] **Type in notes field** - Updates local state
- [ ] **Save functionality** - (Check if button exists, or needs adding)

---

## PHASE 9️⃣: ADMIN PORTAL - REVIEW SUPPLIER DOCUMENTS

**URL:** `https://www.portal.rzglobalsolutions.co.uk/control-centre/document-review`  
**Page:** `AdminDocumentReview.jsx`

### Filter Tabs
- [ ] **Pending Review tab** - Shows documents with status `pending_admin_review`
- [ ] **Approved tab** - Shows documents with status `approved`
- [ ] **Rejected tab** - Shows documents with status `rejected`
- [ ] **Sent to Client tab** - Shows documents with status `sent_to_client`
- [ ] **All tab** - Shows all documents
- [ ] **Tab count** - Shows count for each filter
- [ ] **Tab click** - Changes filtered list

### Document Cards
- [ ] **File name displays** - Shows file_name with FileText icon
- [ ] **Document info** - Shows order ID, part name, supplier name
- [ ] **Upload date** - Shows created_at timestamp
- [ ] **Status badge** - Shows current status with appropriate color/icon

### Expand/View Button
- [ ] **Eye icon button** - Toggles document details view
- [ ] **X icon button** (when expanded) - Collapses view
- [ ] **Card highlight** - Selected document should have cyan border

---

## PHASE 9B️⃣: ADMIN PORTAL - DOCUMENT ACTIONS

**In:** `AdminDocumentReview.jsx` (expanded document)

### Document Preview Section
- [ ] **Download & View button** - Opens document in new tab (links to file_url)
- [ ] **Link works** - Successfully downloads/previews file

### Notes Textarea
- [ ] **Type notes** - Accepts admin sanitization notes
- [ ] **Shows previous notes** - Displays any existing notes from prior reviews

### For Pending Documents
- [ ] **Approve for Client button** - Should:
  - Be GREEN colored
  - Show "Approving..." with spinner while processing
  - Update document status to `approved`
  - Update order supplier_doc_status to `approved`
  - Save admin notes to document.notes
  - Create audit_logs entry
  - Refresh document list
  - Clear selected doc and notes field

- [ ] **Reject & Request Resubmit button** - Should:
  - Be RED (destructive)
  - Show "Rejecting..." with spinner while processing
  - Update document status to `rejected`
  - Update order supplier_doc_status to `rejected`
  - Save rejection notes
  - Create audit_logs entry
  - Refresh document list
  - Clear fields

### For Approved Documents
- [ ] **Send Approved Document to Client button** - Should:
  - Be BLUE colored
  - Update document status to `sent_to_client`
  - Create audit_logs entry
  - Refresh list
  - Clear selected doc

---

## PHASE 🔟: CLIENT PORTAL - TRACK PROJECT DELIVERY

**URL:** `https://www.portal.rzglobalsolutions.co.uk/client-dashboard/projects/{projectId}/tracking`  
**Page:** `LiveProjectTracking.jsx`

### Page Display
- [ ] **Page loads** - Fetches order and job_updates
- [ ] **Auto-refresh** - Updates every 5 seconds
- [ ] **Loading state** - Shows spinner while loading
- [ ] **Error handling** - Shows error message if fetch fails

### Project Header
- [ ] **Order info displays** - Shows part name, client name, material, quantity
- [ ] **Key metrics display** - Shows dates, pricing, locations
- [ ] **Stage badges** - Shows supplier company name, current stage

### 11-Stage Pipeline
- [ ] **Stage indicators display** - Shows all 11 stages:
  1. Order Received (INTAKE)
  2. Sanitizing (SCRUBBING)
  3. Ready for Bid (SANITISED)
  4. Supplier Bidding (BIDDING)
  5. Order Awarded (AWARDED)
  6. Material Sourcing (MATERIAL)
  7. Casting (CASTING)
  8. Machining (MACHINING)
  9. Quality Control (QC)
  10. Dispatch (DISPATCH)
  11. Delivered (DELIVERED)

- [ ] **Current stage highlighted** - Shows with filled blue circle
- [ ] **Past stages complete** - Shows with green checkmark
- [ ] **Future stages pending** - Shows with grey circle

### Updates Timeline
- [ ] **Job updates display** - Shows list of updates in chronological order
- [ ] **Update details** - Shows timestamp, stage, status, notes
- [ ] **No updates message** - Shows if no updates yet

### Documents Section
- [ ] **Documents list** - Shows files associated with project
- [ ] **Download links** - Links work to download files

---

## FINAL PHASE 1️⃣1️⃣: PROJECT COMPLETED

**Expected State:**
- [ ] **Order status** - Should be `DELIVERED`
- [ ] **Client view** - Shows complete pipeline (all stages green)
- [ ] **Supplier view** - Project disappears from active list
- [ ] **Admin view** - Order moves to archive/history

---

## 📊 Database Status Verification

After completing workflow, verify database states:

**Orders Table:**
- [ ] Final order_status = `DELIVERED`
- [ ] supplier_id populated with awarded supplier
- [ ] rz_job_id populated
- [ ] ghost_public_name sanitized
- [ ] target_sell_price set

**Bid Submissions Table:**
- [ ] Winning bid created with quote_price and lead_time_days
- [ ] Losing bids remain in table

**Job Updates Table:**
- [ ] Multiple entries showing progression through stages
- [ ] Each stage has corresponding update record

**Documents Table:**
- [ ] Multiple entries for supplier submissions
- [ ] Status progression: pending → approved → sent_to_client

**Supplier Order Link Table:**
- [ ] Entry created linking supplier to awarded order
- [ ] Contains bid_id reference

---

## 🛠️ Known Issues & Fixes Needed

### ⚠️ HIGH PRIORITY
1. **SanitisationGatePage styling** - Uses light mode CSS (gray-600, bg-white, gray-50)
   - Should use dark mode (slate-400, bg-[#0f172a], bg-[#1e293b])
   - Affects readability and consistency

2. **Missing "Save Notes" button** - SupplierProjectManager notes textarea doesn't have save button
   - Need to add button to persist notes to database

### 🟡 MEDIUM PRIORITY  
1. **Real-time subscriptions** - Some pages use polling (5s intervals) vs real-time
   - Consider switching to PostgreSQL subscriptions
   
2. **Empty state messages** - Some pages need better empty state UX
   - Add illustrations or helpful next steps

### 🟢 LOW PRIORITY
1. **Loading states** - Some buttons could show better feedback during async operations
2. **Form validation** - Add inline validation feedback
3. **Accessibility** - Add ARIA labels and keyboard navigation

---

## 📋 Complete Workflow Summary

```
CLIENT CREATES ORDER
  ↓
ADMIN SCRUBS/SANITIZES
  ↓
ADMIN RELEASES TO BIDDING
  ↓
SUPPLIERS SEE & BID
  ↓
ADMIN AWARDS CONTRACT
  ↓
SUPPLIER EXECUTES PROJECT (6 stages)
  ↓
ADMIN REVIEWS DOCUMENTS
  ↓
CLIENT TRACKS PROGRESS
  ↓
PROJECT DELIVERED
```

---

## 📋 Complete Workflow Overview

### Phase 1: Client Creates Order
**Route:** `/client-dashboard/create-order` → `ClientOrderCreationPage`
- **Status:** ✅ IMPLEMENTED
- **What happens:**
  - Client fills in project details
  - Specifies material, quantity, target price
  - Uploads RFQ documents
  - Order created in `orders` table with status `INTAKE`

### Phase 2: Admin Review & Sanitization
**Route:** `/control-centre/sanitisation-gate` → `SanitisationGatePage`
- **Status:** ✅ IMPLEMENTED
- **What happens:**
  - Admin reviews order from INTAKE
  - Views uploaded RFQ documents
  - Performs "sanitization" (removes sensitive info)
  - Changes status to `SANITISED` → `OPEN_FOR_BIDDING`

### Phase 3: Suppliers See Available Jobs
**Route:** `/supplier-hub/jobs` → `SupplierJobsPage`
- **Status:** ✅ IMPLEMENTED
- **What happens:**
  - Fetches orders with status `OPEN_FOR_BIDDING`
  - Displays list of available tenders
  - Shows: Tender ID, Ghost Name, Material, Quantity, Released Date
  - "View & Bid" button links to tender details

### Phase 4: Supplier Submits Bid
**Route:** `/supplier-hub/jobs/:tenderId` → `TenderDetailsPage`
- **Status:** ✅ IMPLEMENTED
- **What happens:**
  - Shows full tender specifications
  - Supplier fills in bidding form:
    - Cost of Goods Sold (COGS) / Quote Price
    - Lead Time (Days)
    - Notes / Conditions
  - Creates entry in `bid_submissions` table with status `SUBMITTED`
  - Can update existing bid

### Phase 5: Admin Manages Bids
**Route:** `/control-centre/bid-management` → `AdminBidManagement`
- **Status:** ✅ IMPLEMENTED
- **What happens:**
  - Shows orders in `OPEN_FOR_BIDDING` or `BIDDING` status
  - Displays count of bids received for each order
  - Shows bid summary with supplier names
  - Status displays as "BIDDING OPEN" or "✓ AWARDED"
  - Filters between "Open for Bidding" and "Awarded" tabs
  - Click on order to view full bid comparison

### Phase 6: Admin Awards Contract
**Route:** `/control-centre/bid-comparison/:orderId` → `BidComparisonPage`
- **Status:** ✅ IMPLEMENTED
- **What happens:**
  - Shows target price, quantity, bids received
  - Displays table with all bids:
    - Supplier name
    - Quote price (color-coded: green if ≤ target, amber if > target)
    - Lead time
    - Notes
  - Admin selects bid using radio button
  - Clicks "AWARD CONTRACT" button
  - System updates order status to `AWARDED`
  - Creates entry in `supplier_order_link` table
  - Generates `rz_job_id` for tracking

### Phase 7: Supplier Sees Awarded Projects
**Route:** `/supplier-hub/projects` → `SupplierProjectManager`  
- **Status:** ✅ IMPLEMENTED (with fix)
- **Bug Fixed:** `fetchAwardedProjects()` function now properly defined
- **What happens:**
  - Fetches orders where `supplier_id = currentUser.id` and status in ['AWARDED', 'MATERIAL', 'CASTING', etc.]
  - Displays list of awarded projects with:
    - Order ID (first 8 chars)
    - Part name
    - Client name
    - Material
    - Current stage badge
  - Click to expand project details

### Phase 8: Supplier Updates Project Status
**In:** `SupplierProjectManager`
- **Status:** ✅ IMPLEMENTED (with fix)
- **Available Stages:**
  1. MATERIAL - Material Sourcing
  2. CASTING - Casting
  3. MACHINING - Machining
  4. QC - Quality Control
  5. DISPATCH - Dispatch
  6. DELIVERED - Delivered

- **What happens:**
  - Supplier clicks on project to expand
  - Sees buttons for next stages (greyed out for past stages)
  - Can upload documents for current stage
  - Can add notes about progress
  - When moving to next stage:
    - Updates `order_status` in orders table
    - Creates entry in `job_updates` table
    - Sets `supplier_doc_status` to `pending_admin_review`

### Phase 9: Admin Reviews Supplier Documents
**Route:** `/control-centre/document-review` → `AdminDocumentReview`
- **Status:** ✅ IMPLEMENTED
- **What happens:**
  - Shows list of orders awaiting document review
  - Displays documents uploaded by supplier
  - Admin can:
    - View documents
    - Approve submission → updates supplier_doc_status to `approved`
    - Request changes → updates supplier_doc_status to `changes_requested`
    - Reject → updates to `rejected`

### Phase 10: Client Tracks Project Progress
**Route:** `/client-dashboard/projects/:projectId/tracking` → `LiveProjectTracking`
- **Status:** ✅ IMPLEMENTED
- **What happens:**
  - Shows 11-stage pipeline:
    - INTAKE, SCRUBBING, SANITISED, BIDDING, AWARDED, MATERIAL, CASTING, MACHINING, QC, DISPATCH, DELIVERED
  - Real-time updates every 5 seconds
  - Visual stage indicator showing current progress
  - Displays job updates from `job_updates` table
  - Shows documents associated with project
  - Timeline of all historical updates

### Phase 11: Project Delivery Complete
**Final Status:** `DELIVERED`
- Order moves to final "DELIVERED" status
- Client can download final documents
- Project appears in archives
- Supplier's project disappears from active list

---

## 🔍 Testing Checklist

### Client Flow
- [ ] Client creates new order at `/client-dashboard/create-order`
- [ ] Order appears in `/client-dashboard/projects` with status INTAKE
- [ ] Client can track order at `/client-dashboard/projects/:projectId/tracking`

### Admin Flow
- [ ] Admin sees new order at `/control-centre/sanitisation-gate`
- [ ] Admin sanitizes and releases to bidding
- [ ] Admin views bids at `/control-centre/bid-management`
- [ ] Admin awards contract at `/control-centre/bid-comparison/:orderId`

### Supplier Flow
- [ ] Supplier sees available jobs at `/supplier-hub/jobs`
- [ ] Supplier can submit bid at `/supplier-hub/jobs/:tenderId`
- [ ] Supplier sees awarded projects at `/supplier-hub/projects`
- [ ] Supplier can update project status through stages
- [ ] Supplier can upload documents for each stage

### Admin Review Flow
- [ ] Admin reviews supplier documents at `/control-centre/document-review`
- [ ] Admin can approve/reject documents
- [ ] Client sees document approvals in tracking page

---

## 🐛 Known Issues & Fixes

### Fixed ✅
1. **Theme Toggle Button** - Removed broken system, portal stays dark-only
2. **SupplierProjectManager fetchAwardedProjects()** - Function was called but not defined, now properly refactored
3. **Database Columns** - Corrected delivery_days → lead_time_days

### Potential Remaining Issues to Monitor
1. **Document Upload Storage** - Verify Supabase storage bucket 'documents' exists and has proper permissions
2. **Supplier Tracking** - Ensure supplier_id from auth context correctly matches orders.supplier_id
3. **Real-time Subscriptions** - Some pages use polling (5s intervals) instead of real-time subs
4. **Status Flow Validation** - Ensure order_status values are consistently validated

---

## 📊 Database Tables Involved

| Table | Usage |
|-------|-------|
| `orders` | Stores all orders, tracks status through pipeline |
| `bid_submissions` | Stores supplier bids with pricing and lead time |
| `supplier_order_link` | Links suppliers to awarded contracts |
| `job_updates` | Tracks job stage updates and supplier progress |
| `documents` | Stores document metadata and URLs |
| `users` | Authentication and user roles |

---

## 🚀 Current State
- **Build:** ✅ Compiled successfully
- **Deployment:** ✅ Pushed to production
- **Portal Status:** ✅ Live at www.portal.rzglobalsolutions.co.uk
- **Theme System:** ✅ Removed (dark-only portal)
- **Workflow:** ✅ End-to-end implementation complete

---

## 📝 Next Steps
1. Perform complete manual workflow test from order creation to delivery
2. Verify real-world data flow across all systems
3. Check error handling and edge cases
4. Monitor for any runtime issues in production
5. Collect user feedback and iterate

