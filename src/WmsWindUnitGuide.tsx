import {wind,type WindUnit} from './weather';
export default function WmsWindUnitGuide({unit}:{unit:WindUnit}){
 return <div className="weather-precipitation-legend-placeholder" aria-label="Windfiedern in der gewählten Einheit">
  <span>Windfiedern</span>{[5,10,50].map(speed=><span key={speed}><svg width="34" height="24" viewBox="0 0 34 24" aria-hidden="true"><path d="M4 20H30" fill="none" stroke="currentColor" strokeWidth="1.5"/>{speed===50?<path d="M5 20L5 4L17 20Z" fill="currentColor"/>:<path d={speed===5?'M8 20L8 12':'M8 20L8 4'} fill="none" stroke="currentColor" strokeWidth="1.5"/>}</svg>{wind(speed,unit)}</span>)}
  <small>DWD-Originalsymbole · Zahlen gemäß Einstellungen · feste Symbolskala</small>
 </div>;
}
