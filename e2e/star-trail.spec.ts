import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end: Star Trail, the space game that lives beside Typing Teacher at its
 * own address with its own save.
 *
 * The trail only shows the letters the scanner can reach, so these tests read
 * the next letter from the trail's `data-next` attribute and type it, one at a
 * time — exactly what a kid does, minus the looking.
 */

const SAVE_KEY = 'star-trail.save.v1'

type SeedPilot = Record<string, unknown>

function pilot(extra: SeedPilot = {}) {
  return {
    id: 'pilot_test',
    name: 'Nova',
    avatar: '🧑‍🚀',
    createdAt: '2026-09-27',
    planet: 1,
    highestPlanet: 1,
    pieces: {},
    stardust: 0,
    stardustEarned: 0,
    upgrades: { scanner: 0, shields: 0, robot: 0, engines: 0 },
    help: 'letters',
    slipRate: 0.1,
    failStreak: 0,
    keyStats: {},
    recent: {},
    huntsFlown: 5,
    huntsOnPlanet: { 1: 5 },
    timesTowed: 0,
    introsSeen: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    endingSeen: false,
    sound: false,
    history: [],
    ...extra,
  }
}

/** Load Star Trail with a ready-made pilot, and pick them in the hangar. */
async function seed(page: Page, extra: SeedPilot = {}) {
  await page.goto('star-trail/')
  await page.evaluate(
    ([key, p]) => {
      const save = { version: 1, pilots: [p], activePilotId: null }
      localStorage.setItem(key as string, JSON.stringify({ state: { save }, version: 1 }))
    },
    [SAVE_KEY, pilot(extra)] as const,
  )
  await page.reload()
  await page.getByRole('button', { name: /Nova.*pieces/ }).click()
  await expect(page.getByRole('button', { name: /Hunt!/ })).toBeVisible()
}

async function savedPilot(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).state.save.pilots[0], SAVE_KEY)
}

const trail = (page: Page) => page.getByTestId('trail')
const gauges = (page: Page) => page.locator('[data-tank]')

/** Type the next letter on the trail and wait for the ship to move on. */
async function typeNext(page: Page) {
  const before = await trail(page).getAttribute('data-cursor')
  const next = (await trail(page).getAttribute('data-next'))!
  await page.keyboard.press(next === ' ' ? 'Space' : next)
  await expect(trail(page)).not.toHaveAttribute('data-cursor', before!)
}

/** Fly the rest of the trail without a slip. */
async function flyToTheEnd(page: Page) {
  while ((await trail(page).getAttribute('data-status')) === 'flying') await typeNext(page)
}

/** A key that is never on any trail. */
const WRONG = '9'

test('Star Trail has its own page, and Typing Teacher is still at the root', async ({ page }) => {
  await page.goto('star-trail/')
  await expect(page).toHaveTitle('Star Trail')
  await expect(page.getByRole('heading', { name: 'Star Trail' })).toBeVisible()

  await page.goto('./')
  await expect(page).toHaveTitle('Typing Teacher')
  await expect(page.getByRole('heading', { name: 'Typing Teacher' })).toBeVisible()
  await expect(page.getByText(/Star Trail/)).toHaveCount(0)
})

test('the address without a trailing slash still finds Star Trail', async ({ page }) => {
  await page.goto('star-trail')
  await expect(page).toHaveURL(/\/typing-teacher\/star-trail\/$/)
  await expect(page).toHaveTitle('Star Trail')
})

test('a new pilot powers up the home row, flies a trail and finds a piece that is still there after a reload', async ({
  page,
}) => {
  await page.goto('star-trail/')
  await page.evaluate(() => localStorage.setItem('typing-teacher.save.v1', '{"untouched":true}'))
  await page.getByPlaceholder('Pilot name').fill('Robin')
  await page.getByRole('button', { name: /Launch!/ }).click()
  await page.getByRole('button', { name: /Hunt!/ }).click()

  // The first planet's intro: power up each home-row key, bumps first.
  await expect(page.getByRole('heading', { name: 'Welcome to Home Moon' })).toBeVisible()
  const keys = page.locator('[data-power-key]')
  await expect(keys.first()).toHaveAttribute('data-power-key', 'f')
  for (const key of await keys.evaluateAll((els) => els.map((el) => el.getAttribute('data-power-key')!))) {
    await page.keyboard.press(key)
  }
  await page.getByRole('button', { name: /Start hunting/ }).click()

  // No scanner yet: only the letter to type is on show, nothing ahead of it.
  await expect(trail(page)).toHaveAttribute('data-status', 'flying')
  await expect(page.locator('[data-ahead]')).toHaveCount(0)
  await expect(page.getByText(/Training flight/)).toBeVisible()

  await flyToTheEnd(page)
  await expect(page.getByRole('heading', { name: 'Found it!' })).toBeVisible()
  await expect(page.getByText(/Piece 1 of 3/)).toBeVisible()
  await expect(page.getByTestId('payout-total')).toContainText('+')

  // Its own save, and Typing Teacher's left exactly as it was.
  expect(await page.evaluate(() => localStorage.getItem('typing-teacher.save.v1'))).toBe('{"untouched":true}')
  const saved = await savedPilot(page)
  expect(saved.pieces).toEqual({ 1: 1 })
  expect(saved.stardust).toBeGreaterThan(0)

  await page.reload()
  await expect(page.getByText(/1 of 30 pieces/)).toBeVisible()
})

