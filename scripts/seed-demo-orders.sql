-- ============================================================
-- Seed demo orders for the demo client account.
-- Run this AFTER 20260309_demo_isolation.sql.
--
-- Replace DEMO_CLIENT_UUID with the actual auth.uid() of
-- demo.client@rzglobalsolutions.co.uk (find it in
-- Supabase dashboard → Authentication → Users).
-- ============================================================

DO $$
DECLARE
  demo_client_id UUID;
BEGIN
  -- Resolve demo client UUID from profiles
  SELECT id INTO demo_client_id
  FROM profiles
  WHERE email = 'demo.client@rzglobalsolutions.co.uk'
  LIMIT 1;

  IF demo_client_id IS NULL THEN
    RAISE EXCEPTION 'Demo client account not found. Ensure the demo user exists in auth.users and profiles.';
  END IF;

  -- Insert demo orders spanning all major pipeline stages
  INSERT INTO orders (
    client_id, part_name, material, quantity, tolerance,
    surface_finish, delivery_address, description,
    special_requirements, order_status, estimated_value,
    rz_job_id, selected_processes, created_at, updated_at
  ) VALUES
  (
    demo_client_id, 'Valve Body Casting', 'Bronze LG2', 60,
    '±0.05mm', 'As Machined', 'Sheffield, UK',
    'Pressure-rated valve bodies for industrial pipeline applications.',
    'Material cert required. All dimensions to drawing rev B.',
    'CASTING', 9100,
    'RZ-JOB-10033',
    '["MATERIAL","CASTING","MACHINING"]'::jsonb,
    NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'
  ),
  (
    demo_client_id, 'Hydraulic Cylinder End Cap', 'Aluminium 6082-T6', 200,
    '±0.02mm', 'Ra 1.6', 'Birmingham, UK',
    'CNC turned end caps for hydraulic actuator assemblies.',
    'Pressure test to 250 bar before dispatch.',
    'MACHINING', 4200,
    'RZ-JOB-10034',
    '["MATERIAL","MACHINING"]'::jsonb,
    NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'
  ),
  (
    demo_client_id, 'Drive Shaft Flange', 'Stainless Steel 316L', 25,
    '±0.01mm', 'Ra 0.8', 'Leeds, UK',
    'Precision flanges for high-torque drive shaft assemblies.',
    'Dye penetrant inspection on all weld zones.',
    'QC', 7800,
    'RZ-JOB-10035',
    '["MATERIAL","MACHINING","QC"]'::jsonb,
    NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 hours'
  ),
  (
    demo_client_id, 'Impeller Housing', 'Cast Iron GG25', 10,
    '±0.1mm', 'As Cast', 'Manchester, UK',
    'Pump impeller housings for water treatment plant.',
    'Ultrasonic testing on critical wall sections.',
    'DISPATCH', 15400,
    'RZ-JOB-10036',
    '["CASTING","MACHINING","QC","DISPATCH"]'::jsonb,
    NOW() - INTERVAL '30 days', NOW() - INTERVAL '6 hours'
  ),
  (
    demo_client_id, 'Gearbox Cover Plate', 'Aluminium A380', 100,
    '±0.05mm', 'Anodised', 'Bristol, UK',
    'Die-cast cover plates with anodised finish for industrial gearbox.',
    'Dimensional report on first 5 pieces required.',
    'DELIVERED', 3600,
    'RZ-JOB-10031',
    '["CASTING","MACHINING"]'::jsonb,
    NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days'
  ),
  (
    demo_client_id, 'Bearing Housing Block', 'Steel EN8', 50,
    '±0.03mm', 'Ra 1.6', 'Coventry, UK',
    'Machined bearing housings for conveyor drive units.',
    'Bore concentricity within 0.02mm TIR.',
    'PENDING_ADMIN_SCRUB', 5500,
    'RZ-JOB-10037',
    '["MATERIAL","MACHINING"]'::jsonb,
    NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'
  ),
  (
    demo_client_id, 'Pump Bracket Weldment', 'Mild Steel S275', 15,
    '±0.5mm', 'Painted RAL9005', 'Newcastle, UK',
    'Fabricated mounting brackets for centrifugal pump installations.',
    'Full weld symbol compliance to BS EN ISO 2553.',
    'OPEN_FOR_BIDDING', 2900,
    'RZ-JOB-10038',
    '["MATERIAL","MACHINING"]'::jsonb,
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
  ),
  (
    demo_client_id, 'Motor Adapter Plate', 'Aluminium 7075-T6', 30,
    '±0.02mm', 'Hard Anodised', 'Glasgow, UK',
    'Precision adapter plates coupling IEC motor frames to gearbox input.',
    'Parallelism of mounting faces within 0.01mm.',
    'AWARDED', 6200,
    'RZ-JOB-10039',
    '["MATERIAL","MACHINING"]'::jsonb,
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days'
  )
  ON CONFLICT (rz_job_id) DO NOTHING;

  RAISE NOTICE 'Demo orders seeded for client %', demo_client_id;
END $$;
