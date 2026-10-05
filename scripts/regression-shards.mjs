import {regressionSuite} from './regression-suite.mjs';

export const REGRESSION_HEAVY_SHARDS=Object.freeze({
 'heavy-native-map':Object.freeze(['test-adaptive-native-maps-0985141.mjs']),
 'heavy-unified-map':Object.freeze(['test-unified-map-layers-0985167.mjs']),
 'heavy-mountain-visual':Object.freeze(['test-mountain-visual-acceptance-18213.mjs']),
});

export const REGRESSION_SHARD_NAMES=Object.freeze(['core',...Object.keys(REGRESSION_HEAVY_SHARDS)]);

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
 if(!REGRESSION_SHARD_NAMES.includes(name))throw new Error('Unknown MID regression shard: '+name);
 return plan.shards[name];
}
