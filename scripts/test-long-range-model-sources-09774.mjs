import fs from 'node:fs';
import path from 'node:path';

const panel=fs.readFileSync(path.join(process.cwd(),'src','LongRangePanel.tsx'),'utf8');
const comparison=fs.readFileSync(path.join(process.cwd(),'src','LongRangeModelComparison.tsx'),'utf8');
const seasonal=fs.readFileSync(path.join(process.cwd(),'src','seasonalForecast.ts'),'utf8');

const checks=[
  ['poor mans ensemble uses every loaded model family once',panel.includes('Poor-Man’s-Ensemble')&&panel.includes('eine Stimme je numerisch verfügbarer Modellfamilie')],
  ['all loaded model families feed the combined months',panel.includes("buildCombinedMonths(models,'temperature')")&&panel.includes("buildCombinedMonths(models,'precipitation')")],
  ['single-model overlay receives complete point model list',panel.includes('<LongRangeModelComparison models={models}/>')],
  ['overlay explicitly shows all available numerical models',comparison.includes('alle verfügbaren numerischen Modelle')&&comparison.includes('series:ModelSeries[]=models.map')],
  ['catalogue-only model cards removed from panel',!panel.includes('C3S-Vergleich')&&!panel.includes('Numerische Saisonmodelle')&&!panel.includes('catalogueOnlyCount')&&!panel.includes('long-range-gateway-status')],
  ['selected-model card carousel removed',!panel.includes('mid:long-range:selected-model')&&!panel.includes('mid:long-range:model-scroll')],
  ['seasonal source contract keeps catalogue entries internal',seasonal.includes('reine Katalogeinträge bleiben intern und werden nicht als Modellkarte dargestellt')],
  ['actual c3s model families remain available to the loader',seasonal.includes("freshModels.push(...c3s.models)")]
];

const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('Long-range model source regression failed:');failed.forEach(([label])=>console.error(` - ${label}`));process.exit(1)}
console.log('Long-range model source regression passed with',checks.length,'checks.');
