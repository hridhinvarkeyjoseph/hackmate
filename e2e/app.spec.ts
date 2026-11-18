import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const inDays = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const listing = (name: string, overrides: Record<string, unknown> = {}) => ({
  id: name,
  name,
  organizer: 'Test Host',
  mode: 'Online',
  location: 'Online',
  themes: ['AI'],
  prize: '',
  applyUrl: 'https://example.com/apply',
  startDate: inDays(10),
  endDate: inDays(12),
  deadline: inDays(5),
  region: 'online',
  open: true,
  source: 'unstop',
  ...overrides,
})

const feed = {
  generatedAt: new Date().toISOString(),
  events: [
    listing('Open AI Jam'),
    listing('Local Build Day', { mode: 'In person', location: 'Bengaluru', themes: ['Design'] }),
    listing('Faraway Summit', { mode: 'In person', location: 'New Delhi', themes: ['Climate'] }),
    listing('Closed Hack', { deadline: inDays(-1) }),
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route('**/live-hackathons.json', (route) => route.fulfill({ json: feed }))
})

async function finishSetup(page: Page) {
  await page.goto('/')
  const welcome = page.getByRole('dialog', { name: 'Welcome to Hackmate' })
  await welcome.getByLabel('Your name').fill('Asha')
  await welcome.getByRole('button', { name: 'Bengaluru, IN' }).click()
  await welcome.getByRole('button', { name: 'AI', exact: true }).click()
  await welcome.getByRole('button', { name: 'Show my hackathons' }).click()
  await expect(page.getByRole('heading', { name: /Worth the trip/ })).toBeVisible()
}

const row = (page: Page, name: string) =>
  page.locator('.finder-row').filter({ has: page.getByRole('heading', { name }) })

test('a new visitor gets ranked, open hackathons', async ({ page }) => {
  await finishSetup(page)

  await expect(row(page, 'Open AI Jam')).toContainText('Matches themes you follow: AI')
  await expect(row(page, 'Local Build Day').locator('.verdict')).toHaveText('Go')
  await expect(row(page, 'Faraway Summit').locator('.verdict')).toHaveText('Skip')
  await expect(page.getByRole('heading', { name: 'Closed Hack' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Skip · 1' }).click()
  await expect(page.locator('.finder-row')).toHaveCount(1)
})

test('results come first, and the city can still be changed', async ({ page }) => {
  await finishSetup(page)
  await expect(page.locator('.finder-locator__cities')).toHaveCount(0)
  await page.getByRole('button', { name: 'Change city' }).click()
  await page.getByRole('button', { name: 'New Delhi, IN' }).click()
  await expect(row(page, 'Faraway Summit').locator('.verdict')).toHaveText('Go')
})

test('a tracked hackathon becomes a saved plan', async ({ page }) => {
  await finishSetup(page)
  await row(page, 'Open AI Jam').getByRole('button', { name: 'Track it' }).click()

  const details = page.getByRole('dialog', { name: 'Open AI Jam details' })
  const score = details.getByRole('progressbar', { name: 'Submission readiness' })
  await expect(score).toHaveAttribute('aria-valuenow', '0')

  await details.getByRole('button', { name: 'Plan my sprint' }).click()
  await expect(details.locator('.detail-tasks li')).toHaveCount(9)
  await expect(score).toHaveAttribute('aria-valuenow', '5')

  await details.getByRole('button', { name: 'Mark task done' }).first().click()
  await expect(score).toHaveAttribute('aria-valuenow', '8')

  await page.reload()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: /My hackathons/ }).click()
  await expect(page.getByRole('heading', { name: 'Open AI Jam' })).toBeVisible()
})

test('search and quick filters narrow the list', async ({ page }) => {
  await finishSetup(page)
  await page.getByRole('searchbox', { name: 'Filter open hackathons' }).fill('bengaluru')
  await expect(page.locator('.finder-row h3')).toHaveText(['Local Build Day'])
  await page.getByRole('button', { name: 'Online only' }).click()
  await expect(page.getByText('Nothing matches these filters')).toBeVisible()
})

test('planned work appears in todays focus', async ({ page }) => {
  await finishSetup(page)
  await row(page, 'Open AI Jam').getByRole('button', { name: 'Track it' }).click()
  await page.getByRole('button', { name: 'Plan my sprint' }).click()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Overview', exact: true }).click()

  const focus = page.getByRole('region', { name: "Today's focus" })
  await expect(focus.getByText('Read the rules and judging criteria')).toBeVisible()
  await focus.getByRole('button', { name: /Mark done: Read the rules/ }).click()
  await expect(focus.getByText('Read the rules and judging criteria')).toHaveCount(0)
})

test('the pitch builder writes and keeps a script', async ({ page }) => {
  await finishSetup(page)
  await row(page, 'Open AI Jam').getByRole('button', { name: 'Track it' }).click()
  await page.getByRole('button', { name: 'Write my pitch' }).click()

  const pitch = page.getByRole('dialog', { name: 'Pitch for Open AI Jam' })
  await pitch.getByLabel('Project name').fill('Hackmate')
  await pitch.getByLabel('What does your project do?').fill('it plans your sprint')
  const script = pitch.getByRole('region', { name: 'Your pitch script' })
  await expect(script).toContainText('we built Hackmate: it plans your sprint.')
  await pitch.getByRole('button', { name: 'Copy script' }).click()
  await expect(pitch.getByRole('button', { name: 'Copied' })).toBeVisible()

  await page.keyboard.press('Escape')
  const details = page.getByRole('dialog', { name: 'Open AI Jam details' })
  await expect(details.getByRole('button', { name: 'Edit my pitch' })).toBeVisible()
  await expect(details.getByRole('link', { name: 'Add to Google Calendar' })).toHaveAttribute(
    'href',
    /calendar\.google\.com/,
  )
})

test('pages have their own links and Back works', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore with sample data' }).click()
  await page.getByRole('button', { name: 'Calendar', exact: true }).click()
  await page.getByRole('button', { name: 'Insights', exact: true }).click()
  await expect(page).toHaveURL(/#\/insights$/)
  await expect(page).toHaveTitle('Insights · Hackmate')

  await page.goBack()
  await expect(page).toHaveURL(/#\/calendar$/)
  await expect(page.getByRole('heading', { name: /Your months/ })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: /Your months/ })).toBeVisible()
})

