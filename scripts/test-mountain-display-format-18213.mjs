import assert from 'node:assert/strict';
import {mountainSnowfallLabel} from '../src/mountainDisplay.ts';

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

console.log('Mountain snowfall labels preserve zero, trace amounts, rounded centimeters, and missing data.');