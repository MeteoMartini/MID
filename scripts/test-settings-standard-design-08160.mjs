import {readFile} from 'node:fs/promises';

const [app,pushPanel,twinSettings,syncSettings,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/PushSettingsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherTwinSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/DeviceSyncSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: ${token}`)};

const favoritesStart=app.indexOf('function FavoritesManager('),favoritesEnd=app.indexOf('function RuleInput(',favoritesStart),favoritesBlock=app.slice(favoritesStart,favoritesEnd);
reject('Favoritenverwaltung enthält weiterhin Push-Optionen',favoritesBlock,'favorite-push-rules');
reject('Favoritenverwaltung ändert weiterhin Push-Regeln',favoritesBlock,"patchPushRule(item.id");
need('Favoritenverwaltung verweist zentral auf Benachrichtigungen',favoritesBlock,'Benachrichtigungen werden ausschließlich im gleichnamigen Einstellungsbereich verwaltet.');

const viewStart=app.indexOf("section==='view'&&"),notificationsStart=app.indexOf("section==='notifications'&&",viewStart),viewBlock=app.slice(viewStart,notificationsStart);
reject('Ansichtsbereich enthält weiterhin Benachrichtigungs-Schalter',viewBlock,'checked={modelChangeSettings.notifyMaterial}');
need('Ansichtsbereich verweist auf zentralen Benachrichtigungsbereich',viewBlock,'Benachrichtigungen zu Modelllaufänderungen werden ausschließlich unter „Benachrichtigungen“ verwaltet.');
need('Modelländerungs-Benachrichtigung zentral im Push-Menü',pushPanel,'onModelChangeNotificationChange');
need('Modelländerungs-Benachrichtigung zentral im Push-Menü',pushPanel,'Bei materieller Änderung benachrichtigen');
need('Standardmodus zeigt technische Push-Hinweise nur eingeklappt',pushPanel,'settings-info-disclosure');
need('Push-Texte unterscheiden Standard und Erweitert',pushPanel,"advancedMode?'Push-Verbindung, Mindestabstand und ortsbezogene Regeln werden hier zentral verwaltet.'");

for(const token of [
 "WeatherTwinSettings({advancedMode=false}",
 'advancedMode&&<ConnectedStationSettings/>',
 "advancedMode&&<><label className={`settings-toggle-card",
 "'Wird nur genutzt, wenn die lokale Korrektur nachweislich belastbar ist.'"
])need('Kompakter Wetterzwilling im Standardmodus',twinSettings,token);
for(const token of [
 'DeviceSyncSettings({advancedMode=false}',
 'Automatische Web-App-Synchronisation',
 'Diese Web-App automatisch synchronisieren',
 'Geräteübergreifend übernommen'
])need('Kompakte Synchronisation im Standardmodus',syncSettings,token);
need('Apple-Werkzeuge nur im Erweiterten Modus',app,"layoutMode==='advanced'?<AppleWidgetSettings location={currentLocation} unit={unit}/>");

for(const token of [
 'data-settings-mode={layoutMode}',
 'className="settings-option-list"',
 "summary={layoutMode==='advanced'?'Radar, Satellit, Blitz und Modellkonturen':'Radar und aktuelle Wetterbeobachtungen'}",
 "summary={layoutMode==='advanced'?'Unsicherheit, Konsistenz, Quartile und Klimavergleich':'Mögliche Entwicklung der nächsten 14 Tage'}",
 "available&&fresh?'mit Messwert geprüft':'Vorhersage'",
 "advancedMode?' · Open-Meteo/CAMS':''"
])need('Standardmodus und App-Texte',app,token);

for(const token of [
 '.settings-dialog{--settings-card-radius:15px;--settings-card-gap:10px}',
 '.settings-option-list{display:grid;',
 '.settings-info-disclosure{',
 '.settings-dialog[data-settings-mode=standard] .settings-content{',
 '.settings-choice-grid button,.settings-unit-grid button,.settings-toggle-card,.settings-option-card,.push-settings-group,.advanced-feature-settings,.device-sync-settings,.weather-twin-settings{border-radius:var(--settings-card-radius)!important}'
])need('Vereinheitlichtes Einstellungsdesign',styles,token);

if(failures.length){console.error('Standardmodus-/Designbereinigung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Einstellungs- und Standardmodus-Design geprüft: Benachrichtigungen zentral, technische Inhalte reduziert und Karten-/Abstandsdesign vereinheitlicht.');
