import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id } = await req.json();
    if (!user_id) throw new Error('user_id is required');

    // 1) Remove rows in documents that reference this profile (FK would block profile delete)
    const { data: docs } = await supabaseAdmin.from('documents').select('id, file_path').or(`uploaded_by.eq.${user_id},client_id.eq.${user_id},supplier_id.eq.${user_id}`);
    if (docs?.length) {
      const paths = docs.map((d) => d.file_path).filter(Boolean);
      if (paths.length) await supabaseAdmin.storage.from('documents').remove(paths);
      await supabaseAdmin.from('documents').delete().or(`uploaded_by.eq.${user_id},client_id.eq.${user_id},supplier_id.eq.${user_id}`);
    }

    // 2) Delete profile (must be before auth so no other FKs from profiles are hit)
    await supabaseAdmin.from('profiles').delete().eq('id', user_id);

    // 3) Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (authError) throw authError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
