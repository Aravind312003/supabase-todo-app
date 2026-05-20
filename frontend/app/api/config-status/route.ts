import { NextResponse } from 'next/server';
import { isConfigured } from '@/lib/supabase';

export async function GET() {
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_SERVICE_ROLE || 
    process.env.SUPABASE_ANON_KEY || 
    ''
  ).trim();

  let keyType = "None";
  if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE) {
    keyType = "Service Role";
  } else if (process.env.SUPABASE_ANON_KEY) {
    keyType = "Anon/Public";
  }

  const isDemoMode = !isConfigured;

  return NextResponse.json({
    supabaseConfigured: isConfigured,
    connectionVerified: isConfigured,
    isDemoMode,
    url: isDemoMode ? 'Demo Server' : supabaseUrl,
    urlSet: !!supabaseUrl && !supabaseUrl.includes('your-'),
    keySet: !!supabaseKey && supabaseKey.startsWith('eyJ'),
    keyType,
    reason: isDemoMode ? "Configuration missing or invalid." : null,
    backend: "Next.js API"
  });
}
