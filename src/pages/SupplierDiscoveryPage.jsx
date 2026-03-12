import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import ControlCentreLayout from '@/components/ControlCentreLayout';
import { fetchDiscoverableSuppliers, fetchSupplierCountries } from '@/services/supplierDiscoveryService';
import {
  Search, MapPin, Globe, Building2, Award, Star, Users,
  ExternalLink, ChevronDown, ChevronUp, Package, Shield,
} from 'lucide-react';

export default function SupplierDiscoveryPage() {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [suppRes, countryRes] = await Promise.all([
      fetchDiscoverableSuppliers({ search: searchTerm, country: countryFilter }),
      fetchSupplierCountries(),
    ]);
    if (suppRes.data) setSuppliers(suppRes.data);
    setCountries(countryRes);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, countryFilter]);

  return (
    <ControlCentreLayout>
      <div className="max-w-6xl mx-auto space-y-5 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">Sourcing</p>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100">Supplier Discovery</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Search and discover suppliers by capability, region, and certification.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 self-start sm:self-auto">
            <Globe size={12} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{suppliers.length} Suppliers</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search by name, capability, certification…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors" />
          </div>
          <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#232329] border border-gray-200 dark:border-[#2e2e35] rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-slate-100">
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading suppliers…</div>
        ) : suppliers.length === 0 ? (
          <div className="py-20 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-gray-500 dark:text-slate-400">No suppliers found.</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-[#232329] rounded-xl overflow-hidden hover:border-orange-300 dark:hover:border-orange-800 transition-colors">
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {(s.company_name || 'S').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{s.company_name}</h3>
                        {s.featured && <Star size={12} className="text-amber-500 flex-shrink-0" />}
                      </div>
                      {s.description && <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-0.5">{s.description}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {s.country && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <MapPin size={10} /> {s.country}
                      </span>
                    )}
                    {s.year_established && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                        Est. {s.year_established}
                      </span>
                    )}
                    {s.employee_count && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 flex items-center gap-1">
                        <Users size={10} /> {s.employee_count}
                      </span>
                    )}
                  </div>

                  {s.certifications?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {s.certifications.slice(0, 4).map((cert, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                          <Shield size={8} /> {cert}
                        </span>
                      ))}
                      {s.certifications.length > 4 && <span className="text-[10px] text-gray-400">+{s.certifications.length - 4}</span>}
                    </div>
                  )}

                  {s.capabilities?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(s.capabilities[0]?.processes || []).slice(0, 3).map((p, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400">{p}</span>
                      ))}
                      {(s.capabilities[0]?.materials || []).slice(0, 2).map((m, i) => (
                        <span key={`m${i}`} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">{m}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 dark:border-[#232329] px-5 py-3 flex items-center justify-between bg-gray-50/50 dark:bg-[#131316]">
                  <span className="text-xs text-gray-400">{s.email}</span>
                  {s.website && (
                    <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
                      Website <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ControlCentreLayout>
  );
}
