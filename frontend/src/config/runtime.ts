export const runtimeConfig = {
  apiUrl: process.env.REACT_APP_API_URL || '/api',
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
  figmaDesignUrl:
    process.env.REACT_APP_FIGMA_DESIGN_URL ||
    'https://www.figma.com/make/2p6TjAZfhuelcAGHTeUGGR/Simple-UX-UI-Design?t=OYLkPDDV7LYgImpn-1',
};

export const hasSupabaseBrowserConfig = Boolean(
  runtimeConfig.supabaseUrl && runtimeConfig.supabaseAnonKey
);