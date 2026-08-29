import {readFile,appendFile} from 'node:fs/promises';
const file=process.argv[2];if(!file)throw new Error('Wrangler-Ausgabedatei fehlt');const raw=await readFile(file,'utf8'),rows=raw.split(/\r?\n/).filter(Boolean).map(line=>{try{return JSON.parse(line)}catch{return null}}).filter(Boolean);
const row=[...rows].reverse().find(item=>item.type==='version-upload'&&item.version_id)||[...rows].reverse().find(item=>item.version_id);
const versionId=String(row?.version_id||'');if(!/^[0-9a-f-]{20,}$/i.test(versionId))throw new Error(`Keine sichere version_id in ${file} gefunden`);
console.log(versionId);if(process.env.GITHUB_OUTPUT)await appendFile(process.env.GITHUB_OUTPUT,`version_id=${versionId}\n`);
