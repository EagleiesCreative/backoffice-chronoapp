import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side Supabase client with service role (full admin access)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Client-side Supabase client (limited access for real-time features)
export const createSupabaseClient = () => {
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey) {
        console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY not set, using service key for client');
        return supabaseAdmin;
    }
    return createClient(supabaseUrl, supabaseAnonKey);
};
