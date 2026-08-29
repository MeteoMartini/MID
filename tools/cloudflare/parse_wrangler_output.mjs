import {readFile,appendFile} from 'node:fs/promises';

const source=process.argv[2];
let raw='';
if(source){
  try{raw=await readFile(source,'utf8')}
  catch(error){
    if(error?.code!=='ENOENT')throw error;
  }
}
if(!raw)raw=String(process.env.WRANGLER_COMMAND_OUTPUT||'');
if(!raw.trim())throw new Error('Wrangler-Ausgabe fehlt: weder Ausgabedatei noch WRANGLER_COMMAND_OUTPUT vorhanden');

const ids=new Set();
for(const line of raw.split(/\r?\n/)){
  const match=line.match(/Worker Version ID:\s*([0-9a-f-]{20,})/i);
  if(match)ids.add(match[1]);
  try{
    const item=JSON.parse(line);
    const candidate=String(item?.version_id||'');
    if(/^[0-9a-f-]{20,}$/i.test(candidate))ids.add(candidate);
  }catch{}
}
if(ids.size!==1)throw new Error(`Keine eindeutige sichere Worker-Version in Wrangler-Ausgabe gefunden (gefunden: ${ids.size})`);
const [versionId]=ids;
console.log(versionId);
if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`version_id=${versionId}\n`);
