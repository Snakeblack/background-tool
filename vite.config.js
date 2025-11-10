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
        chrome: 107,
        firefox: 104,
        safari: 16,
        edge: 107,
      },
      drafts: {
        customMedia: true,
      },
    },
    devSourcemap: false,
  },
  
  build: {
    target: ['chrome107', 'edge107', 'firefox104', 'safari16'],
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'three';
            if (id.includes('culori')) return 'culori';
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    chunkSizeWarningLimit: 600,
    reportCompressedSize: false,
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
    modulePreload: {
      polyfill: true,
    },
  },
  
  server: {
    port: 3000,
    open: true,
    host: true,
    warmup: {
      clientFiles: [
        './main.js',
        './scripts/ColorManager.js',
        './scripts/Renderer.js',
        './scripts/ShaderManager.js',
      ],
    },
  },
  
  preview: {
    port: 4173,
    host: true,
  },
  
  assetsInclude: ['**/*.glsl'],
  
  optimizeDeps: {
    include: ['three', 'culori'],
    exclude: [],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  
  resolve: {
    extensions: ['.js', '.glsl', '.json'],
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
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'logo-img.jpg', 'robots.txt'],
      manifestFilename: 'site.webmanifest',
      workbox: {
        globPatterns: ['**/*.{js,css,html,glsl,jpg,svg,woff2}'],
      },
    }),
  ],
});
