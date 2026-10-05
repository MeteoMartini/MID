import {readFileSync} from 'node:fs';
import {activeCssSources} from './cssCascade.mjs';
const root=new URL('../../',import.meta.url);
/** Ordered source view for load-order contracts formerly expressed as main imports.
 * Uses the canonical manifest which actually generates the eager runtime stylesheet.
 * The direct main entry and generated result are verified separately by the .170 test.
 */
export function readPresentationEntrySources(){
 const sources=activeCssSources(root),imports=["import './styles.css';"];
 for(const file of sources.slice(5)){
  if(file==='src/v078.css')imports.push("import './v078';");else imports.push(`import './${file.slice(4)}';`);
 }
 return readFileSync(new URL('src/main.tsx',root),'utf8').replace("import './v078';\n",'').replace("import './midPresentation.css';",imports.join('\n'));
}
