import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const reactVendorPattern=/[\\/]node_modules[\\/](?:react|react-dom|react-is|scheduler)[\\/]/;
const chartsVendorPattern=/[\\/]node_modules[\\/](?:recharts|victory-vendor|react-smooth|d3-[^\\/]+|decimal\.js-light|tiny-invariant)[\\/]/;

export default defineConfig({
  plugins:[react(),{
    name:'mid-fourteen-offline-shell',
    transformIndexHtml:{order:'post',handler(_html,ctx){
      if(!ctx.bundle)return;
      const bundle=ctx.bundle,files=new Set<string>();
      const visit=(file:string)=>{
        if(files.has(file))return;
        const chunk=bundle[file];
        if(!chunk)throw new Error('Missing offline module dependency: '+file);
        files.add(file);
        if(chunk.type==='chunk'){
          for(const dep of chunk.imports)visit(dep);
          const metadata=(chunk as typeof chunk & {viteMetadata?:{importedCss:Set<string>}}).viteMetadata;
          for(const css of metadata?.importedCss??[])visit(css);
        }
      };
      const roots=Object.keys(bundle).filter(file=>/^assets\/FourteenDayDevelopment-.*\.js$/.test(file));
      if(roots.length!==1)throw new Error('Expected exactly one deferred fourteen-day module');
      visit(roots[0]);
      // Custom rel does not eagerly execute JS or apply CSS. The established
      // service-worker shell discovers hrefs and validates all before activation.
      return [...files].sort().map(file=>({tag:'link',attrs:{rel:'mid-offline',href:'./'+file},injectTo:'head' as const}));
    }},
  }],
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
