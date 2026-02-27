# RZ Portal Manufacturing Workflow - Test Plan

## Test Objective
Validate all 6 manufacturing workflow pages work correctly end-to-end:
1. Job Tracking (job-tracking page - overview)
2. Material Update (material sourcing)
3. Casting (casting operations)
4. Machining (precision machining)
5. QC (quality control)
6. Dispatch (shipment logistics)

## Test User Credentials
- Email: supplier@rzglobalsolutions.co.uk
- Password: 9W@Z34w5

## Test Workflow Steps

### Phase 1: Login & Navigation
- [ ] Login to supplier portal
- [ ] Navigate to Supplier Hub
- [ ] Access "Jobs" section
- [ ] Select a test job (or use existing OPEN_FOR_BIDDING job)
- [ ] Verify Manufacturing Workflow navigation panel appears on JobDetailsPage

### Phase 2: Material Update Page
- [ ] Click "Material Update" button
- [ ] Route should be: /supplier-hub/material-update/{rz_job_id}
- [ ] Verify page loads with:
  - [ ] Material Grade dropdown
  - [ ] Supplier Name field
  - [ ] Quantity Available field
  - [ ] Cost Per Unit field
  - [ ] ETA date picker
  - [ ] Notes textarea
- [ ] Submit form with test data
- [ ] Verify success toast notification
- [ ] Check Supabase job_updates table for inserted record

### Phase 3: Casting Page
- [ ] Navigate back to job details
- [ ] Click "Casting" button
- [ ] Route should be: /supplier-hub/casting/{rz_job_id}
- [ ] Verify page loads with:
  - [ ] Cast Method dropdown (sand/investment/die/continuous)
  - [ ] Cast Started datetime picker
  - [ ] Cast Completed datetime picker
  - [ ] Units Cast field
  - [ ] Yield Percentage field (auto-calculated)
  - [ ] Defects Found field
  - [ ] Notes textarea
- [ ] Submit form with test data
- [ ] Verify success toast notification

### Phase 4: Machining Page
- [ ] Navigate back to job details
- [ ] Click "Machining" button
- [ ] Route should be: /supplier-hub/machining/{rz_job_id}
- [ ] Verify page loads with:
  - [ ] Machine Type dropdown (cnc/lathe/milling/grinding/drilling/multi-axis)
  - [ ] Machining Started datetime picker
  - [ ] Machining Completed datetime picker
  - [ ] Units Machined field
  - [ ] Surface Finish field (Ra µm)
  - [ ] Tolerance Achieved field
  - [ ] Rework Required checkbox
  - [ ] Notes textarea
  - [ ] Display job requirements for tolerance & surface finish
- [ ] Submit form with test data
- [ ] Verify success toast notification

### Phase 5: QC Page
- [ ] Navigate back to job details
- [ ] Click "QC" button
- [ ] Route should be: /supplier-hub/qc/{rz_job_id}
- [ ] Verify page loads with:
  - [ ] QC Date picker
  - [ ] Units Tested field
  - [ ] Units Passed field (auto-calculates failed & percentage)
  - [ ] Pass Percentage display (color-coded: ≥95% green, ≥80% yellow, <80% red)
  - [ ] Defects Found textarea
  - [ ] Corrective Actions textarea
  - [ ] Certifications checkbox
  - [ ] Notes textarea
- [ ] Submit form with test data
- [ ] Verify pass percentage calculation
- [ ] Verify success toast notification

### Phase 6: Dispatch Page
- [ ] Navigate back to job details
- [ ] Click "Dispatch" button
- [ ] Route should be: /supplier-hub/dispatch/{rz_job_id}
- [ ] Verify page loads with:
  - [ ] Units Dispatched field
  - [ ] Dispatch Date picker
  - [ ] Courier field
  - [ ] Tracking Number field
  - [ ] Shipping Address textarea
  - [ ] Estimated Delivery date picker
  - [ ] Packaging Type dropdown (standard/anti-static/vacuum/climate-controlled/fragile/custom)
  - [ ] Special Handling checkbox
  - [ ] Documents Included checkbox
  - [ ] Notes textarea
- [ ] Submit form with test data
- [ ] Verify order status updates to DISPATCHED
- [ ] Verify success toast notification

### Phase 7: Verification
- [ ] Check Supabase job_updates table:
  - [ ] All 5 stage updates present (MATERIAL_UPDATE, CASTING, MACHINING, QC, DISPATCH)
  - [ ] All updates have correct rz_job_id
  - [ ] All updates have supplier_id
  - [ ] Data payload contains all form fields
- [ ] Verify order status in orders table changed to DISPATCHED

## Expected Results
✅ All pages load without errors
✅ All forms submit successfully
✅ All data persists in Supabase
✅ All navigation links work correctly
✅ All toast notifications appear
✅ All color-coded accents display correctly (cyan→amber→purple→emerald→blue)

## Issues to Document
- Any page load errors
- Form validation issues
- Supabase connection errors
- Navigation problems
- Missing required fields
- Data not persisting

