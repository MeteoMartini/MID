import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [beforePath,afterPath]=process.argv.slice(2);if(!beforePath||!afterPath)throw new Error('Nutzung: worker_semantic_diff.mjs <vorher> <nachher>');
const normalise=s=>String(s).replace(/const WORKER_VERSION='[^']+';/g,"const WORKER_VERSION='<VERSION>';" ).replace(/\r\n/g,'\n').trim();
const [before,after]=await Promise.all([readFile(beforePath,'utf8'),readFile(afterPath,'utf8')]);
const hash=s=>createHash('sha256').update(normalise(s)).digest('hex'),beforeHash=hash(before),afterHash=hash(after),changed=beforeHash!==afterHash;
console.log(JSON.stringify({changed,beforeHash,afterHash}));
if(process.env.GITHUB_OUTPUT)await import('node:fs/promises').then(({appendFile})=>appendFile(process.env.GITHUB_OUTPUT,`changed=${changed}\n`));
