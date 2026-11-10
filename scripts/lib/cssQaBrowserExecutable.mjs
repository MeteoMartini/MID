import {accessSync,constants} from 'node:fs';

export const MID_CSS_QA_SYSTEM_CHROMIUM_CANDIDATES=Object.freeze([
 '/usr/bin/chromium',
 '/usr/bin/chromium-browser',
 '/usr/bin/google-chrome',
 '/usr/bin/google-chrome-stable'
]);
function canExecute(path){
 try{accessSync(path,constants.X_OK);return true}catch{return false}
}
/**
 * Choose an existing executable for real CSS pixel tests, never a mock browser.
 * Playwright's bundled Chromium remains the fallback only when unavailable.
 * This does not claim parity between installed Chrome and Playwright's pinned
 * browser revision; the selected executable/version must be logged.
 */
export function midCssQaBrowserExecutable({env=process.env,probe=canExecute}={}){
 const explicit=String(env.MID_BROWSER_EXECUTABLE||'').trim();
 if(explicit){
  if(!probe(explicit))throw new Error('Explicit MID_BROWSER_EXECUTABLE is not executable');
  return explicit;
 }
 for(const path of MID_CSS_QA_SYSTEM_CHROMIUM_CANDIDATES)if(probe(path))return path;
 return null;
}
