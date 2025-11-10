import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import compress from 'vite-plugin-compression';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 90,
        firefox: 90,
        safari: 14,
        edge: 90,
      },
      drafts: {
        customMedia: true,
      },
    },
  },
  
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    cssMinify: 'lightningcss',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'culori': ['culori'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 600,
    reportCompressedSize: true,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
  
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  
  preview: {
    port: 4173,
    host: true,
  },
  
  assetsInclude: ['**/*.glsl'],
  
  optimizeDeps: {
    include: ['three', 'culori'],
    exclude: [],
  },
  
  plugins: [
    compress({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    
    compress({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-img.jpg', 'robots.txt'],
      manifestFilename: 'site.webmanifest',
      workbox: {
        globPatterns: ['**/*.{js,css,html,glsl,jpg,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});
