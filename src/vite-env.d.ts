/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Blank in local-first builds — cloud sync is then disabled. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key. Safe to ship in a client app. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
