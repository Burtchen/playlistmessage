import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
  },
  // The project keeps JSX in `.js` files; tell esbuild to treat them as JSX.
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
    },
  },
  // Temporary shim so existing `process.env.PUBLIC_URL` references keep working
  // until they are replaced with Vite-native asset handling.
  define: {
    "process.env.PUBLIC_URL": '""',
  },
});
