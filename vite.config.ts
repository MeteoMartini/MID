import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins:[react()],
  base:'./',
  build:{
    target:'es2020',
    cssCodeSplit:true,
    sourcemap:false,
    reportCompressedSize:false,
    chunkSizeWarningLimit:750,
    rollupOptions:{
      output:{
        manualChunks(id){
          if(id.indexOf('node_modules')<0)return;
          if(id.indexOf('recharts')>=0||id.indexOf('d3-')>=0)return 'charts';
          if(id.indexOf('leaflet')>=0)return 'maps';
          if(id.indexOf('html-to-image')>=0)return 'export';
          if(id.indexOf('jsfive')>=0)return 'hdf5';
          if(id.indexOf('react-dom')>=0||id.indexOf('/react/')>=0)return 'react-vendor';
          if(id.indexOf('lucide-react')>=0)return 'icons';
          return 'vendor';
        }
      }
    }
  }
});
