/** Neutral layout preview: no synthetic weather values, axes or progress claims. */
export function ModuleLoadingState({label,kind='chart'}:{label:string;kind?:'chart'|'map'}){
 return <section className="module-loading-state inner" role="status" aria-live="polite" style={{display:'grid',gap:12,minWidth:0,width:'100%',boxSizing:'border-box',padding:16}}>
  <span>{label}</span>
  <div aria-hidden="true" style={{display:'grid',gap:10,minHeight:kind==='map'?240:160,border:'1px solid var(--border)',borderRadius:12,padding:16,background:'var(--surface)',alignContent:'start'}}>
   {[60,85,45].map((width,index)=><span key={index} style={{display:'block',width:`${width}%`,height:index===0?18:12,borderRadius:6,background:'var(--border)'}}/>)}
  </div>
 </section>
}
