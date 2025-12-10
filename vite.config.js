import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import compress from 'vite-plugin-compression';
import fs from 'fs';
import path from 'path';

const copyWasmPlugin = () => {
  return {
    name: 'copy-wasm-files',
    buildStart() {
      const src = path.resolve(process.cwd(), 'node_modules/@litertjs/core/wasm');
      const dest = path.resolve(process.cwd(), 'public/wasm');
      
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
        console.log('Copied LiteRT WASM files to public/wasm');
      } else {
        console.warn('LiteRT WASM source not found at ' + src);
      }
    }
  }
}

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
            if (id.includes('three/build/three.webgpu.js')) return 'three-webgpu';
            if (id.includes('three/build/three.tsl.js')) return 'three-tsl';
            if (id.includes('three')) return 'three-core';
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
    chunkSizeWarningLimit: 1000,
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
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
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
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
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
    copyWasmPlugin(),
  ],
});
