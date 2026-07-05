import { defineConfig } from "vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
  ],
  define: {
    global: "globalThis",
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  optimizeDeps: {
    include: ["buffer"],
  },
});
