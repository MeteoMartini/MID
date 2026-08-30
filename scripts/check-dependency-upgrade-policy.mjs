import {readFile} from 'node:fs/promises';

const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url),'utf8'));
const failures=[];
const expected={
 react:'18.3.1',
 'react-dom':'18.3.1',
 'react-is':'18.3.1',
 recharts:'3.10.1',
 'lucide-react':'^1.34.0',
 'maplibre-gl':'6.5.0',
};
const expectedDev={typescript:'7.0.2','typescript-strada':'npm:typescript@6.0.3',vite:'6.4.3','@vitejs/plugin-react':'4.7.0'};
for(const[name,version]of Object.entries(expected)){
 if(pkg.dependencies?.[name]!==version)failures.push(`${name}: Stable-Vertrag ${version}, package.json ${pkg.dependencies?.[name]??'fehlt'}`);
 const locked=lock.packages?.[`node_modules/${name}`]?.version;
 const expectedLocked=name==='typescript-strada'?'6.0.3':name==='lucide-react'?'1.34.0':version;
 if(locked!==expectedLocked)failures.push(`${name}: Lockfile ${locked??'fehlt'} statt ${expectedLocked}`);
}
for(const[name,version]of Object.entries(expectedDev)){
 if(pkg.devDependencies?.[name]!==version)failures.push(`${name}: Stable-Vertrag ${version}, package.json ${pkg.devDependencies?.[name]??'fehlt'}`);
 const locked=lock.packages?.[`node_modules/${name}`]?.version;
 const expectedLocked=name==='typescript-strada'?'6.0.3':name==='lucide-react'?'1.34.0':version;
 if(locked!==expectedLocked)failures.push(`${name}: Lockfile ${locked??'fehlt'} statt ${expectedLocked}`);
}
if(failures.length){
 console.error('MID-Abhängigkeits-Upgrade-Policy verletzt:\n- '+failures.join('\n- '));
 console.error('Toolchain-Upgrades werden nur nach getrenntem Kompatibilitätslauf in mid-stable übernommen. TypeScript 7.0.2 ist qualifiziert; React 19, Vite 8 und plugin-react 6 bleiben getrennt zurückgestellt.');
 process.exit(1);
}
console.log('Dependency-Policy geprüft: React 18.3.1, Recharts 3.10.1, Lucide React 1.34.0, MapLibre GL JS 6.5.0, TypeScript 7.0.2 und Vite 6.4.3 sind reproduzierbar geschützt; React 19, Vite 8 und plugin-react 6 bleiben getrennte Vollmigrationen.');
