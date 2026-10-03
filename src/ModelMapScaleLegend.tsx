import {mapScaleGradient,mapScaleTicks,type MapColorMode,type MapColorScale} from './modelMapColorScale';
import './modelMapScaleLegend.css';

/** One map-owned scale drives the numeric legend, raster and export. */
export default function ModelMapScaleLegend({label,unit,scale,range,format,onModeChange,locked=false}:{label:string;unit:string;scale:MapColorScale;range:MapColorScale;format:(value:number)=>string;onModeChange:(mode:MapColorMode)=>void;locked?:boolean}){
 const modes:[MapColorMode,string][]=[['field','Wertebereich'],['absolute','Feste Skala']],ticks=mapScaleTicks(scale),rangeAvailable=range.mode==='field';
 return <section className="mid-model-map-legend" aria-label={`${label} Farblegende`}>
  <header className="mid-model-map-legend__header">
   <div className="mid-model-map-legend__identity"><strong className="mid-model-map-legend__title">{label}</strong><span className="mid-model-map-legend__unit">Einheit <b className="mid-model-map-legend__unit-value">{unit}</b></span></div>
   <div className="mid-model-map-legend__modes" role="group" aria-label="Skalenmodus">{modes.map(([mode,text])=><button className="mid-model-map-legend__mode" type="button" key={mode} aria-pressed={scale.mode===mode} disabled={locked||(mode==='field'&&!rangeAvailable)} onClick={()=>onModeChange(mode)}>{text}</button>)}</div>
  </header>
  <div className="mid-model-map-legend__gradient" role="img" aria-label={`Farbskala für ${label}, Werte in ${unit}`} style={{backgroundImage:mapScaleGradient(scale)}}/>
  <div className="mid-model-map-legend__ticks" aria-label={`Werte in ${unit}`}>{ticks.map(([value],i)=><span className="mid-model-map-legend__tick" key={i}>{format(value)}</span>)}</div>
  <p className="mid-model-map-legend__note" aria-live="polite">{locked?'Animation: feste Skala für vergleichbare Farben.':rangeAvailable?scale.mode==='field'?'Relative Farbskala · Grenzen aus dem gesamten Rasterfeld. Für Kartenvergleiche „Feste Skala“ wählen.':'Feste Skala · gleiche Farben entsprechen gleichen Werten.':'Keine räumlichen Wertunterschiede · feste Skala.'}</p>
 </section>;
}
