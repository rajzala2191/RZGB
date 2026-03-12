import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const fetchDiscoverableSuppliers = async ({ search, country, certification, material } = {}) => {
  let query = supabaseAdmin
    .from('profiles')
    .select('*, capabilities:supplier_capabilities(*)')
    .eq('role', 'supplier')
    .eq('is_discoverable', true);

  if (country) query = query.eq('country', country);
  if (certification) query = query.contains('certifications', [certification]);

  const { data, error } = await query.order('featured', { ascending: false });
  if (error) return { data: null, error };

  let filtered = data || [];

  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(s =>
      (s.company_name || '').toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term) ||
      (s.country || '').toLowerCase().includes(term) ||
      (s.certifications || []).some(c => c.toLowerCase().includes(term))
    );
  }

  if (material) {
    filtered = filtered.filter(s =>
      s.capabilities?.some(cap =>
        (cap.materials || []).some(m => m.toLowerCase().includes(material.toLowerCase()))
      )
    );
  }

  return { data: filtered, error: null };
};

export const fetchSupplierCountries = async () => {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('country')
    .eq('role', 'supplier')
    .eq('is_discoverable', true)
    .not('country', 'is', null);

  if (!data) return [];
  const unique = [...new Set(data.map(d => d.country).filter(Boolean))];
  return unique.sort();
};

export const fetchCategories = async () =>
  supabaseAdmin
    .from('procurement_categories')
    .select('*')
    .order('name', { ascending: true });

export const toggleDiscoverable = async (supplierId, isDiscoverable) =>
  supabase
    .from('profiles')
    .update({ is_discoverable: isDiscoverable })
    .eq('id', supplierId);

export const updateSupplierProfile = async (supplierId, updates) =>
  supabase
    .from('profiles')
    .update(updates)
    .eq('id', supplierId);

export const fetchRecommendedSuppliers = async (material, processes) => {
  let query = supabaseAdmin
    .from('supplier_capabilities')
    .select('*, profile:supplier_id(id, company_name, email, country, certifications, is_discoverable, description)');

  if (material) query = query.contains('materials', [material]);
  if (processes?.length) query = query.overlaps('processes', processes);

  const { data } = await query;
  return (data || [])
    .filter(d => d.profile)
    .map(d => ({ ...d.profile, capabilities: d }))
    .slice(0, 10);
};
