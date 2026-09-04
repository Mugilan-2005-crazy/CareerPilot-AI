import { test, expect, Page } from '@playwright/test';

/**
 * AI-protection E2E tests.
 *
 * These verify from the browser perspective that AI endpoints are gated
 * behind authentication — i.e. the frontend cannot invoke AI without a
 * valid JWT, and receiving a 401 is handled gracefully.
 */

test.describe('AI Endpoint Protection', () => {
    test('AI endpoint returns 401 when no JWT is present', async ({ page }) => {
    // Navigate to a non-protected page first so localStorage is accessible.
    // Without a valid token the AI endpoint must reject the request.
    await page.goto('/');

    await page.evaluate(() => {
      localStorage.removeItem('cp_access_token');
      localStorage.removeItem('cp_refresh_token');
    });

    // Attempt to call the AI endpoint directly from the browser.
    // The vite dev-server proxy forwards /api to the backend.
    const response = await page.evaluate(async () => {
      const resp = await fetch('/api/v1/ai/resume-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: 'Experienced software engineer with skills.' }),
      });
      return { status: resp.status, body: await resp.text() };
    });

    expect(response.status).toBe(401);
    expect(response.body).toContain('No token provided');
  });

  test('legacy AI endpoint also requires authentication', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      localStorage.removeItem('cp_access_token');
      localStorage.removeItem('cp_refresh_token');
    });

    const response = await page.evaluate(async () => {
      const resp = await fetch('/api/ai/resume-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: 'Experienced software engineer with skills.' }),
      });
      return { status: resp.status, body: await resp.text() };
    });

    expect(response.status).toBe(401);
  });
});
