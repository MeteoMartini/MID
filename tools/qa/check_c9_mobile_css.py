import sys,re
# Requires tinycss2 and cssselect2; run after npm run build.
# This is a cascade check, not a browser rendering or interaction test.
import tinycss2,cssselect2
from lxml import etree
from pathlib import Path
repo=Path(__file__).resolve().parents[2]
# Use the exact newly built CSS named by the build HTML.
html=(repo/'dist/index.html').read_text()
css=repo/'dist'/re.search(r'href="[./]*(assets/index-[^"]+\.css)"',html)[1]
root=etree.fromstring('''<html data-mid-design="next"><body><div class="app navigation-bottom-tabs with-section-navigation"><header class="top settings-header"><nav class="favorite-strip header-favorites"><div class="favorite-bubbles"><button id="fav" class="active"><span class="favorite-quick-grip"/><svg/><span>Rheidt</span><small>Mondorf</small><b id="standard">Standard</b></button></div></nav></header><main><section class="hero current-compact"><div class="current-weather-overview"><div class="current-weather-facts"><span id="precip" class="precip"/><span id="wind" class="wind"/><span id="humidity" class="humidity"/><span id="visibility" class="visibility"/><span id="pressure" class="pressure"/></div></div></section><div id="timeline" class="cockpit-now90-grid"/></main></div></body></html>''')
wrappers=list(cssselect2.ElementWrapper.from_html_root(root).iter_subtree())
parsed=tinycss2.parse_stylesheet(css.read_text(),skip_whitespace=True,skip_comments=True)
def applies(query,w,h):
 for part in query.split(','):
  if 'print' in part or 'prefers-reduced-motion:reduce' in part or 'forced-colors:active' in part:continue
  ok=True
  for bound,axis,val in re.findall(r'(min|max)-(width|height)\s*:\s*([\d.]+)px',part):
   n=w if axis=='width' else h
   if (bound=='min' and n<float(val)) or (bound=='max' and n>float(val)):ok=False
  if 'orientation:landscape' in part and w<=h:ok=False
  if 'orientation:portrait' in part and w>h:ok=False
  if ok:return True
 return False
def rules(nodes,w,h):
 for n in nodes:
  if n.type=='qualified-rule':yield n
  elif n.type=='at-rule' and n.content is not None:
   q=tinycss2.serialize(n.prelude).replace(' ','')
   if n.lower_at_keyword=='media' and not applies(q,w,h):continue
   if n.lower_at_keyword in ['media','supports','layer']:yield from rules(tinycss2.parse_rule_list(n.content,skip_whitespace=True,skip_comments=True),w,h)
for w,h in [(320,568),(390,844),(430,932),(844,390),(932,430),(768,1024),(834,1194),(1024,768),(1194,834),(1366,1024),(1440,900),(1920,1080)]:
 matcher=cssselect2.Matcher()
 for r in rules(parsed,w,h):
  declarations=[d for d in tinycss2.parse_declaration_list(r.content,skip_whitespace=True,skip_comments=True) if d.type=='declaration']
  try:
   for selector in cssselect2.compile_selector_list(r.prelude):matcher.add_selector(selector,declarations)
  except cssselect2.SelectorError:pass
 resolved={}
 for e in wrappers:
  id=e.etree_element.get('id')
  if not id:continue
  props={};pseudo={}
  for specificity,order,pseudo_element,ds in matcher.match(e):
   target=pseudo if pseudo_element=='after' else props
   if pseudo_element and pseudo_element!='after':continue
   for d in ds:
    rank=(bool(d.important),specificity,order)
    names=[d.name]+(['grid-column','grid-row'] if d.name=='grid-area' and tinycss2.serialize(d.value)=='auto' else [])
    for name in names:
     if name not in target or rank>=target[name][0]:target[name]=(rank,tinycss2.serialize(d.value))
  resolved[id]={k:v[1] for k,v in props.items()}
  if id=='standard':assert pseudo.get('content',(None,''))[1]=='none',(w,'duplicate badge',pseudo)
 for name in ['precip','wind','humidity','pressure']:assert resolved[name]['grid-column']=='auto',(w,name,resolved[name])
 assert resolved['visibility']['display']=='none'
 assert resolved['timeline']['grid-auto-flow']=='column'
 assert resolved['timeline']['grid-template-columns']=='none'
 assert resolved['fav']['display']=='flex'
 assert resolved['standard']['font-size']=='9px'
 print(f'{w}x{h}: resolved production CSS passes spans, hidden cell, one-row timeline, flex favorites, single badge')
