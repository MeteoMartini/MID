/** MID AI Router 1.1 – offline provider selection, no HTTP or secret access. */
import {planMidAiRoute} from './mid-ai-router.mjs';
import {planMidAiSonar} from './mid-ai-router-sonar.mjs';
const deny=(reason)=>{const e=new Error('MID research routing blocked: '+reason);
 e.name='MidAiResearchSelectionBlocked';e.reason=reason;throw e;};
export function planMidAiResearchRoute({
 task,snapshot,providers=[],sonarProof=null,now=Date.now()
}={}){
 if(!task||task.userInitiated!==true)deny('USER_AUTHORIZATION_REQUIRED');
 const preference=task.preferredProvider??'direct-free';
 if(preference==='direct-free'){
   // Intentional default: NEVER fall back to a priced, credit-funded model.
   const plan=planMidAiRoute({task,snapshot,providers,now});
   return Object.freeze({...plan,selection:'DIRECT_FREE_ONLY',
     pricedCreditsAuthorized:false,dispatchAuthorized:false});
 }
 if(preference!=='sonar-included-credit')deny('UNSUPPORTED_PROVIDER_PREFERENCE');
 if(task.kind!=='external-research'||task.dataClass!=='public-redacted'||
    task.allowIncludedCreditUse!==true||task.maxAdditionalCashUsd!==0||
    task.maxExternalCalls!==1)
   deny('EXPLICIT_SONAR_CREDIT_AUTHORIZATION_REQUIRED');
 if(!sonarProof||typeof sonarProof!=='object')
   deny('SONAR_ACCOUNT_PROOF_REQUIRED');
 const sonar=planMidAiSonar({task,snapshot,...sonarProof,now});
 return Object.freeze({...sonar,selection:'EXPLICIT_SONAR_CREDIT_ONLY',
   pricedCreditsAuthorized:true,dispatchAuthorized:false});
}
