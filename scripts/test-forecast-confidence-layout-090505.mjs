import {readFileSync} from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const cockpit=readFileSync(path.join(root,'src','ForecastCockpit.tsx'),'utf8');
const assessment=readFileSync(path.join(root,'src','ensembleAssessment.ts'),'utf8');
const styles=readFileSync(path.join(root,'src','styles-src','30-modern.css'),'utf8');
const failures=[];
const need=(message,condition)=>{if(!condition)failures.push(message)};

need('Cockpit-Konfidenzbadge darf keine harte Inline-Mindesthöhe mehr erzwingen.',!cockpit.includes('minHeight:36'));
need('Cockpit-Konfidenzbadge muss die Agreement-Klasse für gezielte UI-Steuerung tragen.',cockpit.includes('agreement-${assessment.agreement}'));
need('Meteorologische Konfidenz darf bei schwacher Datenbasis nicht hart auf "mittel" gedeckelt werden.',!assessment.includes("if(dataQuality==='poor')score=Math.min(score,68)"));
need('Datenqualität darf die Gesamtkonfidenz nur weich reduzieren.',assessment.includes("if(dataQuality==='poor')score-=4;")&&assessment.includes("if(dataQuality==='limited')score-=1.5;"));
need('Kompaktes Badge-Grundlayout fehlt.',styles.includes('.cockpit-consistency-pill{display:inline-flex;align-items:center;justify-content:center;justify-self:end;position:relative;flex:0 0 auto;min-width:44px;max-width:58px;min-height:26px;padding:3px 8px'));
need('Der Datenqualitätsring muss über ein Pseudo-Element statt Outline laufen.',styles.includes('.cockpit-consistency-pill.quality-limited:not(.active):not(:focus-visible)::after')&&styles.includes('.consistency-dot.quality-poor:not(:focus-visible)::after'));
need('Finale kompakte 14d-Badge-Override-Regel fehlt.',styles.includes('MID v0.9.78.68 · 14d-Konfidenzbadge kompakt und textfrei kollisionsarm')&&styles.includes('.cockpit-fourteen-card>header>.cockpit-consistency-pill{'));

if(failures.length){
  console.error('test-forecast-confidence-layout-090505 failed');
  for(const failure of failures)console.error(' - '+failure);
  process.exit(1);
}
console.log('test-forecast-confidence-layout-090505 passed');
