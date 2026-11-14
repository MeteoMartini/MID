import {regressionSuite} from './regression-suite.mjs';

export const REGRESSION_HEAVY_SHARDS=Object.freeze({
 'heavy-browser-state':Object.freeze(['test-favorite-selection-browser-0985189.mjs','test-forecast-display-persistence-0985166.mjs','test-fourteen-css-lazy-0985339.mjs']),
 'heavy-native-map':Object.freeze(['test-adaptive-native-maps-0985141.mjs']),
 // INCA is a map-domain regression: keep every existing measured Core shard assignment intact.
 'heavy-unified-map':Object.freeze(['test-unified-map-layers-0985167.mjs','test-geosphere-inca-nowcast.mjs']),
 'heavy-mountain-visual':Object.freeze(['test-mountain-visual-acceptance-18213.mjs']),
});

export const REGRESSION_SHARD_NAMES=Object.freeze(['core',...Object.keys(REGRESSION_HEAVY_SHARDS)]);
// Core jobs use separate checkouts. Keep the complete `core` alias for local
// developer verification; only the CI source gate uses these disjoint subsets.
export const REGRESSION_CORE_SUBSHARDS=Object.freeze(['core-1/4','core-2/4','core-3/4','core-4/4']);
/**
 * Append newly registered scientific regressions after the SHA-measured legacy
 * modulo assignment. This prevents alphabetically inserted filenames from
 * silently moving ~1087 existing tests and invalidating the evidence-backed
 * heavy/core cost budget. Additions always execute in an existing mandatory
 * shard and are still accounted for exactly once.
 */
export const REGRESSION_CORE_STABLE_ADDITIONS=Object.freeze([
 Object.freeze({test:'test-current-moisture-0985462.mjs',destination:'core-4/4'}),
 Object.freeze({test:'test-codeql-4393-pin-0985475.mjs',destination:'core-1/4'}),
 Object.freeze({test:'test-current-surroundings-temperature-0985476.mjs',destination:'core-4/4'})
]);

// Budget-neutral test scheduling, measured on actual SHA-bound Source gate #42568701822:
// core-2/4 was 776.3 s against its unchanged 780 s step cap, while the other
// core jobs took 85.5–146.7 s. Transfer only three expensive complete tests
// to underloaded mandatory jobs, exchanging three lightweight complete tests.
// Never omit, duplicate, shorten, mock or downgrade any regression.
export const REGRESSION_CORE_BALANCE_SWAPS=Object.freeze([
 Object.freeze({slow:'test-compact-profile-location-0985235.mjs',destination:'core-1/4',light:'test-mid-original-dwd-weather-profile-09310.mjs'}),
 Object.freeze({slow:'test-favorites-profile-0985242.mjs',destination:'core-1/4',light:'test-pollen-compact-dwd-levels-0985129.mjs'}),
 Object.freeze({slow:'test-module-css-consolidation-0985170.mjs',destination:'core-4/4',light:'test-mid-weather-profile-axes-09322.mjs'}),
]);

export function regressionCoreSubshards(core){
 const parts=Object.fromEntries(REGRESSION_CORE_SUBSHARDS.map(name=>[name,[]]));
 const newNames=new Set(REGRESSION_CORE_STABLE_ADDITIONS.map(row=>row.test));
 if(newNames.size!==REGRESSION_CORE_STABLE_ADDITIONS.length||
    REGRESSION_CORE_STABLE_ADDITIONS.some(row=>!REGRESSION_CORE_SUBSHARDS.includes(row.destination)||core.filter(name=>name===row.test).length!==1))
  throw new Error('Core science additions missing, duplicate or unassigned');
 const previouslyQualified=core.filter(name=>!newNames.has(name));
 for(const [index,name] of previouslyQualified.entries())parts[REGRESSION_CORE_SUBSHARDS[index%REGRESSION_CORE_SUBSHARDS.length]].push(name);
 for(const {slow,destination,light} of REGRESSION_CORE_BALANCE_SWAPS){
  const overloaded=parts['core-2/4'],spare=parts[destination],fromIndex=overloaded.indexOf(slow),toIndex=spare?.indexOf(light)??-1;
  if(destination==='core-2/4'||fromIndex<0||toIndex<0)throw new Error('Stale core balance swap: '+slow+' <-> '+light);
  overloaded[fromIndex]=light;spare[toIndex]=slow;
 }
 for(const {test,destination} of REGRESSION_CORE_STABLE_ADDITIONS)parts[destination].push(test);
 for(const name of REGRESSION_CORE_SUBSHARDS)parts[name].sort();
 const assigned=REGRESSION_CORE_SUBSHARDS.flatMap(name=>parts[name]);
 if(assigned.length!==core.length||new Set(assigned).size!==core.length||core.some(name=>!assigned.includes(name)))throw new Error('Core subshards do not cover every required regression exactly once.');
 return parts;
}

export async function regressionShardPlan(root){
 const tests=await regressionSuite(root);
 const testSet=new Set(tests),heavyNames=Object.values(REGRESSION_HEAVY_SHARDS).flat();
 const unknown=heavyNames.filter(name=>!testSet.has(name));
 if(unknown.length)throw new Error('Heavy regression shard references unknown tests: '+unknown.join(', '));
 const duplicates=heavyNames.filter((name,index)=>heavyNames.indexOf(name)!==index);
 if(duplicates.length)throw new Error('Regression tests assigned to multiple heavy shards: '+[...new Set(duplicates)].join(', '));
 const heavySet=new Set(heavyNames),shards={core:tests.filter(name=>!heavySet.has(name))};
 for(const [name,members] of Object.entries(REGRESSION_HEAVY_SHARDS))shards[name]=[...members];
 const assigned=REGRESSION_SHARD_NAMES.flatMap(name=>shards[name]??[]),assignedSet=new Set(assigned);
 const missing=tests.filter(name=>!assignedSet.has(name)),extra=assigned.filter(name=>!testSet.has(name));
 if(assigned.length!==tests.length||assignedSet.size!==tests.length||missing.length||extra.length){
  throw new Error('Regression shard plan is not a lossless one-to-one partition (missing: '+missing.join(', ')+', extra: '+extra.join(', ')+').');
 }
 return{tests,shards};
}

export async function regressionShard(root,name){
 const plan=await regressionShardPlan(root);
 if(name==='all'||!name)return plan.tests;
 if(REGRESSION_CORE_SUBSHARDS.includes(name))return regressionCoreSubshards(plan.shards.core)[name];
 if(!REGRESSION_SHARD_NAMES.includes(name))throw new Error('Unknown MID regression shard: '+name);
 return plan.shards[name];
}
