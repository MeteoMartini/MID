import {readFile,writeFile} from 'node:fs/promises';
const file='MID_24H_PROFILE_STORY_AXIS_CONTRACT.md';
let text=await readFile(file,'utf8');
text=text.replace(/- 1-h- und 3-h-Modus verdichten nur die Darstellung; Zeitfenster und fachliche\n  Werte bleiben unverändert\./,
`- Das Profil verwendet durchgehend die kanonische stündliche Darstellung; Zeitfenster und fachliche Werte bleiben unverändert.`);
text=text.replace(/- Die Temperaturkurve verwendet innerhalb des rollenden 24-h-Fensters immer die\n  finale kanonische stündliche Reihe `displayHours`; die 1-h-\/3-h-Umschaltung[\s\S]*?  unberührt\.\n/,
`- Die Temperaturkurve verwendet innerhalb des rollenden 24-h-Fensters immer die finale kanonische stündliche Reihe \`displayHours\`; eine zusätzliche Darstellungsauflösung existiert nicht.\n- Derselbe Grundsatz gilt für gefühlte Temperatur, Taupunkt und Luftdruck: Sie bleiben an der kanonischen stündlichen Reihe und damit zeitlich konsistent zur Temperaturkurve. Intervallgrößen wie Niederschlagsakkumulationen bleiben davon unberührt.\n`);
text=text.replace(/- Beide Extremmarken bleiben auch im 3-h-Anzeigemodus sichtbar, weil ihre Position\n  aus der vollständigen stündlichen Temperaturkurve und nicht aus dem ausgedünnten\n  3-h-Raster bestimmt wird\./,
`- Beide Extremmarken werden aus der vollständigen stündlichen Temperaturkurve bestimmt und bleiben deshalb an tatsächlich gezeichneten Stundenpunkten verankert.`);
text=text.replace(/Stunden-\/3-h-Linien/g,'Stundenlinien');
text=text.replace(/1-h-\/3-h-Umschaltung/g,'stündliche Darstellung');
text=text.replace(/1-h-\/3-h/g,'stündlichen');
text=text.replace(/1 h\/3 h/g,'stündlich');
if(/\b3-h(?:-|\b)|\b3 h\b/.test(text)){
 const matches=text.split('\n').filter(line=>/\b3-h(?:-|\b)|\b3 h\b/.test(line));
 throw new Error(`Verwaiste 3-h-Vertragsstellen:\n${matches.join('\n')}`);
}
await writeFile(file,text,'utf8');
console.log('24-h-Profilvertrag vollständig auf ausschließlich stündliche Darstellung bereinigt.');
