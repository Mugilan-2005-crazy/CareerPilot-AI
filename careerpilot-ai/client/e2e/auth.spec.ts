import { test, expect, Page } from '@playwright/test';
import { execSync } from 'node:child_process';

const uniqueEmail = () => `e2e-${Date.now()}@example.com`;
const PASSWORD = 'password123';

/**
 * Register a brand-new user via the UI and return the page (now on dashboard).
 */
async function registerUser(page: Page, email: string) {
  await page.goto('/register');
  await page.fill('input[type="text"]', 'E2E Test User');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator('text=Student Dashboard')).toBeVisible();
}

/**
 * Log in via the UI and return the page (now on dashboard).
 */
async function loginUser(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator('text=Student Dashboard')).toBeVisible();
}

test.describe('Authenticated E2E', () => {
    test('application loads and shows the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CareerPilot/i);
    // "CareerPilot AI" appears multiple times; scope to the header for uniqueness
    await expect(page.locator('header').getByText('CareerPilot AI')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  });

  test('protected route redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    // Login form should be visible after redirect
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('register creates account and auto-logs-in to dashboard', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email);
    // Verify the token is persisted in localStorage
    const token = await page.evaluate(() => localStorage.getItem('cp_access_token'));
    expect(token).not.toBeNull();
    const refreshToken = await page.evaluate(() => localStorage.getItem('cp_refresh_token'));
    expect(refreshToken).not.toBeNull();
  });

  test('login flow works and reaches dashboard', async ({ page }) => {
    const email = uniqueEmail();
    // Register first to create the user
    await registerUser(page, email);
    // Log out by clearing localStorage
    await page.evaluate(() => {
      localStorage.removeItem('cp_access_token');
      localStorage.removeItem('cp_refresh_token');
    });
    // Now login
    await loginUser(page, email);
    // Token should be present again
    const token = await page.evaluate(() => localStorage.getItem('cp_access_token'));
    expect(token).not.toBeNull();
  });

  test('session persists across page reload', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email);

    // Reload the page — token persists in localStorage
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Student Dashboard')).toBeVisible();
  });

  test('logout (clearing tokens) redirects to login on protected route', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email);

    // Simulate logout by clearing tokens via the authService
    await page.evaluate(async () => {
      const refreshToken = localStorage.getItem('cp_refresh_token');
      if (refreshToken) {
        try {
          await fetch('/api/v1/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
        } catch {
          // ignore — logout best-effort
        }
      }
      localStorage.removeItem('cp_access_token');
      localStorage.removeItem('cp_refresh_token');
    });

    // Navigating to /dashboard should now redirect to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('failed refresh clears session and redirects to login', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email);

    // Corrupt the access token and remove the refresh token to simulate
    // an expired / invalidated session that cannot be recovered.
    await page.evaluate(() => {
      const token = localStorage.getItem('cp_access_token');
      if (token) localStorage.setItem('cp_access_token', token + 'corrupted');
      localStorage.removeItem('cp_refresh_token');
    });

    // Reload: RequireAuth still sees a token (corrupted) and lets the page
    // render. DashboardPage's API call fails with 401, the interceptor
    // tries to refresh, fails (no refresh token), and clears all tokens.
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Allow the async interceptor to finish clearing tokens
    await page.waitForTimeout(1500);

    // Both tokens should now be gone
    const access = await page.evaluate(() => localStorage.getItem('cp_access_token'));
    const refresh = await page.evaluate(() => localStorage.getItem('cp_refresh_token'));
    expect(access).toBeNull();
    expect(refresh).toBeNull();

    // Navigating to /dashboard must now redirect to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});
