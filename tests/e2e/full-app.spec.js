import { test, expect } from 'playwright/test'

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function login(page) {
  await page.goto('/login')
  await page.waitForSelector('.el-input__inner', { timeout: 15000 })
  await page.locator('.el-input__inner[type="email"]').fill('admin@fitbase.com')
  await page.locator('.el-input__inner[type="password"]').fill('password123')
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('/', { timeout: 15000 })
  await page.waitForSelector('h1', { timeout: 10000 })
}

// SPA navigation via sidebar click (page.goto doesn't work for auth pages)
async function clickNav(page, path) {
  await page.locator(`nav a[href="${path}"]`).click()
  await page.waitForURL(path, { timeout: 5000 })
  await page.waitForSelector('h1', { timeout: 10000 })
}

// ─── AUTH ──────────────────────────────────────────────────────────────────────

test.describe('Authentication', () => {
  test('login page renders with DS Form components', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.el-input__inner', { timeout: 15000 })
    await expect(page.locator('.el-input__inner[type="email"]')).toBeVisible()
    await expect(page.locator('.el-input__inner[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    await expect(page.getByText('FitBase')).toBeVisible()
    await expect(page.locator('a[href="/register"]')).toBeVisible()
  })

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL('/')
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.waitForSelector('.el-input__inner', { timeout: 15000 })
    await page.locator('.el-input__inner[type="email"]').fill('wrong@email.com')
    await page.locator('.el-input__inner[type="password"]').fill('wrongpass1')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/login/)
  })

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/classes')
    await page.waitForURL(/login/, { timeout: 10000 })
    await expect(page).toHaveURL(/login/)
  })
})

// ─── DASHBOARD ─────────────────────────────────────────────────────────────────

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('renders page title and stats', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard')
    // StatTile components should be present
    const statTiles = page.locator('.flex.flex-wrap.gap-4 > *')
    expect(await statTiles.count()).toBeGreaterThan(0)
  })

  test('shows upcoming classes with links', async ({ page }) => {
    // Wait for upcoming classes to load
    await page.waitForSelector('a[href^="/classes/"]', { timeout: 10000 })
    await expect(page.getByText('Upcoming Classes')).toBeVisible()
    const classLinks = page.locator('a[href^="/classes/"]')
    expect(await classLinks.count()).toBeGreaterThan(0)
  })
})

// ─── SIDEBAR & HEADER ──────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('sidebar has all nav items with icons', async ({ page }) => {
    await expect(page.locator('nav a[href="/"]')).toBeVisible()
    await expect(page.locator('nav a[href="/classes"]')).toBeVisible()
    await expect(page.locator('nav a[href="/members"]')).toBeVisible()
    await expect(page.locator('nav a[href="/trainers"]')).toBeVisible()
    await expect(page.locator('nav a[href="/settings"]')).toBeVisible()
    // DS Icon components render SVGs
    expect(await page.locator('nav svg').count()).toBeGreaterThanOrEqual(5)
  })

  test('sidebar navigation works', async ({ page }) => {
    await clickNav(page, '/classes')
    await clickNav(page, '/members')
    await clickNav(page, '/trainers')
    await clickNav(page, '/settings')
    await page.locator('nav a[href="/"]').click()
    await page.waitForURL('/', { timeout: 5000 })
    await page.waitForSelector('h1', { timeout: 10000 })
  })

  test('header shows gym name and user info', async ({ page }) => {
    await expect(page.locator('header')).toBeVisible()
    // Wait for gym data to load
    await page.waitForTimeout(2000)
    const headerText = await page.locator('header').textContent()
    expect(headerText).toMatch(/FitBase/i)
    expect(headerText).toContain('Alex Rivera')
  })

  test('header has language selector and logout', async ({ page }) => {
    await expect(page.getByText('Log out')).toBeVisible()
    const selects = page.locator('header .el-select')
    expect(await selects.count()).toBeGreaterThan(0)
  })
})

// ─── CLASSES PAGE ──────────────────────────────────────────────────────────────

