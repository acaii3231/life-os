import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://yqbzqjjnlzghgnrzwppy.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYnpxampubHpnaGducnp3cHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Nzk3NjEsImV4cCI6MjEwNDQ1NTc2MX0.kQ7q8iAxh4JALMoTnmGmUDzdENPscT56s83WMDrwzhQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
