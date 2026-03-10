-- Allow deleting profiles when documents reference them: either cascade delete
-- document rows or set the referencing column to null. We use CASCADE so that
-- deleting a profile (from app or Dashboard) automatically removes document rows
-- that reference that profile (uploaded_by, client_id, supplier_id).
-- Constraint names are discovered at run time so this works regardless of naming.

DO $$
DECLARE
  r RECORD;
  col text;
  conname text;
BEGIN
  FOR r IN
    SELECT
      tc.constraint_name AS conname,
      kcu.column_name     AS col
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema   = kcu.table_schema
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema   = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
      AND ccu.table_schema         = rc.unique_constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name   = 'documents'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name  = 'profiles'
      AND ccu.column_name = 'id'
  LOOP
    conname := r.conname;
    col     := r.col;
    EXECUTE format(
      'ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS %I',
      conname
    );
    EXECUTE format(
      'ALTER TABLE public.documents ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.profiles(id) ON DELETE CASCADE',
      conname,
      col
    );
    RAISE NOTICE 'Updated FK documents.% -> profiles(id) to ON DELETE CASCADE', col;
  END LOOP;
END $$;
