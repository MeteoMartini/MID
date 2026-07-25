import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
var CLOUDFLARE_BEACON = 'https://static.cloudflareinsights.com/beacon.min.js';
function cloudflareWebAnalytics(token) { return { name: 'mid-cloudflare-web-analytics', transformIndexHtml: function () { if (!token)
        return []; return [{ tag: 'script', attrs: { type: 'module', defer: true, src: CLOUDFLARE_BEACON, 'data-cf-beacon': JSON.stringify({ token: token, spa: true }) }, injectTo: 'body' }]; } }; }
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, '.', '');
    var analyticsToken = String(env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN || '').trim();
    return {
        plugins: [react(), cloudflareWebAnalytics(analyticsToken)],
        base: './',
        build: { target: 'es2020', cssCodeSplit: true, sourcemap: false, reportCompressedSize: false, chunkSizeWarningLimit: 750 }
    };
});
