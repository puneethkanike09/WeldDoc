#!/usr/bin/env node
/**
 * Generate WeldDoc brochure PDF from the /brochure Next.js page.
 *
 * Usage:
 *   npm run brochure:pdf
 *   npm run brochure:pdf:eur
 *   BROCHURE_REGION=eur npm run brochure:pdf
 *   BROCHURE_URL=http://127.0.0.1:3000/brochure/eur npm run brochure:pdf
 *   BROCHURE_SCALE=3 npm run brochure:pdf   # device pixel ratio (default 3)
 */

import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "public", "brochure");
const defaultPort = process.env.BROCHURE_PORT ?? "3099";
const region = process.env.BROCHURE_REGION ?? "inr";
const pathSuffix = region === "eur" ? "/eur" : "";
const baseUrl =
  process.env.BROCHURE_URL ?? `http://127.0.0.1:${defaultPort}/brochure${pathSuffix}`;
const outFile = path.join(
  outDir,
  region === "eur" ? "welddoc-brochure-eur.pdf" : "welddoc-brochure.pdf",
);
const deviceScaleFactor = Number(process.env.BROCHURE_SCALE ?? "3");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isReachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(url, attempts = 90) {
  for (let i = 0; i < attempts; i += 1) {
    if (await isReachable(url)) return;
    await wait(500);
  }
  throw new Error(`Server not reachable at ${url}`);
}

async function startDevServer() {
  const child = spawn("npm", ["run", "dev", "--", "--port", defaultPort], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: defaultPort },
  });

  let stderr = "";
  child.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  try {
    await waitForServer(baseUrl);
    return { child, started: true };
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(
      `Failed to start Next.js dev server on port ${defaultPort}: ${stderr || error}`,
    );
  }
}

async function resolveChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  try {
    const bundled = puppeteer.executablePath();
    await access(bundled);
    return bundled;
  } catch {
    // Puppeteer Chrome not installed — fall back to Playwright Chromium.
  }

  try {
    const { chromium } = await import("playwright");
    const playwrightPath = chromium.executablePath();
    await access(playwrightPath);
    console.log("Using Playwright Chromium for PDF render");
    return playwrightPath;
  } catch {
    throw new Error(
      "No Chrome found. Run `npx playwright install chromium` or set PUPPETEER_EXECUTABLE_PATH.",
    );
  }
}

async function waitForAssets(page) {
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;

    const images = Array.from(document.images);
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
      ),
    );
  });
}

async function main() {
  await mkdir(outDir, { recursive: true });

  let server = null;
  const alreadyRunning = await isReachable(baseUrl);

  if (!alreadyRunning) {
    console.log(`Starting Next.js on port ${defaultPort}…`);
    server = await startDevServer();
  } else {
    console.log(`Using existing server at ${baseUrl}`);
  }

  const executablePath = await resolveChromePath();
  console.log(`Rendering ${region.toUpperCase()} brochure PDF (scale ${deviceScaleFactor}x)…`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor,
    });
    await page.goto(baseUrl, { waitUntil: "load", timeout: 120_000 });
    await page.waitForSelector(".brochure-page", { timeout: 30_000 });
    await waitForAssets(page);
    await wait(800);
    await page.emulateMediaType("print");

    await page.pdf({
      path: outFile,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await access(outFile);
    console.log(`Saved ${outFile}`);
  } finally {
    await browser.close();
    if (server?.started) {
      server.child.kill("SIGTERM");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
