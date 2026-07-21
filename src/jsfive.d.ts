declare module 'jsfive' {
  export class File {
    constructor(buffer:ArrayBuffer, filename?:string);
    get(path:string):{value?:ArrayLike<number>|unknown;shape?:number[];attrs?:Record<string,unknown>;keys?:string[]};
    keys?:string[];
  }
}
