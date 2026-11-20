import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const app=read('src/App.tsx');
const cockpit=read('src/ForecastCockpit.tsx');
const seven=read('src/SevenDayDesignModes.tsx');
const fourteen=read('src/FourteenDayDevelopment.tsx');
const longRange=read('src/LongRangePanel.tsx');
const radar=read('src/RadarPanel.tsx');
const unified=read('src/UnifiedWeatherMap.tsx');
const startup=read('src/startupPreload.ts');
const contract=read('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md');
const dataQuality=read('src/DataQualityIndicator.tsx');
const qualityStyles=read('src/midParameterQuality.css');

const kept=[
 ['Standard/Erweitert',app.includes("onClick={()=>setLayoutMode('standard')}")&&app.includes("onClick={()=>setLayoutMode('advanced')}")],
 ['Dichte Auto/Kompakt/Komfortabel',app.includes("setUiDensityPreference('auto')")&&app.includes("setUiDensityPreference('compact')")&&app.includes("setUiDensityPreference('comfortable')")],
 ['7d A/B/C',cockpit.includes('mid-we-seven-switch-primary')&&cockpit.includes('showModeSwitch={false}')&&seven.includes("mode==='charts'")&&seven.includes("mode==='table'")],
 ['14d A/B/C',fourteen.includes('mid-we-fourteen-switch')&&fourteen.includes("displayChoice<FourteenView>('compact','charts','days')")],
 ['46d/Saison',longRange.includes("setLocalHorizon('46d')")&&longRange.includes("setLocalHorizon('season')")],
 ['Skybar/Quadrate',app.includes("skybarDisplayMode:'squares'")&&app.includes("skybarDisplayMode:'band'")],
 ['Radar unified renderer',unified.includes('<RadarPanel {...props}')&&radar.includes('!unified&&<div className="composite-view-tabs"')],
 ['Desktop-rail',app.includes('dashboard-section-rail')&&contract.includes('Desktopbreiten')]
];
for(const[label,ok]of kept)assert.ok(ok,'CANONICAL-REACHABILITY LOST: '+label);

const candidate=[
 {id:'old-navigation-fallback',present:app.includes("type NavigationMode='section-rail'|'bottom-tabs'")&&app.includes("const navigationMode:NavigationMode='bottom-tabs'"),action:'Qualify only the alternate JS quick-navigation branch, not the desktop rail.'},
 {id:'cockpit-ribbons',present:cockpit.includes("mode==='cockpit-ribbons'")&&app.includes('mode="cockpit-tabs"'),action:'Qualify alternate ribbon renderer and CSS after importgraph/test-fixture audit.'},
 {id:'obsolete-preload-presentationMode',present:startup.includes("settings?.presentationMode==='cockpit-ribbons'"),action:'Qualify prefetch equivalence, storage migration and bandwidth before removing.'},
 {id:'fixed-bottom-bar-contract-drift',present:contract.includes('**Auto** oder **Fixiert**')&&app.includes("type BottomBarBehavior='fixed'"),action:'Resolve normative current/historical contract with product owner; no automatic behavior change.'},
 {id:'old-24h-navigation',present:app.includes("value==='24h'?'90m'"),action:'Retain migration and all original 24h weather data; no deletion of 24h forecast.'},
 {id:'inactive-parameter-quality-indicator',present:app.includes("import {DataQualityIndicator} from './DataQualityIndicator'")&&app.includes('<DataQualityIndicator station={')&&!app.includes('<ParameterQualityIndicator')&&dataQuality.includes('export function ParameterQualityIndicator(')&&dataQuality.includes('export function DataQualityIndicator(')&&dataQuality.includes('return null;')&&qualityStyles.includes('.parameter-quality-indicator'),action:'Dormant indicator, not a user-visible quality UI. Qualify source import graph, settings, styles and migration before activation or removal; do not claim a visual correction.'}
];
for(const item of candidate)assert.ok(item.present,'LEGACY REMOVAL NOT APPROVED: '+item.id+' — '+item.action);
console.log(JSON.stringify({result:'PASS',stableKept:kept.length,candidates:candidate,removals:0},null,2));
