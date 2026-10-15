// Browser fixtures must obey the same cycle-dependent horizons as real data.
export function synopticBrowserFixtureHours(modelId, runMs) {
 const core=[0,3,6,9,12,15,18,21,24,30,36,42,48];
 const extra={'icon-d2':[],'icon-eu':[60,72],icon:[60,72,96,120,144,168,180],gfs:[384],ifs:[360]}[modelId];
 if(!extra||!Number.isFinite(runMs))throw new RangeError('Invalid synoptic fixture model/run');
 const shortIcon=modelId==='icon'&&[6,18].includes(new Date(runMs).getUTCHours());
 return [...core,...extra].filter(hour=>!shortIcon||hour<=120);
}
