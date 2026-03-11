# RZ Global Solutions — Business Structure & Sales Strategy

> **Platform:** B2B Manufacturing Procurement SaaS  
> **Website:** [www.rzglobalsolutions.co.uk](https://www.rzglobalsolutions.co.uk)  
> **Product:** Multi-portal procurement platform (Client Portal, Control Centre, Supplier Hub)

---

## 1. Revenue Model Options

### Option A — Platform-as-a-Service (Recommended)

RZ operates the platform as a managed procurement service. Revenue comes from margins on every transaction that flows through the system.

| Revenue Stream | How It Works | Typical Range |
|---|---|---|
| **Procurement margin** | Mark-up between supplier buy-price and client sell-price on every order | 8–20% per order |
| **Service fee (flat)** | Fixed management fee per order for coordination, QC, logistics | £150–£500 per order |
| **Expedite surcharge** | Premium for rush/priority orders requiring fast turnaround | 15–30% uplift |
| **Drawing sanitisation fee** | Charge per drawing processed through AI sanitisation engine | £10–£25 per drawing |

**Why this works:** Manufacturing procurement intermediaries typically earn on the spread. The platform automates what was previously manual coordination, so margins improve as volume grows.

### Option B — SaaS Subscription (License the Platform)

License the platform to other procurement companies or large manufacturers who want to run their own supplier network.

| Tier | Target | Monthly Price | Includes |
|---|---|---|---|
| **Starter** | Small procurement firms | £299/mo | 3 admin seats, 10 suppliers, 50 orders/mo |
| **Professional** | Mid-size intermediaries | £799/mo | 10 admin seats, 50 suppliers, 250 orders/mo, AI sanitisation |
| **Enterprise** | Large OEMs / procurement groups | £2,499+/mo | Unlimited seats, white-label, API access, dedicated support |

**Add-ons:** AI sanitisation credits (£0.15/page), additional storage (£10/10GB), custom integrations (quoted).

### Option C — Hybrid (Recommended for Growth)

Run Option A as RZ Global's own procurement business **and** license Option B to other firms.

- Phase 1: Operate the platform yourself (prove the model, build case studies)
- Phase 2: White-label and license to other procurement intermediaries
- Phase 3: Marketplace model — take a platform fee on all transactions across all tenants

---

## 2. Pricing Strategy by Customer Segment

### Clients (Buyers of Manufactured Parts)

Clients pay nothing to use the portal. Revenue is embedded in the quoted price.

| What They See | What Actually Happens |
|---|---|
| "Quoted price: £9,100" | Supplier bid: £7,800 + RZ margin: £1,300 (16.7%) |
| Transparent tracking, quality docs | Value delivered justifies premium over going direct |

**Key selling point:** Clients get supplier competition, IP protection, and project management — without hiring a procurement team.

### Suppliers (Manufacturers)

Suppliers access the Supplier Hub for free. They benefit from new business without sales costs.

| Monetisation Angle | Detail |
|---|---|
| **Free tier** | Browse and bid on jobs, basic profile |
| **Preferred supplier** (future) | £99/mo — priority notifications, featured in bid comparisons |
| **Verified badge** (future) | £199 one-time — RZ audits and certifies their capabilities |

### Enterprise / White-Label Clients

For companies wanting to run their own instance:

| Feature | Included in Enterprise |
|---|---|
| Custom branding / domain | Yes |
| Own supplier pool | Yes |
| AI sanitisation | Yes (with credit limits) |
| Dedicated Supabase project | Yes |
| SLA & priority support | Yes |
| ERP webhook integration | Yes |

---

## 3. Go-to-Market Strategy

### Phase 1: Prove the Model (Months 1–6)

**Goal:** Process 50+ orders through the platform, build 3–5 case studies.

| Activity | Channel | Cost |
|---|---|---|
| Direct outreach to UK manufacturers | LinkedIn, email, trade shows | Low |
| Onboard 10–20 suppliers (foundries, machine shops) | Industry directories, personal network | Free |
| Offer first 5 clients discounted management fees | Direct sales | Lost margin |
| Build case studies with real metrics | Content | Time |

**Key metrics to track:**
- Orders processed per month
- Average margin per order
- On-time delivery rate
- Client retention (repeat orders)
- Supplier bid response rate

### Phase 2: Scale the Network (Months 6–18)

| Activity | Detail |
|---|---|
| **Content marketing** | Blog posts on manufacturing procurement, supply chain IP protection, sourcing best practices |
| **SEO** | Target keywords: "manufacturing procurement UK", "parts sourcing platform", "supplier management software" |
| **Trade shows** | Southern Manufacturing, MACH, Subcon, Advanced Engineering |
| **Referral programme** | Clients who refer new clients get £500 credit per qualified referral |
| **LinkedIn campaigns** | Target procurement managers, engineering directors, operations leads |

### Phase 3: Platform Licensing (Months 18+)

| Activity | Detail |
|---|---|
| **White-label offering** | Package the platform for other procurement firms |
| **Channel partnerships** | Partner with industry bodies (MakeUK, EEF, local chambers) |
| **API integrations** | Connect to SAP, Oracle, Sage for enterprise adoption |

---

## 4. Sales Process

### For Direct Procurement Clients

```
Discovery Call → Demo (use live demo mode) → Trial Order (1 job) → Onboard → Ongoing
```

| Stage | Action | Timeline |
|---|---|---|
| **Lead generation** | LinkedIn outreach, website enquiry, trade show contact | Ongoing |
| **Discovery call** | Understand their current sourcing pain points | 30 min |
| **Live demo** | Walk through Client Portal using demo mode at `/demo?role=client` | 45 min |
| **Trial order** | Process one real order at cost (no margin) to prove the platform | 2–4 weeks |
| **Onboard** | Create their account, upload first batch of orders | 1 week |
| **Ongoing** | Account management, quarterly business reviews | Continuous |

### For Supplier Onboarding

```
Invite → Profile Setup → Capability Declaration → First Bid → Ongoing
```

Suppliers are onboarded via the existing invite flow (Edge Function `invite-user`). The onboarding workflow in EXECUTION_PLAN.md Phase 7 formalises this.

### For SaaS / White-Label Clients

```
Inbound Enquiry → Needs Assessment → Custom Demo → Contract → Deployment → Support
```

Typical enterprise sales cycle: 3–6 months. Target decision-makers: Head of Procurement, COO, IT Director.

---

## 5. Value Proposition by Audience

### For Clients (Buyers)

> "Source precision parts from a vetted global supplier network — without exposing your IP or managing suppliers yourself."

- **IP Protection:** AI-powered drawing sanitisation prevents supplier poaching
- **Competitive Pricing:** Multiple suppliers bid on every job
- **Full Visibility:** Track every order from submission to delivery
- **Quality Assurance:** Certificates, NCR tracking, audit trail
- **Zero Overhead:** No procurement team needed

### For Suppliers (Manufacturers)

> "Win new business from a global client base — compete fairly on sanitised jobs with transparent bidding."

- **New Revenue:** Access jobs you'd never find otherwise
- **Fair Competition:** All suppliers see the same sanitised drawings
- **Reduced Sales Cost:** No cold calling, no trade shows — jobs come to you
- **Simple Workflow:** Bid, win, produce, deliver — all in one portal
- **Performance Visibility:** Scorecard shows your track record (builds reputation)

### For the Business (RZ Global Solutions)

> "Scalable procurement-as-a-service platform that earns margin on every order while delivering genuine value to both sides."

- **Recurring Revenue:** Every order generates margin
- **Network Effects:** More suppliers = better prices = more clients = more suppliers
- **IP Moat:** AI sanitisation is a genuine differentiator
- **Low Variable Cost:** Platform handles coordination that previously required staff
- **Scalable:** Same platform serves 10 or 10,000 orders/month

---

## 6. Competitive Positioning

| Competitor Type | Examples | RZ Advantage |
|---|---|---|
| **Traditional brokers** | Phone/email-based sourcing agents | Full digital pipeline, real-time tracking, audit trail |
| **Generic procurement SaaS** | SAP Ariba, Coupa, Jaggaer | Purpose-built for manufacturing, AI drawing sanitisation, 3-portal model |
| **Manufacturing marketplaces** | Xometry, Hubs (Protolabs), Fictiv | RZ controls quality & IP; not a self-serve marketplace |
| **Spreadsheet/email** | Most SME manufacturers today | Eliminates manual coordination, reduces errors, faster cycle |

**Unique differentiators:**
1. **AI Drawing Sanitisation** — No competitor offers automated IP protection on technical drawings
2. **Three-Portal Architecture** — Purpose-built UX for each role (not one dashboard with permission filters)
3. **Managed Service + Platform** — Combines human expertise with software automation
4. **End-to-End Lifecycle** — From order intake through QC, certificates, and delivery tracking

---

## 7. Financial Projections (Illustrative)

### Year 1 — Direct Procurement Model

| Metric | Q1 | Q2 | Q3 | Q4 | Year 1 |
|---|---|---|---|---|---|
| Active clients | 3 | 5 | 8 | 12 | 12 |
| Active suppliers | 10 | 15 | 25 | 35 | 35 |
| Orders/month | 5 | 12 | 25 | 40 | ~250 total |
| Avg order value | £5,000 | £6,000 | £7,000 | £8,000 | — |
| Avg margin | 15% | 15% | 14% | 13% | ~14% |
| Gross revenue (margin) | £3,750 | £10,800 | £24,500 | £41,600 | ~£80,650 |
| Platform costs (Supabase, hosting) | £200 | £200 | £400 | £600 | ~£1,400 |
| Gross profit | £3,550 | £10,600 | £24,100 | £41,000 | ~£79,250 |

### Year 2–3 — Adding SaaS Licensing

| Revenue Stream | Year 2 | Year 3 |
|---|---|---|
| Direct procurement margin | £180,000 | £350,000 |
| SaaS subscriptions (5–15 licensees) | £60,000 | £180,000 |
| AI sanitisation credits | £5,000 | £15,000 |
| Preferred supplier fees | £10,000 | £30,000 |
| **Total** | **£255,000** | **£575,000** |

---

## 8. Website Integration (rzglobalsolutions.co.uk)

### Recommended Website Structure

```
rzglobalsolutions.co.uk
├── / (Homepage — landing page with value prop, demo CTAs)
├── /services (What RZ does: procurement, sourcing, QC)
├── /platform (Product page — features, screenshots, demo link)
├── /pricing (Transparent pricing or "Get a Quote" for enterprise)
├── /suppliers (Supplier recruitment page — why join the network)
├── /case-studies (Real results from real clients)
├── /about (Company story, team, certifications)
├── /contact (Enquiry form, phone, email)
├── /login (→ app login)
├── /demo (→ app demo mode)
└── /blog (SEO content on manufacturing, procurement, supply chain)
```

### Key Pages to Build

1. **Homepage** — Hero with clear value prop, 3-portal overview, social proof, CTA to demo
2. **For Clients** — Pain points, how RZ solves them, case study, CTA
3. **For Suppliers** — Benefits of joining the network, onboarding process, CTA
4. **Platform** — Feature deep-dive, screenshots, technical capabilities
5. **Pricing** — Transparent model or "talk to sales" depending on strategy chosen

### SEO Keywords to Target

| Keyword | Search Intent | Priority |
|---|---|---|
| manufacturing procurement UK | Buyers looking for sourcing help | High |
| parts sourcing platform | Buyers evaluating tools | High |
| manufacturing supplier management | Ops managers seeking software | Medium |
| technical drawing IP protection | Engineering managers with IP concerns | Medium |
| manufacturing procurement software | Procurement teams evaluating SaaS | Medium |
| subcontract manufacturing UK | Buyers looking for suppliers | High |
| precision parts supplier | Direct sourcing queries | Medium |

---

## 9. Immediate Next Steps

### Technical (Platform)

1. **Add Stripe integration** for SaaS billing (if pursuing Option B/C)
2. **Build pricing page** in the app with tier comparison
3. **Implement supplier onboarding workflow** (EXECUTION_PLAN Phase 7)
4. **Add analytics dashboard** with business metrics (GMV, margins, conversion)
5. **Build referral tracking system** for client referral programme

### Commercial

1. **Register company** (if not done) — Ltd company for credibility
2. **Set up business banking** — separate account for procurement float
3. **Professional liability insurance** — essential for procurement intermediary
4. **Draft client T&Cs** — covering liability, IP, payment terms
5. **Draft supplier T&Cs** — covering quality, delivery, disputes
6. **Create pitch deck** — 10 slides covering problem, solution, market, traction, team

### Marketing

1. **Launch website** at rzglobalsolutions.co.uk with the structure above
2. **LinkedIn company page** with regular content
3. **Google Business Profile** for local SEO
4. **Produce 3 demo videos** (one per portal) for website and LinkedIn
5. **Write 5 blog posts** targeting key SEO terms

---

## 10. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Clients bypass RZ and go direct to suppliers | High | AI sanitisation removes identifiers; contractual non-circumvent clauses |
| Supplier quality issues | High | Onboarding verification, scorecard system, NCR tracking |
| Low initial order volume | Medium | Offer trial orders at cost; focus on niche (e.g., castings, CNC) |
| Competitors copy the model | Medium | First-mover advantage in AI sanitisation; network effects create moat |
| Technical failure / data loss | High | Supabase managed infrastructure, automated backups, RLS security |
| Cash flow gap (paying suppliers before clients pay) | High | Require client deposit (50% upfront), negotiate supplier payment terms (30 days) |

---

## Summary

RZ Global Solutions is positioned as a **technology-enabled manufacturing procurement intermediary**. The platform replaces manual email/phone-based coordination with a purpose-built 3-portal system that protects client IP, enables competitive bidding, and provides end-to-end visibility.

**The recommended approach is Option C (Hybrid):**

1. **Now:** Use the platform to run your own procurement business (earn margin per order)
2. **6–12 months:** Build case studies and refine the product with real usage data
3. **12–18 months:** License the platform to other procurement firms (recurring SaaS revenue)
4. **18+ months:** Evolve toward a marketplace model with platform fees on all transactions

The AI drawing sanitisation feature is a genuine competitive moat — no other platform in the manufacturing procurement space offers automated IP protection on technical drawings. This should be the centrepiece of all marketing and sales conversations.
