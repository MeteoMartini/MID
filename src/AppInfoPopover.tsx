import {useRef,useState,type ReactNode} from 'react';
import {Info} from 'lucide-react';
import {AppPortalPopover} from './AppPortalPopover';

export function AppInfoHint({label='Hinweis',children,width=360,className='',iconSize=14,trigger,showClose=false,popoverClassName=''}:{label?:string;children:ReactNode;width?:number;className?:string;iconSize?:number;trigger?:ReactNode;showClose?:boolean;popoverClassName?:string}){
 const buttonRef=useRef<HTMLButtonElement>(null),[open,setOpen]=useState(false);
 return <span className={`mode-info event-app-info${open?' open':''}${className?` ${className}`:''}`}><button ref={buttonRef} type="button" onClick={event=>{event.preventDefault();event.stopPropagation();setOpen(value=>!value)}} aria-expanded={open} aria-haspopup="dialog" aria-label={label} title={label}>{trigger??<Info size={iconSize}/>}</button><AppPortalPopover anchorRef={buttonRef} open={open} onClose={()=>setOpen(false)} className={`mode-info-popover event-info-popover ${popoverClassName}`.trim()} width={width} role="dialog" ariaLabel={label}>{children}{showClose&&<button type="button" className="thunder-info-close" onClick={()=>setOpen(false)}>Schließen</button>}</AppPortalPopover></span>;
}
