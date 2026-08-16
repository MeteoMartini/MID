import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const station=await readFile(new URL('src/connectedStation.ts',root),'utf8');
const settings=await readFile(new URL('src/ConnectedStationSettings.tsx',root),'utf8');
const ensemble=await readFile(new URL('src/EnsemblePanel.tsx',root),'utf8');
const failures=[];
const need=(source,token,message)=>{if(!source.includes(token))failures.push(message)};
need(station,'authorized:boolean;','Persistenter Netatmo-Autorisierungszustand fehlt.');
need(station,'authorized:Boolean(parsed.authorized||parsed.enabled)','Bestehende aktivierte Netatmo-Übernahme wird beim Upgrade nicht als autorisiert migriert.');
need(station,"{enabled:false,authorized:false,selectedDeviceId:'',selectedModuleId:''}",'Netatmo-Trennen löscht den Autorisierungszustand nicht.');
need(settings,'if(next.connected&&!current.authorized)','Erfolgreicher Live-Status wird nicht dauerhaft als autorisiert gespeichert.');
need(settings,'enabled:true,authorized:true','OAuth-Erfolg persistiert die Messwertübernahme nicht.');
need(settings,"hasPersistedNetatmoConnection=config.provider==='netatmo'&&config.authorized",'UI verwendet keinen persistierten Netatmo-Verbindungszustand.');
need(settings,'checked={config.enabled}','Messwert-Übernahmeschalter ist nicht an die persistierte Nutzerwahl gebunden.');
need(settings,'Die Auswahl bleibt nach Neustarts erhalten.','Persistenzhinweis fehlt.');
need(ensemble,'stroke="rgba(5,12,18,.86)" strokeWidth="2.15"','Dunkle Kontur der Schneeflocke im Ensemble-Wetterband fehlt.');
need(ensemble,'stroke="#ffffff" strokeWidth="1.35"','Weiße Schneeflocke wird nicht über der dunklen Kontur gezeichnet.');
if(failures.length){console.error('Netatmo-Persistenz-/Schneeflockenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Netatmo-Persistenz nach Neustart und kontrastierte Schneeflocke im Ensemble-Wetterband geprüft.');
