// ============================================================
// RZGB Portal — Demo Data (in-memory sandbox, no Supabase)
// All field names mirror production schema exactly
// ============================================================

export const DEMO_CLIENTS = [
  { id: 'dc-001', name: 'James Thornton', company: 'Thornton Precision Ltd', email: 'james@thorntonprecision.co.uk', initials: 'TP', role: 'client' },
  { id: 'dc-002', name: 'Sarah Chen', company: 'Chen Aerospace Components', email: 'sarah@chenaero.co.uk', initials: 'CA', role: 'client' },
  { id: 'dc-003', name: 'Oliver Walsh', company: 'Walsh Industrial Supply', email: 'oliver@walshindustrial.co.uk', initials: 'WI', role: 'client' },
  { id: 'dc-004', name: 'Priya Patel', company: 'Patel Manufacturing Group', email: 'priya@patelmanufacturing.co.uk', initials: 'PM', role: 'client' },
  { id: 'dc-005', name: 'Marcus Bell', company: 'Bell Engineering Works', email: 'marcus@belleng.co.uk', initials: 'BE', role: 'client' },
];

export const DEMO_SUPPLIERS = [
  { id: 'ds-001', name: 'FoundryTech UK', company: 'FoundryTech UK Ltd', email: 'ops@foundrytech.co.uk', initials: 'FT', specialisms: ['CASTING', 'MACHINING'], rating: 4.8, completedJobs: 142, role: 'supplier' },
  { id: 'ds-002', name: 'Precision Metals Ltd', company: 'Precision Metals Ltd', email: 'jobs@precisionmetals.co.uk', initials: 'PM', specialisms: ['MACHINING', 'QC'], rating: 4.6, completedJobs: 98, role: 'supplier' },
  { id: 'ds-003', name: 'Sheffield Forge', company: 'Sheffield Forge & Steel', email: 'bids@sheffieldforge.co.uk', initials: 'SF', specialisms: ['CASTING', 'MATERIAL'], rating: 4.9, completedJobs: 213, role: 'supplier' },
  { id: 'ds-004', name: 'Northern CNC Solutions', company: 'Northern CNC Solutions Ltd', email: 'hub@northerncnc.co.uk', initials: 'NC', specialisms: ['MACHINING'], rating: 4.5, completedJobs: 76, role: 'supplier' },
  { id: 'ds-005', name: 'Midlands Fabrication', company: 'Midlands Fabrication Co.', email: 'work@midlandsfab.co.uk', initials: 'MF', specialisms: ['MATERIAL', 'CASTING'], rating: 4.7, completedJobs: 189, role: 'supplier' },
];

export const DEMO_ADMINS = [
  { id: 'da-001', name: 'Alex Morgan', company: 'RZ Global Solutions', email: 'alex@vrocure.co.uk', initials: 'AM', role: 'admin' },
  { id: 'da-002', name: 'Jordan Clarke', company: 'RZ Global Solutions', email: 'jordan@vrocure.co.uk', initials: 'JC', role: 'admin' },
];

export const ORDER_STATUSES = [
  'PENDING_ADMIN_SCRUB',
  'SANITIZED',
  'OPEN_FOR_BIDDING',
  'BID_RECEIVED',
  'AWARDED',
  'MATERIAL',
  'CASTING',
  'MACHINING',
  'QC',
  'DISPATCH',
  'DELIVERED',
];

export const STATUS_LABELS = {
  PENDING_ADMIN_SCRUB: 'Pending Review',
  SANITIZED: 'Sanitised',
  OPEN_FOR_BIDDING: 'Open for Bidding',
  BID_RECEIVED: 'Bid Received',
  AWARDED: 'Awarded',
  MATERIAL: 'Material Prep',
  CASTING: 'Casting',
  MACHINING: 'Machining',
  QC: 'Quality Control',
  DISPATCH: 'Dispatch',
  DELIVERED: 'Delivered',
};

export const STATUS_COLORS = {
  PENDING_ADMIN_SCRUB: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  SANITIZED: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  OPEN_FOR_BIDDING: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  BID_RECEIVED: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
  AWARDED: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  MATERIAL: { bg: 'bg-cyan-100', text: 'text-cyan-800', dot: 'bg-cyan-500' },
  CASTING: { bg: 'bg-teal-100', text: 'text-teal-800', dot: 'bg-teal-500' },
  MACHINING: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  QC: { bg: 'bg-lime-100', text: 'text-lime-800', dot: 'bg-lime-500' },
  DISPATCH: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
};

