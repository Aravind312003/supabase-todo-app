import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (
  process.env.NEXT_PUBLIC_SUPABASE_URL || ''
).trim();

const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
).trim();

export const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-') &&
  supabaseAnonKey.startsWith('eyJ');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;