/** Canvas-only fallback contract: this proves source/layer/feature state, not visible screen pixels. */
export type ExtremeOutlookRenderHealth={
 contourCount:number;
 polygonCount:number;
 hasFillLayer:boolean;
 hasSource:boolean;
 sourceLoaded:boolean;
 labelInView:boolean;
 renderedFeatureCount:number;
};
export function requiresExtremeOutlookCanvasFallback(health:ExtremeOutlookRenderHealth):boolean{
 if(health.contourCount===0)return false;
 // Reject partial conversion as well as completely absent GeoJSON geometry.
 if(health.polygonCount<health.contourCount)return true;
 if(!health.hasFillLayer||!health.hasSource||!health.sourceLoaded)return true;
 // A blank feature query is actionable only when a model contour label is on screen.
 // Positive query results do NOT establish visible pixels: browser screenshots remain mandatory.
 return health.labelInView&&health.renderedFeatureCount===0;
}
