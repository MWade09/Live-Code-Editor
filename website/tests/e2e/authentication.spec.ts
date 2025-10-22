import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Check page title
    await expect(page.locator('h1, h2')).toContainText(/login|sign in/i)
    
    // Check form fields
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Check submit button
    await expect(page.getByRole('button', { name: /login|sign in/i })).toBeVisible()
  })

  test('should display register page', async ({ page }) => {
    await page.goto('/auth/register')
    
    // Check page title
    await expect(page.locator('h1, h2')).toContainText(/register|sign up/i)
    
    // Check form fields
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Check submit button
    await expect(page.getByRole('button', { name: /register|sign up/i })).toBeVisible()
  })

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Enter invalid email
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).fill('password123')
    
    // Try to submit
    await page.getByRole('button', { name: /login|sign in/i }).click()
    
    // Should show error (implementation may vary)
    // This is a placeholder - adjust based on actual error handling
    await expect(page.locator('text=/invalid|error/i')).toBeVisible()
  })
})
