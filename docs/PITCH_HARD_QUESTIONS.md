# The Three Hard Questions — Answered With Hard Data

> These are the questions that kill pitches. Below are the factual, platform-backed answers.

---

## 1. The Liability Question

> *"If a batch of castings arrives in the UK and fails a hardness test, who pays for air freight, the replacement, and the line-down time? If Zaproc's AI sanitisation missed a critical note on the drawing, is the software liable or the user?"*

### On Quality Failures

The platform enforces a **documented, timestamped accountability chain** at every stage. This is not a promise — it is schema.

**Certificate gate before goods ship.** Every job requires the supplier to upload quality documents before dispatch is permitted. Supported certificate types are enforced at the database level:

```sql
-- supabase/migrations/20260312000400_job_certificates.sql
cert_type TEXT NOT NULL CHECK (cert_type IN ('MTR', 'CoC', 'Inspection Report', 'Test Certificate'))
```

An admin must **approve** each certificate. Rejected documents block the workflow. If a hardness test certificate was approved by RZ Global's admin team and the physical batch still fails, the timestamp and approver identity are both on record — the claim is directed at the certificate, not the air.

**Non-Conformance Reports (NCRs) create a formal paper trail.** The `ncr_reports` table captures issue type (Material Deviation, Manufacturing Error, Quality Issue), severity (Low → Critical), description, supplier ID, and order ID. Every NCR is also written to the immutable audit vault via `logNCRReport()`. When a dispute reaches a legal or insurance conversation, the NCR record is the first exhibit.

**Supplier Scorecard tracks NCR rate as a live KPI.** The platform computes NCR rate per supplier continuously:

```sql
-- supabase/migrations/20260312000300_supplier_scorecard.sql
ROUND(100.0 * COUNT(DISTINCT ncr.id) / COUNT(CASE WHEN o.order_status = 'DELIVERED' THEN 1 END), 1)
AS ncr_rate_pct
```

Suppliers with high NCR rates are visible to admins during bid award. A high-NCR supplier being awarded a critical casting job is a decision that is logged and attributable.

**Who pays?** That is determined by the supply contract, not the platform. The `contracts` table stores formal supply agreements — including financial terms, currency, and a `terms` JSONB field for liability, warranty, and remedy clauses:

```sql
-- supabase/migrations/20260312001000_contracts.sql
terms   JSONB NOT NULL DEFAULT '[]',
total_value NUMERIC(14,2),
currency    TEXT NOT NULL DEFAULT 'GBP'
```

RZ Global's standard supplier contracts assign replacement cost and consequential loss liability to the supplier for non-conforming goods. **Air freight and line-down time are recoverable from the supplier under those terms.** The platform provides the timestamped evidence to enforce that clause.

---

### On AI Sanitisation Liability

The AI scrubbing feature (`src/lib/aiScrubber.js` → `scrub-drawing` Edge Function) uses Claude vision to detect and redact: company name, logo, contact name, email, phone, and address. It returns a watermarked copy and a `X-Redaction-Report` header listing every item it acted on.

**Critically: the AI does not release anything.** The workflow is human-in-the-loop by design:

1. Client uploads drawing → lands in the **Sanitisation Gate queue** (`/control-centre/sanitisation-gate`)
2. An **admin reviews** the AI's redaction report and the scrubbed output
3. The admin sets the public project identity and pricing
4. Only after admin approval does the scrubbed drawing reach suppliers

**The AI is a tool. The admin is the actor.** The platform does not auto-release drawings. If a critical manufacturing note survives scrubbing, the admin review step is the catch. The `sanitization_records` table logs what was scrubbed, by whom, and when — creating an auditable record of what the admin saw and approved.

The software's Terms of Service (to be finalised pre-launch) will state that Zaproc is a platform, not a professional engineer, and that drawing review responsibility lies with the subscribing organisation's authorised personnel. This is identical to how Docusign, Adobe Sign, and every B2B SaaS tool in the legal/engineering space operates.

---

## 2. The "Boots on the Ground" Question

> *"Does RZ Global have its own employees inside the foundries in India, or are you just a digital middleman? Middlemen are the first to be cut during a margin squeeze."*

### The Honest Answer

RZ Global's model is **accountability infrastructure, not physical inspection headcount** — and that is a feature, not a weakness.

Here is what the platform enforces that a traditional middleman does not:

