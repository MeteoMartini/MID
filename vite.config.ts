import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

function midVendorChunk(id:string){
  const normalized=id.replace(/\\/g,'/');
  if(!normalized.includes('/node_modules/'))return undefined;
  // React bleibt ein kleiner, stabil cachebarer Kern statt Teil des großen App-Chunks.
  if(/\/node_modules\/(?:react|react-dom|react-is|scheduler)\//.test(normalized))return 'ReactVendor';
  // Recharts und seine Diagramm-Helfer werden gemeinsam geteilt. Das vermeidet Hoisting
  // in den Hauptchunk, wenn sowohl Hauptansicht als auch lazy Ensemblemodule Diagramme nutzen.
  if(/\/node_modules\/(?:recharts|victory-vendor|react-smooth|d3-[^/]+|decimal\.js-light|tiny-invariant)\//.test(normalized))return 'ChartsVendor';
  // MapLibre wird absichtlich NICHT manuell gechunkt. Die bestehende dynamische Karten-
  // Importgrenze bleibt dadurch erhalten und MapLibre wird nicht beim App-Start vorab geladen.
  return undefined;
}

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
    chunkSizeWarningLimit:900,
    rollupOptions:{
      output:{
        manualChunks:midVendorChunk
      }
    }
  }
});