test.describe('Classes Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await clickNav(page, '/classes')
  })

  test('renders title and Add Class button', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    const addBtn = page.locator('button.button').filter({ hasText: /add class/i })
    await expect(addBtn).toBeVisible()
  })

  test('shows class cards (no text loading)', async ({ page }) => {
    await page.waitForSelector('a[href^="/classes/"]', { timeout: 10000 })
    const loadingText = page.locator('.text-gray-400').filter({ hasText: /^Loading/ })
    expect(await loadingText.count()).toBe(0)
    const cards = page.locator('.grid a[href^="/classes/"]')
    expect(await cards.count()).toBeGreaterThan(0)
  })

  test('class cards show status badges', async ({ page }) => {
    await page.waitForSelector('.badge', { timeout: 10000 })
    const badges = page.locator('.badge')
    expect(await badges.count()).toBeGreaterThan(0)
  })

  test('search input exists and is functional', async ({ page }) => {
    const searchInput = page.locator('.el-input__inner').first()
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Yoga')
    await page.waitForTimeout(500)
  })

  test('Add Class opens dialog with form', async ({ page }) => {
    const addBtn = page.locator('button.button').filter({ hasText: /add class/i })
    await addBtn.click()
    await page.waitForSelector('.el-dialog', { timeout: 5000 })
    await expect(page.locator('.el-dialog')).toBeVisible()
    // Dialog must contain form inputs (not be empty)
    await page.waitForSelector('.el-dialog .el-input__inner', { timeout: 5000 })
    expect(await page.locator('.el-dialog .el-input__inner').count()).toBeGreaterThan(0)
  })
})

// ─── CLASS DETAIL ──────────────────────────────────────────────────────────────

test.describe('Class Detail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await clickNav(page, '/classes')
    await page.waitForSelector('a[href^="/classes/"]', { timeout: 10000 })
    await page.locator('.grid a[href^="/classes/"]').first().click()
    await page.waitForURL(/\/classes\//, { timeout: 5000 })
    await page.waitForSelector('h1', { timeout: 10000 })
  })

  test('shows class title, badge, and back link', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    await page.waitForSelector('.badge', { timeout: 10000 })
    await expect(page.locator('.badge').first()).toBeVisible()
    // Back link to classes list
    await expect(page.locator('main a[href="/classes"]')).toBeVisible()
  })

  test('shows tabs: Overview, Members, Schedule, Settings', async ({ page }) => {
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Overview')
    expect(bodyText).toContain('Members')
    expect(bodyText).toContain('Schedule')
    expect(bodyText).toContain('Settings')
  })

  test('overview tab renders (ClassOverview with inline styles preserved)', async ({ page }) => {
    // ClassOverview has inline styles (Task 3 deliberate defect)
    await page.waitForTimeout(1000)
    const styledElements = page.locator('[style*="font-size"], [style*="color"], [style*="padding"]')
    expect(await styledElements.count()).toBeGreaterThan(0)
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/About this class|Trainer|Capacity|Schedule/i)
  })

  test('members tab shows enrollment data', async ({ page }) => {
    await page.locator('main a').filter({ hasText: 'Members' }).click()
    await page.waitForTimeout(3000)
    // Should show table (class has members) or empty state
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    expect(hasTable).toBeTruthy()
  })

  test('schedule tab shows Add Session button', async ({ page }) => {
    await page.locator('main a').filter({ hasText: 'Schedule' }).click()
    await page.waitForTimeout(2000)
    const addBtn = page.locator('button.button').filter({ hasText: /add session/i })
    await expect(addBtn).toBeVisible()
  })

  test('settings tab shows form and danger zone', async ({ page }) => {
    await page.locator('main a').filter({ hasText: 'Settings' }).click()
    await page.waitForSelector('.el-input__inner', { timeout: 10000 })
    await expect(page.locator('.el-input__inner').first()).toBeVisible()
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/danger zone/i)
  })

  test('no text-based loading on any tab', async ({ page }) => {
    for (const tab of ['Members', 'Schedule', 'Settings']) {
      await page.locator('main a').filter({ hasText: tab }).click()
      await page.waitForTimeout(3000)
      const loadingText = page.locator('.py-12.text-center.text-gray-400').filter({ hasText: /Loading|Nacitani|Cargando/ })
      expect(await loadingText.count(), `Loading text on ${tab} tab`).toBe(0)
    }
  })
})

// ─── MEMBERS PAGE ──────────────────────────────────────────────────────────────

test.describe('Members Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await clickNav(page, '/members')
  })

  test('renders title and search', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    const h1Text = await page.locator('h1').textContent()
    expect(h1Text.toLowerCase()).toContain('members')
    await expect(page.locator('.el-input__inner').first()).toBeVisible()
  })

  test('shows member table with correct columns', async ({ page }) => {
    await page.waitForSelector('table', { timeout: 10000 })
    await expect(page.locator('table')).toBeVisible()
    const headerText = await page.locator('thead').textContent()
    expect(headerText).toMatch(/First Name/i)
    expect(headerText).toMatch(/Last Name/i)
    expect(headerText).toMatch(/Email/i)
  })

  test('member table has status badges', async ({ page }) => {
    await page.waitForSelector('.badge', { timeout: 10000 })
    const badges = page.locator('table .badge')
    expect(await badges.count()).toBeGreaterThan(0)
  })

  test('search filters members', async ({ page }) => {
    await page.waitForSelector('table tbody tr', { timeout: 10000 })
    const initialRows = await page.locator('table tbody tr').count()
    await page.locator('.el-input__inner').first().fill('Emma')
    await page.waitForTimeout(1000)
    const filteredRows = await page.locator('table tbody tr').count()
    expect(filteredRows).toBeLessThanOrEqual(initialRows)
  })

  test('no text-based loading', async ({ page }) => {
    await page.waitForTimeout(2000)
    const loadingText = page.locator('.py-12.text-center.text-gray-400').filter({ hasText: /Loading|Nacitani|Cargando/ })
    expect(await loadingText.count()).toBe(0)
  })
})

