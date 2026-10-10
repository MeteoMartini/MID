import type {CSSProperties} from 'react';
import {utciCategory} from './utci';

/** Presentation only: receives the canonical current UTCI without recalculating it. */
export function CurrentUtciHighlight({value}:{value:number}){
 const available=Number.isFinite(value),category=utciCategory(value);
 return <div className="current-utci-highlight" style={{'--current-utci-tone':available?category.color:'var(--muted)'} as CSSProperties} title="Universal Thermal Climate Index: thermisches Empfinden aus Temperatur, Feuchte, Wind und Strahlung">
  <span>UTCI</span><strong>{available?Math.round(value):'–'}<small> °C</small></strong><em>{available?category.shortLabel:'nicht verfügbar'}</em>
 </div>;
}
