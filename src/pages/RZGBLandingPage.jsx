import { useState, useEffect, useRef } from 'react';
import {
  Mail, Phone, MapPin, Menu, X, ChevronRight, Globe, Settings,
  Factory, Shield, Award, Truck, ArrowUpRight, ArrowRight,
  CheckCircle2, Zap, Package, Layers,
} from 'lucide-react';
import { RZGB_SITE_NAME, RZGB_TAGLINE, RZGB_LEGAL_NAME, RZGB_PAGE_TITLE } from '@/lib/rzgbBranding';
import RZGBLogo from '@/components/RZGBLogo';

/* ─── Design tokens ───────────────────────────────────────────────────────── */
const glass   = 'bg-white/80 backdrop-blur-xl border border-gray-200/80 shadow-sm';
const glassHv = 'hover:bg-white hover:border-gray-300 hover:shadow-md transition-all duration-300';
const pill    = 'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-600 tracking-widest uppercase';

/* ─── Data ────────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'About',    href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Sectors',  href: '#sectors' },
  { label: 'Process',  href: '#process' },
  { label: 'Contact',  href: '#contact' },
];

const SERVICES = [
  {
    icon: Settings,
    tag: 'R&D → Production',
    title: 'Product Development',
    description: 'End-to-end solutions from initial design and prototyping through to full-scale production. FAI, PPAP, and specialised surface treatments available.',
    capabilities: ['FAI / PPAP', 'Surface Treatments', 'Prototyping', 'Tooling Design'],
  },
  {
    icon: Globe,
    tag: 'Procurement',
    title: 'Global Sourcing',
    description: 'Robust, lean sourcing with our verified Indian manufacturer network. Bridging world-class manufacturing capability with global industry demands.',
    capabilities: ['Verified Network', 'Lean Supply Chain', 'Cost Optimisation', 'Lead Time Control'],
  },
  {
    icon: Factory,
    tag: 'Manufacturing',
    title: 'Component Manufacturing',
    description: 'CNC machined components, precision castings, hydraulic systems, automotive parts, and industrial fixtures — defect-free and on-spec.',
    capabilities: ['CNC Machining', 'Precision Castings', 'Hydraulic Systems', 'Automotive Parts'],
  },
];

const INDUSTRIES = [
  { name: 'Automotive & Transport', icon: Truck,    share: 32 },
  { name: 'Railway & Locomotive',   icon: Layers,   share: 24 },
  { name: 'Hydraulics & Fluids',    icon: Zap,      share: 19 },
  { name: 'Industrial & Machinery', icon: Settings, share: 15 },
  { name: 'Engineering & Fab.',     icon: Package,  share: 10 },
];

const PROCESS_STEPS = [
  { n: '01', title: 'Client Requirement',  desc: 'You share part specs, drawings, and volume requirements with our team.' },
  { n: '02', title: 'Sourcing & Quoting',  desc: 'We match your needs against our verified Indian manufacturer network and return a detailed quote.' },
  { n: '03', title: 'Manufacturing',        desc: 'Your components are manufactured to spec under our quality oversight.' },
  { n: '04', title: 'QC & Dispatch',        desc: 'Rigorous inspection before dispatch. Defect-free guarantee on every shipment.' },
  { n: '05', title: 'Global Delivery',      desc: 'Consolidated logistics to your door — wherever you are in the world.' },
];

const TRUST = [
  { icon: Shield, value: '100%',  label: 'Defect-Free Rate',          desc: 'Rigorous multi-stage inspection before every shipment.' },
  { icon: Globe,  value: '5+',    label: 'Industries Served',          desc: 'Automotive, railway, hydraulics, industrial, and more.' },
  { icon: Award,  value: 'India', label: 'Manufacturing Excellence',   desc: 'Verified manufacturer network across key Indian industrial hubs.' },
];

/* ─── Hook ────────────────────────────────────────────────────────────────── */
function useIntersection(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

/* ─── Industries chart ────────────────────────────────────────────────────── */
function IndustriesChart() {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const visible = useIntersection(ref);

  return (
    <div ref={ref} className="grid lg:grid-cols-2 gap-10 items-center">
      {/* Bars */}
      <div className="space-y-3">
        {INDUSTRIES.map((ind, i) => {
          const Icon = ind.icon;
          const isActive = active === i;
          return (
            <button key={ind.name} onClick={() => setActive(i)} className="w-full text-left">
              <div className={`p-4 rounded-2xl transition-all duration-300 ${isActive
                ? 'bg-orange-50 border border-orange-200 shadow-sm'
                : 'bg-white/70 border border-gray-200 hover:border-orange-200 hover:bg-orange-50/40'}`}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-orange-100 border border-orange-200' : 'bg-gray-100 border border-gray-200'}`}>
                      <Icon size={15} className={isActive ? 'text-orange-600' : 'text-gray-400'} />
                    </div>
                    <span className={`text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {ind.name}
                    </span>
                  </div>
                  <span className={`text-sm font-black transition-colors duration-200 ${isActive ? 'text-orange-600' : 'text-gray-300'}`}>
                    {ind.share}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${isActive ? 'bg-orange-500' : 'bg-gray-200'}`}
                    style={{ width: visible ? `${ind.share}%` : '0%' }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detail card */}
      <div className={`relative p-8 rounded-2xl ${glass} overflow-hidden min-h-[280px] flex flex-col justify-between`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-100/60 blur-3xl rounded-full pointer-events-none" />
        <div>
          <span className={pill + ' mb-6'}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Sector Focus
          </span>
          <div className="flex items-center gap-6 mt-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f97316" strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 38 * INDUSTRIES[active].share / 100} ${2 * Math.PI * 38}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.7s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-orange-600">{INDUSTRIES[active].share}%</span>
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-900 mb-1">{INDUSTRIES[active].name}</p>
              <p className="text-sm text-gray-400">of our component supply</p>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mt-6">
          We supply precision-engineered components purpose-built for the {INDUSTRIES[active].name.toLowerCase()} sector — meeting the tightest tolerances and compliance requirements.
        </p>
      </div>
    </div>
  );
}

/* ─── Process timeline ────────────────────────────────────────────────────── */
function ProcessTimeline() {
  const ref = useRef(null);
  const visible = useIntersection(ref, 0.05);

  return (
    <div ref={ref} className="relative">
      <div className="absolute left-[19px] top-10 bottom-10 w-px bg-gradient-to-b from-orange-400/60 via-orange-200/40 to-transparent hidden sm:block" />
      <div className="space-y-4">
        {PROCESS_STEPS.map((step, i) => (
          <div key={step.n}
            className={`flex gap-5 transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
            style={{ transitionDelay: `${i * 100}ms` }}>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center z-10">
              <span className="text-xs font-black text-orange-600">{step.n}</span>
            </div>
            <div className={`flex-1 p-5 rounded-2xl ${glass} ${glassHv} mb-1`}>
              <p className="font-bold text-gray-900 text-sm mb-1.5">{step.title}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function RZGBLandingPage() {
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const [activeService, setActiveService] = useState(0);
  const formRef = useRef(null);

  useEffect(() => {
    document.title = RZGB_PAGE_TITLE;
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.title = 'Vrocure | Global Procurement Platform';
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-900 antialiased overflow-x-hidden">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
        <div className="absolute top-[-15%] left-[5%]   w-[600px] h-[600px] rounded-full bg-orange-200/30 blur-[120px]" />
        <div className="absolute top-[45%]  right-[-5%] w-[500px] h-[500px] rounded-full bg-orange-100/40 blur-[100px]" />
        <div className="absolute bottom-[5%] left-[30%]  w-[400px] h-[400px] rounded-full bg-blue-100/20  blur-[100px]" />
      </div>

      {/* ═══════════ NAV ════════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/80 shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[68px]">

            <a href="#" className="flex items-center gap-3 flex-shrink-0">
              <RZGBLogo size={36} />
              <div className="leading-none">
                <p className="text-sm font-bold text-gray-900 tracking-tight">{RZGB_SITE_NAME}</p>
                <p className="text-[10px] text-gray-400 font-medium">{RZGB_TAGLINE}</p>
              </div>
            </a>

            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200">
                  {l.label}
                </a>
              ))}
            </div>

            <a href="#contact"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold transition-all duration-200 shadow-md shadow-orange-500/25 hover:-translate-y-px">
              Get a Quote <ChevronRight size={14} />
            </a>

            <button onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-xl px-5 py-4 space-y-1">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-gray-100">
              <a href="#contact" onClick={() => setMobileOpen(false)}
                className="block text-center px-4 py-3 bg-orange-600 text-white text-sm font-bold rounded-xl">
                Get a Quote
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════ HERO ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-center pt-[68px]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-28 w-full">

          <div className={pill + ' mb-8'}>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            Global Supply Partner
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-black leading-[1.02] tracking-[-0.02em] mb-8 max-w-5xl text-gray-900">
            Global Supply of<br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Component Parts
            </span>
            <br />
            <span className="text-gray-400">&amp; Precision Castings</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mb-12">
            {RZGB_SITE_NAME} bridges Indian manufacturing excellence with global industries — delivering defect-free products backed by a verified supply chain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <a href="#contact"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-xl shadow-orange-500/25 hover:-translate-y-px text-base">
              Get a Quote Today <ChevronRight size={18} />
            </a>
            <a href="#process"
              className={`inline-flex items-center justify-center gap-2.5 px-8 py-4 ${glass} ${glassHv} text-gray-600 hover:text-gray-900 font-semibold rounded-2xl text-base`}>
              How It Works
            </a>
          </div>

          {/* KPI strip */}
          <div className={`${glass} rounded-2xl overflow-hidden max-w-xl`}>
            <div className="grid grid-cols-3 divide-x divide-gray-200/60">
              {[
                { v: '100%',   l: 'Quality Assurance' },
                { v: '5+',     l: 'Industries Served'  },
                { v: 'Global', l: 'Supply Network'     },
              ].map(s => (
                <div key={s.l} className="px-6 py-5 text-center">
                  <p className="text-2xl font-black text-orange-600 mb-1">{s.v}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ ABOUT ══════════════════════════════════════════════════ */}
      <section id="about" className="relative py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className={pill + ' mb-6'}>About Us</div>
              <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight mb-7 text-gray-900">
                Manufacturing<br />Excellence,<br />
                <span className="text-gray-300">Delivered Globally</span>
              </h2>
              <p className="text-gray-500 leading-relaxed text-lg mb-5">
                We connect Indian manufacturing excellence with the world's most demanding industries — automotive parts, industrial fixtures, hydraulic systems, CNC machined components, and precision castings.
              </p>
              <p className="text-gray-400 leading-relaxed text-sm mb-10">
                Our end-to-end approach covers assembly, prototyping (FAI/PPAP), and specialised surface treatments — ensuring every component meets your precise specifications.
              </p>
              <a href="#contact"
                className={`inline-flex items-center gap-2 px-6 py-3 ${glass} ${glassHv} text-gray-700 hover:text-gray-900 font-semibold rounded-xl text-sm`}>
                Talk to us <ArrowUpRight size={14} />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Factory,  title: 'CNC Machining',     desc: 'Precision tolerances to spec',  accent: true  },
                { icon: Settings, title: 'Precision Castings', desc: 'Investment & sand casting',     accent: false },
                { icon: Truck,    title: 'Global Logistics',   desc: 'Reliable end-to-end supply',    accent: false },
                { icon: Shield,   title: 'Quality Control',    desc: 'Defect-free guarantee',         accent: true  },
              ].map(f => (
                <div key={f.title} className={`group p-6 rounded-2xl ${glass} ${glassHv} cursor-default`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${f.accent ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <f.icon size={17} className={f.accent ? 'text-orange-600' : 'text-gray-400'} />
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-gray-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SERVICES ═══════════════════════════════════════════════ */}
      <section id="services" className="relative py-32 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <div className={pill + ' mb-5'}>What We Offer</div>
              <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight text-gray-900">Our Services</h2>
            </div>
            <div className="flex gap-1 p-1 rounded-2xl bg-white border border-gray-200 shadow-sm">
              {SERVICES.map((s, i) => (
                <button key={s.title} onClick={() => setActiveService(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${activeService === i
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  {s.tag}
                </button>
              ))}
            </div>
          </div>

          <div className={`relative p-8 sm:p-12 rounded-2xl ${glass} overflow-hidden`}>
            <div className="absolute top-0 right-0 w-72 h-72 bg-orange-50/80 blur-3xl rounded-full pointer-events-none" />
            <span className="absolute bottom-4 right-8 text-[160px] font-black text-gray-100 select-none leading-none">
              {String(activeService + 1).padStart(2, '0')}
            </span>

            <div className="relative grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mb-8">
                  {(() => { const Icon = SERVICES[activeService].icon; return <Icon size={24} className="text-orange-600" />; })()}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">
                  {SERVICES[activeService].tag}
                </span>
                <h3 className="text-3xl font-black text-gray-900 mb-5">{SERVICES[activeService].title}</h3>
                <p className="text-gray-500 leading-relaxed text-lg mb-8">{SERVICES[activeService].description}</p>
                <a href="#contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all duration-200 text-sm shadow-md shadow-orange-500/20 hover:-translate-y-px">
                  Enquire about this service <ArrowRight size={15} />
                </a>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Capabilities</p>
                <div className="space-y-3">
                  {SERVICES[activeService].capabilities.map(cap => (
                    <div key={cap} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <CheckCircle2 size={16} className="text-orange-500 flex-shrink-0" />
                      <span className="text-sm font-semibold text-gray-700">{cap}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-8">
                  {SERVICES.map((_, i) => (
                    <button key={i} onClick={() => setActiveService(i)}
                      className={`rounded-full transition-all duration-300 ${activeService === i ? 'w-6 h-2 bg-orange-500' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTORS ════════════════════════════════════════════════ */}
      <section id="sectors" className="relative py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="mb-14">
            <div className={pill + ' mb-5'}>Sectors</div>
            <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight text-gray-900">Industries We Serve</h2>
          </div>
          <IndustriesChart />
        </div>
      </section>

      {/* ═══════════ PROCESS ════════════════════════════════════════════════ */}
      <section id="process" className="relative py-32 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            <div>
              <div className={pill + ' mb-6'}>How It Works</div>
              <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight mb-6 text-gray-900">
                From Requirement<br />to Your Door
              </h2>
              <p className="text-gray-500 leading-relaxed text-lg mb-10">
                A streamlined 5-step process that takes your component requirements from specification to global delivery — with full quality oversight at every stage.
              </p>
              <a href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all duration-200 text-sm shadow-md shadow-orange-500/20 hover:-translate-y-px">
                Start your enquiry <ArrowRight size={15} />
              </a>
            </div>
            <ProcessTimeline />
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST ══════════════════════════════════════════════════ */}
      <section className="relative py-32 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-16">
            <div className={pill + ' mb-5 mx-auto w-fit'}>Why Choose Us</div>
            <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight text-gray-900">
              Built on Quality<br /><span className="text-gray-300">&amp; Reliability</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TRUST.map(t => (
              <div key={t.label} className={`group p-8 rounded-2xl ${glass} ${glassHv} text-center cursor-default`}>
                <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-5 group-hover:bg-orange-100 transition-all duration-300">
                  <t.icon size={22} className="text-orange-600" />
                </div>
                <p className="text-3xl font-black text-orange-600 mb-1">{t.value}</p>
                <p className="text-sm font-bold text-gray-900 mb-2">{t.label}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CONTACT ════════════════════════════════════════════════ */}
      <section id="contact" className="relative py-32 bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            <div>
              <div className={pill + ' mb-6'}>Get In Touch</div>
              <h2 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight mb-7 text-gray-900">
                Looking for a<br />Reliable Parts<br />Supplier?
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-12">
                Tell us your requirements. We'll respond with a tailored quote within 1 business day.
              </p>

              <div className="space-y-3">
                {[
                  { icon: Mail,   label: 'Email',   val: 'sales@rzglobalsolutions.co.uk', href: 'mailto:sales@rzglobalsolutions.co.uk' },
                  { icon: Phone,  label: 'Phone',   val: '+44 7436 676209',               href: 'tel:+447436676209'                  },
                  { icon: MapPin, label: 'Address', val: '4th Floor, Silverstream House, 45 Fitzroy Street, London W1T 6EB', href: null },
                ].map(item => (
                  <div key={item.label} className={`flex items-start gap-4 p-4 rounded-2xl ${glass} ${item.href ? glassHv : ''}`}>
                    {item.href ? (
                      <a href={item.href} className="flex items-start gap-4 w-full group">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                          <item.icon size={15} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                          <p className="text-sm font-semibold text-gray-600 group-hover:text-orange-600 transition-colors leading-snug">{item.val}</p>
                        </div>
                      </a>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0">
                          <item.icon size={15} className="text-orange-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{item.label}</p>
                          <p className="text-sm font-semibold text-gray-500 leading-snug">{item.val}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className={`p-8 rounded-2xl ${glass}`}>
              <h3 className="text-xl font-black text-gray-900 mb-7">Send an Enquiry</h3>
              <form ref={formRef}
                onSubmit={e => {
                  e.preventDefault();
                  const d   = new FormData(formRef.current);
                  const sub = `Parts Enquiry — ${d.get('first')} ${d.get('last')}, ${d.get('company')}`;
                  const body = `Name: ${d.get('first')} ${d.get('last')}%0ACompany: ${d.get('company')}%0AEmail: ${d.get('email')}%0A%0ARequirements:%0A${d.get('message')}`;
                  window.location.href = `mailto:sales@rzglobalsolutions.co.uk?subject=${encodeURIComponent(sub)}&body=${body}`;
                }}
                className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[['first','First Name','James'],['last','Last Name','Thornton']].map(([n,l,ph]) => (
                    <div key={n}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{l}</label>
                      <input name={n} type="text" required placeholder={ph}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:bg-white transition-all" />
                    </div>
                  ))}
                </div>
                {[
                  { n:'company', l:'Company',       t:'text',  ph:'Thornton Precision Ltd'         },
                  { n:'email',   l:'Email Address', t:'email', ph:'james@thorntonprecision.co.uk'  },
                ].map(f => (
                  <div key={f.n}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{f.l}</label>
                    <input name={f.n} type={f.t} required placeholder={f.ph}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:bg-white transition-all" />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Requirements</label>
                  <textarea name="message" required rows={4}
                    placeholder="Describe the parts, materials, quantities, and any specific requirements…"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-orange-400 focus:bg-white transition-all resize-none" />
                </div>
                <button type="submit"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-orange-500/20 hover:-translate-y-px text-sm">
                  Send Enquiry →
                </button>
                <p className="text-xs text-gray-400 text-center">We typically respond within 1 business day.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═════════════════════════════════════════════════ */}
      <footer className="relative bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <RZGBLogo size={32} className="shadow-md shadow-orange-600/30" />
                <span className="text-white font-black text-sm tracking-tight">{RZGB_SITE_NAME}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Bridging Indian manufacturing excellence with global industries. Defect-free component parts and precision castings.
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Quick Links</p>
              <div className="grid grid-cols-3 gap-x-10 gap-y-2.5">
                {['About','Services','Sectors','Portfolio','Pricing','Blog','Contact','Facilities','Case Study'].map(l => (
                  <a key={l}
                    href={l === 'About' ? '#about' : l === 'Services' ? '#services' : l === 'Sectors' ? '#sectors' : l === 'Contact' ? '#contact' : '#'}
                    className="text-sm text-gray-500 hover:text-white transition-colors">
                    {l}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">Contact</p>
              <div className="space-y-2.5 text-sm">
                <a href="mailto:sales@rzglobalsolutions.co.uk" className="block text-gray-500 hover:text-orange-400 transition-colors">sales@rzglobalsolutions.co.uk</a>
                <a href="tel:+447436676209" className="block text-gray-500 hover:text-orange-400 transition-colors">+44 7436 676209</a>
                <p className="text-gray-600 leading-snug">4th Floor, Silverstream House<br />45 Fitzroy Street, London W1T 6EB</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-gray-600">
              <span>© {new Date().getFullYear()} {RZGB_LEGAL_NAME}</span>
              <span className="hidden sm:block opacity-50">·</span>
              <span>Registered in England &amp; Wales · No. 16718910</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms</a>
              <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy</a>
              <a href="https://vrocure.co.uk" target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors border border-gray-700 rounded-full px-3 py-1">
                Powered by Vrocure
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
