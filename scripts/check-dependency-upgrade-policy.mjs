import {readFile} from 'node:fs/promises';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url),'utf8'));
const failures=[];
const expected={
 react:'19.2.8',
 'react-dom':'19.2.8',
 'react-is':'19.2.8',
 recharts:'3.10.1',
 'lucide-react':'^1.40.0',
 'maplibre-gl':'6.7.0',
};
const expectedDev={
 '@types/react':'^19.2.18',
 '@types/react-dom':'^19.2.5',
 typescript:'7.0.2',
 'typescript-strada':'npm:typescript@6.0.3',
 vite:'8.3.5',
 '@vitejs/plugin-react':'6.1.2',
};
const lockedVersion=(name,declared)=>name==='typescript-strada'?'6.0.3':declared.replace(/^\^/,'');
for(const [name,version] of Object.entries(expected)){
 if(pkg.dependencies?.[name]!==version)failures.push(`${name}: Stable-Vertrag ${version}, package.json ${pkg.dependencies?.[name]??'fehlt'}`);
 const locked=lock.packages?.[`node_modules/${name}`]?.version, want=lockedVersion(name,version);
 if(locked!==want)failures.push(`${name}: Lockfile ${locked??'fehlt'} statt ${want}`);
}
for(const [name,version] of Object.entries(expectedDev)){
 if(pkg.devDependencies?.[name]!==version)failures.push(`${name}: Stable-Vertrag ${version}, package.json ${pkg.devDependencies?.[name]??'fehlt'}`);
 const locked=lock.packages?.[`node_modules/${name}`]?.version, want=lockedVersion(name,version);
 if(locked!==want)failures.push(`${name}: Lockfile ${locked??'fehlt'} statt ${want}`);
}
for(const [packagePath,entry] of Object.entries(lock.packages??{})){
 if(packagePath.endsWith('node_modules/source-map-js')){
  const version=String(entry.version??''),parts=version.split('.').map(Number);
  if(!/^1\.\d+\.\d+$/.test(version)||parts[1]<2||(parts[1]===2&&parts[2]<2))failures.push(`${packagePath}: source-map-js >=1.2.2 im kompatiblen 1.x-Pfad erforderlich (GHSA-68fv-2mgg-jv7q)`);
 }
}
const vite=await readFile(new URL('../vite.config.ts',import.meta.url),'utf8');
for(const token of ["minify:'oxc'","cssMinify:'lightningcss'",'rolldownOptions','codeSplitting'])if(!vite.includes(token))failures.push(`Vite-8-Vertrag fehlt: ${token}`);
for(const deprecated of ["minify:'esbuild'","cssMinify:'esbuild'",'rollupOptions','manualChunks'])if(vite.includes(deprecated))failures.push(`Deprecated Vite-Pfad ist noch aktiv: ${deprecated}`);
if(failures.length){console.error('MID-Abhängigkeits-Upgrade-Policy verletzt:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Dependency-Policy geprüft: React 19.2.8, Recharts 3.10.1, Lucide 1.40.0, MapLibre 6.7.0, TypeScript 7.0.2 sowie Vite 8.3.5/plugin-react 6.1.2 sind reproduzierbar geschützt.');