export const DEMO_ORDERS = [
  // --- dc-001 Thornton Precision (PENDING_ADMIN_SCRUB, SANITIZED) ---
  {
    id: 'do-001',
    rz_job_id: 'RZ-JOB-10041',
    part_name: 'Turbine Housing Assembly',
    client_id: 'dc-001',
    supplier_id: null,
    order_status: 'PENDING_ADMIN_SCRUB',
    material: 'Stainless Steel 316L',
    quantity: 24,
    delivery_address: 'Birmingham, B1 1AA',
    created_at: '2026-03-07T09:14:00Z',
    updated_at: '2026-03-07T09:14:00Z',
    notes: 'Urgent — aerospace application. Tight tolerances on bore diameter.',
    selected_processes: ['MATERIAL', 'CASTING', 'MACHINING'],
    estimated_value: null,
  },
  {
    id: 'do-002',
    rz_job_id: 'RZ-JOB-10042',
    part_name: 'Hydraulic Manifold Block',
    client_id: 'dc-001',
    supplier_id: null,
    order_status: 'SANITIZED',
    material: 'Aluminium 6061-T6',
    quantity: 50,
    delivery_address: 'Birmingham, B1 1AA',
    created_at: '2026-03-05T14:30:00Z',
    updated_at: '2026-03-06T10:00:00Z',
    notes: 'Standard lead time acceptable. Anodising finish required.',
    selected_processes: ['MATERIAL', 'MACHINING'],
    estimated_value: null,
  },

  // --- dc-002 Chen Aerospace (OPEN_FOR_BIDDING, BID_RECEIVED) ---
  {
    id: 'do-003',
    rz_job_id: 'RZ-JOB-10039',
    part_name: 'Precision Gear Set (14 pcs)',
    client_id: 'dc-002',
    supplier_id: null,
    order_status: 'OPEN_FOR_BIDDING',
    material: 'Hardened Steel EN36',
    quantity: 14,
    delivery_address: 'Bristol, BS1 4DJ',
    created_at: '2026-03-01T11:00:00Z',
    updated_at: '2026-03-02T09:00:00Z',
    notes: 'Gear module 2.5, pressure angle 20°. Full CMM report required.',
    selected_processes: ['MATERIAL', 'MACHINING', 'QC'],
    estimated_value: 7800,
  },
  {
    id: 'do-004',
    rz_job_id: 'RZ-JOB-10038',
    part_name: 'Wing Bracket Subassembly',
    client_id: 'dc-002',
    supplier_id: 'ds-003',
    order_status: 'BID_RECEIVED',
    material: 'Titanium Grade 5',
    quantity: 8,
    delivery_address: 'Bristol, BS1 4DJ',
    created_at: '2026-02-26T08:45:00Z',
    updated_at: '2026-03-03T14:15:00Z',
    notes: 'Fatigue testing data required with delivery.',
    selected_processes: ['MATERIAL', 'MACHINING', 'QC'],
    estimated_value: 12400,
  },

  // --- dc-003 Walsh Industrial (AWARDED, MATERIAL) ---
  {
    id: 'do-005',
    rz_job_id: 'RZ-JOB-10036',
    part_name: 'Pump Housing Casting',
    client_id: 'dc-003',
    supplier_id: 'ds-001',
    order_status: 'AWARDED',
    material: 'Cast Iron GG25',
    quantity: 30,
    delivery_address: 'Manchester, M1 2HX',
    created_at: '2026-02-20T10:00:00Z',
    updated_at: '2026-02-28T16:00:00Z',
    notes: 'FoundryTech awarded. Lead time 18 days.',
    selected_processes: ['MATERIAL', 'CASTING', 'MACHINING'],
    estimated_value: 5600,
  },
  {
    id: 'do-006',
    rz_job_id: 'RZ-JOB-10035',
    part_name: 'Aluminium Extrusion Frame',
    client_id: 'dc-003',
    supplier_id: 'ds-005',
    order_status: 'MATERIAL',
    material: 'Aluminium 6063',
    quantity: 100,
    delivery_address: 'Manchester, M1 2HX',
    created_at: '2026-02-15T09:00:00Z',
    updated_at: '2026-03-04T11:00:00Z',
    notes: 'T-slot profile. Cut to length 2400mm each.',
    selected_processes: ['MATERIAL', 'MACHINING'],
    estimated_value: 3200,
  },

  // --- dc-004 Patel Manufacturing (CASTING, MACHINING, QC) ---
  {
    id: 'do-007',
    rz_job_id: 'RZ-JOB-10033',
    part_name: 'Valve Body Sand Casting',
    client_id: 'dc-004',
    supplier_id: 'ds-003',
    order_status: 'CASTING',
    material: 'Bronze LG2',
    quantity: 60,
    delivery_address: 'Leeds, LS1 1BA',
    created_at: '2026-02-10T08:00:00Z',
    updated_at: '2026-03-05T09:30:00Z',
    notes: 'Sand casting with cores. Wall thickness 6mm min.',
    selected_processes: ['MATERIAL', 'CASTING', 'MACHINING', 'QC'],
    estimated_value: 9100,
  },
  {
    id: 'do-008',
    rz_job_id: 'RZ-JOB-10031',
    part_name: 'CNC Bracket Set (40 pcs)',
    client_id: 'dc-004',
    supplier_id: 'ds-004',
    order_status: 'MACHINING',
    material: 'Mild Steel S275',
    quantity: 40,
    delivery_address: 'Leeds, LS1 1BA',
    created_at: '2026-02-05T14:00:00Z',
    updated_at: '2026-03-06T15:45:00Z',
    notes: '5-axis CNC. DXF files attached post-scrub.',
    selected_processes: ['MATERIAL', 'MACHINING'],
    estimated_value: 4400,
  },
  {
    id: 'do-009',
    rz_job_id: 'RZ-JOB-10030',
    part_name: 'Bearing Housing (Turned)',
    client_id: 'dc-004',
    supplier_id: 'ds-002',
    order_status: 'QC',
    material: 'Stainless Steel 304',
    quantity: 20,
    delivery_address: 'Leeds, LS1 1BA',
    created_at: '2026-01-28T10:00:00Z',
    updated_at: '2026-03-07T08:00:00Z',
    notes: 'CMM inspection sheet + material cert required.',
    selected_processes: ['MATERIAL', 'MACHINING', 'QC'],
    estimated_value: 6700,
  },

  // --- dc-005 Bell Engineering (DISPATCH, DELIVERED) ---
  {
    id: 'do-010',
    rz_job_id: 'RZ-JOB-10028',
    part_name: 'Sprocket Assembly Kit',
    client_id: 'dc-005',
    supplier_id: 'ds-001',
    order_status: 'DISPATCH',
    material: 'Case Hardened Steel',
    quantity: 12,
    delivery_address: 'Sheffield, S1 2GU',
    created_at: '2026-01-20T09:00:00Z',
    updated_at: '2026-03-08T14:00:00Z',
    notes: 'Dispatched via DPD. Tracking: DPD-GB-2409183.',
    selected_processes: ['MATERIAL', 'CASTING', 'MACHINING', 'QC'],
    estimated_value: 8300,
  },
  {
    id: 'do-011',
    rz_job_id: 'RZ-JOB-10025',
    part_name: 'Compressor Impeller',
    client_id: 'dc-005',
    supplier_id: 'ds-002',
    order_status: 'DELIVERED',
    material: 'Aluminium 2024-T4',
    quantity: 6,
    delivery_address: 'Sheffield, S1 2GU',
    created_at: '2026-01-08T11:00:00Z',
    updated_at: '2026-03-01T10:30:00Z',
    notes: 'Delivered and signed off. Client confirmed receipt.',
    selected_processes: ['MATERIAL', 'MACHINING', 'QC'],
    estimated_value: 11200,
  },
  {
    id: 'do-012',
    rz_job_id: 'RZ-JOB-10024',
    part_name: 'Flanged Coupling Set',
    client_id: 'dc-005',
    supplier_id: 'ds-005',
    order_status: 'DELIVERED',
    material: 'EN8 Steel',
    quantity: 16,
    delivery_address: 'Sheffield, S1 2GU',
    created_at: '2025-12-15T09:00:00Z',
    updated_at: '2026-02-10T09:00:00Z',
    notes: 'Completed project. Final sign-off received.',
    selected_processes: ['MATERIAL', 'MACHINING'],
    estimated_value: 3900,
  },
];

