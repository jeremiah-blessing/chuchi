import { test, expect, Page } from '@playwright/test';
import staticFixtures from '../fixtures/static.json' with { type: 'json' };
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Fixture {
  name: string;
  category: 'valid' | 'parse-error' | 'simulation-error';
  description: string;
  code: string;
  expectedErrors?: string[];
  expectedError?: string;
}

function loadFixtures(): Fixture[] {
  const fixtures: Fixture[] = [...(staticFixtures as Fixture[])];
  const generatedPath = resolve(__dirname, '../fixtures/generated.json');
  if (existsSync(generatedPath)) {
    const raw = readFileSync(generatedPath, 'utf-8');
    const generated = JSON.parse(raw) as Fixture[];
    fixtures.push(...generated);
  }
  return fixtures;
}

const fixtures = loadFixtures();
const HEADED = !!process.env.HEADED;
const TYPE_DELAY = Number(process.env.TYPE_DELAY) || (HEADED ? 30 : 5);

async function waitForMonacoReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const m = (window as any).monaco;
      return m && m.editor && m.editor.getEditors().length > 0;
    },
    { timeout: 15_000 }
  );
}

async function setEditorContent(page: Page, code: string): Promise<void> {
  // Clear existing content
  await page.evaluate(() => {
    const editor = (window as any).monaco.editor.getEditors()[0];
    editor.setValue('');
    editor.focus();
  });

  await page
    .locator('[data-testid="editor-container"] .monaco-editor textarea')
    .first()
    .pressSequentially(code, { delay: TYPE_DELAY });
}

async function waitForLspStability(page: Page): Promise<void> {
  // Wait for markers to stabilize: poll until the marker count stays
  // the same for 500ms, or give up after 5 seconds total.
  await page.waitForFunction(
    () => {
      const w = window as any;
      const markers = w.monaco.editor.getModelMarkers({});
      const count = markers.length;
      const prev = w.__e2eLastMarkerCount;
      const prevTime = w.__e2eLastMarkerTime;
      const now = Date.now();

      if (prev !== count) {
        w.__e2eLastMarkerCount = count;
        w.__e2eLastMarkerTime = now;
        return false;
      }
      return now - prevTime > 500;
    },
    { timeout: 5_000 }
  );
}

async function getMarkers(
  page: Page
): Promise<{ message: string; severity: number }[]> {
  return page.evaluate(() => {
    const m = (window as any).monaco;
    return m.editor.getModelMarkers({}).map((marker: any) => ({
      message: marker.message as string,
      severity: marker.severity as number,
    }));
  });
}

for (const fixture of fixtures) {
  test(`[${fixture.category}] ${fixture.name}: ${fixture.description}`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('/');
    await waitForMonacoReady(page);
    await setEditorContent(page, fixture.code);
    await waitForLspStability(page);

    const markers = await getMarkers(page);

    if (fixture.category === 'valid') {
      expect(
        markers,
        `Expected no markers for valid fixture "${fixture.name}", got: ${JSON.stringify(markers.map((m) => m.message))}`
      ).toHaveLength(0);

      await expect(page.getByTestId('player-placeholder')).not.toBeVisible();
      await expect(page.getByTestId('simulation-error')).not.toBeVisible();
      await expect(page.getByTestId('player-viewport')).toBeVisible();
    } else if (fixture.category === 'parse-error') {
      expect(
        markers.length,
        `Expected markers for parse-error fixture "${fixture.name}"`
      ).toBeGreaterThan(0);

      await expect(page.getByTestId('player-placeholder')).toBeVisible();

      if (fixture.expectedErrors) {
        const messages = markers.map((m) => m.message.toLowerCase());
        for (const expected of fixture.expectedErrors) {
          const found = messages.some((msg) =>
            msg.includes(expected.toLowerCase())
          );
          expect(
            found,
            `Expected marker containing "${expected}" but got: ${JSON.stringify(markers.map((m) => m.message))}`
          ).toBe(true);
        }
      }
    } else if (fixture.category === 'simulation-error') {
      expect(
        markers,
        `Expected no markers for simulation-error fixture "${fixture.name}", got: ${JSON.stringify(markers.map((m) => m.message))}`
      ).toHaveLength(0);

      const errorElement = page.getByTestId('simulation-error');
      await expect(errorElement).toBeVisible({ timeout: 5_000 });

      if (fixture.expectedError) {
        const errorText = await errorElement.textContent();
        expect(errorText?.toLowerCase()).toContain(
          fixture.expectedError.toLowerCase()
        );
      }
    }

    // Always assert no unexpected console errors
    // Filter out benign warnings from Monaco/vscode wrapper and Three.js
    const realErrors = consoleErrors.filter(
      (msg) =>
        !msg.includes('WebGL') &&
        !msg.includes('THREE') &&
        !msg.includes('already has context attribute')
    );
    expect(
      realErrors,
      `Unexpected console errors for "${fixture.name}": ${JSON.stringify(realErrors)}`
    ).toHaveLength(0);
    expect(
      pageErrors,
      `Unexpected page errors for "${fixture.name}": ${JSON.stringify(pageErrors)}`
    ).toHaveLength(0);
  });
}
