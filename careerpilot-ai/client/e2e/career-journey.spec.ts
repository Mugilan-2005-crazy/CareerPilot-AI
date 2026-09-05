import { test, expect, Page } from '@playwright/test';

const uniqueEmail = () => `e2e-journey-${Date.now()}@example.com`;
const PASSWORD = 'password123';

async function registerUser(page: Page, email: string) {
  await page.goto('/register');
  await page.fill('input[type="text"]', 'E2E Journey User');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator('text=Student Dashboard')).toBeVisible();
}

async function loginUser(page: Page, email: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator('text=Student Dashboard')).toBeVisible();
}

test.describe('CareerPilot AI E2E User Journey', () => {
  test('complete career intelligence journey', async ({ page }) => {
    const email = uniqueEmail();

    // 1. Register
    await registerUser(page, email);

    // 2. Dashboard loads with user name
    await expect(page.locator('text=Student Dashboard')).toBeVisible();
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible({ timeout: 10000 });

    // 3. Career Explorer
    await page.goto('/careers');
    await page.fill('input[placeholder="python, javascript, sql, docker"]', 'python, sql, javascript');
    await page.fill('input[placeholder="ai, cloud, data"]', 'ai, data');
    await page.fill('input[type="number"]', '2');
    await page.click('button:has-text("Find Careers")');
    await page.waitForSelector('text=Best Match', { timeout: 15000 });

    // 4. Skill Gap Analysis
    await page.goto('/skill-gap');
    await page.fill('input[placeholder="python, sql, react"]', 'python, sql');
    await page.fill('input[placeholder="Data Scientist"]', 'Data Scientist');
    await page.fill('input[type="number"]', '2');
    await page.click('button:has-text("Analyze Gap")');
    await page.waitForSelector('text=Missing Skills', { timeout: 15000 });

    // 5. Roadmap Generation
    await page.goto('/roadmap');
    await page.fill('input[placeholder="Data Scientist"]', 'Data Scientist');
    await page.fill('input[placeholder="python, sql, statistics"]', 'python, sql');
    await page.fill('input[type="number"]', '10');
    await page.fill('input[type="number"]', '6');
    await page.click('button:has-text("Generate Roadmap")');
    await page.waitForSelector('text=weeks', { timeout: 15000 });

    // 6. Project Recommendations
    await page.goto('/projects');
    await page.fill('input[placeholder="Software Engineer"]', 'Software Engineer');
    await page.fill('input[placeholder="python, react, sql"]', 'python, sql');
    await page.selectOption('select', 'intermediate');
    await page.click('button:has-text("Find Projects")');
    await page.waitForSelector('text=Technologies', { timeout: 15000 });

    // 7. Resume Analysis
    await page.goto('/resume-analyzer');
    await page.fill('textarea', 'Experienced software engineer with Python, JavaScript, SQL and database design. Led teams and shipped APIs.');
    await page.fill('input[placeholder="Software Engineer"]', 'Software Engineer');
    await page.click('button:has-text("Analyze Resume")');
    await page.waitForSelector('text=ATS Score', { timeout: 15000 });

    // 8. Interview Coach
    await page.goto('/interview-coach');
    await page.fill('input[placeholder="Software Engineer"]', 'Software Engineer');
    await page.selectOption('select', 'mid');
    await page.selectOption('select:has-text("Medium")', 'medium');
    await page.click('button:has-text("Generate Questions")');
    await page.waitForSelector('text=Questions', { timeout: 15000 });

    // 9. AI Chat
    await page.goto('/ai-chat');
    await page.fill('input[placeholder="Ask about careers, skills, roadmaps..."]', 'What skills should I learn?');
    await page.press('input[placeholder="Ask about careers, skills, roadmaps..."]', 'Enter');
    await page.waitForSelector('text=Skill development', { timeout: 15000 });

    // 10. Logout
    await page.goto('/dashboard');
    await page.click('button:has-text("Logout")');
    // Wait for tokens to be cleared
    await page.waitForFunction(() => !localStorage.getItem('cp_access_token'));
    // After logout, navigating to a protected route should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login with existing credentials works', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email);

    // Log out
    await page.evaluate(async () => {
      const refreshToken = localStorage.getItem('cp_refresh_token');
      if (refreshToken) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      }
      localStorage.clear();
    });

    // Login again
    await loginUser(page, email);
    await expect(page.locator('text=Student Dashboard')).toBeVisible();
  });

  test('protected routes redirect unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    const protectedRoutes = ['/dashboard', '/careers', '/skill-gap', '/roadmap', '/projects', '/resume-analyzer', '/interview-coach', '/ai-chat'];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
