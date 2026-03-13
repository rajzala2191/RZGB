import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Menu, X, ChevronRight, Globe, Settings, Factory, Shield, Award, Truck } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Sectors', href: '#sectors' },
  { label: 'Portfolio', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Contact', href: '#contact' },
];

const SERVICES = [
  {
    icon: Settings,
    title: 'Product Development',
    description: 'We don\'t just manufacture — we provide end-to-end solutions from initial design and prototyping through to full-scale production. FAI, PPAP, and specialised surface treatments available.',
  },
  {
    icon: Globe,
    title: 'Global Sourcing & Procurement',
    description: 'Robust, lean sourcing with our verified Indian manufacturer network. We bridge the gap between world-class manufacturing capability and global industry demands.',
  },
  {
    icon: Factory,
    title: 'Component Manufacturing',
    description: 'Durable solutions for heavy-duty industrial use. CNC machined components, precision castings, hydraulic systems, automotive parts, and industrial fixtures — defect-free and on-spec.',
  },
];

const INDUSTRIES = [
  'Automotive & Transport',
  'Railway & Locomotive',
  'Hydraulics & Fluid Systems',
  'Industrial & Machinery',
  'Engineering & Fabrication',
];

const TRUST_PILLARS = [
  {
    icon: Shield,
    title: 'Defect-Free Quality',
    description: 'High-quality, defect-free products backed by rigorous inspection at every stage of the supply chain.',
  },
  {
    icon: Globe,
    title: 'Global Supply Network',
    description: 'Verified manufacturer network across India delivering to clients worldwide with reliable, consistent lead times.',
  },
  {
    icon: Award,
    title: 'Indian Manufacturing Excellence',
    description: 'Bridging world-class Indian precision manufacturing capability with the most demanding global industries.',
  },
];

const FOOTER_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Sectors', href: '#sectors' },
  { label: 'Portfolio', href: '#' },
  { label: 'Facilities', href: '#' },
  { label: 'Case Study', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Contact', href: '#contact' },
];

