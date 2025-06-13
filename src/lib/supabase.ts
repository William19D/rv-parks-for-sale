import { createClient } from '@supabase/supabase-js';

// Environment variables should be used in a real application
// For development, we'll use direct values from env variables if available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anonymous Key is missing from environment variables');
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
