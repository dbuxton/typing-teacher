import { test, expect } from '@playwright/test'

/**
 * End-to-end: Star Trail, the space game that lives beside Typing Teacher at its
 * own address with its own save.
 */

test('Star Trail has its own page, and Typing Teacher is still at the root', async ({ page }) => {
  await page.goto('star-trail/')
  await expect(page).toHaveTitle('Star Trail')
  await expect(page.getByRole('heading', { name: 'Star Trail' })).toBeVisible()

  await page.goto('./')
  await expect(page).toHaveTitle('Typing Teacher')
  await expect(page.getByRole('heading', { name: 'Typing Teacher' })).toBeVisible()
})

test('the address without a trailing slash still finds Star Trail', async ({ page }) => {
  await page.goto('star-trail')
  await expect(page).toHaveURL(/\/typing-teacher\/star-trail\/$/)
  await expect(page).toHaveTitle('Star Trail')
})
