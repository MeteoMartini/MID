import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const source=fs.readFileSync(path.join(root,'src','SubseasonalTrendPanel.tsx'),'utf8');
const longRange=fs.readFileSync(path.join(root,'src','LongRangePanel.tsx'),'utf8');

const failures=[];
const need=(label,condition)=>{if(!condition)failures.push(label)};

need('SubseasonalTrendPanel muss den kanonischen MID-WindUnit aus weather.ts verwenden.',source.includes("import type {Location,WindUnit} from './weather';"));
need('Default-Windeinheit muss dem kanonischen WindUnit-Wert kn entsprechen.',source.includes("windUnit='kn'"));
need('Veralteter lokaler WindUnit-Wert kt darf nicht als Typdefinition vorkommen.',!source.includes("type WindUnit='kt'"));
need('Niederschlags-Icon muss das tatsächlich exportierte CloudRain verwenden.',source.includes('CloudRain')&&!source.includes('{Cloud,Rain,'));
need('Der kombinierte Tmax/Tmin-Schalter muss einen realen, bereits verwendeten Lucide-Export verwenden.',source.includes("id:'temperature'")&&source.includes('icon:ThermometerSun'));
need('Die zusammengeführte Tmax/Tmin-Ansicht darf keinen veralteten Snowflake-Pflichtimport erzwingen.',!source.includes('{Snowflake,')&&!source.includes(',Snowflake,'));
need('Nicht gelieferte Windböen dürfen im Subseasonal-Trend keinen Daten- oder Icon-Vertrag mehr erzwingen.',!source.includes("id:'gust'")&&!source.includes('wind_gusts_10m_mean')&&!source.includes('Böen'));
need('Lucide-Icon-Typ muss über einen realen Lucide-Komponententyp laufen.',source.includes('icon:typeof ThermometerSun;'));
need('Klimadifferenz muss optionale meanValue-Werte vor der Subtraktion numerisch absichern.',source.includes('Number.isFinite(meanValue)&&Number.isFinite(climateValue)?Number(meanValue)-climateValue'));
need('LongRangePanel muss denselben WindUnit aus weather.ts verwenden.',longRange.includes("import type {Location,WindUnit} from './weather';"));
need('LongRangePanel muss windUnit unverändert an SubseasonalTrendPanel durchreichen.',longRange.includes('windUnit={windUnit}'));
need('Open-Meteo-Metadatenabfrage darf keine nicht existierende Priorität low verwenden.',!source.includes("priority:'low'"));
need('Open-Meteo-Metadatenabfrage muss als nichtkritischer Hintergrundabruf laufen.',source.includes("priority:'background'"));


if(failures.length){
  console.error('MID v0.9.77.5 Trend-14d+-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('MID v0.9.77.10: Trend-14d+-Buildvertrag geschützt (WindUnit, reale Lucide-Exports, kombinierte Tmax/Tmin-Ansicht, keine nicht gelieferten Böen, Nullability).');
