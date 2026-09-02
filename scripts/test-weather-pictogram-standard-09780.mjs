import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pictogram,features,styles,route,weather,pkgRaw,baselineRaw,contract]=await Promise.all([
 read('src/WeatherPictogram.tsx'),read('src/styles-src/10-features.css'),read('src/styles.css'),read('src/routeWeather.ts'),read('src/weather.ts'),read('package.json'),read('MID_BASELINE.json'),read('MID_WEATHER_PICTOGRAM_STANDARD.md')
]);
const failures=[],need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)},forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};
for(const token of [
 "export type WeatherPictogramIntensity='none'|'light'|'moderate'|'heavy'",
 "if([51,56,61,66,68,71,80,83,85].includes(c))return'light'",
 "if([53,63,69,73,77,81,84,95,96].includes(c))return'moderate'",
 "if([55,57,65,67,75,82,86,97,99].includes(c))return'heavy'",
 "if([68,69].includes(c))return'sleet'",
 "if([83,84].includes(c))return'sleet-showers'",
 'export function synopticPhenomenonPictogram',
 "else if(has('FZDZ'))kind='freezing-drizzle'",
 "else if(has('FZRA'))kind='freezing-rain'",
 "else if(has('SG'))kind='snow-grains'",
 "else if(has('IC'))kind='ice-crystals'",
 "else if(has('PL'))kind='ice-pellets'",
 "else if(has('GS'))kind='graupel'",
 "else if(has('GR'))kind='hail'",
 "else if(has('SQ'))kind='squall'",
 "if(has('FC'))kind='funnel-cloud'",
 'data-intensity={precipIntensity}',
 'data-day-part={day?',
 '<Rain intensity={precipIntensity} drizzle/>',
 '<Snow grains intensity={precipIntensity}/>',
 '<IcePellets intensity={precipIntensity}/>',
 '<Graupel intensity={precipIntensity}/>',
 '<Hail intensity={precipIntensity}/>',
 "['mostly-clear','partly-cloudy','showers','sleet-showers','snow-showers']"
])need('Piktogramm',pictogram,token);
for(const token of ['--wx-icon-rain:','--wx-icon-snow:','--wx-icon-lightning:','--wx-icon-day-plate:','--wx-icon-night-plate:',':root[data-theme=light]','.mid-weather-pictogram.intensity-heavy','@media(prefers-contrast:more)'])need('Theme-CSS',features,token);
const modules=await Promise.all(['src/styles-src/00-foundation.css','src/styles-src/10-features.css','src/styles-src/20-ensemble-composite.css','src/styles-src/25-extreme-outlook.css','src/styles-src/30-modern.css'].map(read));
if(styles!==modules.join(''))failures.push('styles.css ist nicht mit den kanonischen Stylemodulen synchron.');
forbid('Route-Datenmodell',route,'icon:string;');forbid('Route-Datenmodell',route,'icon(displayCode');forbid('Legacy weather helper',weather,'export function icon(c:number');
for(const token of ['SYNOP','FM 12','BUFR','METAR','Sprühregen','Schneegriesel','Tag/Nacht','Hell- und Dunkelmodus','WeatherPictogram'])need('Vertrag',contract,token);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);if(pkg.scripts?.['test:weather-pictogram-standard']!=='node scripts/test-weather-pictogram-standard-09780.mjs')failures.push('package.json: Testscript fehlt.');if(!baseline.requiredRegressionTests?.includes('scripts/test-weather-pictogram-standard-09780.mjs'))failures.push('Baseline: neuer Piktogrammtest fehlt.');if(!baseline.requiredFiles?.includes('MID_WEATHER_PICTOGRAM_STANDARD.md'))failures.push('Baseline: Piktogrammvertrag fehlt.');
if(failures.length){console.error('MID Wetterpiktogramm-Standard 2.0 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID Wetterpiktogramm-Standard 2.0: Intensität, SYNOP/METAR-Phänomene, Tag/Nacht und Theme-Vertrag statisch geprüft.');
