import {readAppFeatureSources} from './lib/appFeatureSources.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const configPath=new URL('../src/widgetUrlExports.ts',import.meta.url),app=await readAppFeatureSources(),css=await readFile(new URL('../src/styles-src/00-foundation.css',import.meta.url),'utf8');
const probe=`import {readWidgetUrlExportRequest,widgetUrlExportVariants} from ${JSON.stringify(pathToFileURL(configPath.pathname).href)};const variants=widgetUrlExportVariants('https://www.midwx.app/');const legacy=readWidgetUrlExportRequest('https://www.midwx.app/?widget=malatya&ansicht=kurve&tage=5&design=light&farben=ecmwf');console.log(JSON.stringify({variants,parsed:variants.map(item=>readWidgetUrlExportRequest(item.url)),legacy}))`;
const run=spawnSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',probe],{encoding:'utf8'});assert.equal(run.status,0,run.stderr||'Widget-URL-Konfiguration konnte nicht geladen werden.');

const{variants,parsed,legacy}=JSON.parse(run.stdout);
assert.equal(variants.length,12,'Drei Orte × zwei Profile × zwei Themes müssen zwölf URLs ergeben.');

const expectedProfiles=[
 {ansicht:'kurve',view:'curve',tage:7,showWind:true,showRain:true,showSunshine:true,showHazards:false},
 {ansicht:'kompakt',view:'cards',tage:5,showWind:true,showRain:false,showSunshine:false,showHazards:false}
];
for(const slug of['malatya','kuerecik','amari'])for(const theme of['light','dark'])for(const profile of expectedProfiles){
 const variant=variants.find(item=>item.location.slug===slug&&item.view===profile.view&&item.days===profile.tage&&item.theme===theme);
 assert.ok(variant,`URL fehlt: ${slug}/${profile.ansicht}/${profile.tage}/${theme}`);
 assert.match(variant.url,new RegExp(`ansicht=${profile.ansicht}`));
 assert.match(variant.url,/farben=ecmwf/);
 assert.match(variant.url,/wind=1/);
 assert.match(variant.url,new RegExp(`regen=${profile.showRain?1:0}`));
 assert.match(variant.url,new RegExp(`sonne=${profile.showSunshine?1:0}`));
 assert.match(variant.url,/hazards=0/);
 assert.equal(variant.temperatureColors,'ecmwf');
}
assert.deepEqual(variants.map(item=>[item.location.slug,item.location.name,item.location.latitude,item.location.longitude]).filter((row,index,all)=>all.findIndex(candidate=>candidate[0]===row[0])===index),[['kuerecik','Kürecik',38.35,37.79],['malatya','Malatya',38.44,38.09],['amari','Ämari',59.26,24.2]]);
assert.ok(parsed.every((item,index)=>item&&item.location.slug===variants[index].location.slug&&item.view===variants[index].view&&item.days===variants[index].days&&item.theme===variants[index].theme&&item.temperatureColors==='ecmwf'&&item.showWind===variants[index].showWind&&item.showRain===variants[index].showRain&&item.showSunshine===variants[index].showSunshine&&item.showHazards===variants[index].showHazards),'Kanonische URLs werden nicht verlustfrei gelesen.');
assert.deepEqual({showWind:legacy.showWind,showRain:legacy.showRain,showSunshine:legacy.showSunshine,showHazards:legacy.showHazards},{showWind:true,showRain:true,showSunshine:true,showHazards:true},'Nichtkanonische ältere Direkt-URL verliert das bisherige Sichtbarkeitsverhalten.');

assert.match(app,/if\(widgetUrlExport\)return <div className=\{\`app widget-url-export-app/,'Eigene Nur-Widget-Ausgabe fehlt.');
assert.match(app,/showWind:urlExport\.showWind,showRain:urlExport\.showRain,showSunshine:urlExport\.showSunshine,showHazards:urlExport\.showHazards/,'URL-Ausgabe übernimmt die festgelegten Sichtbarkeiten nicht.');
assert.match(css,/\.widget-url-export-app \.widget-controls\{display:none!important\}/,'Bedienelemente werden nicht entfernt.');
assert.match(app,/dataset\.midWidgetReady='pending'/,'Widget-URL meldet den Ladezustand nicht.');
assert.match(app,/dataset\.midWidgetReady='ready'/,'Widget-URL meldet den stabil gerenderten Zustand nicht.');
assert.match(app,/mid:widget-export-ready/,'Widget-URL veröffentlicht kein Bereitschaftsereignis für Automatisierungen.');

console.log('Widget-Live-URLs geprüft: 12 Zielvarianten für Malatya, Kürecik und Ämari in Hell/Dunkel bestanden.');
