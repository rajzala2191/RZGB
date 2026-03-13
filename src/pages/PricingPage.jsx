import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, X, Zap, Shield, Building2, ArrowRight,
  Users, FileText, BarChart2, GitBranch, Globe,
  Lock, Download, Webhook, Crown, ArrowLeft,
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import { useTheme } from '@/contexts/ThemeContext';

const BRAND = '#FF6B35';

const PLAN_COLORS = { orange: BRAND, blue: '#3b82f6', purple: '#8b5cf6' };

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For growing procurement teams',
    price: 299,
    period: '/mo',
    cta: 'Start Free Trial',
    accent: 'orange',
    icon: Zap,
    highlights: ['Up to 5 users', '50 orders/month', 'Basic procurement workflow'],
    features: {
      'Procurement Core': {
        'RFQ creation & intake': true,
        'Supplier assignment': true,
        'Order lifecycle tracking': true,
        'Document management': true,
        'AI drawing sanitisation': true,
        'Competitive bidding engine': false,
        'Multi-lot RFQ': false,
        'RFQ templates': false,
      },
      'Purchase Orders': {
        'PO creation & PDF export': true,
        'PO issue & acknowledge': true,
        'PO amendments': false,
        'Blanket/framework POs': false,
      },
      'Finance': {
        'Invoice submission': true,
        'Invoice approve/reject': true,
        'Payment milestones': false,
        'Spend analytics': false,
        'Credit notes': false,
      },
      'Governance': {
        'Basic role controls': true,
        'Activity logs': true,
        'Approval workflows': false,
        'Threshold-based approvals': false,
        'Audit trail export': false,
        'MFA enforcement': false,
        'SSO/SAML': false,
      },
      'Sourcing': {
        'Supplier profiles': true,
        'Supplier scorecard': false,
        'Supplier discovery': false,
        'Capability matching': false,
      },
      'Integrations': {
        'Email notifications': true,
        'Slack notifications': false,
        'Webhook/API access': false,
        'ERP connectors': false,
      },
      'Support': {
        'In-app support tickets': true,
        'Email support': true,
        'Priority support': false,
        'Dedicated CSM': false,
      },
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For scaling procurement operations',
    price: 1499,
    period: '/mo',
    cta: 'Start Free Trial',
    accent: 'blue',
    icon: Shield,
    popular: true,
    highlights: ['Up to 25 users', 'Unlimited orders', 'Governance Pack included'],
    features: {
      'Procurement Core': {
        'RFQ creation & intake': true,
        'Supplier assignment': true,
        'Order lifecycle tracking': true,
        'Document management': true,
        'AI drawing sanitisation': true,
        'Competitive bidding engine': true,
        'Multi-lot RFQ': true,
        'RFQ templates': true,
      },
      'Purchase Orders': {
        'PO creation & PDF export': true,
        'PO issue & acknowledge': true,
        'PO amendments': true,
        'Blanket/framework POs': false,
      },
      'Finance': {
        'Invoice submission': true,
        'Invoice approve/reject': true,
        'Payment milestones': true,
        'Spend analytics': true,
        'Credit notes': true,
      },
      'Governance': {
        'Basic role controls': true,
        'Activity logs': true,
        'Approval workflows': true,
        'Threshold-based approvals': true,
        'Audit trail export': false,
        'MFA enforcement': false,
        'SSO/SAML': false,
      },
      'Sourcing': {
        'Supplier profiles': true,
        'Supplier scorecard': true,
        'Supplier discovery': true,
        'Capability matching': true,
      },
      'Integrations': {
        'Email notifications': true,
        'Slack notifications': true,
        'Webhook/API access': false,
        'ERP connectors': false,
      },
      'Support': {
        'In-app support tickets': true,
        'Email support': true,
        'Priority support': true,
        'Dedicated CSM': false,
      },
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For regulated, high-volume procurement',
    price: null,
    priceLabel: 'Custom',
    period: '/year',
    cta: 'Contact Sales',
    accent: 'purple',
    icon: Building2,
    highlights: ['Unlimited users', 'Compliance Pack', 'Dedicated support'],
    features: {
      'Procurement Core': {
        'RFQ creation & intake': true,
        'Supplier assignment': true,
        'Order lifecycle tracking': true,
        'Document management': true,
        'AI drawing sanitisation': true,
        'Competitive bidding engine': true,
        'Multi-lot RFQ': true,
        'RFQ templates': true,
      },
      'Purchase Orders': {
        'PO creation & PDF export': true,
        'PO issue & acknowledge': true,
        'PO amendments': true,
        'Blanket/framework POs': true,
      },
      'Finance': {
        'Invoice submission': true,
        'Invoice approve/reject': true,
        'Payment milestones': true,
        'Spend analytics': true,
        'Credit notes': true,
      },
      'Governance': {
        'Basic role controls': true,
        'Activity logs': true,
        'Approval workflows': true,
        'Threshold-based approvals': true,
        'Audit trail export': true,
        'MFA enforcement': true,
        'SSO/SAML': true,
      },
      'Sourcing': {
        'Supplier profiles': true,
        'Supplier scorecard': true,
        'Supplier discovery': true,
        'Capability matching': true,
      },
      'Integrations': {
        'Email notifications': true,
        'Slack notifications': true,
        'Webhook/API access': true,
        'ERP connectors': true,
      },
      'Support': {
        'In-app support tickets': true,
        'Email support': true,
        'Priority support': true,
        'Dedicated CSM': true,
      },
    },
  },
];

