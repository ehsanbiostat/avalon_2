/**
 * E2E Test: Role Configuration Flow
 * T075: Tests for Phase 2 role configuration feature
 */

import { test, expect } from '@playwright/test';

test.describe('Role Configuration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and navigate to home
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('can see advanced options toggle on create room modal', async ({ page }) => {
    // Register a player
    await page.fill('input[placeholder*="Enter"]', 'TestPlayer');
    await page.click('button:has-text("Continue")');

    // Wait for registration to complete
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Check for advanced options toggle
    await expect(page.locator('text=Advanced Options')).toBeVisible();
  });

  test('can expand advanced options to see role configuration', async ({ page }) => {
    // Register
    await page.fill('input[placeholder*="Enter"]', 'RoleConfigTester');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Click advanced options
    await page.click('text=Advanced Options');

    // Check for role configuration elements
    await expect(page.locator('text=Configure Special Roles')).toBeVisible();
    await expect(page.locator('text=Good Team Roles')).toBeVisible();
    await expect(page.locator('text=Evil Team Roles')).toBeVisible();
  });

  test('can toggle Percival role', async ({ page }) => {
    // Register
    await page.fill('input[placeholder*="Enter"]', 'PercivalTester');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Expand advanced options
    await page.click('text=Advanced Options');

    // Find and click Percival toggle
    const percivalRow = page.locator('text=Percival').first();
    await expect(percivalRow).toBeVisible();

    // The Percival toggle should be clickable
    await page.click('label:has-text("Percival")');
  });

  test('can toggle Morgana role', async ({ page }) => {
    // Register
    await page.fill('input[placeholder*="Enter"]', 'MorganaTester');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Expand advanced options
    await page.click('text=Advanced Options');

    // Find and click Morgana toggle
    await page.click('label:has-text("Morgana")');
  });

  test('shows warning when Percival enabled without Morgana', async ({ page }) => {
    // Register
    await page.fill('input[placeholder*="Enter"]', 'BalanceTester');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Expand advanced options
    await page.click('text=Advanced Options');

    // Enable Percival only
    await page.click('label:has-text("Percival")');

    // Check for balance warning
    await expect(page.locator('text=Percival works best with Morgana')).toBeVisible();
  });

  test('can select Oberon mode', async ({ page }) => {
    // Register
    await page.fill('input[placeholder*="Enter"]', 'OberonTester');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Expand advanced options
    await page.click('text=Advanced Options');

    // Select a player count that allows Oberon (7+ for 3 evil slots)
    await page.click('button:has-text("7")');

    // Find Oberon mode dropdown
    const oberonSelect = page.locator('select').first();
    await expect(oberonSelect).toBeVisible();
  });

  test('can enable Lady of the Lake', async ({ page }) => {
    // Register
    await page.fill('input[placeholder*="Enter"]', 'LadyTester');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Expand advanced options
    await page.click('text=Advanced Options');

    // Find and click Lady of the Lake toggle
    await page.click('label:has-text("Lady of the Lake")');
  });

  test('shows role configuration summary', async ({ page }) => {
    // Register
    await page.fill('input[placeholder*="Enter"]', 'SummaryTester');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Expand advanced options
    await page.click('text=Advanced Options');

    // Enable Percival and Morgana
    await page.click('label:has-text("Percival")');
    await page.click('label:has-text("Morgana")');

    // Check for summary section
    await expect(page.locator('text=Game Configuration')).toBeVisible();
    await expect(page.locator('text=Roles in Play')).toBeVisible();
  });

  test('can create room with custom configuration', async ({ page }) => {
    // Register
    await page.fill('input[placeholder*="Enter"]', 'CreateTester');
    await page.click('button:has-text("Continue")');
    await expect(page.locator('text=Welcome back')).toBeVisible({ timeout: 5000 });

    // Open create room modal
    await page.click('button:has-text("Create a Room")');

    // Expand advanced options
    await page.click('text=Advanced Options');

    // Enable Percival and Morgana
    await page.click('label:has-text("Percival")');
    await page.click('label:has-text("Morgana")');

    // Click create button (should succeed if validation passes)
    await page.click('button:has-text("Create Room")');

    // Should redirect to room page (URL contains /rooms/)
    await expect(page).toHaveURL(/\/rooms\/[A-Z0-9]+/i, { timeout: 10000 });
  });
});

