import { expect, test } from '@playwright/test';

function uniqueUser(prefix: string) {
  const t = Date.now();
  return {
    username: `${prefix}${t}`,
    email: `${prefix}${t}@test.local`,
    password: 'pass1234',
  };
}

async function register(page: import('@playwright/test').Page, user: { username: string; email: string; password: string }) {
  await page.goto('/register');
  await page.locator('input[placeholder="Choose a username"]').fill(user.username);
  await page.locator('input[placeholder="teacher@school.edu"]').fill(user.email);
  await page.locator('input[placeholder="At least 6 characters"]').fill(user.password);
  await page.locator('input[placeholder="Re-enter password"]').fill(user.password);
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL(/\/app\/dashboard/);
}

async function login(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/login');
  await page.locator('input[placeholder*="admin or teacher"]').fill(username);
  await page.locator('input[placeholder="••••••••"]').fill(password);
  await page.getByRole('button', { name: 'Sign In to Dashboard' }).click();
}

test('login page shows AI-ActivEdu branding', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('AI-ActivEdu').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('top-right account identity switches between users', async ({ page }) => {
  const userA = uniqueUser('qa_a_');
  const userB = uniqueUser('qa_b_');

  await register(page, userA);
  const header = page.locator('header');
  await expect(header.getByText(userA.username)).toBeVisible();

  await page.locator('button[title="Log out"]').click();
  await expect(page).toHaveURL(/\/login/);

  await register(page, userB);
  await expect(page.locator('header').getByText(userB.username)).toBeVisible();
  await expect(page.locator('header').getByText(userA.username)).toHaveCount(0);
});

test('admin can open admin console', async ({ page }) => {
  await login(page, 'admin', 'admin123');
  await expect(page).toHaveURL(/\/app\/dashboard/);

  await page.goto('/app/admin');
  await expect(page.getByRole('heading', { name: 'Admin Console' })).toBeVisible();
  await expect(page.getByText('Accounts Management')).toBeVisible();
});
