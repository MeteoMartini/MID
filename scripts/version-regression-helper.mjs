export function versionAtLeast(current,minimum){
 const currentParts=String(current).split('.').map(part=>Number.parseInt(part,10)||0);
 const minimumParts=String(minimum).split('.').map(part=>Number.parseInt(part,10)||0);
 const length=Math.max(currentParts.length,minimumParts.length);
 for(let index=0;index<length;index++){
  const difference=(currentParts[index]??0)-(minimumParts[index]??0);
  if(difference!==0)return difference>0;
 }
 return true;
}
