import './v072.css';

type ForecastSnapshot={
  elevation?:number;
  hourly?:Record<string,(string|number|null)[]>;
  daily?:Record<string,(string|number|null)[]>;
};
type ChartToggleKey='tempMaxBand'|'tempMinBand'|'bestMax'|'bestMin'|'rainBest'|'rainLow'|'rainHigh';
type ChartVisibility=Record<ChartToggleKey,boolean>;
type WidgetSettings={days:number;dark:boolean;showWind:boolean;showRain:boolean;showHazards:boolean};

declare global{interface Window{__MID_FORECAST__?:ForecastSnapshot}}

const VERSION='0.7.2';
const CHART_KEY='mid:0.7.1:chart-visibility';
const WIDGET_KEY='mid:0.7.1:widget-settings';
const WIDGET_NAMES_KEY='mid:0.7.1:widget-place-names';
const nativeFetch=window.fetch.bind(window);
const defaultChartVisibility:ChartVisibility={tempMaxBand:true,tempMinBand:true,bestMax:true,bestMin:true,rainBest:true,rainLow:true,rainHigh:true};
let chartVisibility=readJson<ChartVisibility>(CHART_KEY,defaultChartVisibility);
let enhancing=false;
let scheduled=false;

function readJson<T>(key:string,fallback:T):T{try{const value=localStorage.getItem(key);return value?{...fallback,...JSON.parse(value)}:fallback}catch{return fallback}}
function writeJson(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function finite(value:unknown){if(value===null||value===undefined||value==='')return null;const n=Number(value);return Number.isFinite(n)?n:null}
function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value))}

function parseCoordinates(value:string){
  const raw=value.trim().replace(/[−–—]/g,'-');
  if(!raw)return null;
  const directional=[...raw.toUpperCase().matchAll(/([+-]?\d{1,3}(?:[.,]\d+)?)\s*[°º]?\s*([NSOEW])/g)];
  if(directional.length>=2){
    let lat:number|null=null,lon:number|null=null;
    for(const match of directional){const n=Number(match[1].replace(',','.')),dir=match[2];if(!Number.isFinite(n))continue;if(dir==='N'||dir==='S')lat=(dir==='S'?-1:1)*Math.abs(n);if(dir==='E'||dir==='O'||dir==='W')lon=(dir==='W'?-1:1)*Math.abs(n)}
    if(lat!==null&&lon!==null&&Math.abs(lat)<=90&&Math.abs(lon)<=180)return{lat,lon};
  }
  const commaSeparated=raw.match(/^\s*([+-]?\d{1,2}(?:\.\d+)?)\s*[,;]\s*([+-]?\d{1,3}(?:\.\d+)?)\s*$/);
  const whitespaceSeparated=raw.replace(/[°º]/g,' ').match(/^\s*([+-]?\d{1,2}(?:[.,]\d+)?)\s+([+-]?\d{1,3}(?:[.,]\d+)?)\s*$/);
  const match=commaSeparated??whitespaceSeparated;
  if(!match)return null;
  const lat=Number(match[1].replace(',','.')),lon=Number(match[2].replace(',','.'));
  return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?{lat,lon}:null;
}

