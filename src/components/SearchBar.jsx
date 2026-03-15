import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Package, Building2, FileText } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

export default function SearchBar({ onResultSelect, variant = 'default' }) {
  const isPill = variant === 'pill';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ orders: [], suppliers: [], documents: [] });
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef();
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults({ orders: [], suppliers: [], documents: [] }); setSearching(false); return; }
    setSearching(true);
    try {
      const [ordersRes, suppliersRes, docsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, part_name, ghost_public_name, order_status, rz_job_id')
          .or(`part_name.ilike.%${q}%,ghost_public_name.ilike.%${q}%,rz_job_id.ilike.%${q}%`)
          .limit(6),
        supabase
          .from('profiles')
          .select('id, company_name, role')
          .ilike('company_name', `%${q}%`)
          .eq('role', 'supplier')
          .limit(5),
        supabase
          .from('documents')
          .select('id, file_name, order_id')
          .ilike('file_name', `%${q}%`)
          .limit(4),
      ]);
      setResults({
        orders: ordersRes.data || [],
        suppliers: suppliersRes.data || [],
        documents: docsRes.data || [],
      });
    } catch { /* ignore */ } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 200);
  };

  const handleSelect = (item, type) => {
    setOpen(false);
    setQuery('');
    setResults({ orders: [], suppliers: [], documents: [] });
    if (onResultSelect) onResultSelect(item, type);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); }
  };

  const hasResults = results.orders.length > 0 || results.suppliers.length > 0 || results.documents.length > 0;

  const statusColor = (s) => {
    if (!s) return '#94a3b8';
    if (s === 'DELIVERED' || s === 'COMPLETED') return '#22c55e';
    if (s.includes('PENDING') || s === 'PENDING_ADMIN_SCRUB') return '#f59e0b';
    if (s === 'AWARDED') return '#8b5cf6';
    return '#64748b';
  };

  return (
    <div ref={containerRef} className={`relative w-full ${isPill ? 'max-w-xl' : 'max-w-md'} mx-auto`}>
      <div className={`flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full ${isPill ? 'rounded-full py-3 px-5' : 'rounded-lg px-3 py-2 shadow-sm'}`}>
        <Search size={isPill ? 20 : 16} className={`text-slate-400 shrink-0 ${isPill ? 'mr-3' : 'mr-2'}`} />
        <input
          type="text"
          className={`flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 min-w-0 ${isPill ? 'text-base' : 'text-sm'}`}
          placeholder={isPill ? 'Search…' : 'Search orders, suppliers, documents...'}
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {searching && <div className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-1.5" />}
        {query && !searching && (
          <button onClick={() => { setQuery(''); setOpen(false); setResults({ orders: [], suppliers: [], documents: [] }); }}>
            <X size={14} className="text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {open && query.length > 0 && (
        <div className={`absolute left-0 top-full mt-1.5 w-full min-w-[300px] max-h-96 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 z-[300] ${isPill ? 'rounded-xl shadow-sm' : 'rounded-xl shadow-xl'}`}>
          {/* Orders */}
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Package size={10} /> Orders
          </div>
          {results.orders.length === 0
            ? <p className="px-4 py-2 text-xs text-slate-400">No orders found</p>
            : results.orders.map(order => (
              <button
                key={order.id}
                onClick={() => handleSelect(order, 'order')}
                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">
                    {order.part_name || order.ghost_public_name || order.id?.slice(0, 8)}
                  </span>
                  {order.rz_job_id && (
                    <span className="text-[10px] text-slate-400 font-mono">{order.rz_job_id}</span>
                  )}
                </div>
                <span
                  className="text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded"
                  style={{ color: statusColor(order.order_status), background: `${statusColor(order.order_status)}15` }}
                >
                  {order.order_status?.replace(/_/g, ' ')}
                </span>
              </button>
            ))
          }

          {/* Suppliers */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-700 mt-1 flex items-center gap-1.5">
            <Building2 size={10} /> Suppliers
          </div>
          {results.suppliers.length === 0
            ? <p className="px-4 py-2 text-xs text-slate-400">No suppliers found</p>
            : results.suppliers.map(supplier => (
              <button
                key={supplier.id}
                onClick={() => handleSelect(supplier, 'supplier')}
                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors flex items-center gap-2"
              >
                <Building2 size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{supplier.company_name}</span>
              </button>
            ))
          }

          {/* Documents */}
          {results.documents.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 dark:border-slate-700 mt-1 flex items-center gap-1.5">
                <FileText size={10} /> Documents
              </div>
              {results.documents.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => handleSelect(doc, 'document')}
                  className="w-full text-left px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors flex items-center gap-2"
                >
                  <FileText size={14} className="text-slate-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.file_name}</span>
                </button>
              ))}
            </>
          )}

          {!hasResults && !searching && (
            <p className="px-4 py-4 text-sm text-slate-400 text-center">No results for &ldquo;{query}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