const ACCENT_MAP = {
  orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-500', light: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400' },
  blue:   { bg: 'bg-blue-600',   hover: 'hover:bg-blue-500',   light: 'bg-blue-50 dark:bg-blue-950/30',     border: 'border-blue-200 dark:border-blue-800',     text: 'text-blue-600 dark:text-blue-400' },
  purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-500', light: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400' },
};

const CATEGORY_ICONS = {
  'Procurement Core': FileText,
  'Purchase Orders': FileText,
  'Finance': BarChart2,
  'Governance': GitBranch,
  'Sourcing': Globe,
  'Integrations': Webhook,
  'Support': Users,
};

function FeatureCheck({ included }) {
  return included
    ? <Check size={16} className="text-emerald-500" />
    : <X size={16} className="text-gray-300 dark:text-gray-600" />;
}

export default function PricingPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const allCategories = Object.keys(PLANS[0].features);

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <PublicNav activePage="pricing" />

      <div className="relative overflow-hidden">
        {/* Header background */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 70% 50% at 50% -10%, rgba(255,107,53,0.12) 0%, transparent 70%)` }} />
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${BRAND}60, transparent)` }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: BRAND }}>Pricing</p>
            <h1 className="text-4xl sm:text-5xl font-black mb-4" style={{ color: 'var(--heading)' }}>
              Procurement governance that{' '}
              <span style={{ background: `linear-gradient(135deg, ${BRAND} 0%, #fb923c 40%, #8b5cf6 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                scales with you
              </span>
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--body)' }}>
              From first RFQ to enterprise compliance. Reduce procurement risk, accelerate sourcing cycles, and prove ROI with every order.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className="text-sm font-semibold" style={{ color: !annual ? 'var(--heading)' : 'var(--caption)' }}>Monthly</span>
              <button onClick={() => setAnnual(!annual)}
                className="w-12 h-6 rounded-full transition-all relative"
                style={{ background: annual ? BRAND : 'var(--edge-strong)', boxShadow: annual ? `0 0 12px rgba(255,107,53,0.4)` : 'none' }}>
                <span className="absolute top-1 w-4 h-4 rounded-full transition-all" style={{ background: '#fff', left: annual ? 28 : 4 }} />
              </button>
              <span className="text-sm font-semibold" style={{ color: annual ? 'var(--heading)' : 'var(--caption)' }}>
                Annual <span className="text-emerald-500 text-xs font-bold ml-1">Save 20%</span>
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {PLANS.map((plan, i) => {
              const planColor = PLAN_COLORS[plan.accent];
              const a = ACCENT_MAP[plan.accent];
              const displayPrice = plan.price ? (annual ? Math.round(plan.price * 0.8) : plan.price) : null;
              return (
                <motion.div key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
                  className="relative rounded-2xl p-6 sm:p-8 flex flex-col backdrop-blur-xl cursor-default"
                  style={plan.popular ? {
                    background: isDark ? 'rgba(59,130,246,0.06)' : 'var(--surface)',
                    border: `2px solid ${planColor}`,
                    boxShadow: `0 0 0 1px ${planColor}20, 0 16px 50px ${planColor}18`,
                  } : {
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--surface)',
                    border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid var(--edge)',
                    boxShadow: isDark ? '0 4px 40px rgba(0,0,0,0.25)' : '0 2px 20px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Top color accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: planColor }} />

                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold text-white px-4 py-1.5 rounded-full"
                        style={{ background: planColor, boxShadow: `0 4px 12px ${planColor}50` }}>
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6 mt-2">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: `${planColor}15`, border: `1px solid ${planColor}25` }}>
                      <plan.icon size={20} style={{ color: planColor }} />
                    </div>
                    <h3 className="text-xl font-black" style={{ color: 'var(--heading)' }}>{plan.name}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--body)' }}>{plan.tagline}</p>
                  </div>

                  <div className="mb-6">
                    {displayPrice !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black" style={{ color: 'var(--heading)' }}>${displayPrice.toLocaleString()}</span>
                        <span className="text-sm" style={{ color: 'var(--caption)' }}>{plan.period}</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black" style={{ color: 'var(--heading)' }}>{plan.priceLabel}</span>
                        <span className="text-sm" style={{ color: 'var(--caption)' }}>{plan.period}</span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.highlights.map((h, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--body)' }}>
                        <Check size={16} className="text-emerald-500 flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.id === 'enterprise' ? (
                    <a href="mailto:sales@rzglobalsolutions.co.uk?subject=Zaproc%20Enterprise%20plan%20inquiry"
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                      style={{ background: planColor, boxShadow: `0 4px 16px ${planColor}35` }}>
                      {plan.cta} <ArrowRight size={14} />
                    </a>
                  ) : (
                    <button onClick={() => navigate('/login')}
                      className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-1"
                      style={{ background: planColor, boxShadow: `0 4px 16px ${planColor}35` }}>
                      {plan.cta} <ArrowRight size={14} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>

        <div className="text-center mb-8">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="text-sm font-bold text-orange-500 hover:text-orange-400 transition-colors"
          >
            {showMatrix ? 'Hide' : 'Show'} full feature comparison
          </button>
        </div>

        {showMatrix && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--edge)' }}>
                    <th className="text-left p-4 w-1/4 text-xs uppercase" style={{ color: 'var(--caption)' }}>Feature</th>
                    {PLANS.map(p => (
                      <th key={p.id} className="p-4 text-center">
                        <span className={`text-sm font-bold ${ACCENT_MAP[p.accent].text}`}>{p.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allCategories.map(cat => {
                    const CatIcon = CATEGORY_ICONS[cat] || FileText;
                    const featureKeys = Object.keys(PLANS[0].features[cat]);
                    return (
                      <React.Fragment key={cat}>
                        <tr style={{ background: 'var(--surface-raised)' }}>
                          <td colSpan={4} className="p-3 pl-4">
                            <span className="text-xs font-bold uppercase flex items-center gap-2" style={{ color: 'var(--body)' }}>
                              <CatIcon size={12} /> {cat}
                            </span>
                          </td>
                        </tr>
                        {featureKeys.map(feat => (
                          <tr key={feat} className="border-t hover:opacity-90" style={{ borderColor: 'var(--edge)' }}>
                            <td className="p-3 pl-6" style={{ color: 'var(--body)' }}>{feat}</td>
                            {PLANS.map(p => (
                              <td key={p.id} className="p-3 text-center">
                                <FeatureCheck included={p.features[cat][feat]} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 relative rounded-2xl p-8 sm:p-12 max-w-4xl mx-auto overflow-hidden text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--edge)' }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,107,53,0.1) 0%, transparent 70%)` }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${BRAND}, transparent)` }} />
          <div className="relative">
            <Crown size={32} className="mx-auto mb-4" style={{ color: BRAND }} />
            <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: 'var(--heading)' }}>
              Need a{' '}
              <span style={{ background: `linear-gradient(135deg, ${BRAND}, #fb923c)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                custom solution?
              </span>
            </h2>
            <p className="mb-8 max-w-lg mx-auto" style={{ color: 'var(--body)' }}>
              Enterprise procurement teams with complex compliance requirements, ERP integration needs, or multi-site operations — let's talk.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                <button onClick={() => navigate('/request-demo')}
                  className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: BRAND, boxShadow: `0 4px 16px rgba(255,107,53,0.35)` }}>
                  Request Demo
                </button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }}>
                <a href="mailto:sales@rzglobalsolutions.co.uk"
                  className="px-8 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ background: 'var(--surface-raised)', color: 'var(--heading)', border: '1px solid var(--edge)' }}>
                  Talk to Sales
                </a>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Lock, title: 'Prevent unauthorized approvals', desc: 'Threshold-based approval chains ensure the right people sign off on every purchase.' },
            { icon: Shield, title: 'Audit-ready compliance', desc: 'Every decision traced. Export full audit trails for ISO 9001, AS9100, and internal reviews.' },
            { icon: BarChart2, title: 'Prove procurement ROI', desc: 'Spend analytics, bid savings, and cycle-time dashboards built for CFO conversations.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="text-center p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-center justify-center mx-auto mb-4">
                <item.icon size={20} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--heading)' }}>{item.title}</h3>
              <p className="text-xs" style={{ color: 'var(--body)' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}
