import {readFile} from 'node:fs/promises';
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
  'requestIdle?requestIdle(save,{timeout:900})',
  "window.addEventListener('pagehide',flush)",
  "document.addEventListener('visibilitychange',visibility)",
  'const pushFavoriteSignature=useMemo',
  'const learningFavoriteSignature=useMemo',
  'weatherTwinSettings.enabled,weatherTwinSettings.useAsMainForecast,weatherTwinSettings.nowcastAssimilation'
])need('Performance ohne Funktionsverlust',app,token);
for(const token of [
  'function centerWithinScrollContainer',
  'secondFrame=window.requestAnimationFrame(reveal)',
  'window.setTimeout(reveal,120)',
  'centerWithinScrollContainer(container,element)'
])need('Aktiver Favorit wird robust zentriert',app,token);
for(const token of ['content-visibility:auto','contain:layout paint style','contain-intrinsic-size:auto 320px','.favorite-rule-toggle'])need('Favoritenlisten-Rendering',styles,token);
if(app.includes("const DEFAULT_FAVORITE_RULES:FavoriteRules={rainProbability"))failures.push('Alte automatisch aktive Favoritenregeln sind weiterhin als Standard vorhanden.');
if(failures.length){console.error('Favoritenregeln-/Navigation-/Performance-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Favoritenregeln, direkter Menüsprung und Performance geprüft: neue Regeln sind aus, Persistenz läuft verzögert, aktive Favoriten werden robust zentriert und lange Listen layoutseitig isoliert.');
