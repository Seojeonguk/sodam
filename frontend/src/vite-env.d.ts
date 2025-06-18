/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TARGET_URL: string;
  readonly VITE_API_TRANSACTION_SERVICE_PORT: number;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
