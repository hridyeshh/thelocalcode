// Phone-sized captures of the three sites, shown inside Desky's screens.
// Three viewports per site (a full-page shot breaks sites with pinned or 100vh
// sections, like stickynotes' story). Each stop is a scroll offset in px, or a
// selector to scroll to: stickynotes skips its notebook pages for its paintings.
// Run: npm run capture   (drives your installed Google Chrome)
import { chromium } from "playwright-core";

const W = 390;
const H = 844;
const SITES = {
  paperboxd: { url: "https://paperboxd.in", stops: [0, H, 2 * H] },
  stickynotes: { url: "https://stickynotes.in", stops: [0, ".sky", ".hands"] },
  circuitsupport: { url: "https://www.circuitsupport.com", stops: [0, H, 2 * H] },
};

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
});

for (const [slug, { url, stops }] of Object.entries(SITES)) {
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  for (const [i, stop] of stops.entries()) {
    await page.evaluate((s) => {
      const y = typeof s === "number" ? s : document.querySelector(s).getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, y);
    }, stop);
    await page.waitForTimeout(1200); // let lazy images and scroll-in animations settle
    await page.screenshot({ path: `public/sites/${slug}-${i}.jpg`, type: "jpeg", quality: 78 });
  }
  console.log(slug, "ok");
  await page.close();
}
await browser.close();
