const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || null;
  const anonKey = process.env.SUPABASE_ANON_KEY || null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || null;

  return {
    url,
    anonKey,
    serviceRoleKey,
    hasBrowserConfig: Boolean(url && anonKey),
    hasAdminConfig: Boolean(url && serviceRoleKey),
  };
}

function createSupabaseAdminClient() {
  const { url, serviceRoleKey, hasAdminConfig } = getSupabaseConfig();

  if (!hasAdminConfig) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

module.exports = {
  getSupabaseConfig,
  createSupabaseAdminClient,
};