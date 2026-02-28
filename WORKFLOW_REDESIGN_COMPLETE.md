# End-to-End RZ Portal Workflow - Complete Guide

## Overview

The portal now implements a complete end-to-end workflow for managing RFQs from client submission through delivery. All updates are visible to relevant parties (admin, supplier, client) in real-time.

## Complete Workflow Flow

```
CLIENT                    ADMIN                     SUPPLIER              DELIVERY
  │                         │                          │                      │
  ├─ Create RFQ ─────────────┤                         │                      │
  │  (Upload specs)          │                         │                      │
  │                          ├─ Sanitize RFQ           │                      │
  │                          ├─ Brand documents        │                      │
  │                          │                         │                      │
  │                          ├─ Release to Suppliers ──┤                      │
  │                          │  (Bidding Pool)         │                      │
  │                          │                         ├─ View RFQ            │
  │                          │                         ├─ Submit Bid          │
  │                          │                         │                      │
  │                          ├─ Award Project ─────────┤                      │
  │                          │                         ├─ Access Project      │
  │◄─ View Updated Project ──┤                         │                      │
  │  (Real-time tracking)    │                         ├─ Update Status       │
  │                          │                         │  (Dropdown)          │
  │                          │                         │  - Material Sourcing  │
  │                          │                         │  - Casting            │
  │                          │                         │  - Machining          │
  │                          │                         │  - QC                 │
  │                          │                         │  - Dispatch           │
  │                          │                         │                      │
  │                          │                         ├─ Upload Documents    │
  │                          │◄─ Document Review ─────┤ (per stage)          │
  │                          │  (Admin is notified)    │                      │
  │                          │                         │                      │
  │                          ├─ Sanitize Docs         │                      │
  │                          ├─ Approve/Reject       │                      │
  │                          │                         │                      │
  │◄─ Receive Docs ──────────┤                         │                      │
  │  (After approval)        │                         │                      │
  │                          │                         │                      │
  │◄─ Track Progress ────────┤                         ├─ Dispatch ────────────┤
  │  (Real-time updates)     │                         │   Product             │
  │                          │                         │                       ├─ Delivery
  │                          │                         │                       │
  └──────────────────────────┴─────────────────────────┴───────────────────────┤
                    All updates visible to all parties
```

## Key Pages & Their Functions

### 1. **Client Dashboard** (`/client-dashboard`)
- Overview of active projects
- Create new RFQs
- View project list with status
- Click on project to track in real-time

### 2. **Supplier Hub - Awarded Projects** (`/supplier-hub/projects`) **[NEW]**
- Shows only AWARDED projects
- **Dropdown Status Updates**: Move project through stages:
  - MATERIAL → CASTING → MACHINING → QC → DISPATCH → DELIVERED
- **Document Upload**: Upload documents for current stage (PDFs, images, reports)
- **Notes Section**: Add notes for each stage update
- **Real-time Notifications**: Shows if documents are:
  - ✓ Approved by admin
  - ⏳ Pending admin review
  - ✗ Rejected (resubmit)

### 3. **Admin Document Review** (`/control-centre/document-review`) **[NEW]**
- All supplier document submissions in one place
- **Filter by Status**:
  - Pending Review (new submissions)
  - Approved (ready to send to client)
  - Rejected (needs resubmission)
  - Sent to Client (already sent)
- **For Each Document**:
  - Download and review supplier document
  - Add sanitization notes (mark corrections made)
  - Approve → Ready for client
  - Reject → Request resubmission
  - Send to Client → Share approved document
- **Audit Trail**: All actions logged for compliance

### 4. **Live Project Tracking** (`/client-dashboard/projects/:projectId/tracking`)
- **Visual Pipeline**: See project progress through 11 stages
- **Real-time Updates**: Updates from supplier appear instantly
- **Received Documents**: View all approved documents from admin
- **Status Indicators**: 
  - 🔵 In Progress
  - ✓ Completed
  - ⏳ Pending
  - ⚠️ Issues

### 5. **Admin Sanitisation Gate** (`/control-centre/sanitisation-gate`)
- Initial RFQ review before sending to suppliers
- List pending orders needing sanitization
- Click → Detailed review page
- Mark as SANITISED → Moves to supplier bidding pool

