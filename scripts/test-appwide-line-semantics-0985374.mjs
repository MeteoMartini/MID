import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const line=read('src/parameterLineStyle.ts'),app=read('src/App.tsx'),cockpit=read('src/ForecastCockpit.tsx'),css=read('src/styles-src/30-modern.css');
const styles={temperature:'none',apparent:'5 4',dewpoint:'2 5',pressure:'none',probability:'4 3',wind:'none',gust:'9 4'};
for(const [role,dash] of Object.entries(styles)){
  assert.match(line,new RegExp('^\\s*'+role+':\\{[^\\n]*'+(dash==='none'?'width:':'dash:\\x27'+dash+'\\x27'),'m'),'line contract: '+role);
  assert.ok(app.includes('data-parameter-line="'+role+'" style={parameterLineStyle(\x27'+role+'\x27)}'),'daily detail uses central role '+role);
  assert.ok(cockpit.includes('data-parameter-line="'+role+'" style={parameterLineStyle(\x27'+role+'\x27)}'),'24h profile uses central role '+role);
}
const dashed=Object.entries(styles).filter(([,dash])=>dash!=='none').map(([,dash])=>dash);
assert.equal(new Set(dashed).size,dashed.length,'overlapping dashed meteorological lines must be distinct without colour');
const daily=[...app.matchAll(/<path data-parameter-line="([^"]+)" style=\{parameterLineStyle\('([^']+)'\)\}[^>]*?\/>/g)];
assert.equal(daily.length,7,'all seven daily chart paths are governed by the central SVG renderer');
for(const match of daily){
 assert.equal(match[1],match[2]);
 assert.doesNotMatch(match[0],/\s(?:fill|stroke|strokeWidth|strokeDasharray|opacity|vectorEffect|strokeLinecap|strokeLinejoin)="/,'no duplicate hard-coded presentational SVG attributes for '+match[1]);
}
const swatches=[
 ['apparent','--apparent-line','5px','9px'],['dewpoint','--profile-dew','2px','7px'],['probability','--profile-prob','4px','7px'],['gust','--profile-gust','9px','13px']
];
for(const [role,token,solid,end] of swatches){
 assert.ok(css.includes('.cockpit-weather-profile .cockpit-meteogram-pro__legend i.'+role+'{width:24px;height:2px;border:0;background:repeating-linear-gradient(90deg,var('+token+') 0 '+solid+',transparent '+solid+' '+end+')}'),'24h legend must precisely match its SVG dash: '+role);
}
assert.ok(css.includes('.cockpit-weather-profile .gust-line{fill:none;stroke:var(--profile-gust);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:9 4;opacity:.96}'));
for(const [role,token,dash,end] of [['gustline','--param-gust','9px','13px'],['apparent','--apparent-line','5px','9px'],['probability','--param-precipitation','4px','7px']]){
 assert.ok(css.includes('.detaillegend i.'+role+'{background:repeating-linear-gradient(90deg,var('+token+') 0 '+dash+',transparent '+dash+' '+end+')!important}'),'daily legend dash identity: '+role);
}
assert.ok(css.includes('.cockpit-meteogram-pro__tooltip-content dt i.gust{background:var(--param-gust)}'));
assert.ok(css.includes('.cockpit-meteogram-pro__tooltip-content dt i.pressure{background:var(--param-pressure)}'));
for(const [name,token] of [['dew','--param-dewpoint'],['rain','--param-precipitation'],['wind','--param-wind']]){
 assert.ok(css.includes('.cockpit-meteogram-pro__tooltip-content dt i.'+name+'{background:var('+token+')}'),'meteorological tooltip uses canonical token: '+name);
}
assert.ok(css.includes('border-top:3px solid var(--param-wind);border-right:3px solid var(--param-wind)'));
assert.ok(cockpit.includes("style={{...parameterLineStyle('temperature'),stroke:`url(#${temperatureGradientId})`}} className=\"temperature-line\" d={actualPath}"),'temperature gradient must override generic stroke within same CSS style');
assert.ok(!cockpit.includes("style={parameterLineStyle('temperature')} className=\"temperature-line\" d={actualPath} stroke="),'no ineffective SVG presentation stroke override');
console.log('MID app-wide line/legend semantic regression passed');
