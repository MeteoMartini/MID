import './changelogOverlay.css';

let activeDialog: HTMLDialogElement | null = null;

/** Interpret only bold as safe DOM; never execute downloaded Markdown as HTML. */
function appendInline(target: HTMLElement, raw: string): void {
 const bold=/\*\*([^*]+)\*\*/g;
 let offset=0, match:RegExpExecArray|null;
 while((match=bold.exec(raw))!==null){
  if(match.index>offset)target.append(document.createTextNode(raw.slice(offset,match.index)));
  const element=document.createElement('strong');
  element.textContent=match[1];
  target.append(element);
  offset=bold.lastIndex;
 }
 if(offset<raw.length)target.append(document.createTextNode(raw.slice(offset)));
}

/** Incremental rendering avoids creating thousands of historical DOM nodes on iPhone. */
function installMarkdownRenderer(article: HTMLElement, loadOlder: HTMLButtonElement, markdown: string): void {
 const lines=markdown.replace(/\r\n?/g,'\n').split('\n');
 let index=0;
 const appendNext=()=>{
  const fragment=document.createDocumentFragment();
  let list:HTMLUListElement|null=null,processed=0;
  while(index<lines.length&&processed<160){
   const line=lines[index++].trimEnd();
   processed++;
   const trimmed=line.trim();
   if(!trimmed){list=null;continue}
   const heading=/^#{1,4}\s+(.+)$/.exec(trimmed);
   if(heading){
    list=null;
    const level=(trimmed.match(/^#+/)?.[0].length??1);
    const element=document.createElement(level===1?'h2':level===2?'h3':'h4');
    appendInline(element,heading[1]);fragment.append(element);continue;
   }
   if(/^\x60{3}/.test(trimmed)){
    list=null;const code:string[]=[];
    while(index<lines.length&&!/^\x60{3}/.test(lines[index].trim())&&code.length<800){code.push(lines[index++]);}
    if(index<lines.length&&/^\x60{3}/.test(lines[index].trim()))index++;
    const pre=document.createElement('pre');pre.textContent=code.join('\n');fragment.append(pre);continue;
   }
   if(/^[-*_]{3,}$/.test(trimmed)){list=null;fragment.append(document.createElement('hr'));continue}
   const bullet=/^\s*[-*]\s+(.+)$/.exec(line);
   if(bullet){
    if(!list){list=document.createElement('ul');fragment.append(list)}
    const item=document.createElement('li');appendInline(item,bullet[1]);list.append(item);continue;
   }
   list=null;
   const paragraph=document.createElement(trimmed.startsWith('> ')?'blockquote':'p');
   appendInline(paragraph,trimmed.startsWith('> ')?trimmed.slice(2):trimmed);
   fragment.append(paragraph);
  }
  article.append(fragment);
  loadOlder.hidden=index>=lines.length;
 };
 loadOlder.addEventListener('click',appendNext);
 appendNext();
}

/** Same-document modal: the current MID screen, scroll state and favorites remain mounted. */
export function openMidChangelog(url: string): void {
 if(activeDialog?.isConnected){activeDialog.querySelector<HTMLButtonElement>('[data-mid-changelog-close]')?.focus();return}
 const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
 const dialog=document.createElement('dialog');
 dialog.className='mid-changelog-dialog';
 dialog.setAttribute('aria-labelledby','mid-changelog-title');
 dialog.innerHTML=[
  '<header class="mid-changelog-header"><div><small>MID Wetter</small>',
  '<h1 id="mid-changelog-title">Änderungen &amp; Verbesserungen</h1></div>',
  '<button type="button" data-mid-changelog-close>Zurück zu MID</button></header>',
  '<div class="mid-changelog-scroll">',
  '<p role="status" class="mid-changelog-loading">Änderungen werden geladen …</p>',
  '<article class="mid-changelog-entries" aria-label="Veröffentlichte Änderungen"></article>',
  '<div class="mid-changelog-more"><button type="button" data-mid-changelog-more hidden>Ältere Änderungen laden</button></div>',
  '</div>'
 ].join('');
 const returnButton=dialog.querySelector<HTMLButtonElement>('[data-mid-changelog-close]')!;
 const moreButton=dialog.querySelector<HTMLButtonElement>('[data-mid-changelog-more]')!;
 const status=dialog.querySelector<HTMLParagraphElement>('.mid-changelog-loading')!;
 const article=dialog.querySelector<HTMLElement>('.mid-changelog-entries')!;
 const controller=new AbortController();
 const oldOverflow=document.body.style.overflow;
 const close=()=>{if(dialog.open)dialog.close()};
 returnButton.addEventListener('click',close);
 dialog.addEventListener('click',event=>{if(event.target===dialog)close()});
 dialog.addEventListener('close',()=>{
  controller.abort();
  document.body.style.overflow=oldOverflow;
  dialog.remove();
  activeDialog=null;
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
 },{once:true});
 document.body.append(dialog);
 activeDialog=dialog;
 document.body.style.overflow='hidden';
 try{dialog.showModal()}catch{
  document.body.style.overflow=oldOverflow;
  dialog.remove();
  activeDialog=null;
  throw new Error('Der Changelog-Dialog konnte nicht geöffnet werden.');
 }
 returnButton.focus({preventScroll:true});
 void (async()=>{
  try{
   const response=await fetch(url,{signal:controller.signal,cache:'no-store'});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const markdown=await response.text();
   if(!/^#\s+MID\s+v\d/i.test(markdown.trimStart().slice(0,160)))throw new Error('Unerwartetes Changelog-Format');
   if(controller.signal.aborted)return;
   status.remove();
   installMarkdownRenderer(article,moreButton,markdown);
  }catch{
   if(controller.signal.aborted)return;
   status.textContent='Der Changelog ist momentan nicht verfügbar. Über „Zurück zu MID“ gelangst du direkt zur App.';
  }
 })();
}
