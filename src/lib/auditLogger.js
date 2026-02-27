import { supabase } from '@/lib/customSupabaseClient';

export const createAuditLog = async ({ userId, action, orderId = null, details = {}, status = 'success', ipAddress = 'client-side' }) => {
  try {
    // Determine if userId matches an admin or client for the specific column
    // The schema update requested adding admin_id. 
    // We will populate both user_id (legacy/generic) and admin_id (if relevant) or just user_id if that's what's available.
    // For now, we'll map userId to the appropriate column based on context if possible, 
    // but typically we just log the actor.
    
    const payload = {
      user_id: userId, // Keep legacy column populated for now to prevent breakage
      admin_id: userId, // Populate admin_id as requested by schema update (assuming actor is the user)
      action,
      order_id: orderId,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      status,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('audit_logs').insert(payload);

    if (error) {
        console.warn('Audit log insert failed', error);
        // Don't throw, just warn, so we don't block the main action
    }
    return true;
  } catch (error) {
    console.error('Audit Log Error:', error);
    return false;
  }
};

export const logMilestoneUpdate = async (userId, orderId, milestoneType) => {
  return createAuditLog({
    userId,
    action: 'milestone_update',
    orderId,
    details: `Completed milestone: ${milestoneType}`,
    status: 'success'
  });
};

export const logNCRReport = async (userId, orderId, issueType) => {
  return createAuditLog({
    userId,
    action: 'ncr_reported',
    orderId,
    details: `Reported NCR: ${issueType}`,
    status: 'success'
  });
};

export const logShippingLabel = async (userId, orderId, tracking) => {
  return createAuditLog({
    userId,
    action: 'shipping_label_generated',
    orderId,
    details: `Generated label: ${tracking}`,
    status: 'success'
  });
};

export const logAssetView = async (userId, orderId, assetName) => {
  return createAuditLog({
    userId,
    action: 'asset_viewed',
    orderId,
    details: `Viewed asset: ${assetName}`,
    status: 'success'
  });
};

export const logMetadataScrub = async (userId, orderId, fileName) => {
  return createAuditLog({
    userId,
    action: 'metadata_scrubbed',
    orderId,
    details: `Scrubbed metadata for file: ${fileName}`,
    status: 'success'
  });
};

export const logFileRelease = async (userId, orderId, clientCode) => {
  return createAuditLog({
    userId,
    action: 'file_released',
    orderId,
    details: `Released file to client vault: ${clientCode}`,
    status: 'success'
  });
};