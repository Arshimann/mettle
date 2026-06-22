/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** Supabase project URL. Blank in local-first builds — cloud sync is then disabled. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key. Safe to ship in a client app. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected at build time via Vite `define`.
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
