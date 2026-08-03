function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}

export type EnsembleConfidenceInput={
 spread:number;
 index:number;
 modelCount:number;
 maxModelCount:number;
};

export function computeEnsembleConfidence({spread,index,modelCount,maxModelCount}:EnsembleConfidenceInput){
 const safeSpread=Math.max(0,Number(spread)||0);
 const safeIndex=Math.max(0,Number(index)||0);
 const safeModelCount=Math.max(0,Number(modelCount)||0);
 const safeMaxModels=Math.max(1,Number(maxModelCount)||1);
 const scoreSpread=clamp(100-safeSpread*7.5,25,97);
 const scoreLead=clamp(100-safeIndex*3.7,45,100);
 const scoreModels=clamp(55+(safeModelCount/safeMaxModels)*45,55,100);
 return Math.round(clamp(scoreSpread*.48+scoreLead*.22+scoreModels*.30,25,97));
}
