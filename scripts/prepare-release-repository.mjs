import {spawnSync} from 'node:child_process';
import {access,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const modulePath=fileURLToPath(import.meta.url);
const defaultRoot=path.resolve(path.dirname(modulePath),'..');

function defaultGitCleanup(root){
 return spawnSync('git',['rm','-r','-q','--cached','--ignore-unmatch','node_modules'],{cwd:root,stdio:'inherit'});
}

async function fileExists(file){try{await access(file);return true}catch{return false}}
async function prependIfMissing(file,heading,body){
 const current=await readFile(file,'utf8');
 if(current.startsWith(heading))return false;
 await writeFile(file,`${heading}\n\n${body.trim()}\n\n${current}`,'utf8');
 return true;
}
async function syncVersionedReleaseNotes(root){
 const packageFile=path.join(root,'package.json');
 if(!(await fileExists(packageFile)))return {synced:false};
 const pkg=JSON.parse(await readFile(packageFile,'utf8'));
 const version=String(pkg.version||'').trim();
 if(!version)return {synced:false};
 const noteFile=path.join(root,`MID_RELEASE_NOTES_${version}.json`);
 if(!(await fileExists(noteFile)))return {synced:false};
 const notes=JSON.parse(await readFile(noteFile,'utf8'));
 if(String(notes.version)!==version)throw new Error(`Release-Notiz ${path.basename(noteFile)} trägt nicht die Paketversion ${version}.`);
 const external=(Array.isArray(notes.external)?notes.external:[]).map(item=>`- ${String(item)}`).join('\n');
 const internal=(Array.isArray(notes.internal)?notes.internal:[]).map(item=>`- ${String(item)}`).join('\n');
 if(!external||!internal)throw new Error(`Release-Notiz ${path.basename(noteFile)} muss externe und interne Einträge enthalten.`);
 const heading=`# MID v${version}`;
 const internalHeading=`## MID v${version} · ${notes.date||new Date().toISOString().slice(0,10)} · ${notes.title||'Release'}`;
 const targets=[path.join(root,'CHANGELOG.md'),path.join(root,'public','CHANGELOG.md')];
 let changed=false;
 for(const target of targets){if(await fileExists(target))changed=(await prependIfMissing(target,heading,external))||changed}
 const buildChangelog=path.join(root,'MID_BUILD_CHANGELOG.md');
 if(await fileExists(buildChangelog))changed=(await prependIfMissing(buildChangelog,internalHeading,internal))||changed;
 if(changed)console.log(`Changelog-Synchronisierung: MID v${version} wurde aus ${path.basename(noteFile)} vorangestellt.`);
 return {synced:changed};
}

/**
 * Bereitet den normalen Release-Arbeitsbaum auf Repository-Hygiene vor.
 *
 * WICHTIG: Diese Funktion darf .github niemals verändern. GitHub-Workflowdateien
 * werden ausschließlich explizit über `npm run sync:github-workflows` synchronisiert.
 * Ein laufender GitHub-Actions-Job kann Workflowdateien mit seinem GITHUB_TOKEN
 * nicht zuverlässig selbst aktualisieren; automatische Selbstmodifikation würde
 * den späteren Push des Release-Commits blockieren.
 */
export async function prepareReleaseRepository({
 root=defaultRoot,
 githubActions=process.env.GITHUB_ACTIONS==='true',
 runGitCleanup=defaultGitCleanup
}={}){
 await syncVersionedReleaseNotes(root);
 if(!githubActions)return {nodeModulesUntracked:false};
 const result=runGitCleanup(root);
 if(result?.error)throw result.error;
 if(result?.status!==0)throw new Error(`Versioniertes node_modules konnte nicht aus dem Git-Index entfernt werden (Exit ${result?.status ?? 'unbekannt'}).`);
 console.log('Repository-Hygiene: node_modules ist aus dem Git-Index entfernt und bleibt über .gitignore lokal.');
 console.log('Repository-Hygiene: .github bleibt im automatischen Release-Lauf unverändert; Workflow-Synchronisierung ist ausschließlich explizit.');
 return {nodeModulesUntracked:true};
}

if(process.argv[1]&&path.resolve(process.argv[1])===modulePath){
 await prepareReleaseRepository();
}
