import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {omitNativeOnlyAppIconCopies} from './scripts/lib/nativeOnlyWebAssets.mjs';

const reactVendorPattern=/[\\/]node_modules[\\/](?:react|react-dom|react-is|scheduler)[\\/]/;
const chartsVendorPattern=/[\\/]node_modules[\\/](?:recharts|victory-vendor|react-smooth|d3-[^\\/]+|decimal\.js-light|tiny-invariant)[\\/]/;

function nativeOnlyIconCopies():Plugin{
 let nativeIconRoot=process.cwd(),nativeIconOutput='dist';
 return {name:'mid-native-only-icon-copies',apply:'build',configResolved(config){nativeIconRoot=config.root;nativeIconOutput=resolve(config.root,config.build.outDir)},async writeBundle(){const omitted=await omitNativeOnlyAppIconCopies(nativeIconRoot,nativeIconOutput);console.log('Native-only master copies omitted from web: '+omitted.reduce((sum,item)=>sum+item.bytes,0)+' B; source and iOS masters unchanged.')}};
}

export default defineConfig({
  plugins:[react(),nativeOnlyIconCopies(),{name:'mid-verified-brand-shell',buildStart(){execFileSync(process.execPath,['scripts/brand-shell-groups.mjs','--check'],{stdio:'inherit'})}},{
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
      // Pollen is optional and now deferred; keep its module install-cached so
      // enabling it for the first time offline does not fail to load its code.
      const pollenRoots=Object.values(bundle).filter(chunk=>chunk.type==='chunk'&&chunk.facadeModuleId?.endsWith('/src/PollenForecast.tsx'));
      if(pollenRoots.length!==1)throw new Error('Expected exactly one deferred pollen module');
      visit(pollenRoots[0].fileName);
      // Cache the deferred system controls so repair and rollback also open offline.
      const systemRoot=Object.values(bundle).find(chunk=>chunk.type==='chunk'&&chunk.facadeModuleId?.endsWith('/src/SystemUpdateManager.tsx'));
      if(!systemRoot)throw new Error('Missing deferred system update controls');
      visit(systemRoot.fileName);
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