test('the app says when it is offline', async ({ page, context }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore with sample data' }).click()
  await context.setOffline(true)
  await expect(page.getByText("You're offline")).toBeVisible()
  await context.setOffline(false)
  await expect(page.getByText("You're offline")).toHaveCount(0)
})

test('a visitor can explore the sample data', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Explore with sample data' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Minty Build Weekend').first()).toBeVisible()
})

test('a teammate can join from a share link', async ({ page, browser, baseURL }) => {
  await finishSetup(page)
  await row(page, 'Open AI Jam').getByRole('button', { name: 'Track it' }).click()
  await page.getByRole('button', { name: 'Plan my sprint' }).click()
  await page.getByRole('button', { name: 'Share plan with my team' }).click()
  await expect(page.getByText('Link copied')).toBeVisible()
  const link = await page.evaluate(() => navigator.clipboard.readText())

  const teammate = await browser.newContext({ baseURL })
  const other = await teammate.newPage()
  await other.goto(link)
  const invite = other.getByRole('dialog', { name: 'Join Open AI Jam' })
  await expect(invite).toContainText('9 tasks in the plan')
  await invite.getByRole('button', { name: 'Add to my board' }).click()

  await expect(other.getByRole('dialog', { name: 'Open AI Jam details' })).toBeVisible()
  expect(new URL(other.url()).hash).toBe('')
  await teammate.close()
})

test('a damaged share link is ignored', async ({ page }) => {
  await page.goto('/#join=not-a-real-plan')
  await expect(page.getByRole('dialog', { name: 'Welcome to Hackmate' })).toBeVisible()
})

test('main screens pass automated accessibility checks', async ({ page }) => {
  const scan = async () => {
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(violations.map((item) => `${item.id}: ${item.nodes[0].target}`)).toEqual([])
  }

  await page.goto('/')
  await scan()
  await page.getByRole('button', { name: 'Explore with sample data' }).click()
  await scan()
  await page.getByRole('button', { name: 'Near me' }).click()
  await page.getByRole('button', { name: 'Bengaluru, IN' }).click()
  await scan()
  await page.locator('.finder-row').first().getByRole('button', { name: 'Track it' }).click()
  await scan()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('nothing overflows sideways', async ({ page }) => {
    await finishSetup(page)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})
