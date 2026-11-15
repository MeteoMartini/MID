import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe,it,expect} from 'vitest';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=(path:string)=>readFileSync(resolve(root,path),'utf8');
const app=read('src/App.tsx');
const vite=read('vite.config.ts');
const panel=read('src/VentilationAssistantPanel.tsx');

describe('MID ventilation assistant – conservative deferred-UI contract',()=>{
 it('does not eagerly import the optional panel into the application entry',()=>{
  expect(app).not.toMatch(/^\s*import\s+\{[^}]*VentilationAssistantPanel[^}]*}\s+from\s+['"]\.\/VentilationAssistantPanel['"]/m);
  expect(app).toContain("const LazyVentilationAssistantPanel=lazy(()=>import('./VentilationAssistantPanel').then(module=>({default:module.VentilationAssistantPanel})))");
  expect((app.match(/<LazyVentilationAssistantPanel\/>/g)||[]).length).toBe(1);
 });
 it('does not mount the panel before its own existing CollapsibleModule opens',()=>{
  const start=app.indexOf("case'ventilation':return <CollapsibleModule");
  const end=app.indexOf("case'mountain':",start);
  expect(start).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(start);
  const section=app.slice(start,end);
  expect(section).toContain('id="ventilation"');
  expect(section).toContain('defaultOpen={false}');
  expect(section).toContain('<Suspense fallback=');
  expect(section).toContain('role="status"');
  expect(section).toContain('aria-live="polite"');
  expect(section).toContain('<LazyVentilationAssistantPanel/>');
  const collapse=app.slice(app.indexOf('function CollapsibleModule('),app.indexOf('function ModernPlannerHub('));
  expect(collapse).toContain("expanded&&<div className=\"module-shell-content\">{children}</div>");
 });
 it('preserves the established offline-shell caching for the new optional chunk',()=>{
  expect(vite).toContain("chunk.facadeModuleId?.endsWith('/src/VentilationAssistantPanel.tsx')");
  expect(vite).toContain("if(!ventilationRoot)throw new Error('Missing deferred ventilation assistant controls')");
  expect(vite).toContain('visit(ventilationRoot.fileName)');
  expect(vite).toContain("rel:'mid-offline'");
  expect(vite).toContain('if(!systemRoot)throw');
  expect(vite).toContain('visit(systemRoot.fileName)');
 });
 it('keeps existing ventilation sensor logic and subscriptions in its original panel',()=>{
  expect(panel).toContain('export function VentilationAssistantPanel()');
  expect(panel).toContain('fetchVentilationAdvice(settings)');
  expect(panel).toContain("window.addEventListener('mid:ventilation-settings',update)");
  expect(panel).toContain("window.clearInterval(timer)");
  expect(app).toContain("import {readVentilationAssistantSettings,ventilationPushConfig,type VentilationAssistantSettings} from './ventilationAssistant';");
 });
});