async function coordinateResult(url:URL,init?:RequestInit){
  const coordinates=parseCoordinates(url.searchParams.get('name')||'');
  if(!coordinates)return null;
  const {lat,lon}=coordinates;
  let reverse:any=null,elevation:number|undefined;
  await Promise.all([
    (async()=>{try{
      const reverseUrl=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
      reverseUrl.searchParams.set('latitude',String(lat));reverseUrl.searchParams.set('longitude',String(lon));reverseUrl.searchParams.set('localityLanguage','de');
      const response=await nativeFetch(reverseUrl,{signal:init?.signal,cache:'no-store'});if(response.ok)reverse=await response.json();
    }catch{}})(),
    (async()=>{try{
      const elevationUrl=new URL('https://api.open-meteo.com/v1/forecast');
      elevationUrl.searchParams.set('latitude',String(lat));elevationUrl.searchParams.set('longitude',String(lon));elevationUrl.searchParams.set('current','temperature_2m');elevationUrl.searchParams.set('forecast_days','1');elevationUrl.searchParams.set('timezone','auto');
      const response=await nativeFetch(elevationUrl,{signal:init?.signal,cache:'no-store'});if(response.ok){const data=await response.json() as {elevation?:number};const value=finite(data.elevation);if(value!==null)elevation=value}
    }catch{}})()
  ]);
  const name=reverse?.locality||reverse?.city||reverse?.principalSubdivision||`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  const result={id:Date.now(),name,latitude:lat,longitude:lon,elevation,country:reverse?.countryName||undefined,country_code:String(reverse?.countryCode||'').toUpperCase()||undefined,admin1:reverse?.principalSubdivision||undefined,postcodes:reverse?.postcode?[String(reverse.postcode)]:undefined};
  return new Response(JSON.stringify({results:[result]}),{status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
}

function requestUrl(input:RequestInfo|URL){try{return new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href)}catch{return null}}
function mergedHeaders(input:RequestInfo|URL,init?:RequestInit){const headers=new Headers(input instanceof Request?input.headers:undefined);new Headers(init?.headers).forEach((value,key)=>headers.set(key,value));headers.set('accept','application/json');return headers}

async function warningFetch(input:RequestInfo|URL,init:RequestInit|undefined,url:URL){
  const candidates=[new URL(url.href)];
  const retry=new URL(url.href);if(retry.protocol==='http:')retry.protocol='https:';retry.searchParams.set('_mid_retry',String(Date.now()));candidates.push(retry);
  let lastResponse:Response|null=null,lastError:unknown=null;
  for(let i=0;i<candidates.length;i++){
    try{
      const response=await nativeFetch(candidates[i],{...init,method:'GET',headers:mergedHeaders(input,init),mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'follow'});
      lastResponse=response;if(response.ok||response.status<500)return response;
    }catch(error){lastError=error;if(init?.signal?.aborted)throw error}
  }
  if(lastResponse)return lastResponse;
  throw new Error(lastError instanceof Error&&lastError.message&&!/failed to fetch/i.test(lastError.message)?lastError.message:'Amtliche Warnungen konnten wegen einer Netzwerk- oder CORS-Sperre nicht geladen werden. MID hat den Abruf automatisch wiederholt.');
}

function captureForecast(response:Response,url:URL){if(!response.ok||url.hostname!=='api.open-meteo.com'||!url.pathname.includes('/v1/forecast'))return;void response.clone().json().then((data:ForecastSnapshot)=>{if(data?.hourly?.time){window.__MID_FORECAST__=data;window.dispatchEvent(new Event('mid:forecast-updated'))}}).catch(()=>{});}

window.fetch=async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=requestUrl(input);
  if(url?.hostname==='geocoding-api.open-meteo.com'&&url.pathname.includes('/v1/search')){const result=await coordinateResult(url,init);if(result)return result}
  if(url?.searchParams.get('mode')==='alerts')return warningFetch(input,init,url);
  const response=await nativeFetch(input,init);if(url)captureForecast(response,url);return response;
};

function replaceVersionText(root:ParentNode){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;while((node=walker.nextNode())){const text=node.nodeValue||'';if(/0\.7\.[01]/.test(text))node.nodeValue=text.replaceAll('0.7.0',VERSION).replaceAll('0.7.1',VERSION)}}
function enhanceVersion(){document.querySelectorAll<HTMLElement>('.brand-version,.app>footer,.weatherwidget footer').forEach(element=>replaceVersionText(element));const search=document.querySelector<HTMLInputElement>('.search input');if(search&&search.placeholder!=='Ort, PLZ oder Koordinaten suchen')search.placeholder='Ort, PLZ oder Koordinaten suchen'}

const toggleDefinitions:{selector:string;label:string;key:ChartToggleKey;className:string}[]=[
  {selector:'.trend-legend > span',label:'ENS-Spanne Tmax',key:'tempMaxBand',className:'hide-temp-max-band'},
  {selector:'.trend-legend > span',label:'ENS-Spanne Tmin',key:'tempMinBand',className:'hide-temp-min-band'},
  {selector:'.trend-legend > span',label:'Best Match Tmax',key:'bestMax',className:'hide-best-max'},
  {selector:'.trend-legend > span',label:'Best Match Tmin',key:'bestMin',className:'hide-best-min'},
  {selector:'.rain-legend > span',label:'Best Match',key:'rainBest',className:'hide-rain-best'},
  {selector:'.rain-legend > span',label:'P10',key:'rainLow',className:'hide-rain-low'},
  {selector:'.rain-legend > span',label:'P90',key:'rainHigh',className:'hide-rain-high'}
];
function toggleChart(key:ChartToggleKey){chartVisibility={...chartVisibility,[key]:!chartVisibility[key]};writeJson(CHART_KEY,chartVisibility);enhanceChartToggles()}
function enhanceChartToggles(){
  const ensemble=document.querySelector<HTMLElement>('.ensemble');if(!ensemble)return;
  for(const definition of toggleDefinitions){
    ensemble.classList.toggle(definition.className,!chartVisibility[definition.key]);
    const item=[...ensemble.querySelectorAll<HTMLElement>(definition.selector)].find(element=>element.textContent?.trim()===definition.label);if(!item)continue;
    item.classList.add('mid-chart-toggle');item.classList.toggle('inactive',!chartVisibility[definition.key]);item.setAttribute('role','button');item.tabIndex=0;item.setAttribute('aria-pressed',String(chartVisibility[definition.key]));item.title=`${definition.label} ein-/ausblenden`;
    if(item.dataset.midBound!=='1'){item.dataset.midBound='1';item.addEventListener('click',()=>toggleChart(definition.key));item.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleChart(definition.key)}})}
  }
}

const svgNs='http://www.w3.org/2000/svg';
function svgElement<K extends keyof SVGElementTagNameMap>(name:K){return document.createElementNS(svgNs,name)}
function enhanceCloudChart(){
  const snapshot=window.__MID_FORECAST__,svg=document.querySelector<SVGSVGElement>('.meteogram-day .meteogramsvg');if(!snapshot||!svg)return;
  const rows=[...document.querySelectorAll<HTMLButtonElement>('.forecastrows .forecastrow')],active=document.querySelector<HTMLButtonElement>('.forecastrows .forecastrow.active'),dayIndex=active?rows.indexOf(active):-1;
  const dates=(snapshot.daily?.time??[]) as (string|number|null)[],date=dayIndex>=0?String(dates[dayIndex]??''):'';if(!date)return;
  const times=(snapshot.hourly?.time??[]) as (string|number|null)[],clouds=(snapshot.hourly?.cloud_cover??[]) as (string|number|null)[];
  const values=times.map((time,index)=>String(time).startsWith(date)?finite(clouds[index]):null).filter((value):value is number=>value!==null).slice(0,24);if(values.length<2)return;
  const W=240,left=18,right=18,plotW=W-left-right,top=1.4,bottom=8.2,xAt=(index:number)=>left+(index/Math.max(1,values.length-1))*plotW,yAt=(value:number)=>bottom-clamp(value,0,100)/100*(bottom-top);
  const selectedLine=svg.querySelector<SVGLineElement>('line[stroke="#9ad0ff"]'),selectedX=finite(selectedLine?.getAttribute('x1')),selectedIndex=selectedX===null?0:values.reduce((best,_value,index)=>Math.abs(xAt(index)-selectedX)<Math.abs(xAt(best)-selectedX)?index:best,0);
  const signature=`${date}:${values.map(value=>Math.round(value)).join(',')}:${selectedIndex}`;if(svg.dataset.midCloudSignature===signature)return;svg.dataset.midCloudSignature=signature;
  svg.querySelectorAll('[data-mid-cloud]').forEach(element=>element.remove());
  const defs=svgElement('defs');defs.dataset.midCloud='1';const gradient=svgElement('linearGradient');gradient.id='midCloudFill';gradient.setAttribute('x1','0');gradient.setAttribute('y1','0');gradient.setAttribute('x2','0');gradient.setAttribute('y2','1');const stopA=svgElement('stop');stopA.setAttribute('offset','0%');stopA.setAttribute('stop-color','#b9c6d8');stopA.setAttribute('stop-opacity','.48');const stopB=svgElement('stop');stopB.setAttribute('offset','100%');stopB.setAttribute('stop-color','#b9c6d8');stopB.setAttribute('stop-opacity','.08');gradient.append(stopA,stopB);defs.append(gradient);svg.prepend(defs);
  const group=svgElement('g');group.dataset.midCloud='1';group.setAttribute('pointer-events','none');group.setAttribute('aria-label','Verlauf der Gesamtbewölkung');
  const linePath=values.map((value,index)=>`${index?'L':'M'} ${xAt(index).toFixed(2)} ${yAt(value).toFixed(2)}`).join(' '),areaPath=`${linePath} L ${xAt(values.length-1).toFixed(2)} ${bottom} L ${left} ${bottom} Z`;
  const baseline=svgElement('line');baseline.setAttribute('x1',String(left));baseline.setAttribute('x2',String(W-right));baseline.setAttribute('y1',String(bottom));baseline.setAttribute('y2',String(bottom));baseline.setAttribute('stroke','currentColor');baseline.setAttribute('opacity','.10');
  const area=svgElement('path');area.setAttribute('d',areaPath);area.setAttribute('fill','url(#midCloudFill)');
  const line=svgElement('path');line.setAttribute('d',linePath);line.setAttribute('fill','none');line.setAttribute('stroke','#aab8ca');line.setAttribute('stroke-width','1.45');line.setAttribute('vector-effect','non-scaling-stroke');
  const circle=svgElement('circle');circle.setAttribute('cx',String(xAt(selectedIndex)));circle.setAttribute('cy',String(yAt(values[selectedIndex])));circle.setAttribute('r','1.55');circle.setAttribute('fill','#f7fbff');circle.setAttribute('stroke','#aab8ca');circle.setAttribute('stroke-width','.9');
  const text=svgElement('text');text.setAttribute('x',String(clamp(xAt(selectedIndex),26,218)));text.setAttribute('y',String(Math.max(top+2.15,yAt(values[selectedIndex])-1.15)));text.setAttribute('text-anchor','middle');text.setAttribute('font-size','3.5');text.setAttribute('fill','currentColor');text.setAttribute('opacity','.82');text.textContent=`☁ ${Math.round(values[selectedIndex])}%`;
  group.append(baseline,area,line,circle,text);const tempArea=svg.querySelector('path[fill="url(#tempFill)"]'),hit=svg.querySelector('.hour-hit');tempArea?svg.insertBefore(group,tempArea):hit?svg.insertBefore(group,hit):svg.append(group);
  const legend=document.querySelector<HTMLElement>('.meteogram-day .detaillegend');if(legend&&!legend.querySelector('[data-mid-cloud-legend]')){const item=document.createElement('span');item.dataset.midCloudLegend='1';item.innerHTML='<i class="cloud-cover"></i>Gesamtbewölkung';legend.append(item)}
}

function labelContaining(root:ParentNode,text:string){return[...root.querySelectorAll<HTMLLabelElement>('label')].find(label=>label.textContent?.includes(text))}
function setSelectValue(select:HTMLSelectElement,value:string){if(select.value===value)return;const setter=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')?.set;setter?setter.call(select,value):select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}))}
function setCheckboxValue(input:HTMLInputElement,value:boolean){if(input.checked===value)return;const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'checked')?.set;setter?setter.call(input,value):input.checked=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}
function widgetLocationKey(){return document.querySelector<HTMLElement>('.weatherwidget header small')?.textContent?.split(' · ')[0]?.trim()||document.querySelector<HTMLElement>('.place h1')?.textContent?.trim()||'default'}
function widgetBaseName(){return document.querySelector<HTMLElement>('.place h1')?.textContent?.trim()||document.querySelector<HTMLElement>('.weatherwidget header strong')?.textContent?.trim()||'Standort'}
function savedWidgetName(key:string){return readJson<Record<string,string>>(WIDGET_NAMES_KEY,{})[key]||''}
function applyWidgetName(){const input=document.querySelector<HTMLInputElement>('[data-mid-place-name]'),preview=document.querySelector<HTMLElement>('.weatherwidget header strong');if(!input||!preview)return;const name=input.value.trim()||widgetBaseName();if(preview.textContent!==name)preview.textContent=name}
function saveWidgetSettings(controls:HTMLElement){
  const select=controls.querySelector<HTMLSelectElement>('select'),dark=labelContaining(controls,'Dunkles Widget')?.querySelector<HTMLInputElement>('input'),wind=labelContaining(controls,'Wind')?.querySelector<HTMLInputElement>('input'),rain=labelContaining(controls,'Niederschlag')?.querySelector<HTMLInputElement>('input'),hazards=labelContaining(controls,'Hazards anzeigen')?.querySelector<HTMLInputElement>('input');
  if(!select||!dark||!wind||!rain||!hazards)return;writeJson(WIDGET_KEY,{days:Number(select.value),dark:dark.checked,showWind:wind.checked,showRain:rain.checked,showHazards:hazards.checked} satisfies WidgetSettings);
}
function enhanceWidget(){
  const controls=document.querySelector<HTMLElement>('.widget-controls');if(!controls)return;
  const select=controls.querySelector<HTMLSelectElement>('select'),dark=labelContaining(controls,'Dunkles Widget')?.querySelector<HTMLInputElement>('input'),wind=labelContaining(controls,'Wind')?.querySelector<HTMLInputElement>('input'),rain=labelContaining(controls,'Niederschlag')?.querySelector<HTMLInputElement>('input'),hazards=labelContaining(controls,'Hazards anzeigen')?.querySelector<HTMLInputElement>('input');
  if(select&&dark&&wind&&rain&&hazards&&controls.dataset.midSettingsApplied!=='1'){
    controls.dataset.midSettingsApplied='1';const saved=readJson<WidgetSettings>(WIDGET_KEY,{days:4,dark:true,showWind:true,showRain:true,showHazards:true});setSelectValue(select,String(saved.days));setCheckboxValue(dark,saved.dark);setCheckboxValue(wind,saved.showWind);setCheckboxValue(rain,saved.showRain);setCheckboxValue(hazards,saved.showHazards);
    [select,dark,wind,rain,hazards].forEach(control=>control.addEventListener('change',()=>saveWidgetSettings(controls)));
  }
  const key=widgetLocationKey();let input=controls.querySelector<HTMLInputElement>('[data-mid-place-name]');
  if(!input){const label=document.createElement('label');label.className='mid-place-name-control';label.innerHTML='<span>Angezeigter Ortsname</span><input type="text" maxlength="64" data-mid-place-name autocomplete="off">';controls.insertBefore(label,controls.children[1]??null);input=label.querySelector<HTMLInputElement>('input')!;input.addEventListener('input',()=>{const currentKey=input!.dataset.locationKey||widgetLocationKey(),names=readJson<Record<string,string>>(WIDGET_NAMES_KEY,{});names[currentKey]=input!.value.trim();writeJson(WIDGET_NAMES_KEY,names);applyWidgetName()})}
  if(input.dataset.locationKey!==key){input.dataset.locationKey=key;input.value=savedWidgetName(key)||widgetBaseName()}
  applyWidgetName();
}

const nativeAnchorClick=HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click=function(this:HTMLAnchorElement){if(/^wetter-widget-/i.test(this.download)){const name=document.querySelector<HTMLInputElement>('[data-mid-place-name]')?.value.trim(),suffix=this.download.match(/(\d+tage\.png)$/i)?.[1];if(name&&suffix){const slug=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');this.download=`wetter-widget-${slug}-${suffix}`}}return nativeAnchorClick.call(this)};


type VersionDescriptor={version?:string;releasedAt?:string};
const AUTO_UPDATE_KEY='mid:auto-update';
const VERSION_CHECK_INTERVAL=15*60*1000;
const VERSION_CHECK_THROTTLE=30*1000;
const RELOAD_ATTEMPT_KEY='mid:update-reload-attempt';
let lastVersionCheck=0;
let versionCheckPromise:Promise<void>|null=null;
let dismissedVersion='';

function versionNumbers(value:string){return String(value||'').trim().replace(/^v/i,'').split(/[.-]/).map(part=>Number.parseInt(part,10)).map(value=>Number.isFinite(value)?value:0)}
function isNewerVersion(candidate:string,current:string){const a=versionNumbers(candidate),b=versionNumbers(current),length=Math.max(a.length,b.length);for(let i=0;i<length;i++){const av=a[i]??0,bv=b[i]??0;if(av!==bv)return av>bv}return false}
function autoUpdateEnabled(){try{return localStorage.getItem(AUTO_UPDATE_KEY)==='true'}catch{return false}}
function setAutoUpdate(value:boolean){try{localStorage.setItem(AUTO_UPDATE_KEY,String(value))}catch{}}
function recentReloadAttempt(version:string){try{const raw=sessionStorage.getItem(RELOAD_ATTEMPT_KEY);if(!raw)return false;const data=JSON.parse(raw) as {version?:string;time?:number};return data.version===version&&Date.now()-Number(data.time||0)<60000}catch{return false}}
function markReloadAttempt(version:string){try{sessionStorage.setItem(RELOAD_ATTEMPT_KEY,JSON.stringify({version,time:Date.now()}))}catch{}}
function cleanUpdateQuery(){try{const url=new URL(location.href),had=url.searchParams.has('mid-update')||url.searchParams.has('mid-refresh');if(!had)return;url.searchParams.delete('mid-update');url.searchParams.delete('mid-refresh');history.replaceState(history.state,'',url.toString())}catch{}}
function reloadForVersion(version:string){markReloadAttempt(version);const url=new URL(location.href);url.searchParams.set('mid-update',version);url.searchParams.set('mid-refresh',String(Date.now()));location.replace(url.toString())}
function removeUpdateNotice(){document.querySelector<HTMLElement>('[data-mid-update-notice]')?.remove()}
function showUpdateNotice(version:string,releasedAt?:string){
  if(dismissedVersion===version)return;
  let notice=document.querySelector<HTMLElement>('[data-mid-update-notice]');
  if(notice?.dataset.version===version)return;
  notice?.remove();notice=document.createElement('aside');notice.dataset.midUpdateNotice='1';notice.dataset.version=version;notice.className='mid-update-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const copy=document.createElement('div');copy.className='mid-update-copy';const strong=document.createElement('strong');strong.textContent='MID wurde aktualisiert – jetzt neu laden';const small=document.createElement('small');const date=releasedAt?new Date(releasedAt):null;small.textContent=`Version ${version} ist verfügbar${date&&Number.isFinite(date.getTime())?` · ${date.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}`:''}.`;copy.append(strong,small);
  const autoLabel=document.createElement('label');autoLabel.className='mid-update-auto';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=autoUpdateEnabled();const autoText=document.createElement('span');autoText.textContent='Künftige Updates automatisch laden';autoLabel.append(checkbox,autoText);
  const actions=document.createElement('div');actions.className='mid-update-actions';const later=document.createElement('button');later.type='button';later.className='secondary';later.textContent='Später';later.addEventListener('click',()=>{dismissedVersion=version;removeUpdateNotice()});const reload=document.createElement('button');reload.type='button';reload.className='primary';reload.textContent='Jetzt neu laden';reload.addEventListener('click',()=>reloadForVersion(version));actions.append(later,reload);
  checkbox.addEventListener('change',()=>{setAutoUpdate(checkbox.checked);if(checkbox.checked)reloadForVersion(version)});
  notice.append(copy,autoLabel,actions);document.body.append(notice);
}
async function checkVersion(force=false){
  const now=Date.now();if(!force&&now-lastVersionCheck<VERSION_CHECK_THROTTLE)return;if(versionCheckPromise)return versionCheckPromise;
  lastVersionCheck=now;versionCheckPromise=(async()=>{try{const url=new URL('./version.json',document.baseURI);url.searchParams.set('_mid',String(Date.now()));const response=await nativeFetch(url,{cache:'no-store',headers:{'cache-control':'no-cache','pragma':'no-cache'}});if(!response.ok)return;const descriptor=await response.json() as VersionDescriptor,remote=String(descriptor.version||'').trim();if(!remote)return;if(!isNewerVersion(remote,VERSION)){removeUpdateNotice();try{sessionStorage.removeItem(RELOAD_ATTEMPT_KEY)}catch{}return}if(autoUpdateEnabled()&&!recentReloadAttempt(remote)){reloadForVersion(remote);return}showUpdateNotice(remote,descriptor.releasedAt)}catch{}finally{versionCheckPromise=null}})();return versionCheckPromise;
}
function setupVersionChecks(){cleanUpdateQuery();void checkVersion(true);window.setInterval(()=>{if(document.visibilityState==='visible')void checkVersion()},VERSION_CHECK_INTERVAL);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void checkVersion(true)});window.addEventListener('pageshow',()=>void checkVersion(true));window.addEventListener('focus',()=>void checkVersion())}

function improveWarningMessage(){const message=document.querySelector<HTMLElement>('.official-warnings.unavailable small');if(message&&/failed to fetch/i.test(message.textContent||''))message.textContent='Amtliche Warnungen konnten vom Desktop-Browser nicht geladen werden. MID hat den CORS-sicheren Abruf automatisch wiederholt; bitte Netzwerk- oder Inhaltsblocker prüfen.'}
function enhance(){if(enhancing)return;enhancing=true;try{enhanceVersion();enhanceChartToggles();enhanceCloudChart();enhanceWidget();improveWarningMessage()}finally{enhancing=false}}
function scheduleEnhance(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})}
function start(){enhance();setupVersionChecks();new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','x1']});window.addEventListener('mid:forecast-updated',scheduleEnhance)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

export{};