export const DEMO_BIDS = [
  {
    id: 'db-001',
    order_id: 'do-003',
    supplier_id: 'ds-001',
    supplier_name: 'FoundryTech UK',
    amount: 7400,
    currency: 'GBP',
    lead_time_days: 14,
    notes: 'Full CMM capability on site. ISO 9001 certified.',
    submitted_at: '2026-03-03T10:20:00Z',
    status: 'pending',
  },
  {
    id: 'db-002',
    order_id: 'do-003',
    supplier_id: 'ds-004',
    supplier_name: 'Northern CNC Solutions',
    amount: 8100,
    currency: 'GBP',
    lead_time_days: 10,
    notes: 'Can deliver in 10 days. 5-axis machining centre available.',
    submitted_at: '2026-03-03T14:45:00Z',
    status: 'pending',
  },
  {
    id: 'db-003',
    order_id: 'do-004',
    supplier_id: 'ds-003',
    supplier_name: 'Sheffield Forge',
    amount: 11900,
    currency: 'GBP',
    lead_time_days: 21,
    notes: 'Titanium specialists. Full fatigue test rig available.',
    submitted_at: '2026-03-04T09:00:00Z',
    status: 'received',
  },
];

export const DEMO_JOB_UPDATES = [
  // do-005 Pump Housing (AWARDED)
  { id: 'ju-001', order_id: 'do-005', rz_job_id: 'RZ-JOB-10036', message: 'Order reviewed and sanitised by admin team. Drawings cleared for supplier release.', created_at: '2026-02-22T09:00:00Z', author: 'RZ Admin', type: 'admin' },
  { id: 'ju-002', order_id: 'do-005', rz_job_id: 'RZ-JOB-10036', message: 'Order opened for bidding. 3 suppliers invited.', created_at: '2026-02-23T10:00:00Z', author: 'RZ Admin', type: 'admin' },
  { id: 'ju-003', order_id: 'do-005', rz_job_id: 'RZ-JOB-10036', message: 'Bid received from FoundryTech UK — £5,600 / 18-day lead time.', created_at: '2026-02-25T14:30:00Z', author: 'RZ Admin', type: 'bid' },
  { id: 'ju-004', order_id: 'do-005', rz_job_id: 'RZ-JOB-10036', message: 'Supplier awarded: FoundryTech UK. Purchase order issued.', created_at: '2026-02-28T16:00:00Z', author: 'RZ Admin', type: 'award' },

  // do-006 Aluminium Frame (MATERIAL)
  { id: 'ju-005', order_id: 'do-006', rz_job_id: 'RZ-JOB-10035', message: 'Order sanitised. Technical drawings cleared.', created_at: '2026-02-17T10:00:00Z', author: 'RZ Admin', type: 'admin' },
  { id: 'ju-006', order_id: 'do-006', rz_job_id: 'RZ-JOB-10035', message: 'Awarded to Midlands Fabrication. Material procurement started.', created_at: '2026-02-21T09:00:00Z', author: 'RZ Admin', type: 'award' },
  { id: 'ju-007', order_id: 'do-006', rz_job_id: 'RZ-JOB-10035', message: 'Aluminium billet stock confirmed. Delivery to fab shop expected 06-Mar.', created_at: '2026-03-04T11:00:00Z', author: 'Midlands Fabrication', type: 'update' },

  // do-007 Valve Body (CASTING)
  { id: 'ju-008', order_id: 'do-007', rz_job_id: 'RZ-JOB-10033', message: 'Order sanitised and released.', created_at: '2026-02-12T09:00:00Z', author: 'RZ Admin', type: 'admin' },
  { id: 'ju-009', order_id: 'do-007', rz_job_id: 'RZ-JOB-10033', message: 'Awarded to Sheffield Forge. Pattern equipment confirmed available.', created_at: '2026-02-18T14:00:00Z', author: 'RZ Admin', type: 'award' },
  { id: 'ju-010', order_id: 'do-007', rz_job_id: 'RZ-JOB-10033', message: 'Bronze LG2 material procured and delivered to foundry.', created_at: '2026-02-28T10:00:00Z', author: 'Sheffield Forge', type: 'update' },
  { id: 'ju-011', order_id: 'do-007', rz_job_id: 'RZ-JOB-10033', message: 'Casting underway. First pour completed. Cooling in progress.', created_at: '2026-03-05T09:30:00Z', author: 'Sheffield Forge', type: 'update' },

  // do-008 CNC Brackets (MACHINING)
  { id: 'ju-012', order_id: 'do-008', rz_job_id: 'RZ-JOB-10031', message: 'Order awarded to Northern CNC Solutions.', created_at: '2026-02-10T09:00:00Z', author: 'RZ Admin', type: 'award' },
  { id: 'ju-013', order_id: 'do-008', rz_job_id: 'RZ-JOB-10031', message: 'Material received. S275 sheet cut to blanks.', created_at: '2026-02-20T11:00:00Z', author: 'Northern CNC Solutions', type: 'update' },
  { id: 'ju-014', order_id: 'do-008', rz_job_id: 'RZ-JOB-10031', message: 'CNC machining in progress. 22 of 40 parts completed.', created_at: '2026-03-06T15:45:00Z', author: 'Northern CNC Solutions', type: 'update' },

  // do-009 Bearing Housing (QC)
  { id: 'ju-015', order_id: 'do-009', rz_job_id: 'RZ-JOB-10030', message: 'Machining complete. Parts cleaned and deburred.', created_at: '2026-03-04T14:00:00Z', author: 'Precision Metals Ltd', type: 'update' },
  { id: 'ju-016', order_id: 'do-009', rz_job_id: 'RZ-JOB-10030', message: 'QC inspection started. CMM programme loaded.', created_at: '2026-03-07T08:00:00Z', author: 'Precision Metals Ltd', type: 'update' },

  // do-010 Sprocket (DISPATCH)
  { id: 'ju-017', order_id: 'do-010', rz_job_id: 'RZ-JOB-10028', message: 'QC passed. All parts within tolerance. CoC issued.', created_at: '2026-03-07T16:00:00Z', author: 'FoundryTech UK', type: 'qc' },
  { id: 'ju-018', order_id: 'do-010', rz_job_id: 'RZ-JOB-10028', message: 'Packed and dispatched via DPD. Tracking: DPD-GB-2409183. ETA 10-Mar.', created_at: '2026-03-08T14:00:00Z', author: 'FoundryTech UK', type: 'dispatch' },

  // do-011 Compressor Impeller (DELIVERED)
  { id: 'ju-019', order_id: 'do-011', rz_job_id: 'RZ-JOB-10025', message: 'Delivered to client. Signed off by M. Bell.', created_at: '2026-03-01T10:30:00Z', author: 'RZ Admin', type: 'complete' },
];

