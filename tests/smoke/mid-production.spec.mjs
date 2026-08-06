import {test,expect} from '@playwright/test';
test('MID production shell and core cockpit load',async({page})=>{await page.goto('/');await expect(page).toHaveTitle(/Meteorological Information Dashboard/i);await expect(page.locator('#root')).toBeVisible();await expect(page.locator('body')).not.toContainText('Daten werden geladen…',{timeout:30000});});
