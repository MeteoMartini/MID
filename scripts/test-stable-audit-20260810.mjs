import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const paths=['package.json','MID_BASELINE.json','src/seasonalForecast.ts','src/LongRangePanel.tsx','src/MeteogramPanel.tsx','src/FlightMeteorologyPanel.tsx','src/App.tsx','src/OperaRasterOverlay.tsx','src/projectedCanvasCache.ts','src/styles.css','worker/metar-proxy.js','scripts/check-dependency-upgrade-policy.mjs','MID_DEPENDENCY_UPGRADE_POLICY.md','ci/github/workflows/dependency-audit.yml','ci/github/workflows/deploy.yml'];
const files=Object.fromEntries(await Promise.all(paths.map(async path=>[path,await readFile(new URL(path,root),'utf8')])));
const pkg=JSON.parse(files['package.json']),baseline=JSON.parse(files['MID_BASELINE.json']);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const reject=(area,text,token)=>{if(text.includes(token))failures.push(`${area} enthält weiterhin: ${token}`)};

// P1 – finaler Release-Stand muss TypeScript und den echten Vite-Produktionsbuild sichtbar ausführen.
need('Buildvertrag',pkg.scripts?.['verify:types']||'','tsc --noEmit -p tsconfig.app.json');
need('Buildvertrag',pkg.scripts?.['verify:types']||'','tsc --noEmit -p tsconfig.node.json');
need('Buildvertrag',pkg.scripts?.['verify:vite']||'','node_modules/vite/bin/vite.js build');
need('Buildvertrag',pkg.scripts?.build||'','npm run verify:types');
need('Buildvertrag',pkg.scripts?.build||'','npm run verify:vite');
need('Verify-Vertrag',pkg.scripts?.verify||'','npm run build');

// P2 – Saisonquellen: gemeinsamer TTL, Stale-if-error und bewusster Refresh statt no-store.
const seasonal=files['src/seasonalForecast.ts'],longRange=files['src/LongRangePanel.tsx'],worker=files['worker/metar-proxy.js'];
need('Seasonal-Cache',seasonal,'SEASONAL_CACHE_TTL_MS=4*60*60*1000');
need('Seasonal-Stale',seasonal,'SEASONAL_STALE_IF_ERROR_MS=36*60*60*1000');
need('Seasonal-Refresh',seasonal,"cache:refresh?'reload':'default'");
need('Seasonal-Refresh',seasonal,'refresh:refresh?1:undefined');
need('Seasonal-UI',longRange,'load(true)');
need('Seasonal-UI',longRange,'Saisonmodelle ausdrücklich aktualisieren');
reject('Seasonal-API',seasonal,"cache:'no-store'");
need('Seasonal-Worker',worker,"refresh=url.searchParams.get('refresh')==='1'");
need('Seasonal-Worker',worker,'seasonalTtl=refresh?0:21600');

// P2 – Druckniveau-Meteogramm: nur hinter progressivem UI, TTL + Stale und kein no-store.
const meteogram=files['src/MeteogramPanel.tsx'],flight=files['src/FlightMeteorologyPanel.tsx'],app=files['src/App.tsx'],styles=files['src/styles.css'];
need('Meteogramm-Cache',meteogram,'METEOGRAM_CACHE_TTL_MS=15*60*1000');
need('Meteogramm-Stale',meteogram,'METEOGRAM_STALE_IF_ERROR_MS=3*60*60*1000');
need('Meteogramm-Workerclient',meteogram,'staleIfErrorMs:METEOGRAM_STALE_IF_ERROR_MS');
need('Meteogramm-Refresh',meteogram,"cache:force?'reload':'default'");
need('Meteogramm-Memo',meteogram,'const MeteogramPanel=memo(');
reject('Meteogramm-Direktabruf',meteogram,"cache:'no-store'");
need('Flugmeteorologie Lazy',flight,"lazy(()=>import('./MeteogramPanel'))");
need('Flugmeteorologie geschlossen',flight,'defaultOpen=false');
need('Flugmeteorologie Viewport',app,'className="flight-meteorology-gate" rootMargin="450px"');
need('Meteogramm Offscreen',styles,'content-visibility:auto');
need('Meteogramm Worker TTL',worker,"max-age=900, stale-while-revalidate=2700");

// P2 – Raster-CPU: fertige projizierte Viewports werden mit Geometrieschlüssel begrenzt gecacht.
const raster=files['src/OperaRasterOverlay.tsx'],canvasCache=files['src/projectedCanvasCache.ts'];
for(const token of ['frame:string','zoom:number','bounds:BoundsLike','width:number','height:number','renderWidth:number','renderHeight:number'])need('Raster-Cache-Key',canvasCache,token);
need('Raster-Cache-Limit',canvasCache,'MAX_PROJECTED_CANVAS_ENTRIES=8');
need('Raster-Pixelbudget',canvasCache,'MAX_PROJECTED_CANVAS_PIXELS=4_500_000');
for(const token of ['getProjectedCanvas','projectedViewportCacheKey','setProjectedCanvas'])need('OPERA Raster-Cache',raster,token);

// P3 – Stable-Abhängigkeiten bleiben fest; Upgrades werden isoliert statt ungeprüft übernommen.
const policy=files['scripts/check-dependency-upgrade-policy.mjs'],policyDoc=files['MID_DEPENDENCY_UPGRADE_POLICY.md'];
for(const token of ["react:'18.3.1'","recharts:'3.10.1'","typescript:'7.0.2'","vite:'6.4.3'"])need('Dependency-Policy',policy,token);
need('Dependency-Dokumentation',policyDoc,'Recharts');
need('Dependency-Dokumentation',policyDoc,'React 19');
need('Dependency-Dokumentation',policyDoc,'TypeScript 7.0.2');
need('Dependency-Dokumentation',policyDoc,'Vite 8');

// Scheduled Release-/Auditjobs müssen explizit Stable prüfen.
need('Dependency-Audit-Workflow',files['ci/github/workflows/dependency-audit.yml'],'ref: mid-stable');
need('Deploy-Workflow',files['ci/github/workflows/deploy.yml'],'ref: mid-stable');

if(pkg.version!==baseline.releaseVersion)failures.push(`Versionsynchronität: ${pkg.version} / ${baseline.releaseVersion}`);
if(!baseline.regressionTests?.includes('scripts/test-stable-audit-20260810.mjs'))failures.push('Stable-Audit-Test fehlt in regressionTests.');
if(!baseline.requiredRegressionTests?.includes('scripts/test-stable-audit-20260810.mjs'))failures.push('Stable-Audit-Test fehlt in requiredRegressionTests.');
if(failures.length){console.error('MID Stable-Audit 10.08.2026 nicht vollständig umgesetzt:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID Stable-Audit 10.08.2026 geprüft: finaler Buildvertrag, Seasonal-/Meteogramm-Caches, progressive Berechnung, projizierter Rastercache, Stable-CI und Dependency-Upgrade-Policy sind geschützt.');
