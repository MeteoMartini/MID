/** A failed image/font must never produce a successful automated export. */
export async function waitForWidgetPaint(node: HTMLElement): Promise<void> {
 await document.fonts?.ready;
 if(document.fonts&&Array.from(document.fonts).some(font=>font.status==='error'))throw new Error('Widget-Schrift konnte nicht geladen werden.');
 await Promise.all(Array.from(node.querySelectorAll('img')).map(async image=>{
  if(!image.complete)await image.decode();
  if(!image.complete||image.naturalWidth===0)throw new Error('Widget-Bild konnte nicht geladen werden.');
 }));
 await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 const bounds=node.getBoundingClientRect();
 if(!node.isConnected||bounds.width<100||bounds.height<100)throw new Error('Widget ist nicht sichtbar oder vollständig aufgebaut.');
}
