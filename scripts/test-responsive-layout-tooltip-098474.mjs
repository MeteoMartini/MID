import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const css=read('src/styles-src/30-modern.css');
const app=read('src/ForecastCockpit.tsx');
const events=read('src/EventPlannerPanel.tsx');
const aggregate=read('src/styles.css');
const checks=[
 ['v0.9.84.74 CSS marker',css.includes('MID v0.9.84.74 · geräteübergreifender Layout-/Tooltip-Audit')],
 ['Event sort remains functional',events.includes('<option value="chronological">Chronologisch</option>')&&events.includes('setSortMode')],
 ['Event sort gets full mobile row',css.includes('.event-center-actions>.event-center-sort{\n  grid-column:1/-1!important;')],
 ['Event quick weather no longer ellipsizes',css.includes('.event-center-card-quick-weather>span{')&&css.includes('text-overflow:clip!important;')],
 ['Event workspace labels no longer ellipsize',css.includes('.event-workspace-nav button>span,')&&css.includes('text-wrap:balance;')],
 ['Profile overlay has independent interaction state',app.includes('[profileOverlayId,setProfileOverlayId]=useState<string|null>(null)')],
 ['Profile overlay auto dismisses',app.includes('window.setTimeout')&&app.includes('4800')&&app.includes('setProfileOverlayId(current=>current===point.id?null:current)')],
 ['Profile overlay not rendered from permanent selection',app.includes('profileOverlayVisualPoint?<g className="selected-time-values"')&&!app.includes('selectedVisualPoint?<><line className="selected-time-line"')],
 ['Profile hit layer handles hover focus touch',app.includes('onPointerEnter={()=>{if(fineProfilePointer())')&&app.includes('onFocus={()=>{clearProfileOverlayTimer();setProfileOverlayId(item.point.id)}}')&&app.includes('onClick={()=>showProfileOverlay(item.point,true)}')],
 ['Ensemble mobile tooltip uses viewport width',css.includes('width:calc(100vw - 12px)!important;')&&css.includes('max-height:min(76dvh,560px)!important;')],
 ['Ensemble tooltip background is opaque',css.includes('.ensemble-pro-tooltip{background:var(--surface)!important}')],
 ['Ensemble text may wrap',css.includes('overflow-wrap:anywhere;')&&css.includes('white-space:normal!important;')],
 ['Landscape tooltip is vertically constrained',css.includes('@media(orientation:landscape) and (max-height:620px)')],
 ['Ensemble long single-value rows stack on narrow screens',css.includes('.tooltip-meta-line.single-value{\n    grid-template-columns:minmax(0,1fr)!important;')&&css.includes('word-break:normal!important;')],
 ['Aggregate contains release marker',aggregate.includes('MID v0.9.84.74 · geräteübergreifender Layout-/Tooltip-Audit')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++}if(failed)process.exit(1);
