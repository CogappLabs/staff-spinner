import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import path from "node:path"; // ESM-compatible import

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Alias @ to src directory
    },
  },
});
