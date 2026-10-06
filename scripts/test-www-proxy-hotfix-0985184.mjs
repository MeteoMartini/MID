import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pkg=JSON.parse(read('package.json'));
const baseline=JSON.parse(read('MID_BASELINE.json'));
const dns=read('tools/cloudflare/ensure_www_proxy.mjs');
const route=read('tools/cloudflare/ensure_same_origin_route.mjs');
const install=read('.github/workflows/install-mid.yml');
const canonical=read('ci/github/workflows/install-mid.yml');
const patch=read('workflow-patches/install-mid.yml');

assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);

assert.match(dns,/const zoneName='midwx\.app'/);
assert.match(dns,/const recordName='www\.midwx\.app'/);
assert.match(dns,/\['CNAME','A','AAAA'\]/);
assert.match(dns,/addressRecords\.length!==1\|\|cnames\.length!==1/);
assert.match(dns,/before\?\.proxiable===false/);
assert.match(dns,/method:'PATCH',body:JSON\.stringify\(\{proxied:true\}\)/);
assert.match(dns,/String\(after\?\.content\|\|''\)!==content/);
assert.match(dns,/String\(after\?\.name\|\|''\)!==name/);
assert.match(dns,/String\(after\?\.type\|\|''\)!==type/);
assert.ok(!dns.includes("method:'POST'"),'DNS-Hotfix darf keinen neuen DNS-Record anlegen.');
assert.ok(!dns.includes("method:'PUT'"),'DNS-Hotfix darf keinen Record vollständig ersetzen.');
assert.ok(!dns.includes('/ssl')&&!dns.includes('/settings'),'DNS-Hotfix darf TLS/Zone-Settings nicht verändern.');

assert.match(route,/pattern='www\.midwx\.app\/api\/mid-worker\*'/);
for(const workflow of [install,canonical,patch]){
 const dnsIndex=workflow.indexOf('ensure_www_proxy.mjs');
 const routeIndex=workflow.indexOf('ensure_same_origin_route.mjs');
 const healthIndex=workflow.indexOf('Same-Origin-Datendienst vor Pages und Stable prüfen');
 assert.ok(dnsIndex>=0&&routeIndex>dnsIndex&&healthIndex>routeIndex,'Reihenfolge muss DNS-Proxy -> Worker-Route -> Same-Origin-Health sein.');
 assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'));
}
assert.equal(install,canonical,'Aktiver und kanonischer Installer müssen bytegleich sein.');
assert.equal(canonical,patch,'Kanonischer Installer und Transportspiegel müssen bytegleich sein.');

console.log(`MID v${pkg.version}: bestehender www-CNAME wird ausschließlich auf proxied=true gesetzt; Ziel, Typ, Name, TLS und andere DNS-Einträge bleiben geschützt.`);
