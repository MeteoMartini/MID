// Never send fixture/code/file data to an endpoint supplied by remote metadata.
export function localCdpEndpoint(value,port){
 const endpoint=new URL(value);
 if(!Number.isInteger(port)||port<1||port>65535||endpoint.protocol!=='ws:'||endpoint.hostname!=='127.0.0.1'||endpoint.port!==String(port)||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||!/^\/devtools\/browser\/[a-f0-9-]+$/.test(endpoint.pathname))throw new Error('CDP endpoint must be the launched loopback browser.');
 return `ws://127.0.0.1:${port}${endpoint.pathname}`;
}
