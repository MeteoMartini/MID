/** Neutral layout preview: no synthetic weather values, axes or progress claims. */
export function ModuleLoadingState({label,kind='chart',className=''}:{label:string;kind?:'chart'|'map';className?:string}){
 return <section className={`module-loading-state inner${className?` ${className}`:''}`} role="status" aria-live="polite" data-loading-kind={kind} style={{display:'grid',gridTemplateRows:'auto 1fr',alignItems:'stretch',gap:12,minWidth:0,width:'100%',boxSizing:'border-box',padding:16}}>
  <span>{label}</span>
  <div aria-hidden="true" style={{display:'grid',width:'100%',boxSizing:'border-box',gap:10,minHeight:160,border:'1px solid var(--border)',borderRadius:12,padding:16,background:'var(--surface)',alignContent:'start'}}>
   {[60,85,45].map((width,index)=><span key={index} style={{display:'block',width:`${width}%`,height:index===0?18:12,borderRadius:6,background:'var(--border)'}}/>)}
  </div>
 </section>
}
