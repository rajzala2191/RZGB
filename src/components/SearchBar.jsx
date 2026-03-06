import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

export default function SearchBar({ onResultSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ orders: [], suppliers: [], documents: [] });
  const [open, setOpen] = useState(false);
  const inputRef = useRef();

  const handleSearch = async (q) => {
    if (!q) {
      setResults({ orders: [], suppliers: [], documents: [] });
      return;
    }
    // Orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, part_name, ghost_public_name, order_status, created_at')
      .or(`part_name.ilike.%${q}%,ghost_public_name.ilike.%${q}%,id.ilike.%${q}%`)
      .limit(8);
    // Suppliers (profiles)
    const { data: suppliers } = await supabase
      .from('profiles')
      .select('id, company_name, role')
      .ilike('company_name', `%${q}%`)
      .eq('role', 'supplier')
      .limit(8);
    // Documents (optional, placeholder)
    setResults({ orders: orders || [], suppliers: suppliers || [], documents: [] });
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
    setResults({ orders: [], suppliers: [], documents: [] });
    if (onResultSelect) onResultSelect(item, type);
  };

  return (
    <div className="relative w-full max-w-md sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
      <div className="flex items-center bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm w-full">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 min-w-0"
          placeholder="Search orders, suppliers..."
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && (query.length > 0) && (
        <div className="absolute left-0 mt-2 w-full max-h-96 overflow-y-auto bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 sm:w-screen sm:left-1/2 sm:-translate-x-1/2">
          <div className="p-2 text-xs text-gray-500 font-semibold">Orders</div>
          <ul>
            {results.orders.length === 0 && <li className="px-4 py-2 text-gray-400">No orders found</li>}
            {results.orders.map(order => (
              <li key={order.id} className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/10 cursor-pointer" onClick={() => handleSelect(order, 'order')}>
                <span className="font-medium text-gray-800 dark:text-gray-100">{order.part_name || order.ghost_public_name || order.id}</span>
                <span className="ml-2 text-xs text-gray-400">{order.order_status}</span>
              </li>
            ))}
          </ul>
          <div className="p-2 text-xs text-gray-500 font-semibold">Suppliers</div>
          <ul>
            {results.suppliers.length === 0 && <li className="px-4 py-2 text-gray-400">No suppliers found</li>}
            {results.suppliers.map(supplier => (
              <li key={supplier.id} className="px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-900/10 cursor-pointer" onClick={() => handleSelect(supplier, 'supplier')}>
                <span className="font-medium text-gray-800 dark:text-gray-100">{supplier.company_name}</span>
              </li>
            ))}
          </ul>
          {/* Documents section can be added here if needed */}
        </div>
      )}
    </div>
  );
}
