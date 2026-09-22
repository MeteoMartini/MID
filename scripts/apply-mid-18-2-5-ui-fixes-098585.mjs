import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(process.cwd());
const exists=async file=>{try{await access(path.join(root,file));return true}catch{return false}};
const read=file=>readFile(path.join(root,file),'utf8');
const write=(file,content)=>writeFile(path.join(root,file),content,'utf8');
const replaceOne=(text,oldValue,newValue,label)=>{
 const count=text.split(oldValue).length-1;
 if(count!==1)throw new Error(`${label}: erwartet 1 Treffer, gefunden ${count}`);
 return text.replace(oldValue,newValue);
};
const replaceRegexOne=(text,regex,newValue,label)=>{
 const matches=text.match(regex)||[];
 if(matches.length!==1)throw new Error(`${label}: erwartet 1 Treffer, gefunden ${matches.length}`);
 return text.replace(regex,newValue);
};
const addUnique=(object,key,value)=>{if(!Array.isArray(object[key]))object[key]=[];if(!object[key].includes(value))object[key].push(value)};

async function patchJsonVersions(){
 const pkgFile='package.json',lockFile='package-lock.json',versionFile='src/version.ts',baselineFile='MID_BASELINE.json';
 const pkg=JSON.parse(await read(pkgFile));
 if(pkg.version==='0.9.85.84')pkg.version='0.9.85.85';
 if(pkg.version!=='0.9.85.85')throw new Error(`Unerwartete package-Version ${pkg.version}`);
 pkg.scripts=pkg.scripts||{};
 pkg.scripts['test:mid-18-2-5-ui-fixes']='node scripts/test-mid-18-2-5-ui-fixes-098585.mjs';
 await write(pkgFile,JSON.stringify(pkg,null,2)+'\n');

 const lock=JSON.parse(await read(lockFile));
 if(lock.version==='0.9.85.84')lock.version='0.9.85.85';
 if(lock.packages?.['']?.version==='0.9.85.84')lock.packages[''].version='0.9.85.85';
 if(lock.version!=='0.9.85.85'||lock.packages?.['']?.version!=='0.9.85.85')throw new Error('Lockfile-Version konnte nicht auf 0.9.85.85 synchronisiert werden.');
 await write(lockFile,JSON.stringify(lock,null,2)+'\n');

 let version=await read(versionFile);
 if(version.includes("MID_VERSION='0.9.85.84'"))version=version.replace("MID_VERSION='0.9.85.84'","MID_VERSION='0.9.85.85'");
 if(!version.includes("MID_VERSION='0.9.85.85'"))throw new Error('src/version.ts ist nicht auf 0.9.85.85 synchronisiert.');
 await write(versionFile,version);

 const baseline=JSON.parse(await read(baselineFile));
 baseline.version='0.9.85.85';
 baseline.releaseVersion='0.9.85.85';
 baseline.updatedAt='2026-09-22T06:35:00.000Z';
 const testPath='scripts/test-mid-18-2-5-ui-fixes-098585.mjs';
 for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])addUnique(baseline,key,testPath);
 for(const value of [testPath,'src/midC18ResponsiveCorrections.css','MID_RELEASE_NOTES_0.9.85.85.json'])addUnique(baseline,'requiredFiles',value);
 for(const value of [testPath,'src/midC18ResponsiveCorrections.css'])addUnique(baseline,'protectedFiles',value);
 await write(baselineFile,JSON.stringify(baseline,null,2)+'\n');
}

async function patchApp(){
 let app=await read('src/App.tsx');
 if(!app.includes('className="current-wind-inline"')){
  app=replaceOne(app,
   '<span className="wind"><small>Wind / Böen</small><b>{wind(displayWindSpeed,unit)} · G{wind(displayWindGust,unit)}</b><em>{cardinalDirection(windDirection)}</em></span>',
   '<span className="wind"><small>Wind / Böen</small><b className="current-wind-inline"><WindDirectionArrow direction={windDirection} gust={displayWindGust}/><span>{wind(displayWindSpeed,unit)} · G{wind(displayWindGust,unit)}</span></b><em>{cardinalDirection(windDirection)}</em></span>',
   'Aktuell-Windpfeil');
 }
 if(!app.includes('className="current-weather-thread-delta"')){
  app=replaceOne(app,
   '<header className="current-weather-thread-head"><span><small>Temperaturdifferenz · +12 h</small><b>{currentThreadTrendLabel}</b></span></header>',
   '<header className="current-weather-thread-head"><span className="current-weather-thread-title"><small>Temperaturdifferenz · +12 h</small></span><b className="current-weather-thread-delta">{currentThreadTrendLabel}</b></header>',
   '+12-h-Header');
 }
 if(!app.includes("data-active={active===item.id?'true':'false'}")){
  app=replaceOne(app,
   "<button type=\"button\" key={item.id} className={active===item.id?'active':''} aria-current={active===item.id?'page':undefined} aria-label={item.id==='90m'?'Ab jetzt: 90 Minuten und 24 Stunden':undefined} onClick={()=>onNavigate(item.id)}>{item.label}</button>",
   "<button type=\"button\" key={item.id} className={active===item.id?'active':''} aria-current={active===item.id?'page':undefined} aria-pressed={active===item.id} data-active={active===item.id?'true':'false'} aria-label={item.id==='90m'?'Ab jetzt: 90 Minuten und 24 Stunden':undefined} onClick={()=>onNavigate(item.id)}>{item.label}</button>",
   'Forecast-Horizont active');
 }
 await write('src/App.tsx',app);
}

