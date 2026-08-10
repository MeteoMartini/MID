import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const modulePath=fileURLToPath(import.meta.url);
const defaultRoot=path.resolve(path.dirname(modulePath),'..');

function defaultGitCleanup(root){
 return spawnSync('git',['rm','-r','-q','--cached','--ignore-unmatch','node_modules'],{cwd:root,stdio:'inherit'});
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
