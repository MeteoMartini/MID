import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [skybar,precipitation,app,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/detailSkyBar.ts'),read('src/precipitation.ts'),read('src/App.tsx'),read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-skybar-sun-cloud-exclusive-097863.mjs';

assert.ok(skybar.includes('const sunBandWidth=(sunshineShare:number)=>{')&&skybar.includes('if(sunshineShare<=.5)return 0;'),'Sonnenband muss bei <=50 % aus bleiben.');
assert.ok(skybar.includes('skybarAboveHalfLevel(sunshineShare)'),'Sonnenband muss 50–100 % auf denselben vier Stufenvertrag abbilden.');
assert.ok(skybar.includes('if(!Number.isFinite(cloud)||cloud<50)return 0;')&&skybar.includes('skybarAboveHalfLevel(cloud/100)'),'Wolkenband muss 50–100 % auf vier Stufen abbilden.');
assert.ok(skybar.includes('if(cloudKnown){')&&skybar.includes('if(daylight&&boundedCloud<50)')&&skybar.includes('if(daylight&&sunshineDirect){'),'Bekannte Gesamtbewölkung muss im Grundband vor dem Sonnenschein-Fallback ausgewertet werden.');
assert.ok(skybar.includes('if(sunshineShare!==null&&Number.isFinite(sunshineShare))return clamp01(sunshineShare);'),'Der eigenständige Sonnenscheindauer-Helfer darf direkte Sonnenscheindauer nicht durch Bewölkung überschreiben.');
assert.ok(skybar.includes('if(daylight&&boundedCloud<50)')&&skybar.includes('const visualSunshine=clamp01(1-boundedCloud/100)'),'Unter 50 % Gesamtbewölkung muss das gelbe Grundband aus dem komplementären Aufklarungsanteil entstehen.');
assert.ok(!skybar.includes('Math.max(sunshineShare,cloudClearShare)'),'Alte Max-Verknüpfung darf Sonne nicht systematisch auf eine zu dicke Stufe heben.');
assert.ok(skybar.includes('if(daylight&&boundedCloud<50)'),'Bekannte Gesamtbewölkung unter 50 % muss tagsüber das gelbe Grundband bestimmen.');
assert.ok(skybar.includes('rawSunshine!==null&&rawSunshine!==undefined')&&!skybar.includes('sunshineDuration??0)/Math.max(60,intervalSeconds)'),'Fehlende Sonnenscheindauer darf nicht als 0 % missinterpretiert werden.');
assert.ok(precipitation.includes('precipitationIntervalStartEpoch?:number;')&&precipitation.includes('precipitationIntervalEndEpoch?:number;'),'PrecipSample muss dargestellte Intervallgrenzen für 1h/3h-Skybar tragen können.');
assert.ok(skybar.includes('explicitEnd>explicitStart?(explicitEnd-explicitStart)/1000')&&skybar.includes('clamp(explicit,60,6*3600)'),'Aggregierte 3h-Sonnenscheindauer muss durch die echte dargestellte Intervalllänge normalisiert werden.');
assert.ok(app.includes('Gesamtbewölkung die primäre Himmelsgröße')&&app.includes('69 % Gesamtbewölkung')&&app.includes('Gelb und Grau werden nie gleichzeitig gezeichnet'),'UI-Hinweis muss den wolkenpriorisierten Klassifikationsvertrag erklären.');
assert.ok(contract.includes('Gesamtbewölkung ist die primäre Himmelsgröße der Skybar')&&contract.includes('69 % Gesamtbewölkung')&&contract.includes('Gelb und Grau bleiben gegenseitig exklusiv'),'Dokumentierter Skybar-Vertrag muss Wolkenpriorität und Exklusivität schützen.');
assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
assert.ok(baseline.regressionTests?.includes(test)&&baseline.requiredRegressionTests?.includes(test),'Neue Skybar-Regression muss in beiden Baseline-Listen stehen.');
console.log(`MID v${pkg.version}: Sonne/Wolken-Skybar nutzt Gesamtbewölkung als primäre, komplementäre 50–100-%-Vierstufenklassifikation; Sonnenscheindauer bleibt Fallback.`);
