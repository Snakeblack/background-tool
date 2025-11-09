export default {
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
  assetsInclude: ['**/*.glsl'],
};