test('a slip costs a shield, then fuel — but missing the same letter again is free', async ({ page }) => {
  await seed(page, { upgrades: { scanner: 0, shields: 0, robot: 0, engines: 0 } })
  await page.getByRole('button', { name: /Hunt!/ }).click()
  await expect(gauges(page)).toHaveAttribute('data-shields', '1')
  await expect(gauges(page)).toHaveAttribute('data-tank', '5')

  await page.keyboard.press(WRONG)
  await expect(gauges(page)).toHaveAttribute('data-shields', '0')
  await expect(gauges(page)).toHaveAttribute('data-tank', '5')
  await expect(trail(page)).toHaveAttribute('data-cursor', '0')

  await typeNext(page)
  await page.keyboard.press(WRONG)
  await expect(gauges(page)).toHaveAttribute('data-tank', '4')
  // Hammering the same letter costs nothing more.
  await page.keyboard.press(WRONG)
  await page.keyboard.press(WRONG)
  await expect(gauges(page)).toHaveAttribute('data-tank', '4')
})

test('running out of fuel means a tow home, keeping the banked stardust, and a shorter trail next time', async ({ page }) => {
  // Planet 4 with two pieces found: a steady pilot gets a long trail, with
  // letters to spare for six slips after the first word.
  await seed(page, {
    planet: 4,
    highestPlanet: 4,
    pieces: { 4: 2 },
    slipRate: 0.03,
    upgrades: { scanner: 0, shields: 0, robot: 0, engines: 3 },
    huntsOnPlanet: { 4: 5 },
  })
  await page.getByRole('button', { name: /Hunt!/ }).click()
  const firstTarget = Number(await trail(page).getAttribute('data-target'))

  // Finish a word to bank some stardust, then slip on letter after letter.
  while ((await trail(page).getAttribute('data-next')) !== ' ') await typeNext(page)
  await typeNext(page)
  while ((await trail(page).getAttribute('data-status')) === 'flying') {
    await page.keyboard.press(WRONG)
    if ((await trail(page).getAttribute('data-status')) !== 'flying') break
    await typeNext(page)
  }
  await expect(page.getByRole('heading', { name: 'Out of fuel!' })).toBeVisible()
  await expect(page.getByText(/You kept the/)).toBeVisible()

  const saved = await savedPilot(page)
  expect(saved.pieces).toEqual({ 4: 2 })
  expect(saved.stardust).toBeGreaterThan(0)
  expect(saved.failStreak).toBe(1)

  await page.getByRole('button', { name: 'Try again' }).click()
  expect(Number(await trail(page).getAttribute('data-target'))).toBeLessThan(firstTarget)
})

test('a held-down key and a stuck Caps Lock cost nothing', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: /Hunt!/ }).click()
  const next = (await trail(page).getAttribute('data-next'))!

  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '9', repeat: true })))
  await page.evaluate(
    (letter) => window.dispatchEvent(new KeyboardEvent('keydown', { key: letter.toUpperCase(), modifierCapsLock: true })),
    next,
  )
  await expect(page.getByText(/Caps Lock is on/)).toBeVisible()
  await expect(trail(page)).toHaveAttribute('data-cursor', '0')
  await expect(gauges(page)).toHaveAttribute('data-shields', '1')
  await expect(gauges(page)).toHaveAttribute('data-tank', '5')
})

test('a letter nobody can find can be skipped after a few tries', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: /Hunt!/ }).click()
  for (let i = 0; i < 4; i++) await page.keyboard.press(WRONG)
  await expect(page.getByText(/Tricky one/)).toHaveCount(0)
  await page.keyboard.press(WRONG)
  await expect(page.getByText(/Tricky one/)).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await expect(trail(page)).toHaveAttribute('data-cursor', '1')
})

