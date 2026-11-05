export type NativeIconCopy={readonly web:string;readonly native:string};
export type OmittedNativeIconCopy={file:string;bytes:number;sha256:string};
export const NATIVE_ICON_COPIES:readonly NativeIconCopy[];
export function omitNativeOnlyAppIconCopies(sourceRoot:string,outputDirectory:string):Promise<OmittedNativeIconCopy[]>;
