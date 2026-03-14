import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const VITE_PORT = Number(env.VITE_PORT ?? 8082);
  const API_PORT = Number(env.API_PORT ?? 3001);
  return {
    server: {
      host: "0.0.0.0",
      port: VITE_PORT,
      proxy: {
        '/api': {
          target: `http://localhost:${API_PORT}`,
          changeOrigin: true,
        },
        '/statements': {
          target: `http://localhost:${API_PORT}`,
          changeOrigin: true,
        },
        '/uploads': {
          target: `http://localhost:${API_PORT}`,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
