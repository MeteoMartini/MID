declare module 'pako'{
 export class Inflate{
  constructor(options?:{chunkSize?:number});
  err:number;msg:string;ended:boolean;
  onData:(chunk:Uint8Array)=>void;
  push(data:Uint8Array,final?:boolean):boolean;
 }
}
