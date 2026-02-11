import { createClient } from '@supabase/supabase-js';

// Helper to validate URL
const isValidUrl = (url: string) => {
  try {
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Fallback values to prevent crash if env vars are missing/invalid
const supabaseUrl = isValidUrl(envUrl) ? envUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-key';
const serviceRoleKey = envServiceKey || 'placeholder-service-key';

// For client-side operations (read-only mostly, unless using RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations (bypassing RLS for admin tasks)
// Only use this in server components or API routes
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
