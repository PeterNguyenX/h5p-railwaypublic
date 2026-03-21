import { createClient } from '@supabase/supabase-js';
import { hasSupabaseBrowserConfig, runtimeConfig } from '../../config/runtime';

export const supabase = hasSupabaseBrowserConfig
  ? createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabaseAnonKey)
  : null;