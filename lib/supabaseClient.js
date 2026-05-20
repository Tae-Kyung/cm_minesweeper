import { createClient } from '@supabase/supabase-js';

const isUrlValid = (url) => {
  try {
    if (!url) return false;
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = isUrlValid(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey && rawKey !== 'your-supabase-anon-public-key' ? rawKey : 'placeholder';

if (!isUrlValid(rawUrl) || !rawKey || rawKey === 'your-supabase-anon-public-key') {
  console.warn(
    'Supabase URL or Anon Key is missing or invalid in .env.local. Leaderboard database features will be disabled.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const isSupabaseConfigured = isUrlValid(rawUrl) && rawKey && rawKey !== 'your-supabase-anon-public-key';
