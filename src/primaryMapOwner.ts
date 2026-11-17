/** Ownership only for the persistent compact surroundings and full map workspaces.
 * The section-rail observer may leave both React panels mounted; the GPU subtree
 * must never be active in both. Other independent warning/chart renderers are
 * outside this bounded contract.
 */
export type PrimaryMapOwner='compact'|'workspace'|'none';
export function choosePrimaryMapOwner(
 activeSection:string|null|undefined,currentEnabled:boolean,workspaceEnabled:boolean
):PrimaryMapOwner{
 if((activeSection==='composite'||activeSection==='weather-maps')&&workspaceEnabled)return'workspace';
 if((activeSection===undefined||activeSection===null||activeSection===''||activeSection==='place'||activeSection==='current')&&currentEnabled)return'compact';
 return'none';
}
