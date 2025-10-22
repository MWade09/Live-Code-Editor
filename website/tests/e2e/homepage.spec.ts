import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/')
    
    // Check page title
    await expect(page).toHaveTitle(/Live Code Editor/i)
    
    // Check hero section is visible
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')
    
    // Check navigation menu
    await expect(page.locator('nav')).toBeVisible()
    
    // Check key links
    await expect(page.getByRole('link', { name: /try editor/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /about/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /features/i })).toBeVisible()
  })

  test('should navigate to editor', async ({ page }) => {
    await page.goto('/')
    
    // Click Try Editor link
    await page.getByRole('link', { name: /try editor/i }).first().click()
    
    // Wait for editor to load
    await page.waitForURL(/\/editor/)
    
    // Verify we're on editor page
    expect(page.url()).toContain('/editor')
  })
})