test('pausing stops the hunt, and the key that resumes it is never typed', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: /Hunt!/ }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible()

  const next = (await trail(page).getAttribute('data-next'))!
  await page.keyboard.press(next === ' ' ? 'Space' : next)
  await expect(page.getByRole('dialog', { name: 'Paused' })).toHaveCount(0)
  await expect(trail(page)).toHaveAttribute('data-cursor', '0')
})

test('heading back to base keeps the stardust banked so far', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: /Hunt!/ }).click()
  while ((await trail(page).getAttribute('data-next')) !== ' ') await typeNext(page)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Back to base' }).click()
  await expect(page.getByRole('button', { name: /Hunt!/ })).toBeVisible()
  const saved = await savedPilot(page)
  expect(saved.stardust).toBeGreaterThan(0)
  expect(saved.failStreak).toBe(0)
})

test('stardust buys a scanner, which shows letters further along the trail', async ({ page }) => {
  await seed(page, { stardust: 200 })
  await page.getByRole('button', { name: /Station/ }).click()
  await page.getByRole('button', { name: 'Buy Scanner level 1 for 30 stardust' }).click()
  await expect(page.getByTestId('stardust')).toHaveText('170')
  await expect(page.getByText(/Arrives in stock when you reach Rusty Rock/)).toBeVisible()
  expect((await savedPilot(page)).upgrades.scanner).toBe(1)

  await page.getByRole('button', { name: /Galaxy/ }).first().click()
  await page.getByRole('button', { name: /Hunt!/ }).click()
  await expect(page.locator('[data-ahead]')).toHaveCount(2)
})

test('launching waits for the engines, then lands on a planet with new keys', async ({ page }) => {
  const history = [
    { planet: 1, result: 'found', practice: false, letters: 30, slips: 1, accuracy: 0.97, newKeyTries: 30, newKeySlips: 1, stardust: 30, help: 'letters', date: '2026-09-27' },
  ]
  await seed(page, { pieces: { 1: 3 }, stardust: 120, history, introsSeen: [1] })
  const launch = page.getByRole('button', { name: /Launch to Echo/ })
  await expect(launch).toBeDisabled()

  await page.getByRole('button', { name: /Station/ }).click()
  await page.getByRole('button', { name: /Buy Engines level 1/ }).click()
  await page.getByRole('button', { name: /Galaxy/ }).first().click()
  await expect(launch).toBeEnabled()
  await launch.click()

  await expect(page.getByRole('heading', { name: 'Welcome to Echo' })).toBeVisible()
  await expect(page.locator('[data-power-key]')).toHaveText(['E', 'I'])
})

test('the robot grabs a sparkle when ↑ is pressed', async ({ page }) => {
  await seed(page, { planet: 2, highestPlanet: 2, upgrades: { scanner: 0, shields: 0, robot: 1, engines: 1 } })
  await page.getByRole('button', { name: /Hunt!/ }).click()
  const sparkle = page.getByTestId('sparkle')
  while ((await sparkle.count()) === 0 && (await trail(page).getAttribute('data-status')) === 'flying') {
    await typeNext(page)
  }
  await expect(page.getByText(/Press ↑ to grab the stardust/)).toBeVisible()
  await page.keyboard.press('ArrowUp')
  await expect(sparkle).toHaveCount(0)
  await flyToTheEnd(page)
  await expect(page.getByText('Caught by your robot')).toBeVisible()
})

test('the hunt fits a phone-sized screen without scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 })
  await seed(page)
  await page.getByRole('button', { name: /Hunt!/ }).click()
  await expect(page.getByTestId('keyboard')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBe(0)
  const box = (await page.getByTestId('keyboard').boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(375)
})

test('the last piece completes the Lost Ship and plays the ending', async ({ page }) => {
  const pieces: Record<number, number> = {}
  for (let planet = 1; planet <= 10; planet++) pieces[planet] = 3
  pieces[10] = 2
  await seed(page, {
    planet: 10,
    highestPlanet: 10,
    pieces,
    upgrades: { scanner: 4, shields: 4, robot: 0, engines: 9 },
    huntsOnPlanet: { 10: 3 },
  })
  await page.getByRole('button', { name: /Hunt!/ }).click()
  await flyToTheEnd(page)
  await page.getByRole('button', { name: /The Lost Ship is complete/ }).click()
  await expect(page.getByTestId('ending-title')).toHaveText('The Lost Ship flies again!')
})
