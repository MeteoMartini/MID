import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {execFileSync} from 'node:child_process';

const reactVendorPattern=/[\\/]node_modules[\\/](?:react|react-dom|react-is|scheduler)[\\/]/;
const chartsVendorPattern=/[\\/]node_modules[\\/](?:recharts|victory-vendor|react-smooth|d3-[^\\/]+|decimal\.js-light|tiny-invariant)[\\/]/;

export default defineConfig({
  plugins:[react(),{name:'mid-verified-brand-shell',buildStart(){execFileSync(process.execPath,['scripts/brand-shell-groups.mjs','--check'],{stdio:'inherit'})}},{
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
      // Export modules are fetched for offline use without eagerly executing them.
      // Their shared map dependencies are already loaded when an export is usable.
      const mapRoot=Object.values(bundle).find(chunk=>chunk.type==='chunk'&&chunk.facadeModuleId?.endsWith('/src/UnifiedWeatherMap.tsx'));
      if(!mapRoot||mapRoot.type!=='chunk')throw new Error('Missing unified map chunk');
      const mapDependencies=new Set<string>();
      const collect=(file:string,set:Set<string>)=>{if(set.has(file))return;set.add(file);const chunk=bundle[file];if(chunk?.type==='chunk')for(const dep of chunk.imports)collect(dep,set)};
      collect(mapRoot.fileName,mapDependencies);
      for(const name of ['cloudWeatherExport','nativeModelMapExport','precipitationTotalsExport']){
        const root=Object.values(bundle).find(chunk=>chunk.type==='chunk'&&chunk.facadeModuleId?.endsWith('/src/'+name+'.ts'));
        if(!root)throw new Error('Missing deferred map exporter: '+name);
        const dependencies=new Set<string>();collect(root.fileName,dependencies);
        for(const file of dependencies)if(!mapDependencies.has(file))files.add(file);
      }

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