async function patchForecastCockpit(){
 let cockpit=await read('src/ForecastCockpit.tsx');
 cockpit=cockpit.replace("import {sunshineHoursLabel,sunshineMinutesLabel} from './sunshineDuration';","import {sunshineHoursLabel,sunshineMinutesLabel,sunshineWholeHoursLabel} from './sunshineDuration';");
 cockpit=cockpit.replace("const PROFILE_RESOLUTION_KEY='mid:forecastCockpit:profileResolution';\n",'');
 cockpit=cockpit.replace("type ProfileResolution='1h'|'3h';\nfunction readProfileResolution():ProfileResolution{try{return localStorage.getItem(PROFILE_RESOLUTION_KEY)==='3h'?'3h':'1h'}catch{return'1h'}}\n",'');
 cockpit=cockpit.replace(",[profileResolution,setProfileResolution]=useState<ProfileResolution>(readProfileResolution)",'');
 cockpit=cockpit.replace("profileDisplayPoints=useMemo(()=>selectShortTermPoints(profileHourlyPoints,profileResolution),[profileHourlyPoints,profileResolution])","profileDisplayPoints=profileHourlyPoints");
 cockpit=cockpit.replace(" useEffect(()=>{try{localStorage.setItem(PROFILE_RESOLUTION_KEY,profileResolution)}catch{}},[profileResolution]);\n",'');
 cockpit=replaceRegexOne(cockpit,/<span className="cockpit-weather-profile__resolution" role="group" aria-label="Zeitauflösung"><button type="button" className=\{profileResolution==='1h'\?'active':''\} onClick=\{\(\)=>setProfileResolution\('1h'\)\} aria-pressed=\{profileResolution==='1h'\}>1 h<\/button><button type="button" className=\{profileResolution==='3h'\?'active':''\} onClick=\{\(\)=>setProfileResolution\('3h'\)\} aria-pressed=\{profileResolution==='3h'\}>3 h<\/button><\/span>/,'','24-h-Auflösungsumschalter');
 cockpit=cockpit.replace('1 h zeigt alle verfügbaren Stundenwerte; 3 h verdichtet ausschließlich Kurven, Marker und Beschriftungen. ','Die Darstellung bleibt durchgehend stündlich und zeigt alle verfügbaren Stundenwerte. ');
 cockpit=cockpit.replace("{skybarDisplayMode==='squares'?'Die Stundenquadrate bleiben in beiden Ansichten unverändert stündlich aufgelöst.':'Die Skybar bleibt in beiden Ansichten unverändert stündlich aufgelöst.'}","{skybarDisplayMode==='squares'?'Die Stundenquadrate bleiben unverändert stündlich aufgelöst.':'Die Skybar bleibt unverändert stündlich aufgelöst.'}");
 cockpit=cockpit.replace("<strong>24 Stunden · {profileResolution==='1h'?'1-stündlich':'3-stündlich'}</strong>",'<strong>24 Stunden · 1-stündlich</strong>');
 cockpit=cockpit.replaceAll('sunshineHoursLabel(item.bestSunshineDuration)','sunshineWholeHoursLabel(item.bestSunshineDuration)');
 cockpit=cockpit.replaceAll('sunshineHoursLabel(item.possibleSunshineDuration)','sunshineWholeHoursLabel(item.possibleSunshineDuration)');
 cockpit=replaceRegexOne(cockpit,/\{daySkyBarSegments\.length\?<span className="cockpit-fourteen-detail-skybar"[\s\S]*?<\/span>:null\}/,'','gedoppelte 14-Tage-24h-Skybar');
 if(cockpit.includes('profileResolution')||cockpit.includes('setProfileResolution')||cockpit.includes('PROFILE_RESOLUTION_KEY'))throw new Error('3-h-Profilvertrag ist noch nicht vollständig entfernt.');
 if(cockpit.includes('<small>24-Stunden-Wetter</small>')||cockpit.includes('cockpit-fourteen-detail-skybar'))throw new Error('Gedoppelte 14-Tage-24h-Zeile ist noch vorhanden.');
 if(!cockpit.includes('sunshineWholeHoursLabel(item.bestSunshineDuration)'))throw new Error('Ganzzahlige Haupt-Sonnenstunden fehlen.');
 await write('src/ForecastCockpit.tsx',cockpit);
}

async function patchMain(){
 let main=await read('src/main.tsx');
 const importLine="import './midC18ResponsiveCorrections.css';";
 if(!main.includes(importLine))main=replaceOne(main,"import './midC18MapFirstWorkspace.css';","import './midC18MapFirstWorkspace.css';\n"+importLine,'Responsive-CSS Import');
 await write('src/main.tsx',main);
}

async function main(){
 for(const required of ['package.json','package-lock.json','MID_BASELINE.json','src/App.tsx','src/ForecastCockpit.tsx','src/main.tsx'])if(!(await exists(required))){console.log(`MID UI-Patch übersprungen: ${required} fehlt im isolierten Test-Arbeitsbaum.`);return}
 await patchJsonVersions();
 await patchApp();
 await patchForecastCockpit();
 await patchMain();
 console.log('MID v0.9.85.85: gesammelte UI-Korrekturen deterministisch angewendet.');
}

await main();
