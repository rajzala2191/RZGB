/**
 * FormSection — portal-wide shared form/panel primitives.
 * Import from '@/components/ui/FormSection' anywhere in the portal.
 *
 *  <FormSection title="Order Details" icon={ClipboardList}>
 *    <FormField label="Part Name" required hint="e.g. Aluminium Enclosure V2">
 *      <Input ... />
 *    </FormField>
 *  </FormSection>
 *
 *  <FormSection title="Specs" display>   ← display mode: label becomes small caps
 *    <DisplayField label="Material" value={order.material} />
 *  </FormSection>
 */

import { cn } from '@/lib/utils';

// ─── Card wrapper ────────────────────────────────────────────────────────────
export function FormSection({ title, icon: Icon, children, className, action }) {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl p-6 shadow-sm', className)}>
      {title && (
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {Icon && <Icon size={18} className="text-orange-500" />}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Form input field (label + optional hint) ─────────────────────────────────
export function FormField({ label, required, hint, className, children }) {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-bold text-slate-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// ─── Display field (read-only: small-caps label + value) ─────────────────────
export function DisplayField({ label, value, className, children }) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      {children ?? (
        <p className="text-slate-800 font-medium text-sm">{value || '—'}</p>
      )}
    </div>
  );
}

// ─── Shared input class (apply to <input>, <select>, <textarea>) ─────────────
export const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm px-3 py-2.5 ' +
  'placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20 ' +
  'transition-colors';

// ─── Styled select wrapper ────────────────────────────────────────────────────
export function SelectField({ value, onChange, children, required, placeholder }) {
  return (
    <select
      required={required}
      value={value}
      onChange={onChange}
      className={inputCls}
    >
      {placeholder && <option value="" disabled={!!required}>{placeholder}</option>}
      {children}
    </select>
  );
}

// ─── Styled textarea wrapper ──────────────────────────────────────────────────
export function TextareaField({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(inputCls, 'resize-none')}
    />
  );
}
