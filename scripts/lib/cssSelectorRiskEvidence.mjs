/**
 * Read-only CSS selector overlap evidence for proposed eager-to-lazy moves.
 * Same-class/same-property matches are a conservative risk signal, NOT proof
 * that selectors target the same DOM element or that a split is safe.
 * The candidate will load AFTER every remaining eager stylesheet, so only
 * rules appearing AFTER it in today's canonical cascade can invert priority.
 */
const CLASS_RE=/\.(-?[_a-zA-Z][-_a-zA-Z0-9]*)/g;
const MAX_EXAMPLES=16;

function classes(selector){
  return [...new Set([...selector.matchAll(CLASS_RE)].map(match=>match[1]))];
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
    result.push({file:entry.file,selector:rule.selector??'',line:rule.source?.start?.line??null,
      classes:classes(rule.selector??''),declarations:decls,conditions:context(rule)});
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
  let potentialPairs=0,unclassifiedRules=0;
  const affectedClasses=new Set(),affectedFiles=new Set(),examples=[];
  for(const left of candidate){
    if(!left.classes.length){unclassifiedRules++;continue}
    for(const className of left.classes)for(const declaration of left.declarations){
      const matches=byClassProperty.get(JSON.stringify([className,declaration.property]))||[];
      for(const {row:right,decl:laterDecl} of matches){
        // Exact-selector collisions are already reported by the original
        // CSS audit. Focus on additional, differently written selectors.
        if(left.selector===right.selector)continue;
        potentialPairs++;
        affectedClasses.add(className);affectedFiles.add(right.file);
        if(examples.length<MAX_EXAMPLES)examples.push({
          className,property:declaration.property,
          candidate:{file:left.file,line:left.line,selector:left.selector.slice(0,220),
            important:declaration.important,conditions:left.conditions},
          later:{file:right.file,line:right.line,selector:right.selector.slice(0,220),
            important:laterDecl.important,conditions:right.conditions},
        });
      }
    }
  }
  return {
    schema:'mid.css-selector-risk-evidence.v1',
    candidateFile,candidateRuleCount:candidate.length,laterEagerFiles:entries.length-index-1,
    laterRuleCount:later.length,potentialPairs,
    affectedClasses:[...affectedClasses].sort(),affectedFiles:[...affectedFiles].sort(),
    unclassifiedRules,examples,
    method:'Shared CSS class AND identical property in different selectors; potential change in order after asynchronous import',
    caveat:'Lower-bound static heuristic; may overreport DOM overlap and underreport complex/cross-property cascade effects, selectors without classes, escaped identifiers, @layer and variable dependencies',
    status:potentialPairs?'POTENTIAL_CROSS_SELECTOR_CASCADE_RISK':'UNVERIFIED_NO_STATIC_MATCH',
    safeToDefer:false,
  };
}
