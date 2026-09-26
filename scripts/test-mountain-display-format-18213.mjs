import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript-strada');
const source=await readFile(new URL('../src/mountainDisplay.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},reportDiagnostics:true,fileName:'mountainDisplay.ts'});
assert.equal(output.diagnostics?.length??0,0,'mountainDisplay.ts lässt sich nicht sauber transpilierten.');
const {mountainSnowfallClass,mountainSnowfallLabel}=await import(`data:text/javascript;base64,${Buffer.from(output.outputText).toString('base64')}`);

const cases=[
 [0,'0 cm'],
 [0.01,'<1 cm'],
 [.7,'<1 cm'],
 [.999,'<1 cm'],
 [1,'1 cm'],
 [1.49,'1 cm'],
 [1.5,'2 cm'],
 [12.6,'13 cm'],
 [null,'–'],
 [undefined,'–'],
 ['', '–'],
 [Number.NaN,'–'],
 [Number.POSITIVE_INFINITY,'–'],
 [-.2,'–'],
 [Symbol('missing'),'–'],
];
for(const [input,expected] of cases)assert.equal(mountainSnowfallLabel(input),expected,`Unexpected snow label for ${String(input)}`);

const classCases=[
 [0,''],
 [.05,''],
 [.1,'mountain-snow-trace'],
 [.99,'mountain-snow-trace'],
 [1,'mountain-snow-light'],
 [2.99,'mountain-snow-light'],
 [3,'mountain-snow-moderate'],
 [7.99,'mountain-snow-moderate'],
 [8,'mountain-snow-heavy'],
 [null,''],
 [Number.NaN,''],
 [-.1,''],
];
for(const [input,expected] of classCases)assert.equal(mountainSnowfallClass(input),expected,`Unexpected snow intensity class for ${String(input)}`);

console.log('Mountain snowfall labels preserve values; snow intensity classes use independent centimeter thresholds.');
