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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseUser = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: userError } = await supabaseUser.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(url, serviceKey);
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', caller.id).single();
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { user_id } = await req.json();
    if (!user_id || typeof user_id !== 'string') throw new Error('user_id is required');

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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
