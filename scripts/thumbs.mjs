/**
 * Generates the gallery thumbnails (public/thumbs/<id>.jpg) from the running app.
 *
 * Needs: the dev server running, Chrome installed, and `playwright-core`
 * (`pnpm dlx playwright-core` is enough, or set PLAYWRIGHT_CORE to its folder).
 *
 *   pnpm dev                       # in one terminal
 *   node scripts/thumbs.mjs        # in another (default http://localhost:3000)
 *   node scripts/thumbs.mjs http://localhost:3001 mesh,aurora   # custom URL / subset
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [baseUrl = 'http://localhost:3000', idsArg] = process.argv.slice(2);
const outDir = path.join(root, 'public', 'thumbs');

const WIDTH = 480;
const HEIGHT = 300;
const TIME = 6; // seconds into the animation (same instant the previews use)

async function loadChromium() {
    try {
        if (process.env.PLAYWRIGHT_CORE) {
            return createRequire(path.join(process.env.PLAYWRIGHT_CORE, 'package.json'))('playwright-core').chromium;
        }
        return (await import('playwright-core')).chromium;
    } catch {
        console.error('playwright-core not found. Install it (pnpm dlx playwright-core) or set PLAYWRIGHT_CORE.');
        process.exit(1);
    }
}

const chromium = await loadChromium();
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'],
});
const page = await (await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })).newPage();

await page.goto(`${baseUrl}/?tier=ultra&lang=en`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__bg?.app?.uiController, null, { timeout: 30000 });
await page.addStyleTag({ content: '.minimal-overlay, hud-dock, #desktop-panel-container, bottom-sheet { display: none !important; }' });

const ids = idsArg
    ? idsArg.split(',')
    : await page.evaluate(() => window.__bg.app.shaderManager.getAvailableShaders());

for (const id of ids) {
    await page.evaluate(({ id, time }) => {
        const { uiController, shaderManager, renderer } = window.__bg.app;
        uiController.selectShader(id);
        renderer.setRenderScale(1); // thumbnails at full quality
        shaderManager.updateResolution();
        shaderManager.freeze(time);
    }, { id, time: TIME });
    await page.waitForTimeout(900);
    const file = path.join(outDir, `${id}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 78 });
    console.log(`${id}.jpg  ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}

await browser.close();
