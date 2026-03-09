import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

export default function SearchBar({ onResultSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ orders: [], suppliers: [] });
  const [open, setOpen] = useState(false);
  const containerRef = useRef();

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async (q) => {
    if (!q.trim()) { setResults({ orders: [], suppliers: [] }); return; }
    const { data: orders } = await supabase
      .from('orders')
      .select('id, part_name, ghost_public_name, order_status')
      .or(`part_name.ilike.%${q}%,ghost_public_name.ilike.%${q}%`)
      .limit(6);
    const { data: suppliers } = await supabase
      .from('profiles')
      .select('id, company_name, role')
      .ilike('company_name', `%${q}%`)
      .eq('role', 'supplier')
      .limit(6);
    setResults({ orders: orders || [], suppliers: suppliers || [] });
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    handleSearch(val);
  };

  const handleSelect = (item, type) => {
    setOpen(false);
    setQuery('');
    setResults({ orders: [], suppliers: [] });
    if (onResultSelect) onResultSelect(item, type);
  };

  const hasResults = results.orders.length > 0 || results.suppliers.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto">
      <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm w-full">
        <Search size={16} className="text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400 min-w-0"
          placeholder="Search orders, suppliers..."
          value={query}
          onChange={handleChange}
          onFocus={() => query && setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); setResults({ orders: [], suppliers: [] }); }}>
            <X size={14} className="text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {open && query.length > 0 && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-[300]">
          {/* Orders */}
          <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Orders</div>
          {results.orders.length === 0
            ? <p className="px-4 py-2 text-xs text-slate-400">No orders found</p>
            : results.orders.map(order => (
              <button
                key={order.id}
                onClick={() => handleSelect(order, 'order')}
                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors flex items-center justify-between gap-2"
              >
                <span className="text-sm font-medium text-slate-800 truncate">{order.part_name || order.ghost_public_name || order.id}</span>
                <span className="text-[10px] text-slate-400 shrink-0">{order.order_status}</span>
              </button>
            ))
          }

          {/* Suppliers */}
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-1">Suppliers</div>
          {results.suppliers.length === 0
            ? <p className="px-4 py-2 text-xs text-slate-400 pb-3">No suppliers found</p>
            : results.suppliers.map(supplier => (
              <button
                key={supplier.id}
                onClick={() => handleSelect(supplier, 'supplier')}
                className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-800">{supplier.company_name}</span>
              </button>
            ))
          }

          {!hasResults && (
            <p className="px-4 py-4 text-sm text-slate-400 text-center">No results for "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
}
