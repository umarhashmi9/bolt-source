import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Verify that the page title is correct
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Example: Check if main content area exists
    const mainContent = await page.locator('main').first();
    await expect(mainContent).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Example: Test navigation elements
    const navLinks = await page.locator('nav a');
    expect(await navLinks.count()).toBeGreaterThan(0);
  });
}); 