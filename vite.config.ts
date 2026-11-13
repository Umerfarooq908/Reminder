import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Reminder/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: "index.src.html",
    },
  },
});
