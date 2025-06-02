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

supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Auth State Changed: ${event}`, session?.user?.id);
});

export const authHelpers = {
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Get user error:', error);
      throw new Error('Failed to get user');
    }
    return user;
  },

  ensureAuth: async () => {
    const user = await authHelpers.getCurrentUser();
    if (!user) throw new Error('Authentication required');
    return user;
  },

  manageProfile: async (userId, updates) => {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Profile update error:', error);
      throw new Error('Failed to update profile');
    }
    return data;
  }
};

if (import.meta.env.MODE === 'development') {
  (async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Connection test failed:', error);
      } else {
        console.log('✅ Supabase connected successfully');
      }
    } catch (err) {
      console.error('Connection test error:', err);
    }
  })();
}