import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const token = authHeader.replace('Bearer ', '');
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAuth = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !caller) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(url, serviceKey);
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, admin_scope')
      .eq('id', caller.id)
      .single();

    const isSuperAdmin =
      profile?.role === 'super_admin' ||
      (profile?.role === 'admin' && profile?.admin_scope === 'platform');
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Super admin only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: 'request_id is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: row, error: fetchErr } = await supabaseAdmin
      .from('demo_requests')
      .select('id, email, status')
      .eq('id', request_id)
      .single();

    if (fetchErr || !row) {
      return new Response(JSON.stringify({ error: 'Demo request not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }
    if (row.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Request already processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const demoToken = crypto.randomUUID();
    const { error: updateErr } = await supabaseAdmin
      .from('demo_requests')
      .update({
        status: 'approved',
        token: demoToken,
        approved_at: new Date().toISOString(),
        approved_by: caller.id,
      })
      .eq('id', request_id);

    if (updateErr) throw updateErr;

    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('REFERER') || 'https://portal.zaproc.co.uk';
    const demoLink = `${siteUrl.replace(/\/$/, '')}/demo?token=${demoToken}`;

    let emailHtml: string;
    try {
      const templatePath = new URL('./demo-approved.html', import.meta.url);
      emailHtml = await Deno.readTextFile(templatePath);
      emailHtml = emailHtml.replace(/\{\{DEMO_LINK\}\}/g, demoLink);
    } catch {
      emailHtml = `
        <p>Your request for demo access has been approved.</p>
        <p>Click the link below to open the demo. The demo resets to default on every refresh.</p>
        <p><a href="${demoLink}" style="color:#FF6B35;font-weight:bold;">Open demo</a></p>
        <p>Or copy this link: ${demoLink}</p>
        <p>— RZ Global Solutions</p>
      `;
    }

    let emailSent = false;
    let emailError: string | null = null;
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('RESEND_FROM') || 'Zaproc <noreply@zaproc.co.uk>',
          to: [row.email],
          subject: 'Your demo access is ready',
          html: emailHtml,
        }),
      });
      if (emailRes.ok) {
        emailSent = true;
      } else {
        const errBody = await emailRes.text();
        console.error('Resend error:', errBody);
        emailError = errBody || `HTTP ${emailRes.status}`;
      }
    } else {
      emailError = 'RESEND_API_KEY not set. Add it in Supabase Dashboard → Edge Functions → approve-demo-request → Secrets.';
    }

    return new Response(
      JSON.stringify({ success: true, email_sent: emailSent, email_error: emailError ?? undefined }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
