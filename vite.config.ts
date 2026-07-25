import {defineConfig,loadEnv,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';

const CLOUDFLARE_BEACON='https://static.cloudflareinsights.com/beacon.min.js';
function cloudflareWebAnalytics(token:string):Plugin{return{name:'mid-cloudflare-web-analytics',transformIndexHtml(){if(!token)return[];return[{tag:'script',attrs:{type:'module',defer:true,src:CLOUDFLARE_BEACON,'data-cf-beacon':JSON.stringify({token,spa:true})},injectTo:'body'}]}}}

export default defineConfig(({mode})=>{
 const env=loadEnv(mode,'.','');
 const analyticsToken=String(env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN||'').trim();
 return{
  plugins:[react(),cloudflareWebAnalytics(analyticsToken)],
  base:'./',
  build:{target:'es2020',cssCodeSplit:true,sourcemap:false,reportCompressedSize:false,chunkSizeWarningLimit:750}
 };
});
