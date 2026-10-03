import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/og.png');
const maxBytes = 300 * 1024;

const WORDMARK = 'Искра';
const SUBLINE = 'Разговорная игра';

const dataUrl = (path, mime) => `data:${mime};base64,${readFileSync(resolve(root, path)).toString('base64')}`;

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Lora';
    src: url(${dataUrl('public/fonts/Lora-Regular.woff2', 'font/woff2')}) format('woff2');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Lora';
    src: url(${dataUrl('public/fonts/Lora-Bold.woff2', 'font/woff2')}) format('woff2');
    font-weight: 700;
  }
  html, body {
    margin: 0;
    width: 1200px;
    height: 630px;
    background: #E4D7BE;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 72px;
    font-family: 'Lora', serif;
    -webkit-font-smoothing: antialiased;
  }
  img {
    width: 320px;
    height: 320px;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .wordmark {
    font-weight: 700;
    font-size: 132px;
    line-height: 1;
    letter-spacing: -0.01em;
    color: #2C2620;
  }
  .subline {
    font-weight: 400;
    font-size: 50px;
    line-height: 1.1;
    color: #9A8C78;
  }
</style>
</head>
<body>
  <img src="${dataUrl('src/assets/engravings/logo-seal.png', 'image/png')}" alt="" />
  <div class="text">
    <div class="wordmark">${WORDMARK}</div>
    <div class="subline">${SUBLINE}</div>
  </div>
</body>
</html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  if (png.length > maxBytes) {
    throw new Error(`og.png is ${png.length} bytes, budget is ${maxBytes}`);
  }
  writeFileSync(out, png);
  console.log(`${out} ${png.length} bytes`);
} finally {
  await browser.close();
}
