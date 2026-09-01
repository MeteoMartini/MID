import fs from 'node:fs';
import path from 'node:path';

const source=fs.readFileSync(path.join(process.cwd(),'src','LongRangePanel.tsx'),'utf8');

const checks=[
  ['live c3s models filtered',source.includes("const liveC3sModels=data?.c3sModels.filter(item=>item.numericalState==='live')??[];")],
  ['catalogue-only count tracked',source.includes('const catalogueOnlyCount=Math.max(0,(data?.c3sModels.length??0)-liveC3sModels.length);')],
  ['c3s run summary shown',source.includes('const c3sRunSummary=[...new Set(liveC3sModels.map(item=>item.currentRun).filter(Boolean))].join(\' · \');')],
  ['c3s section renamed to numeric models',source.includes('<h4>Numerische Saisonmodelle</h4>')],
  ['catalogue entries hidden from active strip',source.includes('MID blendet reine Katalogeinträge aus')],
  ['per-model run label displayed',source.includes('item.currentRun?`Stand ${item.currentRun}`:item.gridLabel')]
];

const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('Long-range model source regression failed:');
  failed.forEach(([label])=>console.error(` - ${label}`));
  process.exit(1);
}

console.log('Long-range model source regression passed with',checks.length,'checks.');
