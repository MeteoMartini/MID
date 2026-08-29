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

export function expectedIosNextMilestone(current){
 if(versionAtLeast(current,'0.9.73.0'))return 'macos-xcode-simulator-quality-assurance';
 if(versionAtLeast(current,'0.9.72.0'))return 'apple-privacy-permission-manifest-preparation';
 if(versionAtLeast(current,'0.9.71.0'))return 'apple-push-background-refresh-source-preparation';
 if(versionAtLeast(current,'0.9.70.1'))return 'widgetkit-xcode-structure-with-mid-native-widget-v1';
 if(versionAtLeast(current,'0.9.68.2'))return 'lifecycle-offline-resume-without-local-data-loss';
 if(versionAtLeast(current,'0.9.68.1'))return 'native-share-import-export-with-browser-fallback';
 if(versionAtLeast(current,'0.9.68.0'))return 'native-external-navigation-with-deep-link-return';
 return 'native-location-adapter-with-browser-fallback';
}
