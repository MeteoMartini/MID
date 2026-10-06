import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pkg=JSON.parse(read('package.json'));
const baseline=JSON.parse(read('MID_BASELINE.json'));
const workflows=[
  read('.github/workflows/install-mid.yml'),
  read('ci/github/workflows/install-mid.yml'),
  read('workflow-patches/install-mid.yml')
];
const self='scripts/test-www-proxy-dns-token-0985185.mjs';

assert.equal(pkg.version,'0.9.85.185');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
assert.equal(pkg.scripts?.['test:www-proxy-dns-token'],`node ${self}`);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(self),`${self} fehlt in ${key}.`);

for(const workflow of workflows){
  const dnsStart=workflow.indexOf('Bestehenden www-CNAME für Same-Origin sicher über Cloudflare proxien');
  const routeStart=workflow.indexOf('Same-Origin-Route für produktives Web fail-closed verifizieren');
  const healthStart=workflow.indexOf('Same-Origin-Datendienst vor Pages und Stable prüfen');
  assert.ok(dnsStart>=0&&routeStart>dnsStart&&healthStart>routeStart,'DNS -> Route -> Health Reihenfolge fehlt.');
  const dnsBlock=workflow.slice(dnsStart,routeStart);
  const routeBlock=workflow.slice(routeStart,healthStart);
  assert.ok(dnsBlock.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_DNS_API_TOKEN }}'),'DNS-Gate muss den separaten Repository-Secret verwenden.');
  assert.ok(!dnsBlock.includes('secrets.CLOUDFLARE_API_TOKEN'),'DNS-Gate darf den Worker-Token nicht verwenden.');
  assert.ok(routeBlock.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'),'Worker-Route muss den bestehenden Worker-Token behalten.');
  assert.ok(!routeBlock.includes('secrets.CLOUDFLARE_DNS_API_TOKEN'),'DNS-Token darf nicht für Worker-Route verwendet werden.');
}
assert.equal(workflows[0],workflows[1],'Aktiver und kanonischer Installer müssen bytegleich sein.');
assert.equal(workflows[1],workflows[2],'Kanonischer Installer und Transportspiegel müssen bytegleich sein.');

console.log('MID v0.9.85.185: DNS-Proxy und Worker/Route verwenden getrennte Least-Privilege-Tokens.');
