import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arolzvuvrabpdakgwyjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb2x6dnV2cmFicGRha2d3eWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Mzc1NDYsImV4cCI6MjA4NjMxMzU0Nn0.osMpya0wKqzqloHsSYwcH_M-9Fa87ZTAtdwv1JnBPu8';

// iOS Safari (especially private browsing) throws SecurityError on localStorage access.
// This safe wrapper prevents auth failures caused by storage restrictions on iOS.
const safeStorage = {
  getItem: (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* silent fail on iOS private mode */ }
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); } catch { /* silent fail on iOS private mode */ }
  },
};

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
