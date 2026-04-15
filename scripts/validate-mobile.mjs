import { webkit, devices } from 'playwright';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'screenshots');
await mkdir(outDir, { recursive: true });
const url = process.env.SNAP_URL || 'http://localhost:5173';

const profiles = [
  { name: 'validate-iphone-se',  device: devices['iPhone SE'] },
  { name: 'validate-iphone-12',  device: devices['iPhone 12'] },
  {
    name: 'validate-messenger-inapp',
    device: {
      ...devices['iPhone 12'],
      viewport: { width: 390, height: 580 },
    },
  },
];

for (const { name, device } of profiles) {
  const browser = await webkit.launch();
  const ctx = await browser.newContext({ ...device });
  const page = await ctx.newPage();
  await page.route('**/fonts.googleapis.com/**', r => r.abort());
  await page.route('**/fonts.gstatic.com/**', r => r.abort());
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(outDir, `${name}-fold.png`), timeout: 60000, animations: 'disabled' });
    console.log(`✓ ${name} ${device.viewport.width}x${device.viewport.height}`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  } finally {
    await browser.close();
  }
}
