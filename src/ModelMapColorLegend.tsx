import './modelMapColorLegend.css';

export type ModelMapLegendMode='range'|'fixed';

export type ModelMapLegendTick={
  position:number;
  label:string;
};

export type ModelMapLegendStop={
  label:string;
  color:string;
};

export type ModelMapLegendTicks=
  |readonly [ModelMapLegendTick,ModelMapLegendTick]
  |readonly [ModelMapLegendTick,ModelMapLegendTick,ModelMapLegendTick];

export type ModelMapLegendScale={
  /** Optional caller-provided gradient and ticks for modes that have a verified scale. */
  gradient?:string;
  ticks?:ModelMapLegendTicks;
  /** Optional exact color thresholds for fixed palettes. */
  stops?:readonly ModelMapLegendStop[];
};

export type ModelMapColorLegendProps={
  label:string;
  unit:string;
  mode:ModelMapLegendMode;
  scales:Record<ModelMapLegendMode,ModelMapLegendScale>;
  onModeChange:(mode:ModelMapLegendMode)=>void;
  disabled?:boolean;
  disabledModes?:readonly ModelMapLegendMode[];
};

const modeLabels:Record<ModelMapLegendMode,string>={
  range:'Wertebereich',
  fixed:'Feste Skala',
};

function tickAlignment(position:number){
  if(position<=0)return'start';
  if(position>=100)return'end';
  return'center';
}

/**
 * A numeric map legend. Categorical weather-code legends stay separate.
 * The caller owns color calculation, scale limits, tick formatting and unit conversion.
 */
export default function ModelMapColorLegend({label,unit,mode,scales,onModeChange,disabled=false,disabledModes=[]}:ModelMapColorLegendProps){
  const scale=scales[mode];
  return <section className="mid-model-map-legend" aria-label={`${label} Farblegende`}>
    <header className="mid-model-map-legend__header">
      <div className="mid-model-map-legend__identity">
        <strong className="mid-model-map-legend__title">{label}</strong>
        <span className="mid-model-map-legend__unit" aria-label={`Einheit: ${unit}`}>
          <span className="mid-model-map-legend__unit-label">Einheit</span>
          <span className="mid-model-map-legend__unit-value">{unit}</span>
        </span>
      </div>
      <div className="mid-model-map-legend__modes" role="group" aria-label="Skalenmodus">
        {(Object.keys(modeLabels) as ModelMapLegendMode[]).map(option=><button
          key={option}
          type="button"
          className="mid-model-map-legend__mode"
          disabled={disabled||disabledModes.includes(option)}
          aria-pressed={mode===option}
          onClick={()=>onModeChange(option)}
        >
          {mode===option?<span className="mid-model-map-legend__check" aria-hidden="true">✓</span>:null}
          <span>{modeLabels[option]}</span>
        </button>)}
        <span className="mid-model-map-legend__live" aria-live="polite">Aktive Skala: {modeLabels[mode]}</span>
      </div>
    </header>
    <div className="mid-model-map-legend__scale">
      {scale.gradient?<div
        className="mid-model-map-legend__gradient"
        role="img"
        aria-label={`Farbverlauf für ${label}; Einheit ${unit}`}
        style={{backgroundImage:scale.gradient}}
      />:null}
      {scale.ticks?<ol className="mid-model-map-legend__ticks" aria-label={`Werte in ${unit}`}>
        {scale.ticks.map(tick=><li
          key={`${tick.position}-${tick.label}`}
          className={`mid-model-map-legend__tick mid-model-map-legend__tick--${tickAlignment(tick.position)}`}
          style={{left:`${tick.position}%`}}
        >{tick.label}</li>)}
      </ol>:null}
      {scale.stops?.length?<ol className="mid-model-map-legend__stops" aria-label={`Feste Farbstufen in ${unit}`}>
        {scale.stops.map((stop,index)=><li key={`${stop.label}-${index}`}>
          <i aria-hidden="true" style={{background:stop.color}}/>
          <span>{stop.label}</span>
        </li>)}
      </ol>:null}
    </div>
  </section>;
}