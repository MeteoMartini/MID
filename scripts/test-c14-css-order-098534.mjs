import {readPresentationEntrySources} from './lib/presentationEntrySources.mjs';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const main=await readPresentationEntrySources();
const order=['styles.css','midNext.css','midDesign.css','v078','midC7Redesign.css','midC7Composition.css','midC8VisibleRedesign.css','midC10CurrentRedesign.css','midC11TodayRedesign.css','midC12ForecastRedesign.css','midC13MobileDensity.css','midC13MobileTouch.css','midC14MapWorkspace.css','midC14ViewportFixes.css'];
let previous=-1;for(const file of order){const index=main.indexOf(`import './${file}'`);assert.ok(index>=0,`Stylesheet fehlt: ${file}`);assert.ok(index>previous,`Stylesheet-Reihenfolge verletzt bei ${file}`);previous=index}
console.log('MID-C14: Legacy-Basis und Redesign-CSS werden in der verbindlichen Kaskadenreihenfolge geladen.');
