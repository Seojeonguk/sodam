/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_TRANSACTION_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
