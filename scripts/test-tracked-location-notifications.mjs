import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,panel]=await Promise.all([readFile(path.join(root,'src','App.tsx'),'utf8'),readFile(path.join(root,'src','PushSettingsPanel.tsx'),'utf8')]);
const failures=[];
for(const token of [
  "const TRACKED_LOCATION_KEY='mid:lastTrackedLocation';",
  "const TRACKED_PUSH_RULES_KEY='mid:trackedPushRules';",
  'setTrackedLocation(tracked);setLoc(tracked)',
  "if(locationTracking&&trackedLocation)pushFavorites.unshift({id:'tracked-location'",
  'localStorage.setItem(TRACKED_PUSH_RULES_KEY,JSON.stringify(trackedPushRules))'
])if(!app.includes(token))failures.push(`Standort-Push-Integration fehlt: ${token}`);
for(const token of [
  'locationTracking&&<article className="tracked-push-location"',
  '<strong><LocateFixed size={16}/> Aktueller Standort</strong>',
  'onTrackedRuleChange',
  'eine dauerhafte Hintergrund-Ortung findet nicht statt'
])if(!panel.includes(token))failures.push(`Standort-Push-UI fehlt: ${token}`);
if(failures.length){console.error('Standort-Benachrichtigungen fehlerhaft:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Standort-Benachrichtigungen geprüft: die zuletzt erfolgreich automatisch bestimmte Position kann eigene Regen- und Gewitterregeln erhalten.');
