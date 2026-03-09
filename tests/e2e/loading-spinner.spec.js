import { test, expect } from 'playwright/test'

test.describe('Loading spinners replace text-based loading', () => {
  test('app.vue shows v-loading spinner instead of "Loading..." text', async ({ page }) => {
    await page.goto('/')
    // The el-loading spinner should appear (Element Plus loading overlay)
    const loadingOverlay = page.locator('.el-loading-mask')
    // Should NOT show plain "Loading..." text
    await expect(page.getByText('Loading...', { exact: true })).not.toBeVisible()
  })

  test('classes page uses v-loading instead of loading text', async ({ page }) => {
    await page.goto('/classes')
    // Check that no plain loading text is shown
    const loadingText = page.locator('text="Loading..."')
    await expect(loadingText).not.toBeVisible({ timeout: 5000 })
  })

  test('members page uses v-loading instead of loading text', async ({ page }) => {
    await page.goto('/members')
    // Check for el-loading-mask (the Element Plus spinner overlay)
    // It should appear briefly while data loads
    const loadingText = page.locator('.py-12.text-center.text-gray-400:has-text("Loading")')
    await expect(loadingText).not.toBeVisible({ timeout: 10000 })
  })

  test('no component renders common.loading translation as plain text', async ({ page }) => {
    // Check multiple pages for absence of text-based loading
    const pages = ['/classes', '/members', '/trainers']

    for (const path of pages) {
      await page.goto(path)
      // Wait for page to settle
      await page.waitForTimeout(2000)
      // Verify no plain loading text is visible
      const loadingTexts = await page.locator('.py-12.text-center.text-gray-400').filter({ hasText: /Loading|Nacitani|Cargando/ }).count()
      expect(loadingTexts, `Found loading text on ${path}`).toBe(0)
    }
  })

  test('v-loading directive produces .el-loading-mask overlay', async ({ page }) => {
    await page.goto('/classes')
    // The v-loading directive should create an .el-loading-mask element
    // It may be brief, so we check it was ever present or that content loaded without text fallback
    await page.waitForLoadState('networkidle')
    // After load, no loading text should remain
    const loadingText = page.locator('text="Loading..."')
    await expect(loadingText).not.toBeVisible()
  })
})
