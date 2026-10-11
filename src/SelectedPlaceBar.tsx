import {MapPin} from 'lucide-react';
export function SelectedPlaceBar({name,tracked=false,hidden=false}:{name:string;tracked?:boolean;hidden?:boolean}){
 if(hidden||!name)return null;
 return <div className="selected-place-bar" role="status" aria-label="Ausgewählter Ort"><MapPin size={14} aria-hidden="true"/><strong title={name}>{name}</strong>{tracked&&<span>Standort</span>}</div>;
}
