import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [vite,audit,install,rechartsTest,baselineText]=await Promise.all([
  read('vite.config.ts'),
  read('ci/github/workflows/dependency-audit.yml'),
  read('ci/github/workflows/install-mid.yml'),
  read('scripts/test-maintenance-recharts3-cache-ci-08260.mjs'),
  read('MID_BASELINE.json')
]);
const baseline=JSON.parse(baselineText);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(area+': '+token)};

for(const token of ['manualChunks:midVendorChunk',"return 'ReactVendor'","return 'ChartsVendor'"])need('Vite-Chunking',vite,token);
if(/return ['"]MapLibre/i.test(vite))failures.push('Vite-Chunking: MapLibre wurde in einen erzwungenen Vendor-Chunk verschoben; die bestehende Lazy-Grenze muss erhalten bleiben.');
for(const token of ['npm-audit-full.json','if: always()','actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a','npm run audit:all'])need('Dependency-Audit',audit,token);
for(const token of ['statuses: write','ls-remote --heads origin refs/heads/mid-stable',"'context': 'MID / stable-release-quality'",'/statuses/${stable_sha}'])need('Stable-SHA',install,token);
if(rechartsTest.includes('Recharts 3.8.1 ist nicht reproduzierbar festgeschrieben.'))failures.push('Recharts-Wartungstest blockiert weiterhin kompatible 3.x-Patch-/Minor-Updates durch einen historischen Versionsliteral.');
need('Recharts-Wartungstest',rechartsTest,'lockedRechartsVersion!==rechartsVersion');
if(!baseline.regressionTests?.includes('scripts/test-stable-release-hardening-095357.mjs'))failures.push('Stable-Hardening-Regression fehlt im Baseline-Vertrag.');

if(failures.length){console.error('MID Stable-Hardening aus v0.9.53.57 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID Stable-Hardening aus v0.9.53.57: Vendor-Chunking, vollständiger Auditbericht, finaler Stable-SHA-Status und Recharts-3-Kompatibilitätsvertrag geprüft.');
