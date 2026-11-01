import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const [app,styles]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
  'type FavoriteRules={enabled:boolean;',
  'const DEFAULT_FAVORITE_RULES:FavoriteRules={enabled:false',
  'function legacyFavoriteRulesEnabled',
  'enabled:legacyFavoriteRulesEnabled(rules)',
  "if(!favorite.rules?.enabled)return[]",
  'checked={Boolean(item.rules.enabled)}',
  'Numerische Regeln aktivieren',
  "{item.rules.enabled&&<div className=\"favorite-rules\">"
])need('Persönliche Regeln standardmäßig aus',app,token);
for(const token of [
  'favoritesPersistRef=useRef(favorites)',
  'persistFavoriteSnapshot(cleaned);setFavoritesState(cleaned)',
  "window.addEventListener('pagehide',flush)",
  "document.addEventListener('visibilitychange',visibility)",
  'const pushFavoriteSignature=useMemo',
  'const learningFavoriteSignature=useMemo',
  'weatherTwinSettings.enabled,weatherTwinSettings.useAsMainForecast,weatherTwinSettings.nowcastAssimilation'
])need('Performance ohne Funktionsverlust',app,token);
for(const token of [
  'function centerWithinScrollContainer',
  'function useActiveItemReveal',
  'new ResizeObserver(schedule)',
  'observer.observe(elementRef.current)',
  'void fonts?.ready.then(schedule)',
  'centerWithinScrollContainer(container,element)'
])need('Aktiver Favorit wird robust zentriert',app,token);
if(app.includes('timers=[0,70,180,360,650].map'))failures.push('Alte Timer-Kaskade für den Favoritensprung ist weiterhin vorhanden.');
for(const token of ['content-visibility:auto','contain:layout paint style','contain-intrinsic-size:auto 320px','.favorite-rule-toggle'])need('Favoritenlisten-Rendering',styles,token);
if(app.includes("const DEFAULT_FAVORITE_RULES:FavoriteRules={rainProbability"))failures.push('Alte automatisch aktive Favoritenregeln sind weiterhin als Standard vorhanden.');

const extract=(name)=>{
 const start=app.indexOf('function '+name+'(');
 assert.ok(start>=0,'Original source function missing: '+name);
 const end=app.indexOf('\n}',start);
 assert.ok(end>start,'Original source function boundary missing: '+name);
 return app.slice(start,end+2);
};
const executable=[
 extract('finiteProvidedNumber'),extract('legacyFavoriteRulesEnabled'),extract('favoriteRuleAlerts'),
 'globalThis.__audit={legacyFavoriteRulesEnabled,favoriteRuleAlerts};'
].join('\n');
const sandbox={
 DEFAULT_FAVORITE_RULES:{rainProbability:50,gustKt:35,frostC:0,heatC:30},
 currentIndex:()=>0,
};
vm.runInNewContext(transformSync(executable,{loader:'ts',format:'iife',target:'es2022'}).code,sandbox);
const {legacyFavoriteRulesEnabled,favoriteRuleAlerts}=sandbox.__audit;
assert.equal(legacyFavoriteRulesEnabled({rainProbability:null,gustKt:undefined,frostC:'',heatC:false}),false,'No missing legacy threshold can enable weather rules');
assert.equal(legacyFavoriteRulesEnabled({rainProbability:0}),true,'Explicit real zero may activate a deliberate zero-threshold rule');
assert.equal(legacyFavoriteRulesEnabled({enabled:false,rainProbability:0}),false,'Explicit user-disabled state remains authoritative');
const rules={enabled:true,rainProbability:0,gustKt:0,frostC:0,heatC:20};
assert.equal(favoriteRuleAlerts({rules},[{probability:null,gust:null,temperature:null}]).length,0,'A wholly missing hour must never synthesize a 0%-rain, 0-kt wind or freezing alert');
assert.equal(favoriteRuleAlerts({rules},[{probability:undefined,gust:Number.NaN,temperature:undefined}]).length,0,'Undefined/NaN is not a real weather observation');
const actual=Array.from(favoriteRuleAlerts({rules},[{probability:null,gust:null,temperature:null},{probability:0,gust:0,temperature:0},{probability:87,gust:45,temperature:29}]));
assert.ok(actual.includes('Niederschlag bis 87 %'),'Mixed valid/missing hours preserve real PoP maxima');
assert.ok(actual.includes('Böen bis 45 kt'),'Mixed valid/missing hours preserve real gust maxima');
assert.ok(actual.includes('Temperatur bis 0 °C'),'Valid freezing minima are not discarded');
assert.ok(actual.includes('Temperatur bis 29 °C'),'Valid heat maxima are not discarded');
const invalid=favoriteRuleAlerts({rules},[{probability:-1,gust:-3,temperature:Number.NaN}]);
assert.equal(invalid.length,0,'Negative, physically invalid forecast probabilities/gusts cannot create alerts');

if(failures.length){console.error('Favoritenregeln-/Navigation-/Performance-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Favoritenregeln, direkter Menüsprung und Performance geprüft: neue Regeln sind aus, Favoriten persistieren sofort, aktive Favoriten werden robust zentriert und lange Listen layoutseitig isoliert.');
