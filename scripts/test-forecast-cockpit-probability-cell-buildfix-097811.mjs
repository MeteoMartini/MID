import fs from 'node:fs';
const cockpit=fs.readFileSync('src/ForecastCockpit.tsx','utf8');
const contract=fs.readFileSync('MID_PRECIPITATION_INTERVAL_CONTRACT.md','utf8');
if(cockpit.includes('const probabilityCellGeometry=')) throw new Error('Der unbenutzte probabilityCellGeometry-Helper darf nicht wieder eingeführt werden.');
if(!contract.includes('vorangegangenen Stunde') && !contract.includes('[T − 60 min, T]')) throw new Error('Der Niederschlags-Intervallvertrag aus v0.9.78.10 fehlt.');
console.log('ForecastCockpit TypeScript-Buildfix v0.9.78.11 geprüft.');
