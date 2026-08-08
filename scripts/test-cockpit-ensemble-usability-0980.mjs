import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [cockpit,ensemble,styles,app,pkg,baseline]=await Promise.all([
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/EnsemblePanel.tsx',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8')
]);

assert.match(cockpit,/Nächste 90 Minuten/,'90-Minuten-Schnellblick fehlt');
assert.match(cockpit,/Wetter · Temperatur · Niederschlag · Wind/,'90-Minuten-Bereich muss mehrere Wetterfaktoren zeigen');
assert.match(cockpit,/WeatherPictogram code=\{item\.code\}/,'90-Minuten-Piktogramme müssen die plausibilisierte Wetterart verwenden');
assert.match(cockpit,/points=useMemo\(\(\)=>selectShortTermPoints\(adjusted,'1h'\)/,'Kurzfristdarstellung muss fest einstündig sein');
assert.match(cockpit,/Stündlich · ein Blick/,'24-h-Wetterprofil muss die feste einstündige Gesamtansicht kennzeichnen');
assert.match(cockpit,/className="cockpit-meteogram-pro__datafield"/,'Einzeldatenfeld des Meteogramms muss vorhanden sein');
assert.doesNotMatch(cockpit,/Auflösung der Kurzfristvorhersage|>3 h<|>1 h</,'Entfernter 1h\/3h-Umschalter darf nicht zurückkehren');
assert.match(cockpit,/Temperatur, gefühlte Temperatur, thermisches Empfinden, Niederschlag, Wind\/Böen, Wolkenschichten und Wetter-Hazards/,'24-h-Wetterprofil erklärt die zentralen Wetterebenen nicht');
assert.match(cockpit,/windSignalColor\(gust\)/,'Windrichtungspfeile müssen warnstufenabhängig eingefärbt werden');
assert.match(cockpit,/function windSignalColor\(gustKt:number\)/,'Die warnstufenabhängige Windfarbe muss als Hilfsfunktion definiert sein');
assert.match(cockpit,/formatDecimalFixed\(value,1\)} K/,'Temperaturabweichung muss in Kelvin dargestellt werden');
assert.match(cockpit,/cockpit-fourteen-temps/,'Tmin\/Tmax-Stil der 14-Tage-Übersicht fehlt');

assert.doesNotMatch(ensemble,/Ensemble-Mitglieder pro Tag im Mittel/,'Nutzlose Mitglieder-Satzanzeige darf nicht zurückkehren');
assert.match(ensemble,/Abweichung zum Klimamittel/,'Temperaturschalter muss die Klimaabweichung erklären');
assert.match(ensemble,/Menge × Wahrscheinlichkeit/,'Niederschlagsschalter muss das kombinierte Signal erklären');
assert.match(styles,/\.ensemble-metric-mini\.wind>em>i\{[^}]*background:#167a55/s,'Windfarbe des Schalters muss dem Diagramm entsprechen');
assert.match(styles,/\.ensemble-metric-mini\.wind>em>strong\{[^}]*background:#5f8f31/s,'Böenfarbe des Schalters muss dem Diagramm entsprechen');
assert.match(ensemble,/showRainRange&&<Scatter/,'P10–P90-Schalter darf nur die Fehlerbalken ausblenden');
assert.match(ensemble,/chartTooltipTrigger\(\)/,'Desktop-Tooltips müssen Hover unterstützen');
assert.match(ensemble,/P10–P90-Spannen ein-\/ausblenden/,'P10–P90-Schalter muss eindeutig beschriftet sein');

assert.match(app,/hazards compact-list/,'Automatische Warnungen müssen kompakt und einklappbar bleiben');
assert.match(styles,/\.hazards\.compact-list\{[^}]*grid-template-columns:repeat\(auto-fit,minmax\(250px,1fr\)\)/s,'Warnungen sind nicht responsiv kompakt');
assert.match(styles,/\.official-list\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(260px,1fr\)\)/,'Amtliche Warnungen sind nicht responsiv kompakt');
assert.match(styles,/\.ensemble-metric-mini\.temperature>em>u/,'Temperaturvorschau braucht eine Klimamittel-Nullinie');
assert.match(styles,/\.ensemble-metric-mini\.precipitation>em>strong\{display:none/,'Niederschlagsschalter darf nur einen Balken pro Tag zeigen');

const versionAtLeast=(value,minimum)=>{const left=String(value).split('.').map(Number),right=String(minimum).split('.').map(Number),length=Math.max(left.length,right.length);for(let index=0;index<length;index++){const a=left[index]||0,b=right[index]||0;if(a>b)return true;if(a<b)return false}return true};
const packageVersion=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion;
assert.ok(versionAtLeast(packageVersion,'0.9.8.0'),`Cockpit-Usability benötigt mindestens v0.9.8.0, gefunden ${packageVersion}`);
assert.equal(baselineVersion,packageVersion,'Baseline und Paketversion müssen synchron bleiben');
console.log(`MID v${packageVersion} Cockpit-, Warnungs- und Ensemble-Usability geprüft.`);
