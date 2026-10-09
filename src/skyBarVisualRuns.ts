import type {SkyBarSegment} from './detailSkyBar';

export type SkyBarVisualRun={segment:SkyBarSegment;samples:SkyBarSegment[]};

// Tooltip values do not define a painted boundary. Preserve each sample while
// painting identical adjacent visuals once, including subpixel hour widths.
export function skyBarVisualRuns(segments:SkyBarSegment[]):SkyBarVisualRun[]{
 const runs:SkyBarVisualRun[]=[];
 for(const sample of segments){
  if(!Number.isFinite(sample.x1)||!Number.isFinite(sample.x2)||sample.x2<=sample.x1)continue;
  const last=runs.at(-1),previous=last?.segment;
  if(previous&&Math.abs(previous.x2-sample.x1)<=1e-7&&previous.layer===sample.layer&&previous.y===sample.y&&previous.color===sample.color&&previous.strokeWidth===sample.strokeWidth&&previous.thicknessLevel===sample.thicknessLevel&&previous.opacity===sample.opacity){
   previous.x2=sample.x2;last!.samples.push(sample);
  }else runs.push({segment:{...sample},samples:[sample]});
 }
 return runs;
}
