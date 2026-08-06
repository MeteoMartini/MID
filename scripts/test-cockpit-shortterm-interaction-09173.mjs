import {readFile} from 'node:fs/promises';

const [cockpit,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const reject=(label,text,token)=>{if(text.includes(token))failures.push(`${label} sollte fehlen: ${token}`)};

for(const token of [
  "[selectedId,setSelectedId]=useState('')",
  'meteogramId=useId().replace(/:/g,\'\')',
  'className="cockpit-meteogram-pro__canvas"',
  'className="cockpit-meteogram-pro__hitlayer"',
  'onClick={()=>activatePoint(item.point)}',
  'temperatureGradientId=`mid-meteogram-temp-${meteogramId}`',
  'stopColor={ecmwfTemperatureLineColor(item.point.temperature)}',
  'stroke={`url(#${temperatureGradientId})`}',
  'className="cockpit-meteogram-pro__overlay wind"',
  'selectedVisualPoint?.point.id===item.point.id?\'active\':\'\''
])need('Kurzfrist-Interaktion',cockpit,token);

for(const token of [
  '.cockpit-meteogram-pro__hitlayer{position:absolute;inset:0;',
  '.cockpit-meteogram-pro__hitlayer button.active{',
  '.cockpit-meteogram-pro__svg .temperature-line{',
  '.cockpit-meteogram-pro__svg .apparent-line{',
  '.cockpit-meteogram-pro__stage{width:100%;max-width:100%;overflow:hidden;'
])need('Kurzfrist-CSS',styles,token);

reject('Alte Kurzfristmatrix',cockpit,'className="cockpit-short-matrix-shell"');
reject('Altes Diagramm-Markup',cockpit,'cockpit-short-diagram-column');
need('Einzeldatenfeld',cockpit,'className="cockpit-meteogram-pro__datafield"');
reject('Entferntes Detail-Overlay',cockpit,'selectedTooltip');
reject('Entfernter 1h/3h-Schalter',cockpit,'aria-label="Auflösung der Kurzfristvorhersage"');
reject('Umgebungsabhängiger TypeScript-Pfad',await readFile(new URL('./test-shortterm-nullish-precedence-buildfix-09176.mjs',import.meta.url),'utf8'),'/opt/nvm/versions/node/');
need('Package-Test',pkg,'test:cockpit-shortterm-interaction');
need('Baseline-Test',baseline,'scripts/test-cockpit-shortterm-interaction-09173.mjs');
need('Version',pkg,'"version": "0.9.18.6"');
need('Version',baseline,'"releaseVersion": "0.9.18.6"');
if(failures.length){console.error('Interaktive Kurzfristdiagrammansicht fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Interaktives, vollständig sichtbares Kurzfrist-Meteogramm mit wiederhergestelltem Einzeldatenfeld geprüft.');
