/**
 * E2E tests for navigation flow
 *
 * Tests the complete user journey of navigating through the framework graph
 */

import { test, expect } from '@playwright/test';

test.describe('Framework Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for graph to load
    await page.waitForSelector('.react-flow');
  });

  test('should navigate to related node via detail panel link', async ({ page }) => {
    // Click on a phase node
    await page.click('text=Research');

    // Wait for detail panel to appear
    await expect(page.locator('[data-testid="detail-panel"]')).toBeVisible();

    // Verify phase details are shown
    await expect(page.locator('text=phase')).toBeVisible();

    // Click on a linked mental model or sub-phase (assuming it exists)
    const relatedLink = page.locator('[data-testid="related-node-link"]').first();
    if (await relatedLink.isVisible()) {
      await relatedLink.click();

      // Detail panel should update with new node info
      await expect(page.locator('[data-testid="detail-panel"]')).toBeVisible();
    }
  });

  test('should use back button to return to previous node', async ({ page }) => {
    // Navigate through multiple nodes
    await page.click('text=Research');
    await page.waitForTimeout(300);

    // Get the first node title
    const firstNodeTitle = await page.locator('[data-testid="detail-panel"] h3').textContent();

    // Click a related node link if available
    const relatedLink = page.locator('[data-testid="related-node-link"]').first();
    if (await relatedLink.isVisible()) {
      await relatedLink.click();
      await page.waitForTimeout(300);

      // Verify we've navigated to a different node
      const secondNodeTitle = await page.locator('[data-testid="detail-panel"] h3').textContent();
      expect(secondNodeTitle).not.toBe(firstNodeTitle);

      // Click back button
      await page.click('button[aria-label="Back"]');
      await page.waitForTimeout(300);

      // Should return to first node
      const returnedNodeTitle = await page.locator('[data-testid="detail-panel"] h3').textContent();
      expect(returnedNodeTitle).toBe(firstNodeTitle);
    }
  });

  test('should use forward button after going back', async ({ page }) => {
    // Navigate through nodes
    await page.click('text=Research');
    await page.waitForTimeout(300);

    const relatedLink = page.locator('[data-testid="related-node-link"]').first();
    if (await relatedLink.isVisible()) {
      await relatedLink.click();
      await page.waitForTimeout(300);

      const secondNodeTitle = await page.locator('[data-testid="detail-panel"] h3').textContent();

      // Go back
      await page.click('button[aria-label="Back"]');
      await page.waitForTimeout(300);

      // Go forward
      await page.click('button[aria-label="Forward"]');
      await page.waitForTimeout(300);

      // Should return to second node
      const forwardNodeTitle = await page.locator('[data-testid="detail-panel"] h3').textContent();
      expect(forwardNodeTitle).toBe(secondNodeTitle);
    }
  });

  test('should disable back button when at start of history', async ({ page }) => {
    // Click first node
    await page.click('text=Research');
    await page.waitForTimeout(300);

    // Back button should be disabled
    const backButton = page.locator('button[aria-label="Back"]');
    await expect(backButton).toBeDisabled();
  });

  test('should disable forward button when at end of history', async ({ page }) => {
    // Click first node
    await page.click('text=Research');
    await page.waitForTimeout(300);

    // Forward button should be disabled
    const forwardButton = page.locator('button[aria-label="Forward"]');
    await expect(forwardButton).toBeDisabled();
  });

  test('should highlight connected nodes when node is selected', async ({ page }) => {
    // Click on a node
    await page.click('text=Research');
    await page.waitForTimeout(300);

    // Connected edges should be highlighted (check for animated class or style)
    const highlightedEdges = page.locator('.react-flow__edge.highlighted, .react-flow__edge[data-animated="true"]');
    const count = await highlightedEdges.count();

    // Expect at least one connected edge to be highlighted
    expect(count).toBeGreaterThan(0);
  });

  test('should pan viewport to focus on navigated node', async ({ page }) => {
    // Click on first node
    await page.click('text=Research');
    await page.waitForTimeout(300);

    // Get viewport transform before navigation
    const viewportBefore = await page.evaluate(() => {
      const viewport = document.querySelector('.react-flow__viewport');
      return viewport?.getAttribute('transform');
    });

    // Navigate to a different node via link
    const relatedLink = page.locator('[data-testid="related-node-link"]').first();
    if (await relatedLink.isVisible()) {
      await relatedLink.click();
      await page.waitForTimeout(500); // Wait for pan animation

      // Get viewport transform after navigation
      const viewportAfter = await page.evaluate(() => {
        const viewport = document.querySelector('.react-flow__viewport');
        return viewport?.getAttribute('transform');
      });

      // Viewport should have changed (panned to new node)
      expect(viewportAfter).not.toBe(viewportBefore);
    }
  });

  test('should support keyboard shortcuts for navigation', async ({ page }) => {
    // Click first node
    await page.click('text=Research');
    await page.waitForTimeout(300);

    const relatedLink = page.locator('[data-testid="related-node-link"]').first();
    if (await relatedLink.isVisible()) {
      await relatedLink.click();
      await page.waitForTimeout(300);

      // Press Alt+Left for back (common browser shortcut)
      await page.keyboard.press('Alt+ArrowLeft');
      await page.waitForTimeout(300);

      // Should navigate back
      // Verify by checking if we can go forward now
      const forwardButton = page.locator('button[aria-label="Forward"]');
      await expect(forwardButton).not.toBeDisabled();
    }
  });
});
