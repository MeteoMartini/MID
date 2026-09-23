import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [logic,risk,shortTerm,current,anchor,pictogram,app,source,aggregate,cockpit]=await Promise.all([
 read('src/visibilityPhenomena.ts'),
 read('src/shortTermFogRisk.ts'),
 read('src/ShortTermForecast.tsx'),
 read('src/currentConditions.ts'),
 read('src/forecastLocalAnchor.ts'),
 read('src/WeatherPictogram.tsx'),
 read('src/App.tsx'),
 read('src/weather-src/10-observations-specialized.tsfrag'),
 read('src/weather.ts'),
 read('src/ForecastCockpit.tsx')
]);

const need=(name,text,token)=>assert.ok(text.includes(token),name+': '+token);
const reject=(name,text,token)=>assert.ok(!text.includes(token),name+': '+token);

need('WMO-Grenze streng unter 1000 m',logic,'visibility<1000');
reject('Kein <=1000-Nebelvertrag',logic,'visibility<=1000');
need('DWD feuchter Dunst bis 8 km',logic,"visibility<=8000&&wet===true");
need('DWD trockener Dunst bis 5 km',logic,"visibility<=5000&&wet===false");
need('Feuchteklassifikation ab 80 %',logic,'humidity>=80');
need('ww05',logic,"code===5");
need('ww10',logic,"code===10");
need('ww11',logic,"code===11");
need('ww12',logic,"code===12");
need('ww40',logic,"code===40");
need('ww41',logic,"code===41");
need('MIFG',logic,"MIFG");
need('BCFG',logic,"BCFG");
need('PRFG',logic,"PRFG");
need('VCFG',logic,"VCFG");
need('FG-Sichtkonflikt',logic,"return visibility<1000");
need('Bodennebel-Ausnahme',logic,'if(report.geometryException)return true');
need('Kein erfundener Reifnebel',logic,"const freezing=modelFreezingFog");

reject('Alte 2,5-km-Nebelkulanzen entfernt',shortTerm,'vis<=2500');
need('Kurzfrist nutzt zentralen Vertrag',shortTerm,'classifyVisibilityPhenomenon');
need('Sondernebel nur kurz aus beobachtetem Anker',shortTerm,'[11,12,40,41].includes(observed)&&offsetMinutes<=30');
need('Aktuell nutzt zentralen Vertrag',current,'classifyVisibilityPhenomenon');
reject('Temperatur erzeugt keinen Reifnebel',current,'temperature<=0?48:45');
need('Lokale Meldung mit Vertrauen',anchor,'trustedPresentWeather');
need('Lokale Meldung geographisch begrenzt',anchor,'localLimitKm');
need('Lokale Meldung wird geparst',anchor,'parseReportedVisibilityPhenomenon');

need('METAR Deskriptoren MI BC PR',source,'TS|SH|FZ|MI|BC|PR');
need('DWD numerische ww übernommen',source,'numericVisibility');
need('Sichtmeldungen lokalitätsgefiltert',source,'visibilityPresentWeatherLimitMeters');
need('Stundenwerte appweit klassifiziert',aggregate,'visibilityState=classifyVisibilityPhenomenon');
for(const token of ["5:'Trockener Dunst'","10:'Feuchter Dunst'","11:'Bodennebel'","12:'Bodennebel / Nebelbänke'"])need('DWD-Sichtlabel',aggregate,token);

need('Haze-Piktogramm',pictogram,"if(c===5)return'haze'");
need('Mist-Piktogramm',pictogram,"if(c===10)return'mist'");
need('Bodennebel-Piktogramm',pictogram,"if(c===11||c===12)return'fog'");
need('METAR Sondernebel-Piktogramme',pictogram,"has('MIFG')||has('BCFG')||has('PRFG')||has('VCFG')");
need('Aktuelle Meldung qualifiziert',app,'currentVisibilityReportTrusted');
need('Aktuelle Sichtmeldung zentral klassifiziert',app,'classifyVisibilityPhenomenon');

need('Risiko unterscheidet Phänomene',risk,"kind:'fog'|'mist'|'haze'|'restricted-visibility'|'fog-risk'|'none'");
need('Feuchter Dunst im Risikomodul',risk,"reason=phenomenon.label");
need('Nebelrisiko bleibt Prognoserisiko',risk,"reason='Nebelrisiko'");
need('UI neutral Sichttrübung',cockpit,"label:'Sichttrübung'");
need('UI Sichtweite + Sichttrübung',cockpit,'Sichtweite + Sichttrübung');
reject('UI pauschal Nebel/Sicht',cockpit,"label:'Nebel/Sicht'");

console.log('WMO/DWD-Sichtvertrag statisch geschützt: Nebel <1000 m; feuchter/trockener Dunst; Bodennebel/Nebelbänke nur aus vertrauenswürdiger lokaler Meldung.');
