import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const required=[
 'function WindDirectionArrow',
 'function SvgWindDirectionArrow',
 'function normalizeDegrees',
 'function windToDegrees',
 'function windDirectionDescription',
 'function windDirectionWarningLevel',
 'function localTimeLabel',
 'function hourDisplayClock',
 'function clockMinutes',
 'function clockLabel',
 'function precipitationBeyondTwoHours'
];
const missing=required.filter(token=>!app.includes(token));
if(missing.length){console.error('Fehlende App-Helfer:',missing.join(', '));process.exit(1)}
if(!app.includes('<ForecastConditionPills label={compactConditionLabel}/>')){console.error('Compact 7-day forecast pill contract missing');process.exit(1)}
if(app.includes('<ForecastConditionPills label={character.label} secondary={character.secondary}/>')){console.error('Legacy multi-part 7-day forecast pill contract unexpectedly restored');process.exit(1)}
console.log('App helper block + compact 7-day forecast pill contract: OK');
