import { supabase } from '@/lib/customSupabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const SLACK_SETTING_KEY = 'slack_webhook_url';
const SLACK_CHANNEL_KEY = 'slack_channel';

async function getSlackConfig() {
  const { data } = await supabaseAdmin
    .from('system_settings')
    .select('key, value')
    .in('key', [SLACK_SETTING_KEY, SLACK_CHANNEL_KEY]);

  const config = {};
  data?.forEach(row => { config[row.key] = row.value; });
  return config;
}

async function sendSlackMessage(text, blocks) {
  const config = await getSlackConfig();
  const webhookUrl = config[SLACK_SETTING_KEY];
  if (!webhookUrl) return { sent: false, reason: 'No webhook URL configured' };

  try {
    const payload = { text };
    if (blocks) payload.blocks = blocks;
    if (config[SLACK_CHANNEL_KEY]) payload.channel = config[SLACK_CHANNEL_KEY];

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return { sent: response.ok };
  } catch (err) {
    console.error('Slack webhook error:', err);
    return { sent: false, reason: err.message };
  }
}

export const notifyOrderStatusChange = async ({ orderId, rzJobId, partName, oldStatus, newStatus, actorName }) => {
  const statusEmoji = {
    OPEN_FOR_BIDDING: ':hammer_and_wrench:',
    BID_RECEIVED: ':incoming_envelope:',
    AWARDED: ':trophy:',
    MATERIAL: ':package:',
    CASTING: ':fire:',
    MACHINING: ':gear:',
    QC: ':mag:',
    DISPATCH: ':truck:',
    DELIVERED: ':white_check_mark:',
  };

  const emoji = statusEmoji[newStatus] || ':arrows_counterclockwise:';
  const text = `${emoji} *Order Status Update*\n*${rzJobId || orderId}* — ${partName || 'Order'}\n${oldStatus} → *${newStatus}*${actorName ? `\nBy: ${actorName}` : ''}`;

  return sendSlackMessage(text);
};

export const notifyNewBid = async ({ rzJobId, partName, supplierName, amount, currency, leadTimeDays }) => {
  const text = `:moneybag: *New Bid Received*\n*${rzJobId}* — ${partName}\nSupplier: ${supplierName}\nAmount: ${currency} ${Number(amount).toLocaleString()}\nLead Time: ${leadTimeDays} days`;
  return sendSlackMessage(text);
};

export const notifyBidAwarded = async ({ rzJobId, partName, supplierName, amount, currency }) => {
  const text = `:trophy: *Bid Awarded*\n*${rzJobId}* — ${partName}\nAwarded to: *${supplierName}*\nValue: ${currency} ${Number(amount).toLocaleString()}`;
  return sendSlackMessage(text);
};

export const notifyPOIssued = async ({ poNumber, rzJobId, supplierName, totalAmount, currency }) => {
  const text = `:page_facing_up: *Purchase Order Issued*\n*${poNumber}*\nJob: ${rzJobId}\nSupplier: ${supplierName}\nTotal: ${currency} ${Number(totalAmount).toLocaleString()}`;
  return sendSlackMessage(text);
};

export const notifyPOAcknowledged = async ({ poNumber, supplierName }) => {
  const text = `:white_check_mark: *PO Acknowledged*\n*${poNumber}* acknowledged by ${supplierName}`;
  return sendSlackMessage(text);
};

export const notifyNewTender = async ({ rzJobId, partName, material, quantity, deadline }) => {
  const text = `:loudspeaker: *New Tender Opened*\n*${rzJobId}* — ${partName}\nMaterial: ${material || 'N/A'}\nQuantity: ${quantity || 'N/A'}${deadline ? `\nDeadline: ${new Date(deadline).toLocaleDateString()}` : ''}`;
  return sendSlackMessage(text);
};

export const saveSlackWebhookUrl = async (url) =>
  supabaseAdmin.from('system_settings').upsert({ key: SLACK_SETTING_KEY, value: url }, { onConflict: 'key' });

export const saveSlackChannel = async (channel) =>
  supabaseAdmin.from('system_settings').upsert({ key: SLACK_CHANNEL_KEY, value: channel }, { onConflict: 'key' });
