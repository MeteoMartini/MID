import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [fragment,weather]=await Promise.all([
  readFile(new URL('src/weather-src/30-ensemble-climate-hazards.tsfrag',root),'utf8'),
  readFile(new URL('src/weather.ts',root),'utf8'),
]);
const typed="freshness=(model:EnsembleModel)=>effectiveModelFreshness(model,runById.get(model.id))";
const untyped="freshness=model=>effectiveModelFreshness(model,runById.get(model.id))";
assert.ok(fragment.includes(typed),'Kanonische weather-Teilquelle verliert den EnsembleModel-Typ im Frische-Callback.');
assert.ok(weather.includes(typed),'Generiertes weather.ts verliert den EnsembleModel-Typ im Frische-Callback.');
assert.ok(!fragment.includes(untyped),'Kanonische weather-Teilquelle enthält wieder den implizit-any Callback.');
assert.ok(!weather.includes(untyped),'Generiertes weather.ts enthält wieder den implizit-any Callback.');
console.log('Weather-Aggregat-Typvertrag geprüft: maintain:aggregates erhält den EnsembleModel-Typ des Frische-Callbacks.');
