import {rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outDir=path.join(root,'.precip-test');
await rm(outDir,{recursive:true,force:true});
const compile=spawnSync('tsc',['--ignoreConfig',
 'src/precipitation.ts',
 '--target','ES2022',
 '--module','ES2022',
 '--moduleResolution','Bundler',
 '--strict',
 '--skipLibCheck',
 '--outDir','.precip-test'
],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
if(compile.status!==0)process.exit(compile.status??1);
const {precipitationParts,presentPrecipTypes}=await import(`${pathToFileURL(path.join(outDir,'precipitation.js')).href}?v=${Date.now()}`);

const sample=(overrides={})=>({precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:0,...overrides});
const cases=[
 ['Schneefallcode bleibt Schnee, obwohl precipitation das Wasseräquivalent enthält',sample({code:75,precipitation:3.1,snowfall:4.8}), 'snow'],
 ['Schneefallcode wird nicht durch paralleles Mengenfeld zu Schneeregen umgedeutet',sample({code:73,precipitation:1.2,rain:.2,snowfall:1.6}), 'snow'],
 ['Schneeschauercode bleibt Schneeschauer',sample({code:85,precipitation:1.1,showers:.3,snowfall:1.4}), 'snowShowers'],
 ['Schneeregencode bleibt Schneeregen',sample({code:68,precipitation:1.3,rain:.7,snowfall:.4}), 'sleet'],
 ['Schneeregenschauercode bleibt Schneeregenschauer',sample({code:83,precipitation:1.4,showers:.8,snowfall:.5}), 'sleetShowers'],
 ['Schneegriesel bleibt bei kalter feuchter Stratuslage Schneegriesel',sample({code:77,temperature:-2,dewPoint:-2.4,humidity:96,cloud:100,lowCloud:94,precipitation:.2,snowfall:.2}), 'snowGrains'],
 ['Unplausibler Schneegrieselcode wird innerhalb der festen Phase zu Schnee',sample({code:77,temperature:5,humidity:62,cloud:35,lowCloud:20,precipitation:.6,rain:.6}), 'snow'],
 ['Warmer Schneefallcode bleibt gemäß WMO-Phase Schnee',sample({code:73,temperature:4.5,precipitation:.8,rain:.8}), 'snow'],
 ['Warmer Schneeschauercode bleibt gemäß WMO-Phase Schneeschauer',sample({code:85,temperature:5,precipitation:.9,showers:.9}), 'snowShowers'],
 ['Explizite Schneemenge erhält Schnee auch bei leicht positiver Temperatur',sample({code:73,temperature:4,precipitation:.6,snowfall:.4}), 'snow'],
 ['Sprühregen bleibt bei feuchter tiefer Stratuslage Sprühregen',sample({code:53,temperature:8,dewPoint:7.5,precipitation:.3,rain:.3,humidity:96,cloud:100,lowCloud:92}), 'drizzle'],
 ['Sprühregencode wird ohne Stratussignal als Regen plausibilisiert',sample({code:53,precipitation:.8,rain:.8,humidity:72,cloud:55,lowCloud:18}), 'rain'],
 ['Sprühregencode wird bei kräftiger Niederschlagsrate als Regen plausibilisiert',sample({code:55,precipitation:3.2,rain:3.2,humidity:96,cloud:100,lowCloud:95}), 'rain'],
 ['Regencode bleibt Regen',sample({code:63,precipitation:2.4,rain:2.4,snowfall:.1}), 'rain'],
 ['Gefrierender Regen bleibt gefrierender Regen',sample({code:67,precipitation:1.1,rain:1.1}), 'freezingRain'],
 ['Fallback erkennt reinen Schnee',sample({code:3,precipitation:.8,snowfall:1.2}), 'snow'],
 ['Fallback erkennt Schneeregen nur bei festem und flüssigem Anteil',sample({code:3,precipitation:1.1,rain:.5,snowfall:.7}), 'sleet'],
 ['Fallback erkennt Schneeregenschauer nur bei Schnee und Schauern',sample({code:3,precipitation:1.1,showers:.5,snowfall:.7}), 'sleetShowers'],
 ['WMO 87 bleibt leichter Graupelschauer',sample({code:87,precipitation:.4,showers:.4}), 'graupelShowers'],
 ['WMO 88 bleibt Graupelschauer mit zusammengefasster mäßig/stark-Stufe',sample({code:88,precipitation:3,showers:3}), 'graupelShowers'],
 ['WMO 89 bleibt leichter Hagelschauer',sample({code:89,precipitation:.4,showers:.4}), 'hailShowers'],
 ['WMO 90 bleibt Hagelschauer mit zusammengefasster mäßig/stark-Stufe',sample({code:90,precipitation:3,showers:3}), 'hailShowers'],
 ['WMO 91 bleibt leichter Regenschauer nach Gewitter in der vorangegangenen Stunde',sample({code:91,precipitation:.3,rain:.3,showers:.6,cape:900}), 'showers'],
 ['WMO 92 bleibt mäßiger/starker Regenschauer nach Gewitter in der vorangegangenen Stunde',sample({code:92,precipitation:3,rain:3,showers:.8,cape:900}), 'showers'],
 ['WMO 93 bleibt phasenoffener winterlicher Niederschlag nach vorangegangenem Gewitter',sample({code:93,precipitation:.4,snowfall:.2}), 'wintryAfterThunder'],
 ['WMO 94 bleibt phasenoffener winterlicher Niederschlag nach vorangegangenem Gewitter',sample({code:94,precipitation:3,snowfall:1}), 'wintryAfterThunder']
];
const failures=[];
for(const [name,input,expected] of cases){const actual=precipitationParts(input).type;if(actual!==expected)failures.push(`${name}: erwartet ${expected}, erhalten ${actual}`)}
const plausibleDrizzle=precipitationParts(sample({code:53,temperature:8,dewPoint:7.5,precipitation:.3,rain:.3,humidity:96,cloud:100,lowCloud:92}));
if(plausibleDrizzle.weatherLabel!=='mäßiger Sprühregen')failures.push(`Plausibler Sprühregen erhält falschen Wettertext: ${plausibleDrizzle.weatherLabel}`);
if(plausibleDrizzle.displayCode!==53)failures.push(`Plausibler Sprühregen erhält falschen Anzeigecode: ${plausibleDrizzle.displayCode}`);
const implausibleDrizzle=precipitationParts(sample({code:53,precipitation:.8,rain:.8,humidity:72,cloud:55,lowCloud:18}));
if(implausibleDrizzle.weatherLabel!=='mäßiger Regen')failures.push(`Unplausibler Sprühregen wird nicht phasen- und intensitätsgerecht zu mäßigem Regen: ${implausibleDrizzle.weatherLabel}`);
if(implausibleDrizzle.displayCode!==63)failures.push(`Unplausibler Sprühregen erhält nicht den zur finalen Menge passenden Regensymbolcode: ${implausibleDrizzle.displayCode}`);

const implausibleSnowGrainsDry=precipitationParts(sample({code:77,temperature:6,humidity:45,cloud:25,lowCloud:10}));
if(implausibleSnowGrainsDry.type!=='snow')failures.push(`Unplausibler Schneegrieselcode wechselt fälschlich die feste Phase: ${implausibleSnowGrainsDry.type}`);
if(![71,73,75].includes(implausibleSnowGrainsDry.displayCode))failures.push(`Unplausibler Schneegrieselcode erhält keinen allgemeinen Schneecode: ${implausibleSnowGrainsDry.displayCode}`);
const implausibleSnowRain=precipitationParts(sample({code:75,temperature:5,precipitation:1.2,rain:1.2,cloud:90}));
if(implausibleSnowRain.type!=='snow'||implausibleSnowRain.displayCode!==75)failures.push(`Schneecode muss in der festen Phase bleiben und die sichtbare Intensität aus der finalen Menge ableiten: ${implausibleSnowRain.type}/${implausibleSnowRain.displayCode}`);
const implausibleFreezingDrizzle=precipitationParts(sample({code:57,precipitation:1.2,rain:1.2,humidity:70,cloud:40,lowCloud:10}));
if(implausibleFreezingDrizzle.type!=='freezingRain'||![66,67].includes(implausibleFreezingDrizzle.displayCode))failures.push(`Gefrierender Sprühregen muss innerhalb der gefrierenden Flüssigphase bleiben: ${implausibleFreezingDrizzle.type}/${implausibleFreezingDrizzle.displayCode}`);


const highBaseColdFrontDrizzle=precipitationParts(sample({code:53,temperature:11,dewPoint:3.2,precipitation:.4,rain:.4,humidity:92,cloud:100,lowCloud:88,showers:0}));
if(highBaseColdFrontDrizzle.type!=='rain')failures.push(`Sprühregen bei geschätzter Wolkenbasis über 3000 ft wird nicht zu Regen verallgemeinert: ${highBaseColdFrontDrizzle.type}`);
const showerAlternation=precipitationParts(sample({code:53,temperature:10,dewPoint:8.8,precipitation:.7,rain:.2,showers:.5,humidity:94,cloud:100,lowCloud:88}));
if(showerAlternation.type!=='showers')failures.push(`Sprühregencode bei gleichzeitigem Schauersignal wird nicht als Schauer dargestellt: ${showerAlternation.type}`);
const highBaseSnowGrains=precipitationParts(sample({code:77,temperature:-3,dewPoint:-11,precipitation:.2,snowfall:.2,humidity:90,cloud:100,lowCloud:85}));
if(highBaseSnowGrains.type!=='snow')failures.push(`Schneegriesel bei hoher Wolkenbasis wird nicht innerhalb der festen Phase zu Schnee verallgemeinert: ${highBaseSnowGrains.type}`);

const fallbackRain=precipitationParts(sample({code:3,precipitation:.8,rain:.8,probability:80}));
if(fallbackRain.displayCode!==63)failures.push(`Fallback-Regen erhält nicht den zur finalen Menge passenden mäßigen Regensymbolcode: ${fallbackRain.displayCode}`);
const fallbackSnow=precipitationParts(sample({code:3,precipitation:.8,snowfall:1.2,probability:80}));
if(![71,73,75].includes(fallbackSnow.displayCode))failures.push(`Fallback-Schnee erhält keinen Schneesymbolcode: ${fallbackSnow.displayCode}`);
const amountCalibratedRain=precipitationParts(sample({code:61,precipitation:12,rain:12,probability:90}));
if(amountCalibratedRain.displayCode!==65)failures.push(`Finale starke Regenmenge wird im Piktogramm nicht als starke Intensität dargestellt: ${amountCalibratedRain.displayCode}`);
const conservativeGapShower=precipitationParts(sample({code:80,precipitation:3.2,showers:3.2,probability:80}));
if(conservativeGapShower.displayCode!==80||conservativeGapShower.intensity!=='light')failures.push(`DWD-Lücke 0,4–<0,7 mm/10 min muss ohne expliziten Intensitätscode konservativ leicht bleiben: ${conservativeGapShower.displayCode}/${conservativeGapShower.intensity}`);
const amountCalibratedShower=precipitationParts(sample({code:80,precipitation:6,showers:6,probability:80}));
if(amountCalibratedShower.displayCode!==81||amountCalibratedShower.intensity!=='moderate')failures.push(`Quantitativ mäßiger Schauer ab 0,7 mm/10 min wird nicht als mäßig dargestellt: ${amountCalibratedShower.displayCode}/${amountCalibratedShower.intensity}`);
const strongShower=precipitationParts(sample({code:81,precipitation:18,showers:18,probability:95}));
if(strongShower.displayCode!==81||strongShower.intensity!=='heavy')failures.push(`Starker Regenschauer muss trotz zusammengefasstem WMO-Code 81 geometrisch stark bleiben: ${strongShower.displayCode}/${strongShower.intensity}`);
const veryStrongShower=precipitationParts(sample({code:82,precipitation:60,showers:60,probability:95}));
if(veryStrongShower.displayCode!==82||veryStrongShower.intensity!=='very-heavy')failures.push(`Sehr starker Regenschauer muss eine eigene vierte Geometriestufe erhalten: ${veryStrongShower.displayCode}/${veryStrongShower.intensity}`);
const strongSnowShower=precipitationParts(sample({code:86,precipitation:3,snowfall:5,showers:3,probability:95}));
if(strongSnowShower.displayCode!==86||strongSnowShower.intensity!=='heavy')failures.push(`Starker Schneeschauer muss trotz zusammengefasstem WMO-Code 86 geometrisch stark bleiben: ${strongSnowShower.displayCode}/${strongSnowShower.intensity}`);
const moderateHeavyGraupel=precipitationParts(sample({code:88,precipitation:3,showers:3,probability:95}));
if(moderateHeavyGraupel.displayCode!==88||moderateHeavyGraupel.intensity!=='moderate'||!moderateHeavyGraupel.weatherLabel.includes('mäßiger bis starker'))failures.push(`WMO 88 darf ohne getrennte Messintensität nicht künstlich als stark präzisiert werden: ${moderateHeavyGraupel.displayCode}/${moderateHeavyGraupel.intensity}/${moderateHeavyGraupel.weatherLabel}`);
const moderateHeavyHail=precipitationParts(sample({code:90,precipitation:7,showers:7,probability:95}));
if(moderateHeavyHail.displayCode!==90||moderateHeavyHail.intensity!=='moderate'||!moderateHeavyHail.weatherLabel.includes('mäßiger bis starker'))failures.push(`WMO 90 darf ohne getrennte Messintensität nicht künstlich als stark präzisiert werden: ${moderateHeavyHail.displayCode}/${moderateHeavyHail.intensity}/${moderateHeavyHail.weatherLabel}`);
const afterThunderShower=precipitationParts(sample({code:92,precipitation:6,rain:6,showers:2,cape:1200,probability:95}));
if(afterThunderShower.type!=='showers'||afterThunderShower.displayCode!==92||afterThunderShower.intensity!=='moderate')failures.push(`WMO 92 muss Regenschauer nach Gewitter in der vorangegangenen Stunde bleiben; eine Stundenakkumulation darf die zusammengefasste WMO-Stufe nicht künstlich verschärfen: ${afterThunderShower.type}/${afterThunderShower.displayCode}/${afterThunderShower.intensity}`);
const afterThunderWintry=precipitationParts(sample({code:94,precipitation:9,snowfall:5,probability:95}));
if(afterThunderWintry.type!=='wintryAfterThunder'||afterThunderWintry.displayCode!==94||afterThunderWintry.intensity!=='moderate')failures.push(`WMO 94 muss phasenoffen und ohne erfundene starke Einzelintensität bleiben: ${afterThunderWintry.type}/${afterThunderWintry.displayCode}/${afterThunderWintry.intensity}`);
const amountCalibratedSnow=precipitationParts(sample({code:71,precipitation:2.4,snowfall:2.4,probability:90}));
if(amountCalibratedSnow.displayCode!==73)failures.push(`Finale mäßige Schneemenge wird im Piktogramm nicht als mäßige Intensität dargestellt: ${amountCalibratedSnow.displayCode}`);
const amountCalibratedSleet=precipitationParts(sample({code:68,precipitation:3.2,rain:1.8,snowfall:.8,probability:80}));
if(amountCalibratedSleet.displayCode!==69)failures.push(`Finale stärkere Schneeregenmenge wird im Piktogramm nicht intensiver dargestellt: ${amountCalibratedSleet.displayCode}`);
const amountCalibratedThunder=precipitationParts(sample({code:95,precipitation:12,showers:12,probability:90}));
if(![97,99].includes(amountCalibratedThunder.displayCode))failures.push(`Starker Gewitterniederschlag erhält keine starke geometrische Intensitätsstufe: ${amountCalibratedThunder.displayCode}`);
const quarterRain=precipitationParts(sample({code:61,precipitation:.2,rain:.2,probability:80,precipitationIntervalStartEpoch:0,precipitationIntervalEndEpoch:15*60000}));
if(quarterRain.displayCode!==63||quarterRain.weatherLabel!=='mäßiger Regen')failures.push(`15-min-Regen wird nicht auf die tatsächliche Intervallintensität normiert: ${quarterRain.displayCode}/${quarterRain.weatherLabel}`);
const quarterGapShower=precipitationParts(sample({code:80,precipitation:.8,showers:.8,probability:80,precipitationIntervalStartEpoch:0,precipitationIntervalEndEpoch:15*60000}));
if(quarterGapShower.displayCode!==80)failures.push(`15-min-Schauer im DWD-Zwischenbereich muss konservativ leicht bleiben: ${quarterGapShower.displayCode}`);
const quarterShower=precipitationParts(sample({code:80,precipitation:1.2,showers:1.2,probability:80,precipitationIntervalStartEpoch:0,precipitationIntervalEndEpoch:15*60000}));
if(quarterShower.displayCode!==81||quarterShower.intensity!=='moderate')failures.push(`15-min-Schauer >=0,7 mm/10 min wird nicht intervallgerecht auf mäßig normiert: ${quarterShower.displayCode}/${quarterShower.intensity}`);
const legend=presentPrecipTypes(cases.slice(0,5).map(([,input])=>precipitationParts(input)));
for(const expected of ['snow','snowShowers','sleet','sleetShowers'])if(!legend.includes(expected))failures.push(`Legende enthält ${expected} nicht`);
if(legend.filter(type=>type==='sleet').length!==1)failures.push('Legende enthält Schneeregen mehrfach');
await rm(outDir,{recursive:true,force:true});
if(failures.length){console.error('Niederschlagsformen-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Niederschlagsformen geprüft: Sprühregen und Schneegriesel werden nur innerhalb ihrer flüssigen bzw. festen Phase verallgemeinert; Symbol, Text, Legende und Tooltip bleiben konsistent.');
