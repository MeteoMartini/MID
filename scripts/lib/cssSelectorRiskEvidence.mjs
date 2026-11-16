/**
 * Read-only CSS selector overlap evidence for proposed eager-to-lazy moves.
 * Same-class/same-property matches are a conservative risk signal, NOT proof
 * that selectors target the same DOM element or that a split is safe.
 * The candidate will load AFTER every remaining eager stylesheet, so only
 * rules appearing AFTER it in today's canonical cascade can invert priority.
 */
const MAX_EXAMPLES=16;

/** Explicit, intentionally incomplete shorthand expansion for diagnostic risk.
 * Expand only well-known longhand families; unrecognised shorthands are
 * unverified, not evidence of safe relocation.
 */
const SHORT_TO_LONG=Object.freeze({
  margin:['margin-top','margin-right','margin-bottom','margin-left'],
  padding:['padding-top','padding-right','padding-bottom','padding-left'],
  inset:['top','right','bottom','left'],
  'border-width':['border-top-width','border-right-width','border-bottom-width','border-left-width'],
  'border-style':['border-top-style','border-right-style','border-bottom-style','border-left-style'],
  'border-color':['border-top-color','border-right-color','border-bottom-color','border-left-color'],
  border:['border-width','border-style','border-color'],
  'border-top':['border-top-width','border-top-style','border-top-color'],
  'border-right':['border-right-width','border-right-style','border-right-color'],
  'border-bottom':['border-bottom-width','border-bottom-style','border-bottom-color'],
  'border-left':['border-left-width','border-left-style','border-left-color'],
  'background':['background-color','background-image','background-position','background-size','background-repeat','background-attachment','background-origin','background-clip'],
  'font':['font-style','font-variant','font-weight','font-stretch','font-size','line-height','font-family'],
  flex:['flex-grow','flex-shrink','flex-basis'],
});
function affectedLonghands(property,seen=new Set()){
  if(seen.has(property))throw Error('Cyclic CSS shorthand mapping: '+property);
  const expanded=SHORT_TO_LONG[property];
  if(!expanded)return [property];
  const next=new Set([...seen,property]);
  return [...new Set(expanded.flatMap(part=>affectedLonghands(part,next)))];
}

/** Conservative ASCII CSS-class scanner, not a full selector parser.
 * Never mistake a dotted attribute value or quoted pseudo argument for a
 * class. Escaped/non-ASCII class names stay explicitly uncertain instead
 * of silently becoming truncated class names.
 */
function classAnchors(selector){
  if(typeof selector!=='string')throw TypeError('CSS selector must be text');
  const names=new Set();
  let quoted=null,attributes=0,ambiguous=false;
  for(let i=0;i<selector.length;i++){
    const char=selector[i],next=selector[i+1];
    if(quoted){
      if(char==='\\'){i++;continue}
      if(char===quoted)quoted=null;
      continue;
    }
    if(char==="'"||char==='"'){quoted=char;continue}
    if(char==='/'&&next==='*'){
      const end=selector.indexOf('*/',i+2);
      if(end<0){ambiguous=true;break}
      i=end+1;continue;
    }
    if(char==='\\'){ambiguous=true;i++;continue}
    if(char==='['){attributes++;continue}
    if(char===']'){
      if(attributes)attributes--;
      else ambiguous=true;
      continue;
    }
    if(attributes||char!=='.')continue;
    let cursor=i+1,candidate='';
    const first=selector[cursor]??'';
    if(!/[-_a-zA-Z]/.test(first)){
      if(first&&first.codePointAt(0)>127)ambiguous=true;
      continue;
    }
    for(;cursor<selector.length;cursor++){
      const value=selector[cursor];
      if(/[-_a-zA-Z0-9]/.test(value)){candidate+=value;continue}
      if(value==='\\'||value.codePointAt(0)>127){ambiguous=true;candidate=''}
      break;
    }
    if(candidate)names.add(candidate);
    i=cursor-1;
  }
  return {names:[...names],ambiguous:ambiguous||Boolean(quoted)||attributes>0};
}
function context(rule){
  const out=[];
  for(let node=rule.parent;node&&node.type!=='root';node=node.parent){
    if(node.type==='atrule')out.unshift('@'+node.name+' '+node.params);
  }
  return out;
}
function declarations(rule){
  return (rule.nodes||[]).filter(node=>node.type==='decl'&&typeof node.prop==='string')
    .map(node=>({property:node.prop.toLowerCase(),important:Boolean(node.important)}));
}
function isKeyframe(rule){
  for(let node=rule.parent;node&&node.type!=='root';node=node.parent){
    if(node.type==='atrule'&&/keyframes$/i.test(node.name))return true;
  }
  return false;
}
function rules(entry){
  if(!entry||typeof entry.file!=='string'||!entry.tree||typeof entry.tree.walkRules!=='function')
    throw new TypeError('Every CSS entry requires a file and parsed PostCSS tree');
  const result=[];
  entry.tree.walkRules(rule=>{
    if(isKeyframe(rule))return;
    const decls=declarations(rule);
    if(!decls.length)return;
    const anchors=classAnchors(rule.selector??'');
    result.push({file:entry.file,selector:rule.selector??'',line:rule.source?.start?.line??null,
      classes:anchors.names,selectorAmbiguous:anchors.ambiguous,declarations:decls,conditions:context(rule)});
  });
  return result;
}
/**
 * Entrypoint operates on loadCssCascade()'s ordered, expanded AST entries.
 * A positive flag requires only a shared class and property, so it may
 * overreport. A negative flag cannot prove visual/cascade/ownership parity.
 */
