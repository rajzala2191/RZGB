-- ============================================================
-- Seed dummy users + orders + job update notes for demo env.
-- Visible only to demo admin (is_demo = TRUE via RLS).
-- Run in Supabase Dashboard → SQL Editor (postgres role).
-- ============================================================

-- Step 1: Create auth users + profiles
DO $$
DECLARE
  v_id  UUID;
  v_row TEXT[];
  v_users TEXT[][] := ARRAY[
    ARRAY['j.hartley@hartleyeng.co.uk',           'James Hartley',                 'client',   'Hartley Engineering Ltd',        'active'],
    ARRAY['s.blackwood@blackwoodprecision.co.uk',  'Sarah Blackwood',               'client',   'Blackwood Precision Components', 'active'],
    ARRAY['m.crest@crestfieldmfg.co.uk',           'Michael Crest',                 'client',   'Crestfield Manufacturing',        'active'],
    ARRAY['r.albion@albioncastings.co.uk',          'Rachel Albion',                 'client',   'Albion Castings Ltd',            'pending'],
    ARRAY['t.norwood@norwoodhydraulics.co.uk',      'Tom Norwood',                   'client',   'Norwood Hydraulics',              'active'],
    ARRAY['ops@sterlingcnc.co.uk',                 'Sterling CNC Solutions',         'supplier', 'Sterling CNC Solutions',          'active'],
    ARRAY['bids@midlandsforge.co.uk',               'Midlands Forge & Fabrication',  'supplier', 'Midlands Forge & Fabrication',    'active'],
    ARRAY['info@apextooling.co.uk',                 'Apex Tooling & Engineering',    'supplier', 'Apex Tooling & Engineering',      'pending']
  ];
BEGIN
  FOREACH v_row SLICE 1 IN ARRAY v_users LOOP
    SELECT id INTO v_id FROM auth.users WHERE email = v_row[1];
    IF v_id IS NULL THEN
      v_id := gen_random_uuid();
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
      VALUES (v_id, v_row[1], crypt('DummyPass123!', gen_salt('bf')), NOW(), NOW(), NOW(), jsonb_build_object('full_name', v_row[2]));
    END IF;
    INSERT INTO profiles (id, email, role, company_name, status, is_demo)
    VALUES (v_id, v_row[1], v_row[3]::user_role, v_row[4], v_row[5], TRUE)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, company_name = EXCLUDED.company_name, status = EXCLUDED.status, is_demo = TRUE;
    RAISE NOTICE '  ✓ user: %', v_row[4];
  END LOOP;
  RAISE NOTICE '✓ Step 1 complete — 8 users ready';
END $$;


-- Step 2: Seed orders + job update notes
DO $$
DECLARE
  hartley_id   UUID; blackwood_id UUID; crest_id    UUID;
  albion_id    UUID; norwood_id   UUID;
  sterling_id  UUID; midlands_id  UUID; apex_id     UUID;
  o_id UUID;
