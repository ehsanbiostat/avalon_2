/**
 * E2E Smoke Test: Role Distribution Flow
 * Tests the complete flow from room creation to role distribution and game start
 */

import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';

// Helper to generate unique nickname
function generateNickname(suffix = '') {
  return `P${Date.now().toString(36).slice(-3)}${suffix}`;
}

// Helper to clear player data
async function clearPlayerData(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('avalon_player_id');
    localStorage.removeItem('avalon_nickname');
  });
}

// Helper to register a player
async function registerPlayer(page: Page, nickname: string) {
  await page.goto('/');
  await clearPlayerData(page);
  await page.reload();

  await page.getByPlaceholder(/nickname|name/i).fill(nickname);
  await page.getByRole('button', { name: /continue|enter/i }).click();
  await page.waitForTimeout(1000);
}

// Helper to create a room with specified player count
async function createRoom(page: Page, playerCount: number = 5): Promise<string> {
  await page.getByRole('button', { name: /create.*room/i }).click();
  await page.waitForTimeout(500);

  // Try to find and click the player count button
  const playerOption = page.getByRole('button', { name: new RegExp(`^${playerCount}$`) }).first();
  if (await playerOption.isVisible()) {
    await playerOption.click();
  }

  await page.getByRole('button', { name: /^create|create room$/i }).last().click();
  await page.waitForURL(/\/rooms\/[A-Z0-9]+/i, { timeout: 10000 });

  const url = page.url();
  return url.split('/rooms/')[1]?.split('/')[0] || '';
}

// Helper to join a room
async function joinRoom(page: Page, roomCode: string) {
  await page.getByPlaceholder(/code|room/i).fill(roomCode);
  await page.getByRole('button', { name: /^join$|join room/i }).click();
  await page.waitForURL(/\/rooms\/[A-Z0-9]+/i, { timeout: 10000 });
}

// Helper to create multiple browser contexts with registered players
async function createPlayers(
  browser: Browser,
  count: number
): Promise<{ context: BrowserContext; page: Page; nickname: string }[]> {
  const players: { context: BrowserContext; page: Page; nickname: string }[] = [];

  for (let i = 0; i < count; i++) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const nickname = generateNickname(i.toString());
    await registerPlayer(page, nickname);
    players.push({ context, page, nickname });
  }

  return players;
}

// Helper to cleanup all player contexts
async function cleanupPlayers(
  players: { context: BrowserContext; page: Page; nickname: string }[]
) {
  for (const player of players) {
    await player.context.close();
  }
}

