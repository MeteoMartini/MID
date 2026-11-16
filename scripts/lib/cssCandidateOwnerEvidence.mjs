/**
 * Read-only LOWER BOUND of CSS module ownership. CSS selector/property
 * collisions alone cannot prove a stylesheet safe to defer.
 * This verifies named CSS class anchors against reviewed component sources,
 * not computed styles, source maps, runtime class activation or browser parity.
 */
import postcss from 'postcss';

const ANCHORS=Object.freeze([
 {id:'app-bottom-navigation',className:'navigation-bottom-tabs',ownerFile:'src/App.tsx',marker:'className="navigation-bottom-tabs"',surface:'shared-navigation'},
 {id:'mountain-controls',className:'mountain-ski',ownerFile:'src/MountainWeather.tsx',marker:'className="card mountain-ski"',surface:'deferred-mountain'},
 {id:'fourteen-cockpit-grid',className:'cockpit-fourteen-grid',ownerFile:'src/ForecastCockpit.tsx',marker:'className="cockpit-fourteen-grid"',surface:'forecast-cockpit'},
 {id:'fourteen-cockpit-cards',className:'cockpit-fourteen-card',ownerFile:'src/ForecastCockpit.tsx',marker:'cockpit-fourteen-card mid-forecast-row',surface:'forecast-cockpit'},
]);

export function cssCandidateOwnerEvidence(css,ownerSources){
 if(typeof css!=='string'||!css.trim()||!ownerSources||typeof ownerSources!=='object'){
  throw TypeError('Nonempty CSS and reviewed component sources are required');
 }
 for(const anchor of ANCHORS){
  const source=ownerSources[anchor.ownerFile];
  if(typeof source!=='string'||!source.includes(anchor.marker)){
   throw Error('Missing reviewed CSS owner marker: '+anchor.ownerFile+' :: '+anchor.marker);
  }
 }
 const ast=postcss.parse(css,{from:'mid-candidate.css'});
 const rules=[];ast.walkRules(rule=>rules.push(rule));
 const owners=ANCHORS.map(anchor=>{
  // Escape only known, checked CSS identifiers; class suffixes are not the same class.
  const selectorPattern=new RegExp('\\.'+anchor.className+'(?![A-Za-z0-9_-])');
  const affected=rules.filter(rule=>selectorPattern.test(rule.selector));
  return {
   id:anchor.id,surface:anchor.surface,ownerFile:anchor.ownerFile,
   selectorAnchor:'.'+anchor.className,
   matchedRuleCount:affected.length,
   examples:affected.slice(0,4).map(rule=>{
    const conditions=[];for(let node=rule.parent;node&&node.type!=='root';node=node.parent){
     if(node.type==='atrule')conditions.unshift('@'+node.name+' '+node.params);
    }
    return {line:rule.source?.start?.line??null,selector:rule.selector.slice(0,180),conditions};
   }),
  };
 });
 const blockers=owners.filter(x=>x.matchedRuleCount>0);
 return {
  schema:'mid.css-candidate-owner-evidence.v1',
  kind:'static lower bound; class anchors in reviewed component sources, never browser/visual parity',
  ownerReferences:owners,
  blockers,
  status:blockers.length?'BLOCKED_CROSS_MODULE_OWNERSHIP':'UNVERIFIED_REQUIRE_BROWSER_PARITY',
  safeToDefer:false,
 };
}
