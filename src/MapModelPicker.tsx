import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {ChevronDown,Check} from 'lucide-react';
import {mapModelFlagCode,type MapModelChoice,type MapModelGroup,type MapModelFlagCode} from './mapModelPresentation';
import './MapModelPicker.css';

const FLAG_EMOJI=/^(?:🇩🇪|🇪🇺|🇺🇸|🇨🇦)\s*/u;
const withoutEmoji=(label:string)=>label.replace(FLAG_EMOJI,'');

function fivePointStar(cx:number,cy:number,r:number):string{
 const points:Array<[number,number]>=[];
 for(let i=0;i<10;i++){
  const angle=(i*Math.PI/5)-Math.PI/2,extent=i%2?r*.4:r;
  points.push([cx+Math.cos(angle)*extent,cy+Math.sin(angle)*extent]);
 }
 return points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join('')+'Z';
}

/** SVG paths are deliberately local, independent of OS emoji fonts.
 * No remote images, icon package, or invented nationality for unknown IDs.
 */
export function MapModelFlag({modelId}:{modelId:string}){
 const code:MapModelFlagCode|null=mapModelFlagCode(modelId);
 if(!code)return null;
 return <svg className="mid-map-model-flag" aria-hidden="true" focusable="false"
  viewBox="0 0 30 20" width="27" height="18" xmlns="http://www.w3.org/2000/svg">
  <rect width="30" height="20" rx="1.2" fill="#fff"/>
  {code==='DE'&&<>
   <path fill="#151515" d="M0 0H30V6.667H0Z"/>
   <path fill="#D21F26" d="M0 6.667H30V13.333H0Z"/>
   <path fill="#FFCE00" d="M0 13.333H30V20H0Z"/>
  </>}
  {code==='EU'&&<>
   <path fill="#003399" d="M0 0H30V20H0Z"/>
   {Array.from({length:12},(_,i)=>{
    const a=i*Math.PI/6-Math.PI/2;
    return <path key={i} d={fivePointStar(15+6.35*Math.cos(a),10+6.35*Math.sin(a),1.05)} fill="#FFCC00"/>;
   })}
  </>}
  {code==='US'&&<>
   {Array.from({length:13},(_,i)=><rect key={i} x="0" y={i*20/13} width="30" height={20/13+.012}
    fill={i%2===0?'#B31942':'#FFFFFF'}/>)}
   <rect width="12.35" height={7*20/13} fill="#0A3161"/>
   {Array.from({length:9},(_,r)=>Array.from({length:r%2===0?6:5},(_,c)=>
    <circle key={r*10+c} cx={1.06+c*2.04+(r%2===0?0:1)} cy={.65+r*.92} r=".29" fill="#FFF"/>))}
  </>}
  {code==='CA'&&<>
   <rect width="7" height="20" fill="#D80621"/>
   <rect x="23" width="7" height="20" fill="#D80621"/>
   <path d="M15 2.4L16.25 5.3L17.95 4.75L17.5 7.15L19.65 6.7L18.9 8.5L21.25 9.25L17.25 12.4L17.6 14L15.55 13.5L15.5 17.4H14.5L14.45 13.5L12.4 14L12.75 12.4L8.75 9.25L11.1 8.5L10.35 6.7L12.5 7.15L12.05 4.75L13.75 5.3Z" fill="#D80621"/>
  </>}
  <rect x=".4" y=".4" width="29.2" height="19.2" rx="1" fill="none" stroke="#64748B" strokeOpacity=".33" strokeWidth=".8"/>
 </svg>;
}

type PickerProps<T extends MapModelChoice>={
 label:string;
 value:string;
 groups:readonly MapModelGroup<T>[];
 fallbackLabel?:string;
 onChange:(id:string)=>void;
};

export function MapModelPicker<T extends MapModelChoice>({label,value,groups,fallbackLabel,onChange}:PickerProps<T>){
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const buttons=useRef<Array<HTMLButtonElement|null>>([]);
 const listId=useId(),selectedNameId=useId();
 const models=groups.flatMap(group=>group.models);
 const current=models.find(item=>item.id===value);
 const currentName=withoutEmoji(current?.displayLabel??fallbackLabel??value);
 const currentIndex=Math.max(0,models.findIndex(item=>item.id===value));
 useEffect(()=>{
  if(!open)return;
  const closeOutside=(event:PointerEvent)=>{
   if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);
  };
  document.addEventListener('pointerdown',closeOutside);
  return()=>document.removeEventListener('pointerdown',closeOutside);
 },[open]);
 useEffect(()=>{
  if(open)buttons.current[currentIndex]?.focus();
 },[open,value]);
 const choose=(id:string)=>{setOpen(false);onChange(id);trigger.current?.focus()};
 const onKeyDown=(event:KeyboardEvent<HTMLDivElement>)=>{
  if(event.key==='Escape'&&open){event.preventDefault();setOpen(false);trigger.current?.focus();return}
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key)||!models.length)return;
  event.preventDefault();
  if(!open){setOpen(true);return}
  const focused=buttons.current.indexOf(document.activeElement as HTMLButtonElement);
  const index=focused<0?currentIndex:focused;
  const next=event.key==='Home'?0:event.key==='End'?models.length-1:
   (index+(event.key==='ArrowDown'?1:-1)+models.length)%models.length;
  buttons.current[next]?.focus();
 };
 let index=-1;
 return <div className="mid-map-model-picker" ref={root} onKeyDown={onKeyDown}>
  <button ref={trigger} type="button" className="mid-map-model-picker-trigger"
   aria-label={label} aria-describedby={selectedNameId} aria-expanded={open} aria-controls={listId} data-model-id={value}
   onClick={()=>setOpen(value=>!value)}>
   <MapModelFlag modelId={value}/>
   <span id={selectedNameId} className="mid-map-model-picker-value">{currentName}</span>
   <ChevronDown aria-hidden="true" size={17}/>
  </button>
  {open&&<div id={listId} className="mid-map-model-picker-menu" role="group" aria-label={label+' auswählen'}>
   {groups.map(group=><section key={group.id} className="mid-map-model-picker-group" aria-label={group.label}>
    <div className="mid-map-model-picker-heading">{group.label}</div>
    {group.models.map(item=>{
     index+=1;
     const pos=index;
     return <button type="button" key={item.id} data-model-id={item.id}
      ref={node=>{buttons.current[pos]=node}}
      className="mid-map-model-picker-option"
      aria-pressed={item.id===value} onClick={()=>choose(item.id)}>
      <MapModelFlag modelId={item.id}/>
      <span>{withoutEmoji(item.displayLabel)}</span>
      {item.id===value&&<Check size={17} aria-hidden="true"/>}
     </button>;
    })}
   </section>)}
  </div>}
 </div>;
}
