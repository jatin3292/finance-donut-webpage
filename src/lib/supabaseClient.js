import { createClient } from '@supabase/supabase-js';

/**
 * Retrieves Supabase URL and Anon Key from localStorage or import.meta.env fallback
 */
export function getSupabaseCredentials() {
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_anon_key');
  
  const url = localUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  return { url: url.trim(), key: key.trim() };
}

/**
 * Checks if Supabase credentials are configured
 */
export function isSupabaseConfigured() {
  const { url, key } = getSupabaseCredentials();
  return url.length > 0 && key.length > 0;
}

let supabaseInstance = null;
let lastUrl = null;
let lastKey = null;

/**
 * Returns a cached or newly created Supabase client instance based on current credentials
 */
export function getSupabaseClient() {
  const { url, key } = getSupabaseCredentials();
  
  if (!url || !key) {
    return null;
  }
  
  // Return cached instance if config has not changed
  if (supabaseInstance && lastUrl === url && lastKey === key) {
    return supabaseInstance;
  }
  
  try {
    supabaseInstance = createClient(url, key);
    lastUrl = url;
    lastKey = key;
    return supabaseInstance;
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
    return null;
  }
}
