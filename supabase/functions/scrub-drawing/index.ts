import { PDFDocument, rgb, StandardFonts, degrees } from 'https://esm.sh/pdf-lib@1.17.1';

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

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Finding {
  type: string;
  text: string;
  page: number;
  bbox: BBox;
}

interface ScrubResult {
  findings: Finding[];
  summary: string;
}

function parseScrubResult(text: string): ScrubResult {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { findings: [], summary: text };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const findings: Finding[] = (parsed.findings || []).map((f: any) => ({
      type: f.type || 'other',
      text: f.text || '',
      page: typeof f.page === 'number' ? f.page : 1,
      bbox: {
        x: Math.max(0, Math.min(1, Number(f.bbox?.x) || 0)),
        y: Math.max(0, Math.min(1, Number(f.bbox?.y) || 0)),
        w: Math.max(0.01, Math.min(1, Number(f.bbox?.w) || 0.15)),
        h: Math.max(0.005, Math.min(1, Number(f.bbox?.h) || 0.03)),
      },
    }));
    return { findings, summary: parsed.summary || '' };
  } catch {
    return { findings: [], summary: text };
  }
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

    const identityHints = [
      companyName   ? `Company name: "${companyName}"`     : '',
      contactPerson ? `Contact person: "${contactPerson}"` : '',
      email         ? `Email: "${email}"`                  : '',
      phone         ? `Phone: "${phone}"`                  : '',
      address       ? `Address: "${address}"`              : '',
    ].filter(Boolean).join('\n');

    const prompt = `You are reviewing a technical engineering drawing to identify client-sensitive information that must be redacted (black-markered) before sharing with suppliers.

${identityHints ? `Known client details to look for:\n${identityHints}\n\n` : ''}Scan the document carefully and identify ALL of the following:
- Company names, brand names, or logos
- Contact person names
- Email addresses
- Phone or fax numbers
- Physical addresses or locations
- Any other personally identifiable information

For EACH piece of sensitive information found, provide its approximate bounding box location on the page as normalised coordinates (0 to 1 range).

Respond with ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "findings": [
    {
      "type": "company_name",
      "text": "Acme Corp Ltd",
      "page": 1,
      "bbox": { "x": 0.65, "y": 0.88, "w": 0.25, "h": 0.03 }
    }
  ],
  "summary": "Found company name and email in title block area"
}

bbox coordinate system:
- x: left edge as fraction of page width (0 = left, 1 = right)
- y: top edge as fraction of page height (0 = top, 1 = bottom)
- w: width as fraction of page width
- h: height as fraction of page height

Valid "type" values: "company_name", "contact_person", "email", "phone", "address", "logo", "other"

If nothing sensitive is found, return: { "findings": [], "summary": "No sensitive information detected." }

Be generous with bounding box sizes — it is better to redact slightly more area than to miss any sensitive text. Add 10-15% padding around text.`;

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
        max_tokens: 1024,
        messages: [{ role: 'user', content: messageContent }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      throw new Error(`Claude API error: ${anthropicRes.status} — ${errText}`);
    }

    const anthropicData = await anthropicRes.json();
    const rawReport: string = anthropicData.content?.[0]?.text ?? '';
    const scrubResult = parseScrubResult(rawReport);

    const humanReport = scrubResult.findings.length > 0
      ? scrubResult.summary + '\n\nRedacted items:\n' +
        scrubResult.findings.map(f => `• [${f.type}] "${f.text}" (page ${f.page})`).join('\n')
      : scrubResult.summary || 'No sensitive information detected.';

    let outputBytes: Uint8Array;
    let contentType: string;

    if (isPdf) {
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages  = pdfDoc.getPages();

      // --- Black-marker redaction ---
      for (const finding of scrubResult.findings) {
        const pageIdx = Math.max(0, Math.min(pages.length - 1, finding.page - 1));
        const page = pages[pageIdx];
        const { width, height } = page.getSize();

        const bx = finding.bbox.x * width;
        const bw = finding.bbox.w * width;
        const bh = finding.bbox.h * height;
        const by = height - (finding.bbox.y * height) - bh;

        page.drawRectangle({
          x: bx,
          y: by,
          width: bw,
          height: bh,
          color: rgb(0, 0, 0),
          opacity: 1,
        });
      }

      // --- Branding per page ---
      for (const page of pages) {
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
          rotate: degrees(45),
        });

        // --- Light logo/branding footer at bottom ---
        const footerY = 10;
        const logoBarHeight = 22;

        page.drawRectangle({
          x: 0,
          y: footerY - 2,
          width,
          height: logoBarHeight,
          color: rgb(0.95, 0.95, 0.95),
          opacity: 0.6,
        });

        const rzBadgeWidth = 24;
        const rzBadgeHeight = 14;
        const rzBadgeX = 12;
        const rzBadgeY = footerY + 2;

        page.drawRectangle({
          x: rzBadgeX,
          y: rzBadgeY,
          width: rzBadgeWidth,
          height: rzBadgeHeight,
          color: rgb(1, 0.42, 0.21),
          opacity: 0.35,
          borderColor: rgb(1, 0.42, 0.21),
          borderWidth: 0.5,
          borderOpacity: 0.4,
        });

        page.drawText('RZ', {
          x: rzBadgeX + 4,
          y: rzBadgeY + 3,
          size: 8,
          font,
          color: rgb(1, 0.42, 0.21),
          opacity: 0.65,
        });

        page.drawText('RZ Global Solutions  |  www.zaproc.co.uk  |  Sanitised Document', {
          x: rzBadgeX + rzBadgeWidth + 8,
          y: footerY + 4,
          size: 7,
          font: fontRegular,
          color: rgb(0.55, 0.55, 0.55),
          opacity: 0.5,
        });

        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
        const tsWidth = fontRegular.widthOfTextAtSize(timestamp, 6);
        page.drawText(timestamp, {
          x: width - tsWidth - 12,
          y: footerY + 4,
          size: 6,
          font: fontRegular,
          color: rgb(0.65, 0.65, 0.65),
          opacity: 0.4,
        });
      }

      outputBytes  = await pdfDoc.save();
      contentType  = 'application/pdf';
    } else {
      outputBytes  = new Uint8Array(arrayBuffer);
      contentType  = file.type || 'application/octet-stream';
    }

    return new Response(outputBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'X-Redaction-Report': encodeURIComponent(humanReport),
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
