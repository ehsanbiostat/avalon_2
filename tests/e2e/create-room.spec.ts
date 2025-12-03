/**
 * E2E Smoke Test: Create Room Flow
 * Tests the complete user journey from landing page to room creation
 */

import { test, expect, Page } from '@playwright/test';

// Helper to generate unique nickname for test isolation
function generateNickname() {
  return `Test${Date.now().toString(36).slice(-4)}`;
}

// Helper to clear localStorage between tests
async function clearPlayerData(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('avalon_player_id');
    localStorage.removeItem('avalon_nickname');
  });
}

test.describe('Create Room Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh - clear any existing player data
    await page.goto('/');
    await clearPlayerData(page);
    await page.reload();
  });

  test('should show landing page with nickname input', async ({ page }) => {
    await page.goto('/');

    // Should see the landing page elements
    await expect(page.locator('h1')).toContainText(/avalon/i);

    // Should have nickname input
    const nicknameInput = page.getByPlaceholder(/nickname|name/i);
    await expect(nicknameInput).toBeVisible();
  });

  test('should validate nickname before allowing actions', async ({ page }) => {
    await page.goto('/');

    // Try to proceed without entering nickname
    const continueButton = page.getByRole('button', { name: /continue|enter|submit/i });

    if (await continueButton.isVisible()) {
      await continueButton.click();

      // Should show validation error
      await expect(page.getByText(/nickname|required|invalid/i)).toBeVisible();
    }
  });

  test('should register player with valid nickname', async ({ page }) => {
    await page.goto('/');

    const nickname = generateNickname();
    const nicknameInput = page.getByPlaceholder(/nickname|name/i);
    await nicknameInput.fill(nickname);

    // Click continue/enter
    const continueButton = page.getByRole('button', { name: /continue|enter/i });
    await continueButton.click();

    // Wait for registration to complete
    await page.waitForTimeout(1000);

    // Should now show room options (create/join)
    const createButton = page.getByRole('button', { name: /create.*room/i });
    await expect(createButton).toBeVisible({ timeout: 5000 });
  });

  test('should open create room modal with player count selection', async ({ page }) => {
    await page.goto('/');

    // Register first
    const nickname = generateNickname();
    await page.getByPlaceholder(/nickname|name/i).fill(nickname);
    await page.getByRole('button', { name: /continue|enter/i }).click();

    // Wait for registration
    await page.waitForTimeout(1000);

    // Click create room
    const createButton = page.getByRole('button', { name: /create.*room/i });
    await createButton.click();

    // Should see player count options (5-10)
    await expect(page.getByText(/5/)).toBeVisible();
    await expect(page.getByText(/10/)).toBeVisible();

    // Should show role distribution info
    await expect(page.getByText(/good|loyal/i)).toBeVisible();
    await expect(page.getByText(/evil|minion/i)).toBeVisible();
  });

  test('should create room and redirect to lobby', async ({ page }) => {
    await page.goto('/');

    // Register
    const nickname = generateNickname();
    await page.getByPlaceholder(/nickname|name/i).fill(nickname);
    await page.getByRole('button', { name: /continue|enter/i }).click();
    await page.waitForTimeout(1000);

    // Open create room modal
    await page.getByRole('button', { name: /create.*room/i }).click();
    await page.waitForTimeout(500);

    // Select 5 players (click on the 5 option)
    const playerOption = page.getByRole('button', { name: /^5$|5 players/i }).first();
    if (await playerOption.isVisible()) {
      await playerOption.click();
    }

    // Click create
    const createConfirmButton = page.getByRole('button', { name: /^create|create room$/i }).last();
    await createConfirmButton.click();

    // Should redirect to room lobby
    await page.waitForURL(/\/rooms\/[A-Z0-9]+/i, { timeout: 10000 });

    // Should show room code
    await expect(page.getByText(/room code/i)).toBeVisible();

    // Should show current player as manager
    await expect(page.getByText(/manager/i)).toBeVisible();
  });

  test('should show player in lobby after creating room', async ({ page }) => {
    await page.goto('/');

    // Full create flow
    const nickname = generateNickname();
    await page.getByPlaceholder(/nickname|name/i).fill(nickname);
    await page.getByRole('button', { name: /continue|enter/i }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /create.*room/i }).click();
    await page.waitForTimeout(500);

    // Select player count and create
    const playerOption = page.getByRole('button', { name: /^5$|5 players/i }).first();
    if (await playerOption.isVisible()) {
      await playerOption.click();
    }
    await page.getByRole('button', { name: /^create|create room$/i }).last().click();

    // Wait for lobby
    await page.waitForURL(/\/rooms\/[A-Z0-9]+/i, { timeout: 10000 });

    // Should show the player's nickname in the player list
    await expect(page.getByText(nickname)).toBeVisible();

    // Should show "1/5" or similar player count
    await expect(page.getByText(/1\s*\/\s*5/)).toBeVisible();

    // Should show "Waiting for players" or similar status
    await expect(page.getByText(/waiting/i)).toBeVisible();
  });

  test('should display room code that can be copied', async ({ page }) => {
    await page.goto('/');

    // Create room
    const nickname = generateNickname();
    await page.getByPlaceholder(/nickname|name/i).fill(nickname);
    await page.getByRole('button', { name: /continue|enter/i }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /create.*room/i }).click();
    await page.waitForTimeout(500);

    const playerOption = page.getByRole('button', { name: /^5$|5 players/i }).first();
    if (await playerOption.isVisible()) {
      await playerOption.click();
    }
    await page.getByRole('button', { name: /^create|create room$/i }).last().click();

    await page.waitForURL(/\/rooms\/[A-Z0-9]+/i, { timeout: 10000 });

    // Extract room code from URL
    const url = page.url();
    const roomCode = url.split('/rooms/')[1]?.split('/')[0];
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

    // Room code should be displayed on page
    await expect(page.getByText(roomCode)).toBeVisible();

    // Should have a copy button
    const copyButton = page.getByRole('button', { name: /copy|📋/i });
    await expect(copyButton).toBeVisible();
  });

  test('should allow leaving the room', async ({ page }) => {
    await page.goto('/');

    // Create room
    const nickname = generateNickname();
    await page.getByPlaceholder(/nickname|name/i).fill(nickname);
    await page.getByRole('button', { name: /continue|enter/i }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /create.*room/i }).click();
    await page.waitForTimeout(500);

    const playerOption = page.getByRole('button', { name: /^5$|5 players/i }).first();
    if (await playerOption.isVisible()) {
      await playerOption.click();
    }
    await page.getByRole('button', { name: /^create|create room$/i }).last().click();

    await page.waitForURL(/\/rooms\/[A-Z0-9]+/i, { timeout: 10000 });

    // Find and click leave button
    const leaveButton = page.getByRole('button', { name: /leave/i });
    await expect(leaveButton).toBeVisible();
    await leaveButton.click();

    // Should redirect back to home
    await page.waitForURL('/', { timeout: 5000 });
  });
});
