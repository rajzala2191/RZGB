import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arolzvuvrabpdakgwyjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb2x6dnV2cmFicGRha2d3eWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3Mzc1NDYsImV4cCI6MjA4NjMxMzU0Nn0.osMpya0wKqzqloHsSYwcH_M-9Fa87ZTAtdwv1JnBPu8';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
