/**
 * Scrub a drawing file using the Supabase scrub-drawing Edge Function.
 * Uses Claude vision AI to identify sensitive client information, then
 * returns a watermarked copy of the file along with a redaction report.
 *
 * @param {File|Blob} file - The drawing file (PDF, image, etc.)
 * @param {Object} clientInfo - Client details to look for
 * @param {string} clientInfo.company_name
 * @param {string} clientInfo.contact_person
 * @param {string} clientInfo.email
 * @param {string} clientInfo.phone
 * @param {string} clientInfo.address
 * @returns {Promise<{ blob: Blob, report: string }>}
 */
export async function scrubDrawingWithAI(file, clientInfo = {}) {
  const formData = new FormData();
  formData.append('file', file);

  if (clientInfo.company_name)   formData.append('company_name',   clientInfo.company_name);
  if (clientInfo.contact_person) formData.append('contact_person', clientInfo.contact_person);
  if (clientInfo.email)          formData.append('email',          clientInfo.email);
  if (clientInfo.phone)          formData.append('phone',          clientInfo.phone);
  if (clientInfo.address)        formData.append('address',        clientInfo.address);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/scrub-drawing`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `AI scrubbing failed (${response.status})`;
    try {
      const json = await response.json();
      if (json.error) message = json.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  const blob   = await response.blob();
  const report = decodeURIComponent(response.headers.get('X-Redaction-Report') || '');

  return { blob, report };
}
