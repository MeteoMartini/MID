import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const reactVendorPattern=/[\\/]node_modules[\\/](?:react|react-dom|react-is|scheduler)[\\/]/;
const chartsVendorPattern=/[\\/]node_modules[\\/](?:recharts|victory-vendor|react-smooth|d3-[^\\/]+|decimal\.js-light|tiny-invariant)[\\/]/;

export default defineConfig({
  plugins:[react()],
  base:'./',
  server:{
    port:5000,
    strictPort:true,
    watch:{ignored:['**/.git/**','**/node_modules/**','**/.local/**','**/.agents/**','**/dist/**']},
  },
  build:{
    target:'es2020',
    cssCodeSplit:true,
    cssMinify:'lightningcss',
    minify:'oxc',
    sourcemap:false,
    reportCompressedSize:false,
    chunkSizeWarningLimit:900,
    rolldownOptions:{
      output:{
        codeSplitting:{
          groups:[
            {
              name:'ReactVendor',
              test:reactVendorPattern,
              priority:20,
            },
            {
              name:'ChartsVendor',
              test:chartsVendorPattern,
              priority:10,
            },
          ],
        },
      },
    },
  },
});
