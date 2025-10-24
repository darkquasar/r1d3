/**
 * E2E Tests: Toggle Rendering
 *
 * End-to-end tests for toggle-based mental model and visualization rendering
 * Tests the complete user workflow for all 3 bug fixes
 */

import { test, expect } from '@playwright/test';

test.describe('Toggle Rendering E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Wait for graph to load
    await page.waitForSelector('[data-testid="graph-canvas"]', { timeout: 10000 });
  });

  test('Issue 1: Visualization only appears when its toggle is ON', async ({ page }) => {
    // Click on a phase node to open detail panel
    await page.click('[data-id="research"]');

    // Wait for detail panel
    await expect(page.locator('[data-testid="detail-panel"]')).toBeVisible();

    // Find mental model toggle and turn it ON
    const mentalModelToggle = page.locator('[data-testid="mental-model-toggle-daiki"]');
    await mentalModelToggle.click();

    // Mental model should be visible
    await expect(page.locator('[data-id="daiki"]')).toBeVisible();

    // But visualization should NOT be visible yet
    await expect(page.locator('[data-id="viz-daiki"]')).not.toBeVisible();

    // Now click on the mental model to open its detail panel
    await page.click('[data-id="daiki"]');

    // Find visualization toggle and verify it's OFF
    const vizToggle = page.locator('[data-testid="visualization-toggle"]');
    await expect(vizToggle).toHaveAttribute('aria-checked', 'false');

    // Turn visualization toggle ON
    await vizToggle.click();

    // Now visualization should appear
    await expect(page.locator('[data-id="viz-daiki"]')).toBeVisible();
  });

  test('Issue 2: Visualization disappears when toggled OFF', async ({ page }) => {
    // Setup: Toggle mental model and visualization ON
    await page.click('[data-id="research"]');
    await page.click('[data-testid="mental-model-toggle-daiki"]');
    await page.click('[data-id="daiki"]');
    await page.click('[data-testid="visualization-toggle"]');

    // Visualization should be visible
    await expect(page.locator('[data-id="viz-daiki"]')).toBeVisible();

    // Toggle visualization OFF
    await page.click('[data-testid="visualization-toggle"]');

    // Visualization should disappear
    await expect(page.locator('[data-id="viz-daiki"]')).not.toBeVisible();

    // But mental model should still be visible
    await expect(page.locator('[data-id="daiki"]')).toBeVisible();
  });

  test('Issue 3: Mental model edges disappear when all phase toggles OFF', async ({ page }) => {
    // Toggle mental model ON from phase 1
    await page.click('[data-id="research"]');
    await page.click('[data-testid="mental-model-toggle-daiki"]');

    // Edge should exist
    await expect(page.locator('[data-id="mental-research-daiki"]')).toBeVisible();

    // Toggle mental model ON from phase 2
    await page.click('[data-id="discovery"]');
    await page.click('[data-testid="mental-model-toggle-daiki"]');

    // Both edges should exist
    await expect(page.locator('[data-id="mental-research-daiki"]')).toBeVisible();
    await expect(page.locator('[data-id="mental-discovery-daiki"]')).toBeVisible();

    // Toggle OFF from phase 1
    await page.click('[data-id="research"]');
    await page.click('[data-testid="mental-model-toggle-daiki"]');

    // Phase 1 edge should be gone
    await expect(page.locator('[data-id="mental-research-daiki"]')).not.toBeVisible();
    // Phase 2 edge should remain
    await expect(page.locator('[data-id="mental-discovery-daiki"]')).toBeVisible();

    // Toggle OFF from phase 2 (all toggles now OFF)
    await page.click('[data-id="discovery"]');
    await page.click('[data-testid="mental-model-toggle-daiki"]');

    // All edges should be gone
    await expect(page.locator('[data-id="mental-research-daiki"]')).not.toBeVisible();
    await expect(page.locator('[data-id="mental-discovery-daiki"]')).not.toBeVisible();

    // Mental model itself should disappear
    await expect(page.locator('[data-id="daiki"]')).not.toBeVisible();
  });

  test('Visualization respects parent mental model visibility', async ({ page }) => {
    // Toggle mental model ON and visualization ON
    await page.click('[data-id="research"]');
    await page.click('[data-testid="mental-model-toggle-daiki"]');
    await page.click('[data-id="daiki"]');
    await page.click('[data-testid="visualization-toggle"]');

    // Both should be visible
    await expect(page.locator('[data-id="daiki"]')).toBeVisible();
    await expect(page.locator('[data-id="viz-daiki"]')).toBeVisible();

    // Toggle mental model OFF (parent)
    await page.click('[data-id="research"]');
    await page.click('[data-testid="mental-model-toggle-daiki"]');

    // Both should disappear (viz respects parent visibility)
    await expect(page.locator('[data-id="daiki"]')).not.toBeVisible();
    await expect(page.locator('[data-id="viz-daiki"]')).not.toBeVisible();
  });

  test('Directional positioning: visualizations appear in same direction as mental model', async ({ page }) => {
    // Toggle mental model ON
    await page.click('[data-id="research"]');
    await page.click('[data-testid="mental-model-toggle-daiki"]');

    // Get mental model position
    const mentalModelBox = await page.locator('[data-id="daiki"]').boundingBox();
    expect(mentalModelBox).not.toBeNull();

    // Toggle visualization ON
    await page.click('[data-id="daiki"]');
    await page.click('[data-testid="visualization-toggle"]');

    // Get visualization position
    const vizBox = await page.locator('[data-id="viz-daiki"]').boundingBox();
    expect(vizBox).not.toBeNull();

    // Get phase grid center (approximate)
    const canvasBox = await page.locator('[data-testid="graph-canvas"]').boundingBox();
    expect(canvasBox).not.toBeNull();

    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;

    // Calculate mental model direction from center
    const mmX = mentalModelBox!.x + mentalModelBox!.width / 2;
    const mmY = mentalModelBox!.y + mentalModelBox!.height / 2;
    const mmVectorX = mmX - centerX;
    const mmVectorY = mmY - centerY;

    // Calculate visualization direction from center
    const vizX = vizBox!.x + vizBox!.width / 2;
    const vizY = vizBox!.y + vizBox!.height / 2;
    const vizVectorX = vizX - centerX;
    const vizVectorY = vizY - centerY;

    // Vectors should point in the same general direction
    // (dot product of normalized vectors should be positive and close to 1)
    const mmMag = Math.sqrt(mmVectorX ** 2 + mmVectorY ** 2);
    const vizMag = Math.sqrt(vizVectorX ** 2 + vizVectorY ** 2);

    const dotProduct = (mmVectorX * vizVectorX + mmVectorY * vizVectorY) / (mmMag * vizMag);

    // Dot product > 0.8 means vectors are in roughly the same direction (within ~36 degrees)
    expect(dotProduct).toBeGreaterThan(0.8);
  });
});
