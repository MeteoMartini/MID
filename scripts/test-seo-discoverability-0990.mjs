import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [html,robots,sitemap,cname,manifestText,pkgText,baselineText]=await Promise.all([
 read('index.html'),read('public/robots.txt'),read('public/sitemap.xml'),read('public/CNAME'),read('public/manifest.webmanifest'),read('package.json'),read('MID_BASELINE.json')
]);
const failures=[];
const need=(label,source,token)=>{if(!source.includes(token))failures.push(`${label}: ${token}`)};
need('Canonical URL',html,'<link rel="canonical" href="https://www.midwx.app/">');
need('Indexfreigabe',html,'<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">');
need('Meta-Beschreibung',html,'<meta name="description" content="MID ist ein kostenloses, responsives Wetterdashboard');
need('OpenGraph-URL',html,'<meta property="og:url" content="https://www.midwx.app/">');
need('Strukturierte Daten',html,'"@type":"WebApplication"');
need('Statischer Fallback',html,'<noscript><main');
if(/noindex/i.test(html))failures.push('index.html enthält unerwartet noindex.');
need('robots Allow',robots,'User-agent: *\nAllow: /');
need('robots Sitemap',robots,'Sitemap: https://www.midwx.app/sitemap.xml');
need('Sitemap Canonical',sitemap,'<loc>https://www.midwx.app/</loc>');
if((sitemap.match(/<url>/g)||[]).length!==1)failures.push('Sitemap soll genau die kanonische App-URL enthalten.');
if(cname.trim()!=='www.midwx.app')failures.push('CNAME muss www.midwx.app enthalten.');
const manifest=JSON.parse(manifestText),pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);
if(manifest.id!=='./'||manifest.start_url!=='./'||manifest.scope!=='./')failures.push('Manifest-ID, Start-URL und Scope müssen GitHub-Pages-kompatibel auf ./ zeigen.');
if(pkg.version!=='0.9.9.0'||baseline.releaseVersion!=='0.9.9.0')failures.push('SEO-Releaseversion ist nicht synchronisiert.');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('MID v0.9.9.0 Suchmaschinen-Discoverability geprüft.');
