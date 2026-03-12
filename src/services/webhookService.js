import { supabaseAdmin } from '@/lib/supabaseAdmin';

const now = () => new Date().toISOString();

// ── HMAC-SHA256 signing via Web Crypto API ────────────────────────────────────
// Signature format: sha256=<hex>  (compatible with GitHub / Stripe convention)
// Signed message: "<unix_timestamp>.<json_body>"

async function computeSignature(secret, timestamp, body) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  return 'sha256=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Core delivery function ────────────────────────────────────────────────────

async function attemptDelivery(delivery, webhook) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({ event: delivery.event_type, payload: delivery.event_payload, timestamp });
  const attemptCount = (delivery.attempt_count || 0) + 1;
  const maxAttempts = delivery.max_attempts || 5;

  // Build HMAC signature if a secret is configured
  let signature = null;
  if (webhook.secret) {
    signature = await computeSignature(webhook.secret, timestamp, body).catch(() => null);
  }

  // Record the attempt
  await supabaseAdmin.from('webhook_deliveries').update({
    attempt_count: attemptCount,
    last_attempted_at: now(),
    hmac_signature: signature,
    updated_at: now(),
  }).eq('id', delivery.id);

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-RZG-Event': delivery.event_type,
      'X-RZG-Delivery': delivery.id,
      'X-RZG-Timestamp': timestamp,
    };
    if (signature) headers['X-RZG-Signature'] = signature;

    const response = await fetch(webhook.endpoint_url, { method: 'POST', headers, body });
    const responseBody = await response.text().catch(() => '');

    if (response.ok) {
      await supabaseAdmin.from('webhook_deliveries').update({
        status: 'success',
        response_status: response.status,
        response_body: responseBody.slice(0, 500),
        updated_at: now(),
      }).eq('id', delivery.id);

      // Update webhook-level counters
      await supabaseAdmin.from('webhooks').update({
        delivery_success_count: (webhook.delivery_success_count || 0) + 1,
        last_delivery_at: now(),
        updated_at: now(),
      }).eq('id', webhook.id);

      return { success: true, status: response.status };
    }

    // Non-2xx response
    const isDeadLetter = attemptCount >= maxAttempts;
    const backoffMs = Math.pow(2, attemptCount) * 60 * 1000; // 2m, 4m, 8m, 16m, 32m
    await supabaseAdmin.from('webhook_deliveries').update({
      status: isDeadLetter ? 'dead_lettered' : 'failed',
      response_status: response.status,
      response_body: responseBody.slice(0, 500),
      next_retry_at: isDeadLetter ? null : new Date(Date.now() + backoffMs).toISOString(),
      dead_lettered_at: isDeadLetter ? now() : null,
      updated_at: now(),
    }).eq('id', delivery.id);

    await supabaseAdmin.from('webhooks').update({
      delivery_failure_count: (webhook.delivery_failure_count || 0) + 1,
      last_delivery_at: now(),
      updated_at: now(),
    }).eq('id', webhook.id);

    return { success: false, status: response.status };
  } catch (err) {
    const isDeadLetter = attemptCount >= maxAttempts;
    const backoffMs = Math.pow(2, attemptCount) * 60 * 1000;
    await supabaseAdmin.from('webhook_deliveries').update({
      status: isDeadLetter ? 'dead_lettered' : 'failed',
      error_message: err.message,
      next_retry_at: isDeadLetter ? null : new Date(Date.now() + backoffMs).toISOString(),
      dead_lettered_at: isDeadLetter ? now() : null,
      updated_at: now(),
    }).eq('id', delivery.id);

    await supabaseAdmin.from('webhooks').update({
      delivery_failure_count: (webhook.delivery_failure_count || 0) + 1,
      updated_at: now(),
    }).eq('id', webhook.id);

    return { success: false, error: err.message };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Dispatch an event to all active webhooks subscribed to eventType.
 * Delivery is fire-and-forget — callers should not await failure.
 */
export const dispatchWebhookEvent = async (eventType, payload) => {
  const { data: hooks } = await supabaseAdmin
    .from('webhooks')
    .select('*')
    .eq('event_type', eventType)
    .eq('active', true);

  if (!hooks?.length) return;

  for (const hook of hooks) {
    const { data: delivery } = await supabaseAdmin
      .from('webhook_deliveries')
      .insert([{
        webhook_id: hook.id,
        event_type: eventType,
        event_payload: payload,
        status: 'pending',
        attempt_count: 0,
        max_attempts: 5,
      }])
      .select()
      .single();

    if (delivery) {
      attemptDelivery(delivery, hook).catch(() => {});
    }
  }
};

/**
 * Manually retry a specific failed or dead-lettered delivery.
 */
export const retryDelivery = async (deliveryId) => {
  const { data: delivery, error } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('*, webhook:webhook_id(*)')
    .eq('id', deliveryId)
    .maybeSingle();
  if (error) throw error;
  if (!delivery) throw new Error('Delivery not found');
  if (delivery.status === 'success') throw new Error('Delivery already succeeded');
  if (!delivery.webhook) throw new Error('Parent webhook not found');

  // Reset status so attempt counter logic works correctly
  await supabaseAdmin.from('webhook_deliveries').update({
    status: 'pending',
    next_retry_at: null,
    dead_lettered_at: null,
    updated_at: now(),
  }).eq('id', deliveryId);

  return attemptDelivery({ ...delivery, status: 'pending' }, delivery.webhook);
};

/**
 * Fetch recent deliveries for a specific webhook (for the settings UI).
 */
export const fetchDeliveriesForWebhook = async (webhookId, limit = 8) =>
  supabaseAdmin
    .from('webhook_deliveries')
    .select('id, status, attempt_count, response_status, error_message, last_attempted_at, created_at')
    .eq('webhook_id', webhookId)
    .order('created_at', { ascending: false })
    .limit(limit);

/**
 * Fetch all pending retries (next_retry_at <= now).
 * Can be called on page load to fire overdue retries.
 */
export const fetchAndFirePendingRetries = async () => {
  const { data: overdue } = await supabaseAdmin
    .from('webhook_deliveries')
    .select('*, webhook:webhook_id(*)')
    .eq('status', 'failed')
    .lte('next_retry_at', now())
    .limit(20);

  if (!overdue?.length) return 0;

  let fired = 0;
  for (const delivery of overdue) {
    if (delivery.webhook?.active) {
      attemptDelivery(delivery, delivery.webhook).catch(() => {});
      fired++;
    }
  }
  return fired;
};
