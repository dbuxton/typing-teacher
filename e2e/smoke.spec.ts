import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end: create a player, complete a whole lesson by actually typing it,
 * and confirm the results land and survive a reload.
 *
 * This is the test that would catch "the app builds but nothing happens when
 * you press a key" — the class of bug unit tests on the engine cannot see.
 */

/** Read the text the app is currently asking for, as real characters. */
async function currentText(page: Page): Promise<string> {
  const text = await page.locator('.type-text').first().innerText()
  // Spaces are rendered as non-breaking spaces for visible width.
  return text.replace(/ /g, ' ').replace(/\n/g, '')
}

async function createPlayer(page: Page, name = 'Robin') {
  await page.goto('./')
  await page.getByPlaceholder('Type your name').fill(name)
  await page.getByRole('button', { name: "Let's go!" }).click()
  await expect(page.getByRole('heading', { name: 'Choose a lesson' })).toBeVisible()
}

/** Type the current item correctly, one character at a time. */
async function typeCurrentItem(page: Page) {
  const text = await currentText(page)
  for (const char of text) {
    await page.keyboard.press(char === ' ' ? 'Space' : char)
  }
}

test('a kid can create a player, do a lesson, and come back to their progress', async ({ page }) => {
  await createPlayer(page)

  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()

  // Level 1 is six short drill items.
  await expect(page.getByText('1/6')).toBeVisible()

  for (let item = 0; item < 6; item++) {
    await typeCurrentItem(page)
    // The app pauses briefly between items so the last character can land.
    await page.waitForTimeout(500)
  }

  // Results screen: eyes-up first, then accuracy.
  await expect(page.getByText('Accuracy', { exact: true })).toBeVisible()
  await expect(page.getByText('100%')).toBeVisible()
  await expect(page.getByText(/\+\d+ coins/)).toBeVisible()

  // A perfect lesson earns the Flawless badge.
  await expect(page.getByText('New badge!')).toBeVisible()

  // Progress survives a reload — the whole point of the save file. A reload
  // lands back on the player picker, which is what you want on a shared family
  // computer, and the saved player is right there with their progress on it.
  await page.reload()
  await expect(page.getByText('Robin')).toBeVisible()
  await expect(page.getByText(/1 lesson/)).toBeVisible()

  await page.getByText('Robin').click()
  await page.getByRole('button', { name: /Badges/ }).click()
  await expect(page.getByText(/Lessons finished:/)).toBeVisible()
  await expect(page.getByText(/Words typed:/)).toBeVisible()
})

test('a wrong key is marked but never blocks progress', async ({ page }) => {
  await createPlayer(page, 'Sam')
  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()

  const text = await currentText(page)
  const wrongKey = text[0] === 'f' ? 'j' : 'f'

  await page.keyboard.press(wrongKey)
  // Amber, not red, and the cursor has not advanced.
  await expect(page.locator('.bg-amber-200').first()).toBeVisible()

  // The correct key still works straight afterwards.
  await page.keyboard.press(text[0])
  await expect(page.locator('.text-emerald-600').first()).toBeVisible()
})

test('the keyboard shows the next key and the finger to use', async ({ page }) => {
  await createPlayer(page, 'Alex')
  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()

  // A brand-new player is at 'full' assist: lettered keys, hands, finger hint.
  await expect(page.getByText(/Use your (left|right) /)).toBeVisible()
  await expect(page.locator('.key-next')).toHaveCount(1)
  await expect(page.locator('svg')).toHaveCount(2) // two hands
})

test('sneaky stars can be switched off for a kid who finds them annoying', async ({ page }) => {
  await createPlayer(page, 'Kit')

  const toggle = page.getByRole('checkbox').first()
  await expect(toggle).toBeChecked()
  await toggle.uncheck()

  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()
  await expect(page.getByText('Sneaky Stars')).toHaveCount(0)
})

test('both comfort settings survive a reload', async ({ page }) => {
  await createPlayer(page, 'Nel')

  const sneaky = page.getByRole('checkbox').first()
  const readAloud = page.getByRole('checkbox').nth(1)
  await expect(sneaky).toBeChecked()
  await expect(readAloud).toBeChecked()

  await sneaky.uncheck()
  await readAloud.uncheck()

  await page.reload()
  await page.getByText('Nel').click()
  await expect(page.getByRole('checkbox').first()).not.toBeChecked()
  await expect(page.getByRole('checkbox').nth(1)).not.toBeChecked()
})

test('a kid who cannot find a key is offered a way past it', async ({ page }) => {
  await createPlayer(page, 'Stuck')
  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()

  const text = await currentText(page)
  const wrongKey = text[0] === 'f' ? 'j' : 'f'

  // No escape offered while they're only a couple of tries in — we don't want to
  // suggest giving up the moment a kid fumbles.
  await page.keyboard.press(wrongKey)
  await page.keyboard.press(wrongKey)
  await expect(page.getByText(/Tricky one/)).toHaveCount(0)

  // But they must never be trapped: after five, there's a way through.
  for (let i = 0; i < 3; i++) await page.keyboard.press(wrongKey)
  await expect(page.getByText(/Tricky one/)).toBeVisible()

  await page.keyboard.press('ArrowRight')
  await expect(page.getByText(/Tricky one/)).toHaveCount(0)
  // The cursor really moved on rather than just hiding the message.
  await expect(page.locator('.bg-sky-500').first()).toBeVisible()
})

test('a capable kid is jumped ahead instead of grinding through level 1', async ({ page }) => {
  await createPlayer(page, 'Quick')
  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()

  // Play a flawless lesson.
  for (let item = 0; item < 6; item++) {
    await typeCurrentItem(page)
    await page.waitForTimeout(500)
  }

  // Perfect work on the new keys should skip them several levels, not one.
  await expect(page.getByText(/Jumping you ahead|Skipping you ahead/)).toBeVisible()
  await page.getByRole('button', { name: 'Lesson map' }).click()
  await expect(page.getByRole('button', { name: /Carry on with Level [2-9]/ })).toBeVisible()
})
