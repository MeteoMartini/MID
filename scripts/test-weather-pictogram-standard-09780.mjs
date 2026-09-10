import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pictogram,features,styles,route,weather,pkgRaw,baselineRaw,contract]=await Promise.all([
 read('src/WeatherPictogram.tsx'),read('src/styles-src/10-features.css'),read('src/styles.css'),read('src/routeWeather.ts'),read('src/weather.ts'),read('package.json'),read('MID_BASELINE.json'),read('MID_WEATHER_PICTOGRAM_STANDARD.md')
]);
const failures=[],need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)},forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};
for(const token of [
 "export type WeatherPictogramIntensity='none'|'light'|'moderate'|'heavy'|'very-heavy'",
 "if([50,51,56,58,60,61,66,68,70,71,80,83,85,87,89,91,93].includes(c))return'light'",
 "if([52,53,57,59,62,63,67,69,72,73,81,84,86,88,90,92,94,95,96].includes(c))return'moderate'",
 "if(c===82)return'very-heavy'",
 "if([54,55,64,65,74,75,97,99].includes(c))return'heavy'",
 "if([68,69].includes(c))return'sleet'",
 "if([87,88].includes(c))return'graupel-showers'",
 "if([89,90].includes(c))return'hail-showers'",
 "if([91,92].includes(c))return'showers'",
 "if([93,94].includes(c))return'wintry-after-thunder'",
 "if([83,84].includes(c))return'sleet-showers'",
 'export function synopticPhenomenonPictogram',
 "else if(has('FZDZ'))kind='freezing-drizzle'",
 "else if(has('FZRA'))kind='freezing-rain'",
 "else if(has('SG'))kind='snow-grains'",
 "else if(has('IC'))kind='ice-crystals'",
 "else if(has('PL'))kind='ice-pellets'",
 "else if(has('SH')&&has('GS'))kind='graupel-showers'",
 "else if(has('SH')&&has('GR'))kind='hail-showers'",
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
 '<WintryAfterThunder intensity={precipIntensity}/>',
 'thunderDust=wmoCode===98&&!phenomenon',
 'thunderRain=Boolean(synopticRaw',
 "kind==='thunder-hail'?<><Lightning",
 'solidParticleXs(intensity)',
 "if(intensity==='very-heavy')return[12,21,30,39,48,58]",
 "if(intensity==='heavy')return[15,26,37,48,59]",
 "return[19,32,45,57]",
 '<IceCrystals intensity={precipIntensity}/>',
 "['mostly-clear','partly-cloudy','showers','sleet-showers','snow-showers','graupel-showers','hail-showers']"
])need('Piktogramm',pictogram,token);
for(const token of ['--wx-icon-rain:','--wx-icon-snow:','--wx-icon-lightning:','--wx-icon-day-plate:','--wx-icon-night-plate:',':root[data-theme=light]','.mid-weather-pictogram.intensity-heavy','@media(prefers-contrast:more)'])need('Theme-CSS',features,token);
const modules=await Promise.all(['src/styles-src/00-foundation.css','src/styles-src/10-features.css','src/styles-src/20-ensemble-composite.css','src/styles-src/25-extreme-outlook.css','src/styles-src/30-modern.css'].map(read));
if(styles!==modules.join(''))failures.push('styles.css ist nicht mit den kanonischen Stylemodulen synchron.');
forbid('Route-Datenmodell',route,'icon:string;');forbid('Route-Datenmodell',route,'icon(displayCode');forbid('Legacy weather helper',weather,'export function icon(c:number');
for(const token of ['SYNOP','FM 12','BUFR','METAR','Sprühregen','Schneegriesel','Tag/Nacht','Hell- und Dunkelmodus','WeatherPictogram'])need('Vertrag',contract,token);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);if(pkg.scripts?.['test:weather-pictogram-standard']!=='node scripts/test-weather-pictogram-standard-09780.mjs')failures.push('package.json: Testscript fehlt.');if(!baseline.requiredRegressionTests?.includes('scripts/test-weather-pictogram-standard-09780.mjs'))failures.push('Baseline: neuer Piktogrammtest fehlt.');if(!baseline.requiredFiles?.includes('MID_WEATHER_PICTOGRAM_STANDARD.md'))failures.push('Baseline: Piktogrammvertrag fehlt.');
if(failures.length){console.error('MID Wetterpiktogramm-Standard 2.0 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID Wetterpiktogramm-Standard 2.0: Intensität, SYNOP/METAR-Phänomene, Tag/Nacht und Theme-Vertrag statisch geprüft.');
