import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!supabaseServiceKey) missing.push('VITE_SUPABASE_SERVICE_ROLE_KEY');
  
  console.error(`
    ❌ Missing Supabase environment variables: ${missing.join(', ')}
    Please check your .env file and ensure:
    1. All variables are correctly spelled
    2. .env file is in the root directory
    3. You've restarted the development server
  `);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: localStorage,
    flowType: 'pkce'
  },
  db: { schema: 'public' },
  realtime: { params: { eventsPerSecond: 10 } }
});

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// باقي الكود كما هو في ملفك