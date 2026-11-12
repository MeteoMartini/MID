// Read-only verifier for the dedicated GitHub-native merge review ruleset.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function verifyNativeReviewPolicy(ruleset, ref='refs/heads/main'){
 const errors=[];
 if(ruleset?.source_type!=='Repository'||ruleset.source!=='MeteoMartini/MID'||ruleset.target!=='branch'||ruleset.enforcement!=='active')
  errors.push('Expected active repository branch ruleset for MeteoMartini/MID.');
 const scope=ruleset?.conditions?.ref_name;
 if(scope?.include?.length!==1||scope.include[0]!==ref||!Array.isArray(scope.exclude)||scope.exclude.length!==0)
  errors.push('Expected exactly the intended branch with no exclusions.');
 if(!Array.isArray(ruleset?.bypass_actors)||ruleset.bypass_actors.length!==0)
  errors.push('No bypass actors permitted; missing administrative readback is unverified.');
 const rules=ruleset?.rules?.filter(rule=>rule.type==='pull_request')??[];
 const policy=rules[0]?.parameters;
 if(rules.length!==1||!Number.isInteger(policy?.required_approving_review_count)||policy.required_approving_review_count<1||
    policy.dismiss_stale_reviews_on_push!==true||policy.required_review_thread_resolution!==true||
    !policy.allowed_merge_methods?.includes('squash'))
  errors.push('Require approval, stale-review dismissal, resolved conversations and MID squash compatibility.');
 return errors;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [path,ref]=process.argv.slice(2);
 const errors=verifyNativeReviewPolicy(JSON.parse(readFileSync(path,'utf8')),ref);
 if(errors.length){
  for(const error of errors)console.error(error);
  process.exitCode=1;
 }else console.log('Native review ruleset settings verified; merge-time pilot evidence remains separate.');
}
