import { chromium, webkit, devices } from 'playwright';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'screenshots');
const url = process.env.SNAP_URL || 'http://localhost:5173';

const profiles = [
  { name: 'iphone-se',          device: devices['iPhone SE'],          engine: webkit },
  { name: 'iphone-12',          device: devices['iPhone 12'],          engine: webkit },
  { name: 'iphone-14-pro-max',  device: devices['iPhone 14 Pro Max'],  engine: webkit },
  { name: 'pixel-7',            device: devices['Pixel 7'],            engine: chromium },
  { name: 'galaxy-s9',          device: devices['Galaxy S9+'],         engine: chromium },
  { name: 'ipad-mini',          device: devices['iPad Mini'],          engine: webkit },
  // Facebook Messenger in-app browser on iPhone 12 — shorter viewport
  {
    name: 'iphone-12-messenger-inapp',
    device: {
      ...devices['iPhone 12'],
      viewport: { width: 390, height: 580 },
      userAgent: devices['iPhone 12'].userAgent + ' [FBAN/MessengerForiOS;FBAV/450.0]',
    },
    engine: webkit,
  },
];

await mkdir(outDir, { recursive: true });

for (const { name, device, engine } of profiles) {
  const browser = await engine.launch();
  const context = await browser.newContext({ ...device });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const foldPath = join(outDir, `${name}-fold.png`);
    const fullPath = join(outDir, `${name}-full.png`);
    await page.screenshot({ path: foldPath, timeout: 60000, animations: 'disabled' });
    await page.screenshot({ path: fullPath, fullPage: true, timeout: 60000, animations: 'disabled' });
    console.log(`✓ ${name.padEnd(30)} ${device.viewport.width}x${device.viewport.height}`);
  } catch (e) {
    console.error(`✗ ${name}: ${e.message}`);
  } finally {
    await browser.close();
  }
}

console.log(`\nScreenshots in: ${outDir}`);
