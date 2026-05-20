import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE || 
  process.env.SUPABASE_ANON_KEY || 
  ''
).trim();

export const isConfigured = supabaseUrl && supabaseKey && !supabaseUrl.includes('your-') && supabaseKey.startsWith('eyJ');

export const supabase = isConfigured 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
