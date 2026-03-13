import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Allow CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { email, company_name, role } = await req.json();
    if (!email || !role) {
      throw new Error('Email and role are required');
    }

    // Check if user already exists in auth.users (source of truth)
    const { data: { users: existingAuthUsers } } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingAuthUsers?.some(u => u.email === email);
    if (alreadyExists) {
      throw new Error('A user with this email already exists');
    }

    // Invite user (creates user in auth.users and sends invite email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: 'https://portal.zaproc.co.uk/create-password'
    });
    if (authError) throw authError;
    const userId = authData.user.id;
    // Update profile
    await supabaseAdmin.from('profiles').update({
      role: role,
      company_name: company_name,
      is_verified: true
    }).eq('id', userId);
    return new Response(JSON.stringify({
      success: true,
      user_id: userId
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
}) /* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/invite-user' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/ ;
