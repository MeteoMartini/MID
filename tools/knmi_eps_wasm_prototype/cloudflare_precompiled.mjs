/**
 * Cloudflare-Module prototype adapter.
 * The .wasm file must be imported by the future Worker bundler as a precompiled
 * WebAssembly.Module. No fetch/ArrayBuffer compilation is performed here.
 */
export async function createEccodesFromPrecompiledModule(createEccodes,wasmModule){
 if(typeof createEccodes!=='function')throw new TypeError('Emscripten module factory fehlt.');
 if(!(wasmModule instanceof WebAssembly.Module))throw new TypeError('Ein vorcompiliertes WebAssembly.Module ist erforderlich.');
 return createEccodes({
  noInitialRun:true,
  instantiateWasm(imports,receiveInstance){
   const instance=new WebAssembly.Instance(wasmModule,imports);
   receiveInstance(instance,wasmModule);
   return instance.exports;
  }
 });
}
