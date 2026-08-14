import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [background,app,refresh,weather,guard,twin,verification,baselineRaw,pkgRaw]=await Promise.all([
 readFile(new URL('src/backgroundNetwork.ts',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/eventWeatherRefresh.ts',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/openMeteoGuard.ts',root),'utf8'),
 readFile(new URL('src/twinBackgroundLearning.ts',root),'utf8'),
 readFile(new URL('src/forecastVerification.ts',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('package.json',root),'utf8')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw);
assert.equal(pkg.version,baseline.releaseVersion);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-background-fetch-stability-095318.mjs'));

// Foreground first: solange der sichtbare Core-Forecast nicht erfolgreich ist, darf kein
// automatischer Favoriten-/Eventjob die gemeinsamen Wetterquellen belasten.
assert.match(background,/const DEFAULT_QUIET_MS=45_000/);
assert.match(background,/let foregroundBusy=true/);
assert.match(background,/export function markForegroundNetworkBusy/);
assert.match(background,/export function markForegroundNetworkReady/);
assert.match(background,/export function runBackgroundNetworkTask/);
assert.match(background,/tail\.catch\(\(\)=>undefined\)\.then/,'Hintergrundjobs werden nicht global serialisiert.');
assert.match(app,/abortAllRequests\(\);markForegroundNetworkBusy\(\)/,'Core-Reload setzt die Hintergrundbremse nicht.');
assert.match(app,/setW\(fw\);markForegroundNetworkReady\(\)/,'Erst ein erfolgreicher Core-Forecast gibt Hintergrundnetzwerk frei.');

// Die ab v0.9.53.8 eingeführten aggressiven Event-Poller dürfen nicht zurückkehren.
assert.match(refresh,/const EVENT_STALE_AFTER_MS=60\*60\*1000/);
assert.match(refresh,/const STALE_CHECK_MS=15\*60\*1000/);
assert.match(refresh,/const BACKGROUND_BATCH_LIMIT=4/);
assert.match(refresh,/runBackgroundNetworkTask\('event-weather-auto'/);
assert.match(refresh,/const forceFresh=isManualReason\(reason\)/);
assert.match(refresh,/if\(!manual&&!ids\)targets=targets\.slice\(0,BACKGROUND_BATCH_LIMIT\)/);
assert.match(refresh,/for\(let index=0;index<targets\.length;index\+\+\)/,'Event-Sammelrefresh arbeitet nicht seriell.');
assert.doesNotMatch(refresh,/Promise\.all\(targets\.map\(record=>enqueueEventRefresh/,'Event-Sammelrefresh erzeugt wieder einen Parallelburst.');
assert.doesNotMatch(refresh,/const modelTimer=/,'5-Minuten-Modellpolling je Eventort ist wieder aktiv.');
assert.doesNotMatch(refresh,/const forcedTimer=/,'Erzwungener 30-Minuten-Fullrefresh ist wieder aktiv.');
assert.doesNotMatch(refresh,/bestMatchModelInfo\(sample\.location/,'Automatisches Modellmetadatenpolling je Eventort ist wieder aktiv.');

// Modellmetadaten werden als Aggregat gecacht statt bei jedem Event/Reload erneut in vielen
// Einzelrequests abgefragt zu werden.
assert.match(weather,/const BEST_MATCH_INFO_FRESH_MS=20\*60\*1000/);
assert.match(weather,/const BEST_MATCH_INFO_STALE_MS=6\*3600000/);
assert.match(weather,/const cached=readBestMatchInfoCache\(lat,lon,country\);if\(cached\)return cached/);

// Ein bereits erkanntes 429 überlebt einen PWA-Neustart. Während des Cooldowns geht der
// sichtbare Forecast direkt auf den Worker-/Cachepfad, statt denselben Client erneut zu hämmern.
assert.match(guard,/const COOLDOWN_STORAGE_KEY='mid:open-meteo-cooldown:v1'/);
assert.match(guard,/let cooldownUntil=readPersistedCooldown\(\)/);
assert.match(guard,/export function openMeteoCooldownRetryAt/);
assert.match(weather,/cooldownAt=openMeteoCooldownRetryAt\(\),cooldownActive=cooldownAt>Date\.now\(\)/);
assert.match(weather,/const useDirectFirst=priority==='foreground'&&!cooldownActive/);
assert.match(weather,/if\(cooldownActive\)throw new OpenMeteoRateLimitError\(cooldownAt\)/);

// Wetterzwilling-Favoritenlernen ist wieder Opt-in und, falls bewusst aktiviert, an dieselbe
// globale Hintergrundbremse gekoppelt.
assert.match(verification,/learnAllFavorites:parsed\.learnAllFavorites===true/);
assert.match(verification,/learnAllFavorites:false,privateSensorUrl:''/);
assert.match(app,/runBackgroundNetworkTask\('weather-twin-favorites'/);
assert.match(twin,/priority:'background'/);

console.log(`MID v${pkg.version}: foreground-first Datenabruf, passive Eventpflege und Rate-Limit-Stabilität geprüft.`);
