import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const reactVendorPattern=/[\\/]node_modules[\\/](?:react|react-dom|react-is|scheduler)[\\/]/;
const chartsVendorPattern=/[\\/]node_modules[\\/](?:recharts|victory-vendor|react-smooth|d3-[^\\/]+|decimal\.js-light|tiny-invariant)[\\/]/;

export default defineConfig({
  plugins:[react()],
  base:'./',
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
            {
              // Keep the established eager dashboard/weather core together.
              // Optional WidgetGenerator/MountainWeather are not part of this group.
              name:'index',
              test:/[\\/]src[\\/](?:main|App|weather|ForecastDisplayPrimitives)\.tsx?$/,
              priority:5,
            },
          ],
        },
      },
    },
  },
});
