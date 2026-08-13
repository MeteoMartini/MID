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
assert.match(weather,/export function elevatedDwdPrecipitationProbabilityWindow/,'central elevated-window selector missing');
assert.match(weather,/highest-second>=10\?ranked\[0\]:undefined/,'a 6-h window must only replace the day label when it is clearly elevated');
assert.match(weather,/return elevated\?`\$\{precipitationProbabilityWindowCompactLabel\(elevated\)\} · \$\{Math\.round\(elevated\.probability\)\}%`:`00–24h · \$\{primary\}%`/,'compact daily display must choose exactly one period: elevated 6-h window or 00–24 h');
assert.doesNotMatch(weather,/`00–24h \$\{primary\}%\$\{peak\?/,'compact daily display must not concatenate day and 6-h probabilities');
assert.match(weather,/return `max\. Std\. \$\{primary\}%`/,'hourly fallback must be clearly labelled and not masquerade as a daily probability');

assert.match(weather,/export function precipitationDurationDayOverviewLabel/,'whole-hour day-overview duration formatter missing');
assert.match(weather,/Math\.round\(Math\.max\(0,Number\(durationHours\)\|\|0\)\)/,'day-overview precipitation duration must round to whole hours');
assert.match(weather,/export function precipitationDurationDayOverviewCompactLabel/,'compact whole-hour day duration missing');
assert.match(app,/precipitationDurationDayOverviewCompactLabel\(precipitationAssessment\.durationHours\)/,'classic forecast/widget day overview must round precipitation duration to whole hours');
assert.match(cockpit,/precipitationDurationDayOverviewCompactLabel\(precipitationAssessment\.durationHours\)/,'7-day cockpit must round precipitation duration to whole hours');
assert.match(ensemble,/precipitationDurationDayOverviewLabel\(dayPrecipitationAssessment\(day,dayHours\)\.durationHours\)/,'ensemble daily overview must round precipitation duration to whole hours');

assert.match(app,/applyEnsembleDailyPrecipitationProbability\(baseDisplayDaysUnweighted,ens\)/,'central displayDays must receive ensemble daily probabilities');
assert.match(app,/dailyPrecipitationProbabilityCompact\(d,allDayHoursForDate\)/,'classic forecast must pass the full calendar-day hours into the central compact formatter');
assert.match(app,/dailyPrecipitationProbabilityCompact\(d,d\.probabilityHours\)/,'widget must pass the full calendar-day hours into the central compact formatter');
assert.match(cockpit,/dailyPrecipitationProbabilityCompact\(day,probabilityHours\)/,'7-day cockpit must pass the full calendar-day hours into the same compact formatter');
assert.match(ensemble,/elevatedDwdPrecipitationProbabilityWindow\(row\.precipitationProbabilityWindows\)/,'ensemble overview must use the same elevated-window logic');
assert.match(ensemble,/return elevated\?`\$\{precipitationProbabilityWindowCompactLabel\(elevated\)\} · \$\{Math\.round\(elevated\.probability\)\}%`:`00–24h · \$\{primary\}%`/,'ensemble overview must choose exactly one period');
assert.match(ensemble,/00–24-h-Niederschlagswahrscheinlichkeit/,'ensemble chart explanation must identify the plotted daily period');

console.log('ok - app-wide exclusive 00–24 h / elevated 6-h display and whole-hour daily precipitation duration verified');
