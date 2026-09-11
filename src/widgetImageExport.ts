/**
 * Freezes SVG paint values to the browser-resolved values for the duration of
 * a raster export. html-to-image clones SVG DOM and can otherwise preserve
 * custom-property based paint declarations (for example fill="var(--mg-night)")
 * into the serialized image. Some rasterizers resolve those declarations as
 * the SVG initial paint (black). The live DOM is restored byte-for-byte after
 * the export finishes.
 */
const SVG_EXPORT_PAINT_PROPERTIES=[
 'color',
 'fill',
 'fill-opacity',
 'stroke',
 'stroke-opacity',
 'stroke-width',
 'stop-color',
 'stop-opacity',
 'flood-color',
 'flood-opacity',
] as const;

export function freezeWidgetSvgPaintsForExport(root:HTMLElement):()=>void{
 const nodes=Array.from(root.querySelectorAll<SVGElement>('svg, svg *'));
 const snapshots=nodes.map(node=>({node,style:node.getAttribute('style')}));
 for(const node of nodes){
  const computed=getComputedStyle(node);
  for(const property of SVG_EXPORT_PAINT_PROPERTIES){
   const value=computed.getPropertyValue(property).trim();
   if(!value||value.includes('var('))continue;
   node.style.setProperty(property,value,'important');
  }
 }
 return()=>{
  for(const{node,style}of snapshots){
   if(style===null)node.removeAttribute('style');
   else node.setAttribute('style',style);
  }
 };
}