### 6. **Admin Supplier Pool** (`/control-centre/supplier-pool`)
- List of suppliers who can bid
- Released RFQs waiting for bids
- Award RFQ to winning supplier

---

## Database Schema Updates

### New/Updated Fields in `orders` Table:
```sql
- supplier_id              (UUID) - Links to winning supplier
- supplier_doc_status      (TEXT) - 'pending_admin_review' | 'approved' | 'rejected' | 'sent_to_client'
- supplier_notes           (TEXT) - Notes from supplier about current stage
- admin_sanitized_at       (TIMESTAMP) - When admin approved documents
- updated_at               (TIMESTAMP) - Last update timestamp
```

### `documents` Table (Already used):
```sql
- id                       (UUID PRIMARY KEY)
- order_id                 (UUID) - Link to orders table
- file_name                (TEXT)
- file_url                 (TEXT) - Storage URL
- uploaded_by              (TEXT) - 'supplier' | 'admin' | 'client'
- doc_type                 (TEXT) - '  supplier_submission' | 'admin_approved' | 'client_received'
- status                   (TEXT) - 'pending_admin_review' | 'approved' | 'rejected' | 'sent_to_client'
- notes                    (TEXT) - Admin sanitization notes
- created_at               (TIMESTAMP)
- updated_at               (TIMESTAMP)
```

### `job_updates` Table (Already used):
```sql
- Automatically updated when supplier changes project status
- Tracks: MATERIAL → CASTING → MACHINING → QC → DISPATCH → DELIVERED
```

---

## Real-Time Features

All updates flow through Supabase subscriptions:

### Supplier Updates → Admin Notification
When supplier updates project status or uploads documents:
- Admin sees notification in Document Review page
- Appears in "Pending Review" tab
- Real-time refresh every 5 seconds

### Admin Approval → Client Visibility
When admin approves and sends document to client:
- Document appears in Client's "Received Documents"
- Project tracking updates immediately
- Client can download and view

### Project Progress → Real-Time Tracking
When supplier moves through stages:
- Visual progress bar updates on client's tracking page
- Timeline shows each stage completion
- Status colors change (yellow→green→blue)

---

## Step-by-Step Usage Examples

### Example 1: Supplier Wins & Starts Work

**Initial State**: Supplier has WON an order (status = AWARDED)

1. **Supplier logs in** → `/supplier-hub/projects`
2. **Sees awarded project** with dropdown showing "MATERIAL" as next stage
3. **Clicks "Move to Material Sourcing"** → Status changes to MATERIAL
4. **Uploads PO documents, supplier quotes** → Documents appear in Admin review queue
5. **Adds notes**: "Ordered materials from vendor X, expected delivery Feb 28"
6. **Saves**

**Behind the scenes**:
- Project status: AWARDED → MATERIAL
- Job update created with timestamp
- Admin receives notification

---

### Example 2: Admin Reviews & Approves Documents

**Admin workflow**: `/control-centre/document-review`

1. **Sees "Pending Review" tab** with new supplier document
2. **Clicks the document card** to expand
3. **Downloads to verify** supplier's PO and materials list
4. **Adds sanitization note**: "Verified vendor credentials, added company letterhead"
5. **Clicks "Approve for Client"**

**Behind the scenes**:
- Document status: pending_admin_review → approved
- Audit log created: "Document approved by admin"

6. **Sees document now in "Approved" tab**
7. **Clicks "Send Approved Document to Client"**

**Behind the scenes**:
- Document status: approved → sent_to_client
- Client immediately sees document in their tracking page

---

### Example 3: Client Monitors Project

**Client workflow**: `/client-dashboard/projects/:projectId/tracking`

1. **Views Live Project Tracking page**
2. **Sees pipeline**:
   - ✓ INTAKE (completed)
   - ✓ SCRUBBING (completed)
   - ✓ SANITISED (completed)
   - ✓ BIDDING (completed)
   - ✓ AWARDED (completed)
   - 🔵 MATERIAL (in progress - supplier working)
   - ⏳ CASTING (waiting)
   - ... MACHINING, QC, DISPATCH ...