**Before a supplier gets on the platform:**
- 5-step structured onboarding (`supabase/migrations/20260312000600_supplier_onboarding.sql`)
- Declared process capabilities per category (CNC Machining, Castings, Forgings, Hydraulics) stored in `supplier_capabilities`
- Capability-based matching — a supplier who has not declared casting capability cannot bid on a casting job

**During production:**
- Mandatory certificate uploads at each stage — Material → Casting → Machining → QC → Dispatch
- Admin approval gate on every certificate before progression
- Real-time order status tracking visible to admin (`AdminLiveTracking`)
- Per-order threaded messaging between admin, client, and supplier — all timestamped and logged

**After delivery:**
- Scorecard updated automatically: on-time delivery rate, NCR rate, bid win rate
- Poor performers surface immediately; they lose bid invitations
- NCR history is visible to admins during future bid evaluation

**The alternative to "boots on the ground" is skin in the game.** RZ Global's suppliers have signed supply agreements (`contracts` table) with defined KPIs. A supplier with a rising NCR rate loses access to new jobs on the platform. That is a stronger incentive than a visiting inspector who comes once a quarter.

**The margin-squeeze counter-argument:** A buyer cuts out a traditional middleman because the middleman adds cost with no verifiable value. Zaproc adds verifiable value — traceable quality records, structured bid competition, automated PO/invoice workflows, and a supplier accountability layer that would cost a procurement team 2–3 headcount to replicate manually. The platform *is* the value. Cutting it means rebuilding it internally.

---

## 3. The Interoperability Question

> *"Can Zaproc export data directly into my SAP or Oracle ERP? If I have to manually copy data from your 'intelligent platform' into my system, you haven't saved me time — you've created a new chore."*

### Yes. Via a Production-Ready Webhook Layer.

The platform ships with a fully implemented, HMAC-SHA256 signed webhook integration layer (`src/services/webhookService.js`). This is not a roadmap item — it is live in the codebase.

**How it works:**

Zaproc fires signed HTTP POST events to any endpoint the client configures — including SAP Integration Suite middleware, Oracle Integration Cloud, MuleSoft, or a custom API gateway sitting in front of either ERP.

**Events fired automatically:**
- PO created / issued / acknowledged
- Invoice submitted / approved / paid
- Order status changes (CASTING → MACHINING → QC → DISPATCH → DELIVERED)
- Supplier scorecard updates

**Security:** Every delivery is signed using the same convention as GitHub webhooks and Stripe webhooks — `sha256=<hex>` in the `X-RZG-Signature` header, using `HMAC-SHA256` over `<unix_timestamp>.<json_body>`. Your ERP middleware can verify the signature before processing.

**Reliability:** Deliveries are logged in `webhook_deliveries` with exponential backoff retry (2 min, 4 min, 8 min, 16 min, 32 min — 5 attempts before dead-lettering). Failed deliveries can be manually retried from the admin UI. Every delivery attempt is logged with HTTP response status and body.

```
Event: po.created
Headers:
  X-RZG-Event: po.created
  X-RZG-Delivery: <uuid>
  X-RZG-Timestamp: <unix>
  X-RZG-Signature: sha256=<hex>
Body: { event, payload, timestamp }
```

**What the client does on their side:** Configure a receiving endpoint in SAP Integration Suite (iFlow) or Oracle Integration Cloud that accepts the webhook payload and maps fields to the relevant SAP BAPI or Oracle REST API call. This is a standard integration pattern. Most enterprise IT teams have done it for Salesforce, Stripe, or GitHub already.

**What we are building next:** Native certified connectors for SAP S/4HANA and Oracle Fusion (Phase 5 of the roadmap: automated PO/Invoice 3-way matching). Until those ship, the webhook layer handles the data flow. No manual copying.

---

## Summary Table

| Question | Platform Evidence | Gap / Caveat |
|---|---|---|
| Quality liability | NCR reports, certificate approval gates, supplier scorecard, immutable audit vault, supply contracts | Financial remedy terms must be defined per contract — platform provides the enforcement record, not the legal clause |
| AI sanitisation liability | Human-in-the-loop: admin reviews and approves all scrubbed drawings before release | ToS must explicitly assign review responsibility to the subscribing organisation |
| Boots on the ground | Capability verification, certificate gates, admin approval at every stage, scorecard accountability | No physical on-site inspectors — oversight is digital + contractual |
| ERP integration | Live HMAC-signed webhooks for all key events, retry infrastructure, delivery audit trail | Native SAP/Oracle certified connectors on roadmap (Phase 5); currently requires client-side middleware configuration |
