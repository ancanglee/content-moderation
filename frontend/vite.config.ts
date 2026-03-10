import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { Agent } from "node:http";

// 创建不走系统代理的 HTTP Agent，确保 Vite proxy → 后端 不经过 http_proxy
const directAgent = new Agent();

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8001",
        agent: directAgent,
      },
      "/ws": {
        target: "ws://localhost:8001",
        ws: true,
        agent: directAgent,
      },
    },
  },
});
