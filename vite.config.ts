import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// `lovable-tagger` intentionally removed — provide a no-op stub so dev mode keeps working without that package
const componentTagger = (): any => undefined;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
