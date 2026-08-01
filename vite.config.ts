import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins:[react()],
  base:'./',
  build:{
    target:'es2020',
    cssCodeSplit:true,
    cssMinify:'esbuild',
    minify:'esbuild',
    sourcemap:false,
    reportCompressedSize:false,
    chunkSizeWarningLimit:900
  }
});