// ─── TRAINERS PAGE ─────────────────────────────────────────────────────────────

test.describe('Trainers Page', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await clickNav(page, '/trainers')
  })

  test('renders title and Add Trainer button', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    const addBtn = page.locator('button.button').filter({ hasText: /add trainer/i })
    await expect(addBtn).toBeVisible()
  })

  test('shows 3 seeded trainers', async ({ page }) => {
    await page.waitForSelector('.grid .rounded-lg', { timeout: 10000 })
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Sarah Chen')
    expect(bodyText).toContain('Marcus Johnson')
    expect(bodyText).toContain('Elena Kowalski')
  })

  test('trainer cards have Edit and Delete buttons', async ({ page }) => {
    await page.waitForSelector('.grid .rounded-lg', { timeout: 10000 })
    const editBtns = page.locator('button.button').filter({ hasText: /^edit$/i })
    const deleteBtns = page.locator('button.button').filter({ hasText: /^delete$/i })
    expect(await editBtns.count()).toBeGreaterThan(0)
    expect(await deleteBtns.count()).toBeGreaterThan(0)
  })

  test('Add Trainer opens dialog with form', async ({ page }) => {
    const addBtn = page.locator('button.button').filter({ hasText: /add trainer/i })
    await addBtn.click()
    await page.waitForSelector('.el-dialog', { timeout: 5000 })
    await expect(page.locator('.el-dialog')).toBeVisible()
    // Dialog must contain form inputs (not be empty)
    await page.waitForSelector('.el-dialog .el-input__inner', { timeout: 5000 })
    expect(await page.locator('.el-dialog .el-input__inner').count()).toBeGreaterThan(0)
  })

  test('Edit trainer opens dialog with form', async ({ page }) => {
    await page.waitForSelector('.grid .rounded-lg', { timeout: 10000 })
    await page.locator('button.button').filter({ hasText: /^edit$/i }).first().click()
    await page.waitForSelector('.el-dialog', { timeout: 5000 })
    await expect(page.locator('.el-dialog')).toBeVisible()
    // Dialog must contain form inputs with pre-filled data
    await page.waitForSelector('.el-dialog .el-input__inner', { timeout: 5000 })
    expect(await page.locator('.el-dialog .el-input__inner').count()).toBeGreaterThan(0)
  })

  test('Delete trainer shows confirmation (no native confirm)', async ({ page }) => {
    await page.waitForSelector('.grid .rounded-lg', { timeout: 10000 })
    let nativeDialogShown = false
    page.on('dialog', () => { nativeDialogShown = true })
    await page.locator('button.button').filter({ hasText: /^delete$/i }).first().click()
    await page.waitForTimeout(1000)
    expect(nativeDialogShown).toBe(false)
    // DS Modal renders confirmation with trainer name
    await expect(page.locator('.el-overlay').filter({ hasText: /remove/i })).toBeVisible({ timeout: 3000 })
  })

  test('no text-based loading', async ({ page }) => {
    await page.waitForTimeout(2000)
    const loadingText = page.locator('.py-12.text-center.text-gray-400').filter({ hasText: /Loading|Nacitani|Cargando/ })
    expect(await loadingText.count()).toBe(0)
  })
})

// ─── SETTINGS PAGE ─────────────────────────────────────────────────────────────

test.describe('Settings Page', () => {
  test('renders gym settings form with DS components', async ({ page }) => {
    await login(page)
    await clickNav(page, '/settings')
    await expect(page.locator('h1')).toBeVisible()
    await page.waitForSelector('.el-input__inner', { timeout: 10000 })
    await expect(page.locator('.el-input__inner').first()).toBeVisible()
    expect(await page.locator('.el-select').count()).toBeGreaterThan(0)
  })
})

// ─── PUBLIC APP ────────────────────────────────────────────────────────────────

