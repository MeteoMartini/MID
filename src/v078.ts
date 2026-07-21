import './v078.css';

type ForecastSnapshot={
  elevation?:number;
  hourly?:Record<string,(string|number|null)[]>;
  daily?:Record<string,(string|number|null)[]>;
};
type ChartToggleKey='tempMaxBand'|'tempMinBand'|'bestMax'|'bestMin'|'rainBest'|'rainLow'|'rainHigh';
type ChartVisibility=Record<ChartToggleKey,boolean>;
type WidgetSettings={days:number;dark:boolean;showWind:boolean;showRain:boolean;showHazards:boolean};

declare global{interface Window{__MID_FORECAST__?:ForecastSnapshot}}

const VERSION='0.7.23';
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
  let reverse:any=null,elevation:number|undefined,timezone:string|undefined;
  await Promise.all([
    (async()=>{try{
      const reverseUrl=new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
      reverseUrl.searchParams.set('latitude',String(lat));reverseUrl.searchParams.set('longitude',String(lon));reverseUrl.searchParams.set('localityLanguage','de');
      const response=await nativeFetch(reverseUrl,{signal:init?.signal,cache:'no-store'});if(response.ok)reverse=await response.json();
    }catch{}})(),
    (async()=>{try{
      const elevationUrl=new URL('https://api.open-meteo.com/v1/forecast');
      elevationUrl.searchParams.set('latitude',String(lat));elevationUrl.searchParams.set('longitude',String(lon));elevationUrl.searchParams.set('current','temperature_2m');elevationUrl.searchParams.set('forecast_days','1');elevationUrl.searchParams.set('timezone','auto');
      const response=await nativeFetch(elevationUrl,{signal:init?.signal,cache:'no-store'});if(response.ok){const data=await response.json() as {elevation?:number;timezone?:string};const value=finite(data.elevation);if(value!==null)elevation=value;timezone=data.timezone}
    }catch{}})()
  ]);
  const name=reverse?.locality||reverse?.city||reverse?.principalSubdivision||`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  const result={id:Date.now(),name,latitude:lat,longitude:lon,elevation,timezone,source:'Koordinatensuche',country:reverse?.countryName||undefined,country_code:String(reverse?.countryCode||'').toUpperCase()||undefined,admin1:reverse?.principalSubdivision||undefined,postcodes:reverse?.postcode?[String(reverse.postcode)]:undefined};
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

function replaceVersionText(root:ParentNode){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;while((node=walker.nextNode())){const text=node.nodeValue||'';if(/\bv0\.7\.\d+\b/.test(text))node.nodeValue=text.replace(/\bv0\.7\.\d+\b/g,`v${VERSION}`)}}
function enhanceVersion(){document.querySelectorAll<HTMLElement>('.brand-version,.app>footer,.weatherwidget footer').forEach(element=>replaceVersionText(element));const search=document.querySelector<HTMLInputElement>('.search input');if(search&&search.placeholder!=='Ort, PLZ, POI oder Koordinaten suchen')search.placeholder='Ort, PLZ, POI oder Koordinaten suchen'}

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
type SkyBarLevel=0|1|2|3|4;
type SkyBarSample={cloud:number;isDay:boolean;color:'sun'|'cloud'|'none';level:SkyBarLevel};
function rangeLevel(value:number,min:number,max:number):1|2|3|4{
  const ratio=clamp((value-min)/Math.max(1,max-min),0,1);
  return Math.min(4,Math.max(1,Math.ceil(ratio*4))) as 1|2|3|4;
}
function skyBarSample(cloud:number,isDay:boolean):SkyBarSample{
  const bounded=clamp(cloud,0,100);
  if(!isDay){
    if(bounded<20)return{cloud:bounded,isDay,color:'none',level:0};
    return{cloud:bounded,isDay,color:'cloud',level:rangeLevel(bounded,20,100)};
  }
  if(bounded<50)return{cloud:bounded,isDay,color:'sun',level:rangeLevel(50-bounded,0,50)};
  return{cloud:bounded,isDay,color:'cloud',level:rangeLevel(bounded,50,100)};
}
function enhanceSkyBars(){
  const snapshot=window.__MID_FORECAST__,svg=document.querySelector<SVGSVGElement>('.meteogram-day .meteogramsvg');if(!snapshot||!svg)return;
  const rows=[...document.querySelectorAll<HTMLButtonElement>('.forecastrows .forecastrow')],active=document.querySelector<HTMLButtonElement>('.forecastrows .forecastrow.active'),dayIndex=active?rows.indexOf(active):-1;
  const dates=(snapshot.daily?.time??[]) as (string|number|null)[],date=dayIndex>=0?String(dates[dayIndex]??''):'';if(!date)return;
  const times=(snapshot.hourly?.time??[]) as (string|number|null)[],clouds=(snapshot.hourly?.cloud_cover??[]) as (string|number|null)[],daylight=(snapshot.hourly?.is_day??[]) as (string|number|null)[];
  const samples:SkyBarSample[]=[];
  for(let index=0;index<times.length;index++){
    if(!String(times[index]).startsWith(date))continue;
    const cloud=finite(clouds[index]);if(cloud===null)continue;
    samples.push(skyBarSample(cloud,Number(daylight[index])===1));
  }
  if(samples.length<2)return;
  const signature=`${date}:${samples.map(sample=>`${Math.round(sample.cloud)}-${sample.isDay?1:0}`).join(',')}`;if(svg.dataset.midSkySignature===signature)return;svg.dataset.midSkySignature=signature;
  svg.querySelectorAll('[data-mid-cloud],[data-mid-skybar]').forEach(element=>element.remove());
  const W=240,left=18,right=18,plotW=W-left-right,centerY=16.15,xAt=(index:number)=>left+(index/Math.max(1,samples.length-1))*plotW;
  const boundaryBefore=(index:number)=>index<=0?left:(xAt(index-1)+xAt(index))/2,boundaryAfter=(index:number)=>index>=samples.length-1?W-right:(xAt(index)+xAt(index+1))/2;
  const strokeWidth=(level:SkyBarLevel)=>[0,2.1,3.4,4.9,6.5][level];
  const group=svgElement('g');group.dataset.midSkybar='1';group.setAttribute('pointer-events','none');group.setAttribute('aria-label','Sonnenschein und Gesamtbewölkung in vier Stärken');
  let runStart=0;
  for(let index=1;index<=samples.length;index++){
    const previous=samples[index-1],current=samples[index];
    if(index<samples.length&&current.color===previous.color&&current.level===previous.level)continue;
    if(previous.color!=='none'){
      let x1=boundaryBefore(runStart),x2=boundaryAfter(index-1);const gap=Math.min(.72,Math.max(0,(x2-x1)*.12));x1+=gap;x2-=gap;
      if(x2<=x1){const mid=(x1+x2)/2;x1=mid-.18;x2=mid+.18}
      const line=svgElement('line');line.dataset.midSkybar='1';line.setAttribute('x1',x1.toFixed(2));line.setAttribute('x2',x2.toFixed(2));line.setAttribute('y1',String(centerY));line.setAttribute('y2',String(centerY));line.setAttribute('stroke',previous.color==='sun'?'#ffc229':'#aeb3b9');line.setAttribute('stroke-width',String(strokeWidth(previous.level)));line.setAttribute('stroke-linecap','round');line.setAttribute('vector-effect','non-scaling-stroke');line.setAttribute('opacity',previous.color==='sun'?'.98':'.92');
      const title=svgElement('title');title.textContent=previous.color==='sun'?`Sonnenschein/Klarheit · Stufe ${previous.level} von 4`:`Gesamtbewölkung · Stufe ${previous.level} von 4`;line.append(title);group.append(line);
    }
    runStart=index;
  }
  const tempArea=svg.querySelector('path[fill="url(#tempFill)"]'),hit=svg.querySelector('.hour-hit');tempArea?svg.insertBefore(group,tempArea):hit?svg.insertBefore(group,hit):svg.append(group);
  const legend=document.querySelector<HTMLElement>('.meteogram-day .detaillegend');if(legend){
    legend.querySelectorAll('[data-mid-cloud-legend],[data-mid-sky-legend],[data-mid-sky-note]').forEach(element=>element.remove());
    const sun=document.createElement('span');sun.dataset.midSkyLegend='1';sun.innerHTML='<i class="sunshine-bar"></i>Sonnenschein / klar';
    const cloud=document.createElement('span');cloud.dataset.midSkyLegend='1';cloud.innerHTML='<i class="cloudiness-bar"></i>Bewölkung';
    const note=document.createElement('small');note.dataset.midSkyNote='1';note.className='mid-skybar-note';note.textContent='Tagsüber: Gelb bei klarem Himmel, sonst Grau. Nachts: klar ohne Balken, Bewölkung grau. Dicke = Ausprägung.';
    legend.append(sun,cloud,note);
  }
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
function enhance(){if(enhancing)return;enhancing=true;try{enhanceVersion();enhanceChartToggles();enhanceSkyBars();enhanceWidget();improveWarningMessage()}finally{enhancing=false}}
function scheduleEnhance(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;enhance()})}
function start(){enhance();setupVersionChecks();new MutationObserver(scheduleEnhance).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','x1']});window.addEventListener('mid:forecast-updated',scheduleEnhance)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

export{};
