import re
from pathlib import Path

import cssselect2
import tinycss2
from lxml import etree

repo=Path(__file__).resolve().parents[2]
html=(repo/'dist/index.html').read_text()
css_path=repo/'dist'/re.search(r'href="[./]*(assets/index-[^"]+\.css)"',html)[1]
parsed=tinycss2.parse_stylesheet(css_path.read_text(),skip_whitespace=True,skip_comments=True)
root=etree.fromstring('''<html data-mid-design="next"><body>
<section class="cockpit-seven-grid" id="seven"><button id="day" class="cockpit-day active"/><div id="accordion" class="cockpit-day-hourly-accordion"/></section>
<section class="ensemble-presentation-cockpit"><nav id="metrics" class="ensemble-metric-deck"><button id="metric" class="active"><b/><small/><i class="ensemble-metric-mini"/></button></nav></section>
<div class="ensemble-mobile-tooltip-layer"><div id="tooltip" class="ensemble-pro-tooltip compact-trend-tooltip"><div id="matrix" class="trend-tooltip-matrix"/></div></div>
<div class="composite-layer-toolbar"><div id="layers" class="composite-layer-switches"><button id="layer" class="composite-switch compact"><small/></button></div></div>
<div id="map" class="composite-focus-mode"><div class="composite-maplibre"/></div>
</body></html>''')
wrappers=list(cssselect2.ElementWrapper.from_html_root(root).iter_subtree())

def applies(query,width,height):
 for part in query.split(','):
  if 'print' in part or 'prefers-reduced-motion:reduce' in part or 'any-pointer:coarse' in part:
   continue
  ok=True
  for bound,axis,value in re.findall(r'(min|max)-(width|height)\s*:\s*([\d.]+)px',part):
   actual=width if axis=='width' else height
   if (bound=='min' and actual<float(value)) or (bound=='max' and actual>float(value)):ok=False
  if 'orientation:landscape' in part and width<=height:ok=False
  if 'orientation:portrait' in part and width>height:ok=False
  if ok:return True
 return False

def rules(nodes,width,height):
 for node in nodes:
  if node.type=='qualified-rule':yield node
  elif node.type=='at-rule' and node.content is not None:
   query=tinycss2.serialize(node.prelude).replace(' ','')
   if node.lower_at_keyword=='media' and not applies(query,width,height):continue
   if node.lower_at_keyword in {'media','supports','layer'}:
    yield from rules(tinycss2.parse_rule_list(node.content,skip_whitespace=True,skip_comments=True),width,height)

def resolve(width,height):
 matcher=cssselect2.Matcher()
 for rule in rules(parsed,width,height):
  declarations=[item for item in tinycss2.parse_declaration_list(rule.content,skip_whitespace=True,skip_comments=True) if item.type=='declaration']
  try:
   for selector in cssselect2.compile_selector_list(rule.prelude):matcher.add_selector(selector,declarations)
  except cssselect2.SelectorError:pass
 result={}
 for element in wrappers:
  identifier=element.etree_element.get('id')
  if not identifier:continue
  properties={}
  for specificity,order,pseudo,declarations in matcher.match(element):
   if pseudo:continue
   for declaration in declarations:
    rank=(bool(declaration.important),specificity,order)
    if declaration.name not in properties or rank>=properties[declaration.name][0]:
     properties[declaration.name]=(rank,tinycss2.serialize(declaration.value))
  result[identifier]={name:value[1] for name,value in properties.items()}
 return result

portrait=resolve(320,568)
assert portrait['seven'].get('overflow')=='auto visible' or portrait['seven'].get('overflow-x')=='auto'
assert portrait['seven']['grid-template-columns']=='repeat(var(--cockpit-day-count),minmax(106px,1fr))'
assert portrait['day']['min-width']=='106px'
assert portrait['day'].get('grid-area')=='auto' or portrait['day'].get('grid-column')=='auto'
assert portrait['accordion']['position']=='sticky' and portrait['accordion']['left']=='0'
assert portrait['metrics']['gap']=='0' and portrait['metric']['border-radius']=='0'
assert portrait['tooltip']['font-size']=='10px' and portrait['matrix']['font-size']=='9px'
assert portrait['layers']['grid-auto-flow']=='column' and portrait['layer']['min-width']=='116px'

landscape=resolve(844,390)
map_child=next(item for item in wrappers if item.etree_element.get('class')=='composite-maplibre')
matcher=cssselect2.Matcher()
for rule in rules(parsed,844,390):
 declarations=[item for item in tinycss2.parse_declaration_list(rule.content,skip_whitespace=True,skip_comments=True) if item.type=='declaration']
 try:
  for selector in cssselect2.compile_selector_list(rule.prelude):matcher.add_selector(selector,declarations)
 except cssselect2.SelectorError:pass
height=[]
for specificity,order,pseudo,declarations in matcher.match(map_child):
 if pseudo:continue
 for declaration in declarations:
  if declaration.name in {'height','min-height','max-height'}:height.append((declaration.name,bool(declaration.important),specificity,order,tinycss2.serialize(declaration.value)))
resolved_height={}
for name,important,specificity,order,value in height:
 rank=(important,specificity,order)
 if name not in resolved_height or rank>=resolved_height[name][0]:resolved_height[name]=(rank,value)
assert resolved_height['height'][1].startswith('calc(100dvh')
assert resolved_height['min-height'][1]=='250px' and resolved_height['max-height'][1]=='520px'

print('MID-C9 v0.9.85.40: production CSS keeps 7-day, ensemble and map workspaces compact across phone portrait and landscape.')
