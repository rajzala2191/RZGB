/**
 * Read-only summary of onboarding_data — used in the platform joinlist page
 * to let super-admins preview what a workspace applicant submitted.
 */
import { Building2, Package, BarChart2, AlertCircle } from 'lucide-react';

const BRAND = '#FF6B35';

const PROCUREMENT_CATEGORIES = [
  { id: 'raw_materials',  label: 'Raw Materials' },
  { id: 'metals',         label: 'Metal & Alloys' },
  { id: 'electronics',    label: 'Electronics & Components' },
  { id: 'plastics',       label: 'Plastics & Polymers' },
  { id: 'chemicals',      label: 'Chemicals' },
  { id: 'packaging',      label: 'Packaging' },
  { id: 'machinery',      label: 'Machinery & Equipment' },
  { id: 'safety',         label: 'Safety & PPE' },
  { id: 'office',         label: 'Office Supplies' },
  { id: 'logistics',      label: 'Logistics & Freight' },
  { id: 'it',             label: 'IT & Technology' },
  { id: 'other',          label: 'Other' },
];

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: 'var(--app-bg)', border: '1px solid var(--edge)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: BRAND }} />
        <span className="text-sm font-bold" style={{ color: 'var(--heading)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-1.5" style={{ borderBottom: '1px solid var(--edge)' }}>
      <span className="text-xs font-semibold w-40 shrink-0" style={{ color: 'var(--caption)' }}>{label}</span>
      <span className="text-xs" style={{ color: 'var(--body)' }}>
        {Array.isArray(value) ? value.join(', ') : value}
      </span>
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) return <span className="text-xs" style={{ color: 'var(--caption)' }}>—</span>;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {items.map(item => (
        <span
          key={item}
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: `${BRAND}18`, color: BRAND, border: `1px solid ${BRAND}40` }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function OnboardingDetailsPanel({ onboardingData }) {
  if (!onboardingData || Object.keys(onboardingData).length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--caption)' }}>
        No onboarding data submitted yet.
      </p>
    );
  }

  const catLabels = (onboardingData.categories || [])
    .map(id => PROCUREMENT_CATEGORIES.find(c => c.id === id)?.label)
    .filter(Boolean);

  return (
    <div>
      <SectionCard icon={Building2} title="Company Profile">
        <Row label="Industry"      value={onboardingData.industry} />
        <Row label="Country"       value={onboardingData.country} />
        <Row label="Company Size"  value={onboardingData.companySize} />
        <Row label="Year Founded"  value={onboardingData.yearFounded} />
      </SectionCard>

      <SectionCard icon={Package} title="What They Procure">
        <div className="py-1">
          <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--caption)' }}>
            Categories
          </span>
          <TagList items={catLabels} />
        </div>
        {(onboardingData.supplierRegions || []).length > 0 && (
          <div className="py-1 mt-2">
            <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--caption)' }}>
              Preferred Regions
            </span>
            <TagList items={onboardingData.supplierRegions} />
          </div>
        )}
      </SectionCard>

      <SectionCard icon={BarChart2} title="Procurement Scale">
        <Row label="Annual Spend"      value={onboardingData.annualSpend} />
        <Row label="Active Suppliers"  value={onboardingData.activeSuppliers} />
        <Row label="Orders / Month"    value={onboardingData.ordersPerMonth} />
      </SectionCard>

      <SectionCard icon={AlertCircle} title="Challenges & Goals">
        {(onboardingData.painPoints || []).length > 0 && (
          <div className="py-1">
            <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--caption)' }}>
              Pain Points
            </span>
            <TagList items={onboardingData.painPoints} />
          </div>
        )}
        <Row label="Current Tools"  value={onboardingData.currentTools} />
        {onboardingData.goals && (
          <div className="pt-2">
            <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--caption)' }}>Goals</span>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--body)' }}>
              {onboardingData.goals}
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
