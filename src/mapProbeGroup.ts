/**
 * Per-MapLibre-map probe coordinator. One map click, one focusable popup,
 * multiple independently labelled model values. This does not combine
 * meteorological fields: it merely presents the separately validated probes.
 * Every model source keeps its own unit, status and provenance.
 */
export type MapProbeValue=number|string;
export type MapProbeSource={
 label:string;unit:string;source:string;unavailableNote:string;
 sample:(latitude:number,longitude:number,signal:AbortSignal)=>MapProbeValue|null|Promise<MapProbeValue|null>;
 format:(value:MapProbeValue|null)=>string;
};
export type MapProbeRow=Omit<MapProbeSource,'sample'>&{
 id:symbol;value:MapProbeValue|null;pending:boolean;
};
export type MapProbePoint={
 latitude:number;longitude:number;revision:number;rows:MapProbeRow[];
};
export type MapProbeSnapshot={owner:boolean;point:MapProbePoint|null};
export type MapProbeMember={
 id:symbol;read:()=>MapProbeSource;notify:(state:MapProbeSnapshot)=>void;
};

/** No browser or map API dependency: all concurrency cases can be unit-tested. */
export class MapProbeGroup{
 private members:MapProbeMember[]=[];
 private point:MapProbePoint|null=null;
 private pending:AbortController|null=null;
 private revision=0;
 get size(){return this.members.length;}
 private emit(){
  for(const member of this.members)
   member.notify({owner:this.members[0]===member,point:this.point});
 }
 add(member:MapProbeMember){
  if(this.members.some(existing=>existing.id===member.id))throw new Error('Duplicate map probe');
  this.close();
  this.members.push(member);
  this.emit();
 }
 remove(id:symbol){
  if(!this.members.some(member=>member.id===id))return;
  this.close();
  this.members=this.members.filter(member=>member.id!==id);
  this.emit();
 }
 close(){
  this.pending?.abort();
  this.pending=null;
  if(this.point!==null){this.point=null;this.emit();}
 }
 private settle(revision:number,id:symbol,result:MapProbeValue|null,controller:AbortController){
  if(controller.signal.aborted||this.point?.revision!==revision)return;
  // Missing, invalid and genuine meteorological zero must remain distinct.
  const value=typeof result==='number'&&!Number.isFinite(result)?null:result;
  this.point={...this.point,rows:this.point.rows.map(row=>
   row.id===id?{...row,value,pending:false}:row)};
  this.emit();
 }
 show(latitude:number,longitude:number){
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!this.members.length)return;
  this.pending?.abort();
  const controller=new AbortController();
  this.pending=controller;
  const sources=this.members.map(member=>({id:member.id,spec:member.read()}));
  const revision=++this.revision;
  this.point={latitude,longitude,revision,rows:sources.map(({id,spec})=>({
   id,label:spec.label,unit:spec.unit,source:spec.source,
   unavailableNote:spec.unavailableNote,format:spec.format,
   value:null,pending:true,
  }))};
  this.emit();
  for(const {id,spec} of sources){
   try{
    const result=spec.sample(latitude,longitude,controller.signal);
    if(result!==null&&typeof result==='object'&&'then' in result)
     void Promise.resolve(result).then(value=>this.settle(revision,id,value,controller))
      .catch(()=>this.settle(revision,id,null,controller));
    else this.settle(revision,id,result as MapProbeValue|null,controller);
   }catch{this.settle(revision,id,null,controller);}
  }
 }
}
