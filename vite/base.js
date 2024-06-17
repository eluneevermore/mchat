import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const URL_PREFIX = ''

const BACKEND_TARGET = `http://localhost:10008`

export const base = ({
  base: URL_PREFIX,

  plugins: [
    react(),
  ],

  publicDir: 'public',

  resolve: {
    alias: {
      frontend: '/frontend',
      backend: '/backend',
    },
  },

  server: {
    port: 8080,
    open: true,
    proxy: {
      [`^${URL_PREFIX}/(api|socket.io)`]: {
        ws: true,
        target: BACKEND_TARGET,
      },
    },
  },

  build: {
    assetsDir: '',
    outDir: 'dist',
    emptyOutDir: false,
  },
})

// https://vitejs.dev/config/
export default defineConfig(() => {
  return base
})
