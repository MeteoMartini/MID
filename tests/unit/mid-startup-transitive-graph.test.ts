import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {startupTransitiveGraph} from '../../scripts/lib/startupTransitiveGraph.mjs';

function js(file:string,source:string){
 const data=Buffer.from(source);
 return {file,extension:'.js',source,bytes:data.length,gzipBytes:gzipSync(data,{level:9}).length,
  sha256:createHash('sha256').update(data).digest('hex')};
}
function startup(files:ReturnType<typeof js>[],...roots:string[]){
 return {schema:'mid.static-startup-assets.v1',js:{entries:roots.map(file=>({
  file,bytes:files.find(f=>f.file===file)?.bytes,gzipBytes:files.find(f=>f.file===file)?.gzipBytes
 }))}};
}
const fixture=[
 js('assets/index.js',"import './a.js'; import('./lazy.js'); export {default} from './vendor.js';"),
 js('assets/a.js',"export * from './leaf.js';"),
 js('assets/leaf.js',"import './index.js'; export const value=1;"),
 js('assets/vendor.js',"export default 9;"),
 js('assets/lazy.js',"export const later=1;"),
];

describe('MID Design 1.5: exact static startup import closure',()=>{
 it('follows imports and re-exports, handles cycles, deduplicates preloads and excludes dynamic chunks',()=>{
  const result=startupTransitiveGraph(startup(fixture,'assets/index.js','assets/vendor.js'),fixture);
  expect(result.schema).toBe('mid.static-transitive-startup-js.v1');
  expect(result.entries.map((x:{file:string})=>x.file)).toEqual(['assets/a.js','assets/index.js','assets/leaf.js','assets/vendor.js']);
  expect(result.htmlReferencedFiles).toBe(2);
  expect(result.additionalStaticFiles).toBe(2);
  expect(result.dynamicImportCount).toBe(1);
  expect(result.excludedDynamicImports[0].specifier).toBe('./lazy.js');
  expect(result.staticClosureBytes).toBe(result.entries.reduce((n:number,x:{bytes:number})=>n+x.bytes,0));
  expect(result.entries.every((x:{sha256:string})=>x.sha256.length===64)).toBe(true);
 });
 it('rejects missing imports, external imports, traversal and non-JavaScript static dependencies',()=>{
  const source=js('assets/index.js',"import './missing.js';");
  expect(()=>startupTransitiveGraph(startup([source],'assets/index.js'),[source])).toThrow(/missing/);
  for(const spec of ['react','../../outside.js','./style.css','https://example.com/a.js']){
   const root=js('assets/index.js',"import '"+spec+"';");
   expect(()=>startupTransitiveGraph(startup([root],'assets/index.js'),[root])).toThrow(/Unsupported|escapes/);
  }
 });
 it('rejects altered source, invented sizes, bad paths, duplicate inventory and missing HTML roots',()=>{
  const x=js('assets/index.js','export default 1;');
  for(const invalid of [{...x,source:'export default 2;'},{...x,bytes:x.bytes+1},{...x,sha256:null},{...x,file:'../index.js'}]){
   expect(()=>startupTransitiveGraph(startup([x],'assets/index.js'),[invalid])).toThrow();
  }
  expect(()=>startupTransitiveGraph(startup([x],'assets/index.js'),[x,x])).toThrow(/Duplicate/);
  expect(()=>startupTransitiveGraph(startup([x],'assets/index.js'),[])).toThrow(/not present/);
  expect(()=>startupTransitiveGraph({schema:'mid.static-startup-assets.v1',js:{entries:[]}},[x])).toThrow(/required/);
 });
 it('rejects malformed JavaScript and retains nonliteral dynamic imports as excluded and unverified',()=>{
  const broken=js('assets/index.js','import {');
  expect(()=>startupTransitiveGraph(startup([broken],'assets/index.js'),[broken])).toThrow(/Malformed/);
  const dynamic=js('assets/index.js','const target="./maybe.js"; import(target);');
  const result=startupTransitiveGraph(startup([dynamic],'assets/index.js'),[dynamic]);
  expect(result.staticClosureFiles).toBe(1);
  expect(result.excludedDynamicImports).toEqual([{parent:'assets/index.js',specifier:null,kind:'excluded-dynamic-import'}]);
 });
});
