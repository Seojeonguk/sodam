import { defineConfig, loadEnv  } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({mode}) => {

  const env = loadEnv(mode, process.cwd(), '');

  return {plugins: [react()],
    server: {
    proxy: {
      '/api/transactions': { // /api로 시작하는 모든 요청을 프록시
        target: `${env.VITE_API_TARGET_URL}:${env.VITE_API_TRANSACTION_SERVICE_PORT}` || 'http://localhost:10001',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // /api를 제거하고 백엔드로 전달
      },
    },
  },
}
});
