// Phase 7 — PWA install layer. Static-contract tests: the manifest,
// icons, SW file, and index.html wiring are all servable and
// well-formed. SW RUNTIME behavior (caching strategies, killswitch)
// is not exercised here — registration is production-only and
// Playwright dev-server tests would need a built+served bundle;
// strategy correctness was Codex-reviewed instead (quasi-strict per
// CLAUDE.md PWA constraints).

import { test, expect } from '@playwright/test';

test.describe('Phase 7 PWA — static contracts', () => {

  test('P1 manifest: served, parses, standalone display, icons + maskable present', async ({ request }) => {
    const res = await request.get('/manifest.webmanifest');
    expect(res.ok()).toBe(true);
    const manifest = JSON.parse(await res.text());
    expect(manifest.name).toBe('TheGrind');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBe('#0a0a12');
    const sizes = manifest.icons.map(i => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some(i => i.purpose === 'maskable')).toBe(true);
  });

  test('P2 icons: 192/512/apple-touch all served as PNG', async ({ request }) => {
    for (const path of ['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']) {
      const res = await request.get(path);
      expect(res.ok()).toBe(true);
      expect(res.headers()['content-type']).toContain('image/png');
    }
  });

  test('P3 sw.js: served as JS with the cache-version + killswitch markers', async ({ request }) => {
    const res = await request.get('/sw.js');
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body).toContain("const CACHE = 'grind-v2-sw-");
    expect(body).toContain('skipWaiting');
    expect(body).toContain('clients.claim');
    // /api/* must never be cached.
    expect(body).toContain("startsWith('/api/')");
  });

  test('P4 index.html: manifest + apple-touch-icon + iOS meta wired', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/apple-touch-icon.png');
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0a0a12');
  });
});
