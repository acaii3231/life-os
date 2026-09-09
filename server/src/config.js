import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3030,
  supabaseUrl: process.env.SUPABASE_URL || 'https://yqbzqjjnlzghgnrzwppy.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxYnpxampubHpnaGducnp3cHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Nzk3NjEsImV4cCI6MjEwNDQ1NTc2MX0.kQ7q8iAxh4JALMoTnmGmUDzdENPscT56s83WMDrwzhQ',
  jwtSecret: process.env.JWT_SECRET || 'life_os_super_secret_jwt_key_venom_2026',
};
