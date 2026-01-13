import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_URL || '/',
  server: {
    host: "0.0.0.0", // Listen on all network interfaces for mobile access
    port: 8080,
    strictPort: false, // Allow using next available port if 8080 is taken
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
