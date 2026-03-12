import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const now = () => new Date().toISOString();

// --- RFQ Lots ---

export const createRFQLots = async (orderId, lots) => {
  const rows = lots.map((lot, i) => ({
    order_id: orderId,
    lot_number: i + 1,
    description: lot.description,
    quantity: lot.quantity || null,
    material: lot.material || null,
    notes: lot.notes || null,
  }));
  return supabaseAdmin.from('rfq_lots').insert(rows).select();
};

export const fetchLotsForOrder = async (orderId) =>
  supabase
    .from('rfq_lots')
    .select('*')
    .eq('order_id', orderId)
    .order('lot_number', { ascending: true });

export const deleteLots = async (orderId) =>
  supabaseAdmin.from('rfq_lots').delete().eq('order_id', orderId);

// --- RFQ Templates ---

export const saveRFQTemplate = async ({ name, description, templateData, createdBy }) =>
  supabase
    .from('rfq_templates')
    .insert([{
      name,
      description,
      template_data: templateData,
      created_by: createdBy,
    }])
    .select()
    .single();

export const fetchTemplates = async (userId) =>
  supabase
    .from('rfq_templates')
    .select('*')
    .or(`created_by.eq.${userId},created_by.is.null`)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

export const fetchTemplateById = async (templateId) =>
  supabase
    .from('rfq_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();

export const deleteTemplate = async (templateId) =>
  supabase.from('rfq_templates').delete().eq('id', templateId);

// --- RFQ Q&A ---

export const askQuestion = async ({ orderId, askedBy, question }) =>
  supabase
    .from('rfq_questions')
    .insert([{ order_id: orderId, asked_by: askedBy, question }])
    .select()
    .single();

export const answerQuestion = async (questionId, answer, answeredBy) =>
  supabaseAdmin
    .from('rfq_questions')
    .update({ answer, answered_by: answeredBy, answered_at: now() })
    .eq('id', questionId);

export const fetchQuestionsForOrder = async (orderId) =>
  supabase
    .from('rfq_questions')
    .select('*, asker:asked_by(company_name, email, role), answerer:answered_by(company_name, email)')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

// --- Auto-invite suppliers based on capabilities ---

export const fetchMatchingSuppliers = async (material, processes) => {
  let query = supabaseAdmin
    .from('supplier_capabilities')
    .select('*, profile:supplier_id(id, company_name, email)');

  if (material) {
    query = query.contains('materials', [material]);
  }
  if (processes && processes.length > 0) {
    query = query.overlaps('processes', processes);
  }

  return query;
};
