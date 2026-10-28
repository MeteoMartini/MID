import {regressionSuite} from './regression-suite.mjs';

export const REGRESSION_HEAVY_SHARDS=Object.freeze({
 'heavy-browser-state':Object.freeze(['test-favorite-selection-browser-0985189.mjs','test-forecast-display-persistence-0985166.mjs','test-fourteen-css-lazy-0985339.mjs']),
 'heavy-native-map':Object.freeze(['test-adaptive-native-maps-0985141.mjs']),
 'heavy-unified-map':Object.freeze(['test-unified-map-layers-0985167.mjs']),
 'heavy-mountain-visual':Object.freeze(['test-mountain-visual-acceptance-18213.mjs']),
});

export const REGRESSION_SHARD_NAMES=Object.freeze(['core',...Object.keys(REGRESSION_HEAVY_SHARDS)]);
// Core jobs use separate checkouts. Keep the complete `core` alias for local
// developer verification; only the CI source gate uses these disjoint subsets.
export const REGRESSION_CORE_SUBSHARDS=Object.freeze(['core-1/4','core-2/4','core-3/4','core-4/4']);

export function regressionCoreSubshards(core){
 const parts=Object.fromEntries(REGRESSION_CORE_SUBSHARDS.map(name=>[name,[]]));
 for(const [index,name] of core.entries())parts[REGRESSION_CORE_SUBSHARDS[index%REGRESSION_CORE_SUBSHARDS.length]].push(name);
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
