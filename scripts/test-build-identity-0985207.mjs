import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {writeBuildIdentity} from './write-build-identity.mjs';

const root=await mkdtemp(path.join(tmpdir(),'mid-identity-'));
try{
 await mkdir(path.join(root,'dist','assets'),{recursive:true});
 await mkdir(path.join(root,'src'));
 await writeFile(path.join(root,'package.json'),JSON.stringify({version:'0.9.85.207'}));
 await writeFile(path.join(root,'src','version.ts'),"export const MID_VERSION='0.9.85.207';\n");
 await writeFile(path.join(root,'dist','index.html'),'<meta name="mid-version" content="0.9.85.207">');
 await writeFile(path.join(root,'dist','version.json'),JSON.stringify({version:'0.9.85.207'}));
 await writeFile(path.join(root,'dist','assets','index-abcd.js'),'console.log("MID");');
 const sha='a'.repeat(40);
 const first=await writeBuildIdentity({root,sourceSha:sha,now:'2026-10-08T19:00:00Z'});
 assert.equal(first.schema,'mid.web-build-identity.v1');
 assert.equal(first.version,'0.9.85.207');
 assert.equal(first.sourceGitSha,sha);
 assert.equal(first.assetCount,3);
 assert.match(first.assetsSha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(JSON.parse(await readFile(path.join(root,'dist','mid-build-identity.json'),'utf8')),first);
 const second=await writeBuildIdentity({root,sourceSha:sha,now:'2026-10-08T19:02:00Z'});
 assert.equal(second.assetsSha256,first.assetsSha256,'Das Identitätsmanifest darf den eigenen Asset-Fingerabdruck nicht ändern');
 await writeFile(path.join(root,'dist','assets','index-abcd.js'),'console.log("Changed");');
 const third=await writeBuildIdentity({root,sourceSha:sha});
 assert.notEqual(third.assetsSha256,first.assetsSha256,'Ein verändertes Bundle benötigt neuen Fingerabdruck');
 await writeFile(path.join(root,'dist','version.json'),JSON.stringify({version:'0.9.85.206'}));
 await assert.rejects(writeBuildIdentity({root,sourceSha:sha}),/Web-Bundle-Version/);
 await writeFile(path.join(root,'dist','version.json'),JSON.stringify({version:'0.9.85.207'}));
 await assert.rejects(writeBuildIdentity({root,sourceSha:'unverified'}),/Ungültige Quell-SHA/);
 console.log('MID: Versionsgleichheit, SHA-Provenienz, Bundle-Fingerprint und negative Fixtures erfolgreich geprüft.');
}finally{await rm(root,{recursive:true,force:true});}
