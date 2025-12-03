import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import { nitro } from 'nitro/vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

const config = defineConfig({
  build: {
    outDir: 'dist',
  },
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitro(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

export default config