BEGIN
  -- Resolve user IDs
  SELECT id INTO hartley_id   FROM auth.users WHERE email = 'j.hartley@hartleyeng.co.uk';
  SELECT id INTO blackwood_id FROM auth.users WHERE email = 's.blackwood@blackwoodprecision.co.uk';
  SELECT id INTO crest_id     FROM auth.users WHERE email = 'm.crest@crestfieldmfg.co.uk';
  SELECT id INTO albion_id    FROM auth.users WHERE email = 'r.albion@albioncastings.co.uk';
  SELECT id INTO norwood_id   FROM auth.users WHERE email = 't.norwood@norwoodhydraulics.co.uk';
  SELECT id INTO sterling_id  FROM auth.users WHERE email = 'ops@sterlingcnc.co.uk';
  SELECT id INTO midlands_id  FROM auth.users WHERE email = 'bids@midlandsforge.co.uk';
  SELECT id INTO apex_id      FROM auth.users WHERE email = 'info@apextooling.co.uk';

  -- Clear any existing demo orders for these clients to allow re-runs
  DELETE FROM orders WHERE client_id IN (hartley_id, blackwood_id, crest_id, albion_id, norwood_id)
    AND rz_job_id LIKE 'RZ-JOB-D%';

  -- ── 1. Hartley — PENDING_ADMIN_SCRUB ───────────────────────
  INSERT INTO orders (client_id, user_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (hartley_id, hartley_id, 'Spindle Housing', 'EN24 Alloy Steel', 10, '±0.01mm', 'Ra 0.8',
    'Precision spindle housings for CNC lathe headstocks. Critical bore tolerances on all fits.',
    'Full dimensional report on all pieces. Material cert to BS EN 10083-3 required.',
    'PENDING_ADMIN_SCRUB', 7400, 'Coventry, CV1 2WT', '["MATERIAL","MACHINING","QC"]'::jsonb,
    'RZ-JOB-D001', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D001', 'PENDING_ADMIN_SCRUB', 'Order received from Hartley Engineering. Drawing package: 3× DXF + 1× PDF spec sheet. Flagged for priority scrub.');

  -- ── 2. Blackwood — SANITIZED ───────────────────────────────
  INSERT INTO orders (client_id, user_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (blackwood_id, blackwood_id, 'Cam Follower Bracket', 'Stainless Steel 304', 40, '±0.02mm', 'Ra 1.6',
    'Cam follower mounting brackets for automated assembly line conveyor. Weld zones ground flush.',
    'Weld procedure qualification required to BS EN ISO 15614-1. Dye penetrant on all welds.',
    'SANITIZED', 3800, 'Derby, DE1 3FG', '["MATERIAL","MACHINING"]'::jsonb,
    'RZ-JOB-D002', NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 hours')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D002', 'PENDING_ADMIN_SCRUB', 'Received from Blackwood Precision Components. 2 drawing files. Minor title block issues to resolve.'),
    ('RZ-JOB-D002', 'SANITIZED',           'Sanitisation complete. Client logo and company name removed from title blocks. Clean DXF + PDF exported and ready.');

  -- ── 3. Crest — OPEN_FOR_BIDDING ────────────────────────────
  INSERT INTO orders (client_id, user_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (crest_id, crest_id, 'Hydraulic Valve Spool', 'Stainless Steel 316L', 20, '±0.005mm', 'Ra 0.4',
    'High-precision valve spools for hydraulic directional control blocks. Chrome plating required after final grind.',
    '100% pressure test at 350 bar. Chrome plate to 25 micron min. Roundness report on each piece.',
    'OPEN_FOR_BIDDING', 11200, 'Nottingham, NG1 5BT', '["MATERIAL","MACHINING","QC"]'::jsonb,
    'RZ-JOB-D003', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D003', 'PENDING_ADMIN_SCRUB', 'High-spec valve spool from Crestfield. 5 drawing sheets — tight tolerances throughout. Needs precision CNC supplier.'),
    ('RZ-JOB-D003', 'SANITIZED',           'Sanitisation complete. All client references stripped. Technical accuracy verified by admin.'),
    ('RZ-JOB-D003', 'OPEN_FOR_BIDDING',    'Released to 8 approved precision CNC suppliers. Bidding window closes Friday 17:00. 2 bids received so far.');

  -- ── 4. Albion — BID_RECEIVED ───────────────────────────────
  INSERT INTO orders (client_id, user_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (albion_id, albion_id, 'Bronze Bushing Set', 'Bronze SAE 660', 200, '±0.025mm', 'As Machined',
    'Turned bronze bushings for slow-speed pivot joints on agricultural harvesting equipment.',
    'Oil groove as per drawing rev C. 100% dimensional check on OD/ID. Bagged in sets of 10.',
    'BID_RECEIVED', 3200, 'Wolverhampton, WV1 1PL', '["MATERIAL","MACHINING"]'::jsonb,
    'RZ-JOB-D009', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D009', 'OPEN_FOR_BIDDING', 'Released to 4 bronze turning specialists. Good standard job — expecting competitive bids.'),
    ('RZ-JOB-D009', 'BID_RECEIVED',     '3 bids received: £2,800 / £3,200 / £3,600. Middle bid offers fastest lead time (10 days). Awaiting client review call.');

  -- ── 5. Norwood — AWARDED (Sterling) ────────────────────────
  INSERT INTO orders (client_id, user_id, supplier_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (norwood_id, norwood_id, sterling_id, 'Cylinder End Cap', 'Aluminium 6082-T6', 80, '±0.02mm', 'Hard Anodised',
    'CNC turned end caps for double-acting hydraulic cylinder assemblies. Hard anodised for wear resistance.',
    'Hard anodise to 50 micron. First article dimensional report. No burrs on thread form.',
    'AWARDED', 4900, 'Leicester, LE1 7RH', '["MATERIAL","MACHINING","QC"]'::jsonb,
    'RZ-JOB-D004', NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D004', 'OPEN_FOR_BIDDING', 'Sent to 6 approved CNC aluminium suppliers. Norwood repeat part — good reference drawings available.'),
    ('RZ-JOB-D004', 'BID_RECEIVED',     '3 bids received within 48 hours. Sterling CNC lowest at £4,900 with 12-day lead time.'),
    ('RZ-JOB-D004', 'AWARDED',          'Awarded to Sterling CNC Solutions. Client approved via email. PO raised. Supplier notified.');

  -- ── 6. Hartley — MACHINING (Midlands) ──────────────────────
  INSERT INTO orders (client_id, user_id, supplier_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (hartley_id, hartley_id, midlands_id, 'Gearbox Output Flange', 'EN36 Alloy Steel', 15, '±0.015mm', 'Ra 1.6',
    'Case-hardened output flanges for industrial gearboxes. Spline form milling to DIN 5480.',
    'Case hardness 58–62 HRC on spline teeth. Core hardness 35–40 HRC. Spline form report required.',
    'MACHINING', 8600, 'Coventry, CV1 2WT', '["MATERIAL","CASTING","MACHINING","QC"]'::jsonb,
    'RZ-JOB-D005', NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D005', 'AWARDED',   'Awarded to Midlands Forge & Fabrication. Complex job — spline milling + case hardening capability confirmed.'),
    ('RZ-JOB-D005', 'MATERIAL',  'EN36 alloy steel bar stock confirmed in stock at supplier. Heat treatment slot booked for week 3. Machine start Monday.'),
    ('RZ-JOB-D005', 'MACHINING', 'Turning complete on 8 of 15 pieces. Spline milling starts Thursday on the Mazak. On track for delivery date. No issues.');

  -- ── 7. Blackwood — QC (Sterling) ───────────────────────────
  INSERT INTO orders (client_id, user_id, supplier_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (blackwood_id, blackwood_id, sterling_id, 'Bearing Retainer Plate', 'Mild Steel S275', 60, '±0.05mm', 'Zinc Plated',
    'Laser cut and press-formed retainer plates for roller bearing assemblies.',
    'Zinc plate to 8 micron minimum per BS EN ISO 4042. Flatness within 0.1mm over full face.',
    'QC', 2600, 'Derby, DE1 3FG', '["MATERIAL","MACHINING","QC"]'::jsonb,
    'RZ-JOB-D006', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D006', 'MACHINING', 'All 60 plates cut, formed, and zinc plated by Sterling. Moving batch to QC inspection cell.'),
    ('RZ-JOB-D006', 'QC',        'CMM inspection in progress. 52 of 60 passed. 8 flagged — borderline flatness on 3, zinc thickness low on 5. Re-work underway.');

  -- ── 8. Norwood — DISPATCH (Apex) ───────────────────────────
  INSERT INTO orders (client_id, user_id, supplier_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (norwood_id, norwood_id, apex_id, 'Piston Rod Assembly', 'Chrome Steel 52100', 25, '±0.008mm', 'Hard Chrome 25µm',
    'Ground and hard-chromed piston rods for hydraulic actuator assemblies. Critical surface finish.',
    'Roundness within 0.003mm TIR. Chrome adhesion test on 10% sample per ASTM B571.',
    'DISPATCH', 9100, 'Leicester, LE1 7RH', '["MATERIAL","MACHINING","QC","DISPATCH"]'::jsonb,
    'RZ-JOB-D007', NOW() - INTERVAL '40 days', NOW() - INTERVAL '12 hours')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D007', 'QC',       'All 25 piston rods passed CMM and chrome adhesion testing. Inspection report signed off. Zero rejections.'),
    ('RZ-JOB-D007', 'DISPATCH', 'Packed in individual foam-lined tubes — 5 per outer box. DPD courier booked. Tracking number sent to RZ. Expected delivery tomorrow before 12:00.');

  -- ── 9. Crest — DELIVERED (Midlands) ────────────────────────
  INSERT INTO orders (client_id, user_id, supplier_id, part_name, material, quantity, tolerance, surface_finish, description, special_requirements, order_status, buy_price, delivery_location, selected_processes, rz_job_id, created_at, updated_at)
  VALUES (crest_id, crest_id, midlands_id, 'Motor Mounting Frame', 'Mild Steel S355', 5, '±0.5mm', 'Painted RAL7016',
    'Fabricated steel motor mounting frames for 75kW drive units on industrial conveyor systems.',
    'Weld to BS EN ISO 5817 Class B. Paint adhesion cross-cut test to ISO 2409 required.',
    'DELIVERED', 5300, 'Nottingham, NG1 5BT', '["MATERIAL","CASTING","MACHINING","QC","DISPATCH"]'::jsonb,
    'RZ-JOB-D008', NOW() - INTERVAL '55 days', NOW() - INTERVAL '5 days')
  RETURNING id INTO o_id;
  INSERT INTO job_updates (rz_job_id, stage, notes) VALUES
    ('RZ-JOB-D008', 'DISPATCH',  'All 5 frames loaded on Midlands flatbed truck. Delivery ETA Friday AM. Client informed.'),
    ('RZ-JOB-D008', 'DELIVERED', 'Delivery confirmed by Crestfield site manager. Signed POD received and filed. Invoice raised. Job closed.');

  RAISE NOTICE '✓ Step 2 complete — 9 orders + job notes seeded';
END $$;