3. **Scrolls down** → "Received Documents" section
4. **Sees supplier's materials PO** that admin approved
5. **Downloads to review**
6. **Sees timeline of all updates** from supplier with timestamps

---

## Navigation Updates

### Supplier Hub
**Old Navigation**: "Material", "Casting", "Machining", "QC", "Dispatch" (orphaned)
**New Navigation**:
- Dashboard
- **Awarded Projects** ← NEW (unified interface)
- Available Jobs
- Job Details
- Documents Portal

### Admin Control Centre
**New Navigation**:
- Dashboard
- Sanitisation Gate
- **Document Review** ← NEW
- Supplier Pool

### Client Dashboard
**Existing**: Projects with link to Live Tracking

---

## API Endpoints / Supabase Queries

### Fetch Awarded Projects (Supplier):
```sql
SELECT * FROM orders 
WHERE supplier_id = $1 
  AND order_status IN ('AWARDED', 'MATERIAL', 'CASTING', 'MACHINING', 'QC', 'DISPATCH', 'DELIVERED')
ORDER BY created_at DESC
```

### Fetch Pending Documents (Admin):
```sql
SELECT * FROM documents 
WHERE doc_type = 'supplier_submission' 
ORDER BY created_at DESC
```

### Fetch Received Documents (Client):
```sql
SELECT * FROM documents 
WHERE order_id = $1 
  AND doc_type = 'supplier_submission' 
  AND status = 'sent_to_client'
ORDER BY created_at DESC
```

### Update Project Status:
```sql
UPDATE orders 
SET order_status = $1, 
    supplier_doc_status = 'pending_admin_review'
WHERE id = $2
```

---

## Error Handling & Edge Cases

### Supplier Submits Without Documents
- Status still updates
- No documents in admin review queue
- Admin can manually flag as "needs docs"

### Admin Rejects Documents
- Supplier sees "Rejected" status in dropdown
- Document appears in "Rejected" tab in admin panel
- Supplier must resubmit improved documents

### Client Tries to Access Project Before Awarded
- ProtectedRoute checks role
- Redirects to dashboard

### Real-Time Sync Failures
- Fallback: Refresh page (manual sync)
- Supabase retries automatically
- Audit log captures all actions

---

## Testing Checklist

- [ ] Supplier can view only AWARDED projects
- [ ] Supplier can update status via dropdown
- [ ] Supplier documents upload without errors
- [ ] Admin receives notification in Document Review
- [ ] Admin can filter documents by status
- [ ] Admin can approve document
- [ ] Admin can send document to client
- [ ] Client receives document in tracking page
- [ ] Client sees real-time status updates
- [ ] Failed status transitions show error
- [ ] Audit logs capture all actions
- [ ] Theme toggle works on all pages

---

## Testing Credentials
```
Admin:    admin@rzglobalsolutions.co.uk / 9W@Z34w5
Supplier: supplier@rzglobalsolutions.co.uk / 9W@Z34w5
Client:   client@rzglobalsolutions.co.uk / 9W@Z34w5
```

## Portal URL
**Production**: www.portal.rzglobalsolutions.co.uk

---

## Future Enhancements

1. **Automated Notifications**: Email/SMS alerts for status changes
2. **Document Versioning**: Track multiple versions of same document
3. **Reject Reasons Template**: Pre-set rejection reasons with quick select
4. **Supplier Performance Metrics**: Track document approval rate
5. **Client Approval Workflow**: Optional client approval before dispatch
6. **QC Images Gallery**: Multiple image uploads per stage
7. **Progress Predictions**: Estimate delivery date based on stage timing

---

## Commit Information
- **Commit Hash**: c8f8a16
- **Date**: 2026-02-27
- **Changes**: 
  - Created: SupplierProjectManager.jsx (150 lines)
  - Created: AdminDocumentReview.jsx (200 lines)
  - Updated: App.jsx (routes)
  - Updated: SupplierHubLayout.jsx (navigation)
  - Updated: ControlCentreLayout.jsx (navigation)
