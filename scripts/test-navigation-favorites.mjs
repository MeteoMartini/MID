import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const styles=await readFile(path.join(root,'src','styles.css'),'utf8');
const failures=[];

const navBase=styles.indexOf('.meteogram-day-jump{\n position:absolute;');
const tabletMedia=styles.indexOf('@media(max-width:850px)',navBase);
if(navBase<0)failures.push('Die Tagespfeile besitzen keine plattformübergreifende Basisdarstellung.');
if(tabletMedia<0||navBase>tabletMedia)failures.push('Die Tagespfeile sind weiterhin nur innerhalb der Tablet-/Mobil-Media-Query definiert.');
if(styles.includes('.meteogram-day-jump{display:none}'))failures.push('Die Tagespfeile werden auf Desktop weiterhin ausgeblendet.');
for(const token of ['Vorheriger Tag:','Nächster Tag:','Handy, Tablet und Desktop tageweise'])if(!app.includes(token))failures.push(`Tagesnavigation unvollständig: ${token}`);

if(!app.includes('return current.length>=20?[...current.slice(0,19),added]:[...current,added]'))failures.push('Neu angelegte Favoriten werden nicht am Ende einsortiert.');
if(!app.includes('normaliseFavoriteCollection([...current,...incoming])'))failures.push('Importierte Favoriten werden nicht hinter den vorhandenen Favoriten angefügt.');
if(app.includes('[{id:favoriteId()')&&app.includes('},...current].slice(0,20)'))failures.push('Alte Favoriten-Voranstellung ist weiterhin vorhanden.');

if(failures.length){console.error('Navigations-/Favoritenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Navigation und Favoriten geprüft: Tagespfeile stehen auf Handy, Tablet und Desktop bereit; neue und importierte Favoriten werden hinten angefügt.');
