// Optional WCAG 2.2 AA pilot on the published MID site, never a source/release approval.
// Intentionally skipped by the existing mandatory smoke matrix until the isolated P1 step
// installs @axe-core/playwright and sets MID_AXE_P1_PILOT=1.
import {test,expect} from '@playwright/test';

test('MID P1 accessible current page · automated WCAG audit',async({page},testInfo)=>{
 test.skip(process.env.MID_AXE_P1_PILOT!=='1','Separate optional P1 accessibility scan');
 const {default:AxeBuilder}=await import('@axe-core/playwright');
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('body')).toBeVisible();
 const root=page.locator('.current-surroundings');
 const aroundVisible=await root.isVisible().catch(()=>false);
 const result=await new AxeBuilder({page})
  .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'])
  .analyze();
 const findings=result.violations.map(item=>({
  id:item.id,impact:item.impact,description:item.description,nodeCount:item.nodes.length
 }));
 await testInfo.attach('mid-p1-axe-automated-results',{
  body:Buffer.from(JSON.stringify({schema:1,viewport:testInfo.project.name,aroundVisible,checkedUrl:page.url(),violations:findings},null,2)),
  contentType:'application/json'
 });
 console.log('MID P1 axe scan · '+testInfo.project.name+' · Umfeld mounted '+aroundVisible+' · findings '+findings.length);
 // Automated checks are not a manual VoiceOver/iOS or complete WCAG 2.2 AA acceptance.
 expect(findings.filter(item=>item.impact==='critical'||item.impact==='serious')).toEqual([]);
});
