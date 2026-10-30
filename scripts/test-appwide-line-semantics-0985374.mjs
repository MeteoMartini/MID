import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const line=read('src/parameterLineStyle.ts'),app=read('src/App.tsx'),cockpit=read('src/ForecastCockpit.tsx'),css=read('src/styles-src/30-modern.css');
const styles={temperature:'none',apparent:'5 4',dewpoint:'2 5',pressure:'none',probability:'4 3',wind:'none',gust:'9 4'};
for(const [role,dash] of Object.entries(styles)){
  assert.match(line,new RegExp('^\\s*'+role+':\\{[^\\n]*'+(dash==='none'?'width:':'dash:\\x27'+dash+'\\x27'),'m'),'line contract: '+role);
  assert.ok(app.includes('data-parameter-line="'+role+'" style={parameterLineStyle(\x27'+role+'\x27)}'),'daily detail uses central role '+role);
  if(role==='temperature') assert.ok(cockpit.includes('data-parameter-line="temperature" style={{...parameterLineStyle(\x27temperature\x27),stroke:'),'24h temperature uses central role with intentional value-driven stroke override');
  else assert.ok(cockpit.includes('data-parameter-line="'+role+'" style={parameterLineStyle(\x27'+role+'\x27)}'),'24h profile uses central role '+role);
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
assert.ok(cockpit.includes('className="temperature" style={{background:temperatureCurvePoints.length>1?`linear-gradient('),'temperature legend must consume dynamic 24h temperature samples');
assert.ok(css.includes('.cockpit-meteogram-pro__legend i.temperature{width:24px;height:4px;border-radius:999px;background:var(--param-temperature)}'),'legend fallback must retain canonical token');
assert.ok(cockpit.includes("style={{...parameterLineStyle('temperature'),stroke:`url(#${temperatureGradientId})`}} className=\"temperature-line\" d={actualPath}"),'temperature gradient must override generic stroke within same CSS style');
assert.ok(!cockpit.includes("style={parameterLineStyle('temperature')} className=\"temperature-line\" d={actualPath} stroke="),'no ineffective SVG presentation stroke override');

const foundation=read('src/styles-src/00-foundation.css');
const darkTheme=foundation.split(':root{')[1]?.split('}')[0],lightTheme=foundation.split(':root[data-theme=light]{')[1]?.split('}')[0];
assert.ok(darkTheme&&lightTheme,'both theme roots exist');
const hex=(root,token)=>{const raw=root.split('--'+token+':')[1]?.split(';')[0];assert.ok(/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(raw),'hex color '+token);const c=raw.slice(1);return c.length===3?c.split('').map(x=>x+x).join(''):c};
const luminance=(color)=>{const weights=[.2126,.7152,.0722];return [0,2,4].reduce((sum,index,i)=>{const channel=parseInt(color.slice(index,index+2),16)/255,linear=channel<=.04045?channel/12.92:((channel+.055)/1.055)**2.4;return sum+weights[i]*linear},0)};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
for(const [theme,root] of [['dark',darkTheme],['light',lightTheme]]){
 for(const param of ['pressure','precipitation-snow','sunshine']){
  const foreground=hex(root,'param-'+param);
  for(const background of ['bg','surface','s2','s3']){
   const ratio=contrast(foreground,hex(root,background));
   assert.ok(ratio>=3,'nontext contrast <3:1 '+theme+'/'+param+'/'+background+': '+ratio.toFixed(2));
  }
 }
}

console.log('MID app-wide line/legend semantic regression passed');
