/* eslint-disable no-undef */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "")

  return {
    plugins: [react(), tailwindcss()],
    define: {
      global: "globalThis",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: env.VITE_DEV_SERVER_HOST || "0.0.0.0",
      port: 25174,
      proxy: {
        "/files": env.VITE_DEV_FILES_PROXY_TARGET || "http://localhost:28080",
      },
    },
  }
})
