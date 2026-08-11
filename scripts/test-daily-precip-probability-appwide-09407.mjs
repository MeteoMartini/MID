import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [weather,app,cockpit,ensemble]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8')
]);

assert.match(weather,/peakWindow=Math\.max\(0,\.\.\.windows\.map\(window=>window\.probability\)\)/,'00–24-h probability must be reconciled against every 6-h window');
assert.match(weather,/next=Math\.max\(peakWindow,Math\.max\(0,Math\.min\(100,probability\)\)\)/,'daily probability must never fall below a contained 6-h probability');
assert.match(weather,/DWD-Ereigniswahrscheinlichkeit · 00–24 h:/,'daily title must name the calendar-day period explicitly');
assert.match(weather,/return `00–24h \$\{primary\}%\$\{peak\?` · \$\{precipitationProbabilityWindowCompactLabel\(peak\)\} \$\{Math\.round\(peak\.probability\)\}%`:/,'compact daily display must include both 00–24 h and the strongest 6-h window');
assert.match(weather,/return `max\. Std\. \$\{primary\}%`/,'hourly fallback must be clearly labelled and not masquerade as a daily probability');
assert.doesNotMatch(weather,/return `bis \$\{primary\}%`/,'ambiguous fallback wording must not return');

assert.match(app,/applyEnsembleDailyPrecipitationProbability\(baseDisplayDaysUnweighted,ens\)/,'central displayDays must receive ensemble daily probabilities');
assert.match(app,/dailyPrecipitationProbabilityCompact\(d\)/,'classic forecast and widget paths must use the central compact formatter');
assert.match(cockpit,/dailyPrecipitationProbabilityCompact\(day\)/,'7-day cockpit must use the same compact formatter');
assert.match(ensemble,/return `00–24h \$\{primary\}%/,'ensemble overview must expose the 00–24-h probability');
assert.match(ensemble,/00–24-h-Niederschlagswahrscheinlichkeit/,'ensemble chart explanation must identify the plotted daily period');

console.log('ok - app-wide 00–24 h / 6-h precipitation probability display and consistency contract verified');
