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

async function createPlayer(page: Page, name = 'Robin', prizes?: RegExp) {
  await page.goto('./')
  await page.getByPlaceholder('Type your name').fill(name)
  if (prizes) await page.getByRole('button', { name: prizes }).click()
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

test('a kid who picks Pokémon collects eggs instead of seeds', async ({ page }) => {
  await createPlayer(page, 'Ash', /^Pokémon/)

  // The top bar and the collection are Pokémon-flavoured, not a garden.
  await expect(page.getByRole('button', { name: /Garden/ })).toHaveCount(0)
  await page.getByRole('button', { name: /Pokémon/ }).click()
  await expect(page.getByRole('heading', { name: 'Your Pokémon' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Egg shop/ })).toBeVisible()
  // No coins yet, so nothing is buyable.
  await expect(page.getByRole('button', { name: /Magikarp/ })).toBeDisabled()

  // Earn some coins with a flawless lesson, then spend them.
  await page.getByRole('button', { name: /Back to lessons/ }).click()
  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()
  for (let item = 0; item < 6; item++) {
    await typeCurrentItem(page)
    await page.waitForTimeout(500)
  }
  await page.getByRole('button', { name: /Spend coins/ }).click()
  await page.getByRole('button', { name: /Magikarp/ }).click()
  await expect(page.getByText('Magikarp egg')).toBeVisible()

  // The collection badge speaks the theme's language too.
  await page.getByRole('button', { name: /Badges/ }).click()
  await expect(page.getByText('Hatchling')).toBeVisible()
  await expect(page.getByText('Green Fingers')).toHaveCount(0)
})

test('baby animals can be found by type, collected and grown through lessons', async ({ page }) => {
  await createPlayer(page, 'Ava', /^Animals/)
  // Start with enough coins for one baby; grow it by typing a real lesson.
  await page.evaluate(() => {
    const key = 'typing-teacher.save.v1'
    const saved = JSON.parse(localStorage.getItem(key)!)
    saved.state.save.profiles[0].coins = 20
    localStorage.setItem(key, JSON.stringify(saved))
  })
  await page.reload()
  await page.getByText('Ava', { exact: true }).click()
  await page.getByRole('button', { name: /Animals/ }).click()
  await expect(page.getByRole('heading', { name: 'Your animal friends' })).toBeVisible()
  await expect(page.locator('[aria-label="Your collection"] > div')).toHaveCount(18)
  await page.getByRole('button', { name: 'Birds', exact: true }).click()
  await expect(page.getByRole('button', { name: /Robin/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Red fox/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Mammals', exact: true }).click()
  await expect(page.getByRole('button', { name: /Red fox/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Robin/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'More animals', exact: true }).click()
  await expect(page.getByRole('button', { name: /Octopus/ })).toBeVisible()
  await page.getByRole('button', { name: 'All animals', exact: true }).click()
  await page.getByRole('button', { name: /Robin/ }).click()
  await expect(page.getByText('Robin · Baby', { exact: true })).toBeVisible()
  await expect(page.locator('[aria-label="Your collection"] img')).toHaveAttribute('src', /robin-baby\.webp$/)
  await page.locator('[aria-label="Your collection"] img').evaluate(image => (image as HTMLImageElement).decode())
  const babyWidth = (await page.locator('[aria-label="Your collection"] img').boundingBox())!.width
  await page.getByRole('button', { name: /Back to lessons/ }).click()
  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()
  for (let item = 0; item < 6; item++) {
    await typeCurrentItem(page)
    await page.waitForTimeout(500)
  }
  await page.getByRole('button', { name: /Spend coins/ }).click()
  await expect(page.getByText('Robin · Juvenile', { exact: true })).toBeVisible()
  await expect(page.locator('[aria-label="Your collection"] img')).toHaveAttribute('src', /robin-juvenile\.webp$/)
  await page.locator('[aria-label="Your collection"] img').evaluate(image => (image as HTMLImageElement).decode())
  expect((await page.locator('[aria-label="Your collection"] img').boundingBox())!.width).toBeGreaterThan(babyWidth)
  await page.reload()
  await page.getByText('Ava', { exact: true }).click()
  await page.getByRole('button', { name: /Animals/ }).click()
  await expect(page.getByText('Robin · Juvenile', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Badges/ }).click()
  await expect(page.getByText('Animal Friend', { exact: true })).toBeVisible()
})

for (const theme of [
  { picker: /^Garden/, nav: /Garden/, kind: 'daisy', name: /Daisy/ },
  { picker: /^Pokémon/, nav: /Pokémon/, kind: 'magikarp', name: /Magikarp/ },
  { picker: /^Animals/, nav: /Animals/, kind: 'robin', name: /Robin/ },
]) {
  test(`${theme.kind} collections grow past 18 and 24 without blocking the shop`, async ({ page }) => {
    await createPlayer(page, 'Max', theme.picker)
    await page.evaluate(({ kind }) => {
      const key = 'typing-teacher.save.v1'
      const saved = JSON.parse(localStorage.getItem(key)!)
      saved.state.save.profiles[0].coins = 1000
      saved.state.save.profiles[0].garden = Array.from({ length: 17 }, () => ({ kindId: kind, stage: 0 }))
      localStorage.setItem(key, JSON.stringify(saved))
    }, { kind: theme.kind })
    await page.reload()
    await page.getByText('Max', { exact: true }).click()
    await page.getByRole('button', { name: theme.nav }).click()
    const slots = page.locator('[aria-label="Your collection"] > div')
    const buy = page.getByRole('button', { name: theme.name })
    await expect(slots).toHaveCount(18)
    await buy.click()
    await expect(slots).toHaveCount(24)
    for (let i = 0; i < 7; i++) await buy.click()
    await expect(slots).toHaveCount(30)
    await expect(buy).toBeEnabled()
    await page.reload()
    await page.getByText('Max', { exact: true }).click()
    await page.getByRole('button', { name: theme.nav }).click()
    await expect(slots).toHaveCount(30)
    const owned = await page.evaluate(() => JSON.parse(localStorage.getItem('typing-teacher.save.v1')!).state.save.profiles[0].garden.length)
    expect(owned).toBe(25)
  })
}

test('a tricky lesson gets fresh practice before a missed pattern returns', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 })
  await createPlayer(page, 'Rowan')
  await page.getByRole('checkbox').first().uncheck()
  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const keyboard = await page.locator('.typing-keyboard').boundingBox()
  expect(keyboard!.x).toBeGreaterThanOrEqual(0)
  expect(keyboard!.x + keyboard!.width).toBeLessThanOrEqual(375)
  const firstRound: string[] = []
  for (let item = 0; item < 6; item++) {
    const text = await currentText(page)
    firstRound.push(text)
    for (const char of text) {
      if (item === 0) for (let miss = 0; miss < 3; miss++) await page.keyboard.press('k')
      await page.keyboard.press(char === ' ' ? 'Space' : char)
    }
    await page.waitForTimeout(500)
  }
  await expect(page.getByText('Same keys, a fresh mix next time.', { exact: false })).toBeVisible()
  const memory = await page.evaluate(() => JSON.parse(localStorage.getItem('typing-teacher.save.v1')!).state.save.profiles[0].practice)
  expect(memory.find((item: { text: string }) => item.text === firstRound[0])).toMatchObject({ lastSeenAt: 1, dueAt: 3 })
  await page.getByRole('button', { name: 'Try a fresh mix!' }).click()
  for (let item = 0; item < 6; item++) {
    expect(firstRound).not.toContain(await currentText(page))
    await typeCurrentItem(page)
    await page.waitForTimeout(500)
  }
  // Reload before the due review: it must survive a real saved-profile reload.
  await page.reload()
  await page.getByText('Rowan', { exact: true }).click()
  await page.getByRole('button', { name: /Carry on with Level 1/ }).click()
  await typeCurrentItem(page)
  await expect(page.getByText('🌱 Look how far you’ve come', { exact: true })).toBeVisible()
  expect(await currentText(page)).toBe(firstRound[0])
})

test('an old starting eleven can fill its expanded squad with seven more players', async ({ page }) => {
  await createPlayer(page, 'Skipper', /^Women's Super League/)
  const newNames = ['Phallon Tullis-Joyce', 'Lotte Wubben-Moy', 'Naomi Girma', 'Sjoeke Nüsken', 'Jess Park', 'Lauren Hemp', 'Aggie Beever-Jones']
  await page.evaluate(() => {
    const key = 'typing-teacher.save.v1'
    const saved = JSON.parse(localStorage.getItem(key)!)
    saved.version = 3
    saved.state.save.version = 3
    const p = saved.state.save.profiles[0]
    delete p.practice
    p.coins = 140
    p.badges = ['full-garden']
    p.garden = ['hampton', 'bronze', 'bright', 'williamson', 'greenwood', 'walsh', 'toone', 'mariona', 'james', 'russo', 'shaw'].map(kindId => ({ kindId, stage: 4 }))
    localStorage.setItem(key, JSON.stringify(saved))
  })
  await page.reload()
  await page.getByText('Skipper', { exact: true }).click()
  await page.getByRole('button', { name: /Squad/ }).click()
  await expect(page.locator('[aria-label="Your collection"] > div')).toHaveCount(18)
  for (const name of newNames) await page.getByRole('button', { name: new RegExp(name) }).click()
  await expect(page.locator('[aria-label="Your collection"] img')).toHaveCount(18)
  const images = await page.locator('[aria-label="Your collection"] img').evaluateAll(async imgs => {
    await Promise.all(imgs.map(img => (img as HTMLImageElement).decode()))
    return imgs.every(img => (img as HTMLImageElement).naturalWidth > 0)
  })
  expect(images).toBe(true)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('typing-teacher.save.v1')!))
  expect(saved.version).toBe(4)
  expect(saved.state.save.profiles[0]).toMatchObject({ coins: 0, badges: ['full-garden'], practice: [] })
  await expect(page.getByRole('button', { name: /Phallon Tullis-Joyce/ })).toBeDisabled()
})