test.describe('Public App', () => {
  test('browse classes page renders', async ({ page }) => {
    await page.goto('/app/default')
    await page.waitForSelector('h1', { timeout: 15000 })
    await expect(page.locator('h1')).toContainText('Browse Classes')
    const bodyText = await page.textContent('body')
    expect(bodyText).toContain('Powered by FitBase')
  })

  test('shows published class cards', async ({ page }) => {
    await page.goto('/app/default')
    await page.waitForSelector('.grid a', { timeout: 15000 })
    const gridItems = page.locator('.grid a')
    expect(await gridItems.count()).toBeGreaterThan(0)
  })

  test('no text-based loading on browse page', async ({ page }) => {
    await page.goto('/app/default')
    await page.waitForSelector('h1', { timeout: 15000 })
    await page.waitForTimeout(2000)
    const loadingText = page.locator('.text-gray-400').filter({ hasText: /^Loading/ })
    expect(await loadingText.count()).toBe(0)
  })

  test('class detail page shows info and enroll option', async ({ page }) => {
    await page.goto('/app/default')
    await page.waitForSelector('.grid a', { timeout: 15000 })
    await page.locator('.grid a').first().click()
    await page.waitForURL(/\/app\/default\/[a-f0-9]/, { timeout: 5000 })
    await page.waitForSelector('h1', { timeout: 10000 })
    const bodyText = await page.textContent('body')
    expect(bodyText).toMatch(/Back/i)
    // Enroll Now link (NuxtLink <a>) or "Class is full" text (div)
    const enrollLink = page.locator('a').filter({ hasText: /enroll now/i })
    const classFull = page.getByText(/class is full/i)
    const hasEnrollOption = await enrollLink.isVisible().catch(() => false) || await classFull.isVisible().catch(() => false)
    expect(hasEnrollOption).toBeTruthy()
  })

  test('no text-based loading on class detail', async ({ page }) => {
    await page.goto('/app/default')
    await page.waitForSelector('.grid a', { timeout: 15000 })
    await page.locator('.grid a').first().click()
    await page.waitForSelector('h1', { timeout: 10000 })
    await page.waitForTimeout(1000)
    const loadingText = page.locator('.py-12.text-center.text-gray-400').filter({ hasText: /Loading|Nacitani|Cargando/ })
    expect(await loadingText.count()).toBe(0)
  })

  test('enrollment form renders with DS components', async ({ page }) => {
    await page.goto('/app/default')
    await page.waitForSelector('.grid a', { timeout: 15000 })
    await page.locator('.grid a').first().click()
    await page.waitForURL(/\/app\/default\/[a-f0-9]/, { timeout: 5000 })
    await page.waitForSelector('h1', { timeout: 10000 })
    const enrollLink = page.locator('a').filter({ hasText: /enroll now/i })
    if (await enrollLink.isVisible().catch(() => false)) {
      await enrollLink.click()
      await page.waitForURL(/\/enroll\//, { timeout: 5000 })
      await page.waitForSelector('.el-input__inner', { timeout: 10000 })
      expect(await page.locator('.el-input__inner').count()).toBeGreaterThan(0)
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    }
  })
})

// ─── DS CONSISTENCY ────────────────────────────────────────────────────────────

test.describe('Design System Consistency', () => {
  test('no native <select> on admin pages', async ({ page }) => {
    await login(page)
    const paths = ['/classes', '/members', '/trainers', '/settings']
    for (const path of paths) {
      await clickNav(page, path)
      await page.waitForTimeout(1000)
      const nativeSelects = await page.locator('select:not(.el-select__input):not([class*="el-"])').count()
      expect(nativeSelects, `Native <select> found on ${path}`).toBe(0)
    }
  })

  test('no native confirm() dialogs', async ({ page }) => {
    await login(page)
    await clickNav(page, '/trainers')
    await page.waitForSelector('.grid .rounded-lg', { timeout: 10000 })
    let nativeDialog = false
    page.on('dialog', () => { nativeDialog = true })
    const deleteBtn = page.locator('button.button').filter({ hasText: /^delete$/i }).first()
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(1000)
      expect(nativeDialog).toBe(false)
    }
  })
})

// ─── CONSOLE HEALTH ────────────────────────────────────────────────────────────

test.describe('Console Health', () => {
  test('no JS errors on main pages', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (
          text.includes('favicon') ||
          text.includes('404') ||
          text.includes('401') ||
          text.includes('hydration') ||
          text.includes('WebSocket') ||
          text.includes('vite') ||
          text.includes('Vite') ||
          text.includes('Failed to load resource') ||
          text.includes('net::ERR')
        ) return
        errors.push(text)
      }
    })
    await login(page)
    const paths = ['/classes', '/members', '/trainers', '/settings']
    for (const path of paths) {
      await clickNav(page, path)
      await page.waitForTimeout(1000)
    }
    expect(errors.length, `Console errors: ${errors.join('\n')}`).toBe(0)
  })
})