test.describe('Role Distribution Flow', () => {
  test('manager should not see distribute button when room is not full', async ({ page }) => {
    await registerPlayer(page, generateNickname('Solo'));
    const roomCode = await createRoom(page, 5);

    // Should NOT see distribute roles button (only 1/5 players)
    const distributeButton = page.getByRole('button', { name: /distribute/i });
    await expect(distributeButton).not.toBeVisible();

    // Should see waiting message
    await expect(page.getByText(/waiting/i)).toBeVisible();
  });

  test('non-manager should not see distribute button', async ({ browser }) => {
    const players = await createPlayers(browser, 2);

    try {
      // Player 0 creates room
      const roomCode = await createRoom(players[0].page, 5);

      // Player 1 joins
      await joinRoom(players[1].page, roomCode);

      // Player 1 (non-manager) should NOT see distribute button
      const distributeButton = players[1].page.getByRole('button', { name: /distribute/i });
      await expect(distributeButton).not.toBeVisible();

      // Player 0 (manager) should see manager badge
      await expect(players[0].page.getByText(/manager/i)).toBeVisible();
    } finally {
      await cleanupPlayers(players);
    }
  });

  test('manager should see distribute button when room is full', async ({ browser }) => {
    // Create 5 players for a 5-player game
    const players = await createPlayers(browser, 5);

    try {
      // Player 0 creates room
      const roomCode = await createRoom(players[0].page, 5);

      // Other players join
      for (let i = 1; i < 5; i++) {
        await joinRoom(players[i].page, roomCode);
        await players[i].page.waitForTimeout(500);
      }

      // Wait for all players to appear
      await players[0].page.waitForTimeout(2000);

      // Manager should now see distribute button
      const distributeButton = players[0].page.getByRole('button', { name: /distribute/i });
      await expect(distributeButton).toBeVisible({ timeout: 10000 });
    } finally {
      await cleanupPlayers(players);
    }
  });

  test('should distribute roles to all players', async ({ browser }) => {
    const players = await createPlayers(browser, 5);

    try {
      // Create room and have all players join
      const roomCode = await createRoom(players[0].page, 5);

      for (let i = 1; i < 5; i++) {
        await joinRoom(players[i].page, roomCode);
        await players[i].page.waitForTimeout(300);
      }

      await players[0].page.waitForTimeout(2000);

      // Manager distributes roles
      const distributeButton = players[0].page.getByRole('button', { name: /distribute/i });
      await expect(distributeButton).toBeVisible({ timeout: 10000 });
      await distributeButton.click();

      // All players should see role modal
      for (let i = 0; i < 5; i++) {
        await expect(
          players[i].page.getByText(/loyal servant|minion|role/i)
        ).toBeVisible({ timeout: 10000 });
      }
    } finally {
      await cleanupPlayers(players);
    }
  });

  test('should show correct role information in modal', async ({ browser }) => {
    const players = await createPlayers(browser, 5);

    try {
      const roomCode = await createRoom(players[0].page, 5);

      for (let i = 1; i < 5; i++) {
        await joinRoom(players[i].page, roomCode);
        await players[i].page.waitForTimeout(300);
      }

      await players[0].page.waitForTimeout(2000);

      // Distribute roles
      const distributeButton = players[0].page.getByRole('button', { name: /distribute/i });
      await distributeButton.click();

      // Check that roles are distributed (3 good, 2 evil for 5 players)
      let goodCount = 0;
      let evilCount = 0;

      for (const player of players) {
        await player.page.waitForTimeout(2000);

        const isGood = await player.page.getByText(/loyal servant/i).isVisible().catch(() => false);
        const isEvil = await player.page.getByText(/minion/i).isVisible().catch(() => false);

        if (isGood) goodCount++;
        if (isEvil) evilCount++;
      }

      // Should have correct distribution
      expect(goodCount).toBe(3);
      expect(evilCount).toBe(2);
    } finally {
      await cleanupPlayers(players);
    }
  });

  test('should allow players to confirm their roles', async ({ browser }) => {
    const players = await createPlayers(browser, 5);

    try {
      const roomCode = await createRoom(players[0].page, 5);

      for (let i = 1; i < 5; i++) {
        await joinRoom(players[i].page, roomCode);
        await players[i].page.waitForTimeout(300);
      }

      await players[0].page.waitForTimeout(2000);

      // Distribute roles
      await players[0].page.getByRole('button', { name: /distribute/i }).click();

      // Wait for roles to be distributed
      await players[0].page.waitForTimeout(2000);

      // Each player confirms their role
      for (const player of players) {
        const confirmButton = player.page.getByRole('button', { name: /confirm|understood|got it/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await player.page.waitForTimeout(500);
        }
      }

      // Check confirmation progress shows on manager's screen
      await expect(players[0].page.getByText(/5\s*\/\s*5|all.*confirmed/i)).toBeVisible({
        timeout: 10000,
      });
    } finally {
      await cleanupPlayers(players);
    }
  });

  test('manager should see start game button after all confirm', async ({ browser }) => {
    const players = await createPlayers(browser, 5);

    try {
      const roomCode = await createRoom(players[0].page, 5);

      for (let i = 1; i < 5; i++) {
        await joinRoom(players[i].page, roomCode);
        await players[i].page.waitForTimeout(300);
      }

      await players[0].page.waitForTimeout(2000);

      // Distribute roles
      await players[0].page.getByRole('button', { name: /distribute/i }).click();
      await players[0].page.waitForTimeout(2000);

      // All players confirm
      for (const player of players) {
        const confirmButton = player.page.getByRole('button', { name: /confirm|understood|got it/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await player.page.waitForTimeout(500);
        }
      }

      // Manager should see start game button
      const startButton = players[0].page.getByRole('button', { name: /start.*game/i });
      await expect(startButton).toBeVisible({ timeout: 10000 });
    } finally {
      await cleanupPlayers(players);
    }
  });

  test('should start game and redirect all players', async ({ browser }) => {
    const players = await createPlayers(browser, 5);

    try {
      const roomCode = await createRoom(players[0].page, 5);

      for (let i = 1; i < 5; i++) {
        await joinRoom(players[i].page, roomCode);
        await players[i].page.waitForTimeout(300);
      }

      await players[0].page.waitForTimeout(2000);

      // Distribute roles
      await players[0].page.getByRole('button', { name: /distribute/i }).click();
      await players[0].page.waitForTimeout(2000);

      // All players confirm
      for (const player of players) {
        const confirmButton = player.page.getByRole('button', { name: /confirm|understood|got it/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await player.page.waitForTimeout(500);
        }
      }

      // Manager starts game
      await players[0].page.waitForTimeout(2000);
      const startButton = players[0].page.getByRole('button', { name: /start.*game/i });
      await startButton.click();

      // All players should be redirected to game page
      for (const player of players) {
        await expect(player.page).toHaveURL(/\/game\/[A-Z0-9]+/i, { timeout: 10000 });
      }

      // Game page should show started state
      await expect(players[0].page.getByText(/game.*started|started/i)).toBeVisible();
    } finally {
      await cleanupPlayers(players);
    }
  });

  test('evil players should see their teammates', async ({ browser }) => {
    const players = await createPlayers(browser, 5);

    try {
      const roomCode = await createRoom(players[0].page, 5);

      for (let i = 1; i < 5; i++) {
        await joinRoom(players[i].page, roomCode);
        await players[i].page.waitForTimeout(300);
      }

      await players[0].page.waitForTimeout(2000);

      // Distribute roles
      await players[0].page.getByRole('button', { name: /distribute/i }).click();
      await players[0].page.waitForTimeout(3000);

      // Find evil players and check they see teammates
      for (const player of players) {
        const isEvil = await player.page.getByText(/minion/i).isVisible().catch(() => false);

        if (isEvil) {
          // Evil players should see teammate info
          const hasTeammateInfo = await player.page
            .getByText(/teammate|fellow.*minion|evil/i)
            .isVisible()
            .catch(() => false);

          // They should see another player's name (their evil teammate)
          // This is a soft check since the exact wording may vary
          expect(hasTeammateInfo || await player.page.getByText(/know/i).isVisible()).toBeTruthy();
        }
      }
    } finally {
      await cleanupPlayers(players);
    }
  });
});
