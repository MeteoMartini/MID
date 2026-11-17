import {MapPin} from 'lucide-react';
import type {CSSProperties} from 'react';

// The same selected-place label is rendered in every non-map primary workspace.
// Allow arbitrarily long German city names and user aliases to wrap instead of
// expanding a flex/grid min-content track or silently dropping information.
const placeNameReflowStyle:CSSProperties={
 minWidth:0,maxWidth:'100%',whiteSpace:'normal',overflowWrap:'anywhere',
 wordBreak:'normal',textOverflow:'clip',
};

export function SelectedPlaceBar({name,tracked=false,hidden=false}:{name:string;tracked?:boolean;hidden?:boolean}){
 if(hidden||!name)return null;
 return <div className="selected-place-bar" role="status" aria-label="Ausgewählter Ort">
  <MapPin size={14} aria-hidden="true"/>
  <strong title={name} style={placeNameReflowStyle}>{name}</strong>
  {tracked&&<span>Standort</span>}
 </div>;
}