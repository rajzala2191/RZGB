import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, X, Zap, Shield, Building2, ArrowRight,
  Users, FileText, BarChart2, GitBranch, Globe,
  Lock, Download, Webhook, Crown,
} from 'lucide-react';

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
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  const allCategories = Object.keys(PLANS[0].features);

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg, #ffffff)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">

        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3">Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-slate-100 mb-4">
            Procurement governance that<br />scales with your business
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 max-w-2xl mx-auto">
            From first RFQ to enterprise compliance. Reduce procurement risk, accelerate sourcing cycles, and prove ROI with every order.
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-semibold ${!annual ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`w-12 h-6 rounded-full transition-colors relative ${annual ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${annual ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-semibold ${annual ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400'}`}>
              Annual <span className="text-emerald-500 text-xs font-bold">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, i) => {
            const a = ACCENT_MAP[plan.accent];
            const displayPrice = plan.price ? (annual ? Math.round(plan.price * 0.8) : plan.price) : null;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white dark:bg-[#18181b] border rounded-2xl p-6 sm:p-8 flex flex-col ${
                  plan.popular ? 'border-blue-400 dark:border-blue-600 shadow-lg shadow-blue-500/10' : 'border-gray-200 dark:border-[#232329]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold bg-blue-600 text-white px-4 py-1 rounded-full">Most Popular</span>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${a.light} ${a.border} border`}>
                    <plan.icon size={18} className={a.text} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-slate-100">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{plan.tagline}</p>
                </div>

                <div className="mb-6">
                  {displayPrice !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900 dark:text-slate-100">${displayPrice.toLocaleString()}</span>
                      <span className="text-sm text-gray-400">{plan.period}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-900 dark:text-slate-100">{plan.priceLabel}</span>
                      <span className="text-sm text-gray-400">{plan.period}</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.highlights.map((h, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-slate-300">
                      <Check size={16} className="text-emerald-500 flex-shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate(plan.id === 'enterprise' ? '/how-it-works' : '/login')}
                  className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] ${a.bg} ${a.hover}`}
                >
                  {plan.cta} <ArrowRight size={14} className="inline ml-1" />
                </button>
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
            className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#232329]">
                    <th className="text-left p-4 w-1/4 text-gray-400 dark:text-slate-500 text-xs uppercase">Feature</th>
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
                        <tr className="bg-gray-50 dark:bg-[#131316]">
                          <td colSpan={4} className="p-3 pl-4">
                            <span className="text-xs font-bold text-gray-600 dark:text-slate-400 uppercase flex items-center gap-2">
                              <CatIcon size={12} /> {cat}
                            </span>
                          </td>
                        </tr>
                        {featureKeys.map(feat => (
                          <tr key={feat} className="border-t border-gray-100 dark:border-[#232329] hover:bg-gray-50/50 dark:hover:bg-[#232329]/50">
                            <td className="p-3 pl-6 text-gray-700 dark:text-slate-300">{feat}</td>
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

        <div className="mt-16 text-center">
          <div className="bg-gray-50 dark:bg-[#131316] border border-gray-200 dark:border-[#232329] rounded-2xl p-8 sm:p-12 max-w-3xl mx-auto">
            <Crown size={32} className="mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-black text-gray-900 dark:text-slate-100 mb-3">
              Need a custom solution?
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6 max-w-lg mx-auto">
              Enterprise procurement teams with complex compliance requirements, ERP integration needs, or multi-site operations — let's talk.
            </p>
            <button
              onClick={() => navigate('/how-it-works')}
              className="px-8 py-3 rounded-xl text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors active:scale-[0.98]"
            >
              Talk to Sales
            </button>
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
              <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-2">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
