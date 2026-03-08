import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY secret is not set');

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) throw new Error('No file provided');

    const companyName    = (form.get('company_name')   as string) || '';
    const contactPerson  = (form.get('contact_person') as string) || '';
    const email          = (form.get('email')          as string) || '';
    const phone          = (form.get('phone')          as string) || '';
    const address        = (form.get('address')        as string) || '';

    const arrayBuffer = await file.arrayBuffer();
    const base64Data  = arrayBufferToBase64(arrayBuffer);

    const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');

    // Build identity context for Claude prompt
    const identityHints = [
      companyName   ? `Company name: "${companyName}"`     : '',
      contactPerson ? `Contact person: "${contactPerson}"` : '',
      email         ? `Email: "${email}"`                  : '',
      phone         ? `Phone: "${phone}"`                  : '',
      address       ? `Address: "${address}"`              : '',
    ].filter(Boolean).join('\n');

    const prompt = `You are reviewing a technical engineering drawing to identify client information that must be removed before sharing with suppliers.

${identityHints ? `Known client details to look for:\n${identityHints}\n\n` : ''}Scan the document and list any of the following found:
- Company names, brand names, or logos
- Contact person names
- Email addresses
- Phone or fax numbers
- Physical addresses or locations
- Any other personally identifiable information

Respond with a concise bullet list of findings. If nothing sensitive is found, respond with "No sensitive information detected."`;

    // Call Claude API with vision/document
    const messageContent = isPdf
      ? [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
          { type: 'text', text: prompt },
        ]
      : [
          { type: 'image', source: { type: 'base64', media_type: file.type || 'image/png', data: base64Data } },
          { type: 'text', text: prompt },
        ];

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: messageContent }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Claude API error: ${anthropicRes.status} — ${errText}`);
    }

    const anthropicData = await anthropicRes.json();
    const redactionReport: string = anthropicData.content?.[0]?.text ?? 'Analysis unavailable';

    // For PDFs: stamp a visible SANITISED watermark on every page
    let outputBytes: Uint8Array;
    let contentType: string;

    if (isPdf) {
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const page of pdfDoc.getPages()) {
        const { width, height } = page.getSize();

        // Top banner bar
        page.drawRectangle({
          x: 0, y: height - 24,
          width, height: 24,
          color: rgb(1, 0.42, 0.21),
          opacity: 0.92,
        });

        page.drawText('SANITISED — RZ GLOBAL SOLUTIONS', {
          x: 10, y: height - 17,
          size: 9,
          font,
          color: rgb(1, 1, 1),
        });

        // Diagonal watermark
        page.drawText('SANITISED', {
          x: width / 2 - 80,
          y: height / 2 - 20,
          size: 52,
          font,
          color: rgb(1, 0.42, 0.21),
          opacity: 0.07,
          rotate: { type: 'degrees', angle: 45 },
        });
      }

      outputBytes  = await pdfDoc.save();
      contentType  = 'application/pdf';
    } else {
      // Return image as-is — watermarking images requires canvas which isn't available in Deno
      outputBytes  = new Uint8Array(arrayBuffer);
      contentType  = file.type || 'application/octet-stream';
    }

    return new Response(outputBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'X-Redaction-Report': encodeURIComponent(redactionReport),
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