export function cssSelectorRiskEvidence(entries,candidateFile){
  if(!Array.isArray(entries)||!entries.length||!candidateFile||typeof candidateFile!=='string')
    throw TypeError('Nonempty ordered CSS entries and candidate file required');
  const seen=new Set();
  for(const entry of entries){
    if(typeof entry?.file!=='string'||seen.has(entry.file))throw Error('Invalid or duplicate CSS entry');
    seen.add(entry.file);
  }
  const index=entries.findIndex(entry=>entry.file===candidateFile);
  if(index<0)throw Error('Candidate missing from canonical eager CSS cascade: '+candidateFile);
  const candidate=rules(entries[index]);
  if(!candidate.length)throw Error('Candidate has no parsed CSS declarations; not a validated move target');
  const later=entries.slice(index+1).flatMap(rules);
  const byClassProperty=new Map();
  for(const row of later){
    for(const className of row.classes)for(const decl of row.declarations){
      const key=JSON.stringify([className,decl.property]);
      if(!byClassProperty.has(key))byClassProperty.set(key,[]);
      byClassProperty.get(key).push({row,decl});
    }
  }
  let potentialPairs=0,matchingImportancePairs=0,differentImportancePairs=0,unclassifiedRules=0,ambiguousCandidateSelectors=0;
  const ambiguousLaterSelectors=later.filter(row=>row.selectorAmbiguous).length;
  const affectedClasses=new Set(),affectedFiles=new Set(),examples=[];
  for(const left of candidate){
    if(left.selectorAmbiguous)ambiguousCandidateSelectors++;
    if(!left.classes.length){unclassifiedRules++;continue}
    for(const className of left.classes)for(const declaration of left.declarations){
      const matches=byClassProperty.get(JSON.stringify([className,declaration.property]))||[];
      for(const {row:right,decl:laterDecl} of matches){
        // Exact-selector collisions are already reported by the original
        // CSS audit. Focus on additional, differently written selectors.
        if(left.selector===right.selector)continue;
        potentialPairs++;
        // Source order alone can only be a tiebreaker when importance matches.
        // Equal importance still does NOT establish equal specificity, layer, DOM or scope.
        const sameImportance=declaration.important===laterDecl.important;
        if(sameImportance)matchingImportancePairs++;else differentImportancePairs++;
        affectedClasses.add(className);affectedFiles.add(right.file);
        if(examples.length<MAX_EXAMPLES)examples.push({
          className,property:declaration.property,importanceRelation:sameImportance?'MATCH':'DIFFERENT',
          candidate:{file:left.file,line:left.line,selector:left.selector.slice(0,220),
            important:declaration.important,conditions:left.conditions},
          later:{file:right.file,line:right.line,selector:right.selector.slice(0,220),
            important:laterDecl.important,conditions:right.conditions},
        });
      }
    }
  }

  // A different property name can still compete when one declaration is a
  // shorthand. Build a separate longhand index and preserve the old exact-
  // property counts. Declaration identity de-duplicates multi-longhand and
  // multi-class overlaps (e.g. border vs border-width).
  const byClassAffectedLonghand=new Map();
  for(const row of later)for(const className of row.classes)for(const decl of row.declarations){
    for(const longhand of affectedLonghands(decl.property)){
      const key=JSON.stringify([className,longhand]);
      if(!byClassAffectedLonghand.has(key))byClassAffectedLonghand.set(key,[]);
      byClassAffectedLonghand.get(key).push({row,decl});
    }
  }
  let shorthandLonghandPairs=0,shorthandMatchingImportancePairs=0,shorthandDifferentImportancePairs=0;
  const shorthandExamples=[],shorthandAffectedFiles=new Set();
  for(const left of candidate){
    if(!left.classes.length)continue;
    for(const declaration of left.declarations){
      const counted=new Set();
      for(const className of left.classes)for(const longhand of affectedLonghands(declaration.property)){
        for(const {row:right,decl:laterDecl} of byClassAffectedLonghand.get(JSON.stringify([className,longhand]))??[]){
          if(declaration.property===laterDecl.property||counted.has(laterDecl))continue;
          // An overlap of different names requires at least one known shorthand.
          if(!SHORT_TO_LONG[declaration.property]&&!SHORT_TO_LONG[laterDecl.property])continue;
          counted.add(laterDecl);
          shorthandLonghandPairs++;
          const importanceMatch=declaration.important===laterDecl.important;
          if(importanceMatch)shorthandMatchingImportancePairs++;
          else shorthandDifferentImportancePairs++;
          shorthandAffectedFiles.add(right.file);
          if(shorthandExamples.length<MAX_EXAMPLES)shorthandExamples.push({
            className,affectedLonghand:longhand,importanceRelation:importanceMatch?'MATCH':'DIFFERENT',
            candidate:{file:left.file,line:left.line,selector:left.selector.slice(0,220),property:declaration.property,important:declaration.important,conditions:left.conditions},
            later:{file:right.file,line:right.line,selector:right.selector.slice(0,220),property:laterDecl.property,important:laterDecl.important,conditions:right.conditions},
          });
        }
      }
    }
  }
  return {
    schema:'mid.css-selector-risk-evidence.v1',
    candidateFile,candidateRuleCount:candidate.length,laterEagerFiles:entries.length-index-1,
    laterRuleCount:later.length,potentialPairs,matchingImportancePairs,differentImportancePairs,
    shorthandLonghandPairs,shorthandMatchingImportancePairs,shorthandDifferentImportancePairs,
    shorthandAffectedFiles:[...shorthandAffectedFiles].sort(),shorthandExamples,
    affectedClasses:[...affectedClasses].sort(),affectedFiles:[...affectedFiles].sort(),
    unclassifiedRules,ambiguousCandidateSelectors,ambiguousLaterSelectors,examples,
    method:'Shared CSS class/property across different selectors plus separately deduplicated curated shorthand/longhand overlaps; descriptive only',
    caveat:'Static heuristic: equal importance does not prove equal specificity, layer, scope or DOM targeting; unlike exact property matches, shorthandLonghandPairs include same-selector collisions. Curated shorthand coverage is deliberately partial (e.g. border-image, all, custom properties and logical shorthands remain unverified). Unknown or missing overlap never means CSS safe to defer.',
    status:potentialPairs||shorthandLonghandPairs?'POTENTIAL_CROSS_SELECTOR_CASCADE_RISK':'UNVERIFIED_NO_STATIC_MATCH',
    safeToDefer:false,
  };
}
