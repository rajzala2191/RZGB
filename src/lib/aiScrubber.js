/**
 * Scrub a drawing file using the external AI scrubbing API.
 * Passes client identity details so the AI can redact targeted information
 * (company name, contact person, address, email, phone) from the drawing.
 *
 * @param {File|Blob} file - The drawing file (PDF, image, etc.)
 * @param {Object} clientInfo - Client details to redact
 * @param {string} clientInfo.company_name
 * @param {string} clientInfo.contact_person
 * @param {string} clientInfo.email
 * @param {string} clientInfo.phone
 * @param {string} clientInfo.address
 * @returns {Promise<Blob>} - The scrubbed file as a Blob
 */
export async function scrubDrawingWithAI(file, clientInfo = {}) {
  const formData = new FormData();
  formData.append('file', file);

  // Pass client identity fields so the AI knows what to redact
  if (clientInfo.company_name)   formData.append('company_name',   clientInfo.company_name);
  if (clientInfo.contact_person) formData.append('contact_person', clientInfo.contact_person);
  if (clientInfo.email)          formData.append('email',          clientInfo.email);
  if (clientInfo.phone)          formData.append('phone',          clientInfo.phone);
  if (clientInfo.address)        formData.append('address',        clientInfo.address);

  const response = await fetch('https://manu-ai-plan.base44.app/api/scrub', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) throw new Error(`AI scrubbing failed (${response.status})`);
  return await response.blob();
}