// Helper: get orders for a specific client
export const getOrdersByClient = (clientId) =>
  DEMO_ORDERS.filter((o) => o.client_id === clientId);

// Helper: get orders assigned to a specific supplier
export const getOrdersBySupplier = (supplierId) =>
  DEMO_ORDERS.filter((o) => o.supplier_id === supplierId);

// Helper: get bids for an order
export const getBidsForOrder = (orderId) =>
  DEMO_BIDS.filter((b) => b.order_id === orderId);

// Helper: get job updates for an order
export const getUpdatesForOrder = (orderId) =>
  DEMO_JOB_UPDATES.filter((u) => u.order_id === orderId);

// Helper: get a single order by id
export const getOrderById = (orderId) =>
  DEMO_ORDERS.find((o) => o.id === orderId) || null;

// Helper: admin pipeline stats
export const getDemoStats = () => ({
  totalOrders: DEMO_ORDERS.length,
  pendingScrub: DEMO_ORDERS.filter((o) => o.order_status === 'PENDING_ADMIN_SCRUB').length,
  openBidding: DEMO_ORDERS.filter((o) => o.order_status === 'OPEN_FOR_BIDDING').length,
  inProduction: DEMO_ORDERS.filter((o) => ['MATERIAL', 'CASTING', 'MACHINING', 'QC'].includes(o.order_status)).length,
  dispatched: DEMO_ORDERS.filter((o) => o.order_status === 'DISPATCH').length,
  delivered: DEMO_ORDERS.filter((o) => o.order_status === 'DELIVERED').length,
  totalClients: DEMO_CLIENTS.length,
  totalSuppliers: DEMO_SUPPLIERS.length,
  totalUsers: DEMO_CLIENTS.length + DEMO_SUPPLIERS.length + DEMO_ADMINS.length,
  totalValue: DEMO_ORDERS.reduce((sum, o) => sum + (o.estimated_value || 0), 0),
});