export default function RZGBLandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = 'RZ Global Solutions | Global Supply of Component Parts & Precision Castings';
    return () => { document.title = 'Zaproc | Manufacturing Procurement Platform'; };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Wordmark */}
            <a href="#" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center">
                <span className="text-white font-black text-sm leading-none">RZ</span>
              </div>
              <div className="leading-none">
                <p className="text-sm font-black text-gray-900 tracking-tight">RZ Global Solutions</p>
                <p className="text-[10px] text-gray-500 font-medium">Precision Parts Supply</p>
              </div>
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                  {l.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <a href="#contact"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
              Get a Quote
            </a>

            {/* Mobile toggle */}
            <button onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                {l.label}
              </a>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <a href="#contact" onClick={() => setMobileOpen(false)}
                className="block text-center px-4 py-2.5 bg-orange-600 text-white text-sm font-bold rounded-lg">
                Get a Quote
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative pt-16 min-h-screen flex items-center bg-slate-900 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        {/* Orange gradient accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-600/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-600/20 border border-orange-600/30 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-xs font-bold text-orange-300 uppercase tracking-widest">Global Supply Partner</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6">
              Global Supply of{' '}
              <span className="text-orange-400">Component Parts</span>{' '}
              &amp; Precision Castings
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl">
              At RZ Global Solutions, we bridge Indian manufacturing excellence with global industries — delivering high-quality, defect-free products backed by reliable global supply.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-orange-600/30 text-base">
                Get a Quote Today
                <ChevronRight size={18} />
              </a>
              <a href="#about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all text-base">
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-800/80 backdrop-blur-sm border-t border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 divide-x divide-slate-700">
              {[
                { label: 'Industries Served', value: '5+' },
                { label: 'Quality Assured', value: 'Defect-Free' },
                { label: 'Supply Reach', value: 'Global' },
              ].map(s => (
                <div key={s.label} className="px-6 py-5 text-center">
                  <p className="text-2xl font-black text-orange-400">{s.value}</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── About ───────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">About Us</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight mb-6">
                Manufacturing Excellence,<br />Delivered Globally
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-6">
                We connect Indian manufacturing excellence with the world's most demanding industries. From automotive parts to industrial fixtures, hydraulic systems, CNC machined components, and precision castings, we provide high-quality, defect-free products backed by reliable global supply.
              </p>
              <p className="text-gray-600 leading-relaxed mb-8">
                Our end-to-end approach covers assembly, prototyping (FAI/PPAP), and specialised surface treatments — ensuring every component meets the precise specifications your operation demands.
              </p>
              <a href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors text-sm">
                Learn More <ChevronRight size={16} />
              </a>
            </div>

            {/* Visual feature block */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Factory, title: 'CNC Machining', desc: 'Precision tolerances to spec' },
                { icon: Settings, title: 'Precision Castings', desc: 'Investment & sand casting' },
                { icon: Truck, title: 'Global Logistics', desc: 'Reliable supply chain' },
                { icon: Shield, title: 'Quality Control', desc: 'Defect-free guarantee' },
              ].map(f => (
                <div key={f.title} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-orange-300 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                    <f.icon size={18} className="text-orange-600" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{f.title}</p>
                  <p className="text-xs text-gray-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────── */}
      <section id="services" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-3">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Our Services</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              End-to-end manufacturing solutions — from product development to global supply.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {SERVICES.map(s => (
              <div key={s.title}
                className="group p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-orange-500/50 transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-orange-600/20 border border-orange-600/30 flex items-center justify-center mb-6">
                  <s.icon size={22} className="text-orange-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm mb-6">{s.description}</p>
                <a href="#contact"
                  className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-sm font-bold transition-colors">
                  See more <ChevronRight size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industries ──────────────────────────────────────── */}
      <section id="sectors" className="py-24 bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-200 mb-3">Sectors</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Industries We Serve</h2>
            <p className="text-orange-100 text-lg max-w-xl mx-auto">
              Supplying precision components to demanding sectors worldwide.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map(ind => (
              <div key={ind}
                className="px-6 py-3 bg-white/15 border border-white/25 text-white font-semibold rounded-full text-sm hover:bg-white/25 transition-colors cursor-default">
                {ind}
              </div>
            ))}
          </div>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Automotive Parts', sub: 'Engine, transmission & body components' },
              { label: 'Industrial Fixtures', sub: 'Jigs, fixtures & tooling hardware' },
              { label: 'Hydraulic Systems', sub: 'Valves, cylinders & manifolds' },
              { label: 'Railway Components', sub: 'Locomotive & rolling stock parts' },
            ].map(c => (
              <div key={c.label} className="p-5 rounded-xl bg-white/10 border border-white/20">
                <p className="font-bold text-white text-sm mb-1">{c.label}</p>
                <p className="text-orange-200 text-xs">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust Pillars ────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">Why Choose Us</p>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Built on Quality & Reliability</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TRUST_PILLARS.map(p => (
              <div key={p.title} className="text-center p-8 rounded-2xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-5">
                  <p.icon size={24} className="text-orange-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-3">{p.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────── */}
      <section id="contact" className="py-24 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">Get In Touch</p>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6">
                Looking for a Reliable Parts Supplier?
              </h2>
              <p className="text-gray-600 leading-relaxed text-lg mb-10">
                Tell us about your requirements and we'll get back to you with a tailored quote. We work with clients across automotive, industrial, hydraulic, and railway sectors.
              </p>

              <div className="space-y-5">
                <a href="mailto:sales@rzglobalsolutions.co.uk"
                  className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-orange-300 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Email</p>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">sales@rzglobalsolutions.co.uk</p>
                  </div>
                </a>

                <a href="tel:+447436676209"
                  className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200 hover:border-orange-300 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">+44 7436 676209</p>
                  </div>
                </a>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-200">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Address</p>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">
                      4th Floor, Silverstream House<br />
                      45 Fitzroy Street, Fitzrovia<br />
                      London W1T 6EB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick enquiry form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h3 className="text-xl font-black text-gray-900 mb-6">Send an Enquiry</h3>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  window.location.href = `mailto:sales@rzglobalsolutions.co.uk?subject=Parts Enquiry`;
                }}
                className="space-y-4"
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">First Name</label>
                    <input type="text" required placeholder="James"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Last Name</label>
                    <input type="text" required placeholder="Thornton"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Company</label>
                  <input type="text" required placeholder="Thornton Precision Ltd"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email</label>
                  <input type="email" required placeholder="james@thorntonprecision.co.uk"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">What do you need?</label>
                  <textarea required rows={4} placeholder="Describe the parts, materials, quantities, and any specific requirements…"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors resize-none" />
                </div>
                <button type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-colors text-sm">
                  Send Enquiry
                </button>
                <p className="text-xs text-gray-400 text-center">We typically respond within 1 business day.</p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Top row */}
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center">
                  <span className="text-white font-black text-sm leading-none">RZ</span>
                </div>
                <span className="text-white font-black text-sm">RZ Global Solutions</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Bridging Indian manufacturing excellence with global industries. High-quality, defect-free component parts and precision castings.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Quick Links</p>
              <div className="grid grid-cols-3 gap-x-8 gap-y-2">
                {FOOTER_LINKS.map(l => (
                  <a key={l.label} href={l.href}
                    className="text-sm text-slate-400 hover:text-orange-400 transition-colors">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Contact</p>
              <div className="space-y-2 text-sm text-slate-400">
                <a href="mailto:sales@rzglobalsolutions.co.uk" className="block hover:text-orange-400 transition-colors">
                  sales@rzglobalsolutions.co.uk
                </a>
                <a href="tel:+447436676209" className="block hover:text-orange-400 transition-colors">
                  +44 7436 676209
                </a>
                <p className="leading-snug text-slate-500">
                  4th Floor, Silverstream House<br />
                  45 Fitzroy Street, London W1T 6EB
                </p>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-slate-500">
              <span>© {new Date().getFullYear()} RZ Global Solutions Limited</span>
              <span className="hidden sm:block">·</span>
              <span>Registered in England & Wales · Company No. 16718910</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Terms & Conditions</a>
              <a href="#" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">Privacy Policy</a>
              <a href="https://zaproc.co.uk" target="_blank" rel="noopener noreferrer"
                className="text-xs text-slate-600 hover:text-slate-500 transition-colors border border-slate-700 rounded-full px-2.5 py-1">
                Powered by Zaproc
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
