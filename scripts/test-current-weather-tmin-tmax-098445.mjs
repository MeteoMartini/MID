import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const css=fs.readFileSync('src/styles-src/30-modern.css','utf8');
for(const token of ['hero-day-range-values','className="min"','className="max"','Tmin','Tmax']) if(!app.includes(token)) throw new Error('missing '+token);
for(const token of ['.hero.current-compact .hero-day-range-values>.min','.hero.current-compact .hero-day-range-values>.max','font-variant-numeric:tabular-nums']) if(!css.includes(token)) throw new Error('missing style '+token);
if(css.includes('.hero-day-range{grid-column:1;grid-row:3;grid-template-columns:1fr 1px 1fr;padding:4px}.hero.current-compact .hero-day-range>em{display:none}')) throw new Error('legacy mobile Tmin/Tmax layout still overrides redesigned range');
console.log('PASS current weather Tmin/Tmax presentation contract');
