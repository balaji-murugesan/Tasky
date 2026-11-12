/**
 * Capture screenshots of every page in screenshots.config.json, at every viewport.
 * Output: artifacts/screenshots/<page>--<viewport>.png + manifest.json
 *
 *   npm run screenshots                 # all pages
 *   npm run screenshots -- home-empty   # only the named pages
 *
 * Assumes the app is running (npm run app:up). CI and the screenshot skill
 * call this, then post the PNGs on the PR.
 */
import { chromium, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

type Step = { fill?: string; value?: string; click?: string; check?: string; waitFor?: string };
type PageSpec = { name: string; path: string; reset?: boolean; steps: Step[] };
type Config = { viewports: { name: string; width: number; height: number }[]; pages: PageSpec[] };

const BASE = process.env.BASE_URL ?? `http://localhost:${process.env.WEB_PORT ?? 5173}`;
const OUT = "artifacts/screenshots";

async function runStep(page: Page, s: Step) {
  if (s.fill) await page.getByLabel(s.fill).fill(s.value ?? "");
  if (s.click) await page.getByRole("button", { name: s.click }).click();
  if (s.check) await page.getByLabel(s.check).check();
  if (s.waitFor) await page.getByText(s.waitFor).waitFor();
  await page.waitForLoadState("networkidle");
}

async function main() {
  const config: Config = JSON.parse(await readFile("screenshots.config.json", "utf8"));
  const only = process.argv.slice(2);
  const pages = only.length ? config.pages.filter((p) => only.includes(p.name)) : config.pages;
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {});
  const manifest: { page: string; viewport: string; file: string }[] = [];

  for (const vp of config.viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    for (const spec of pages) {
      if (spec.reset) await ctx.request.post(`${BASE}/api/__reset`);
      const page = await ctx.newPage();
      await page.goto(BASE + spec.path, { waitUntil: "networkidle" });
      for (const step of spec.steps) await runStep(page, step);
      const file = `${OUT}/${spec.name}--${vp.name}.png`;
      await page.screenshot({ path: file, fullPage: true });
      manifest.push({ page: spec.name, viewport: vp.name, file });
      console.log("📸", file);
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
  await writeFile(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
