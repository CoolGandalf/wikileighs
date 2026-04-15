"""Take screenshots of wikileighs pages for visual verification."""
import asyncio
import pathlib
from playwright.async_api import async_playwright

PAGES = [
    ("home", "http://127.0.0.1:4321/"),
    ("article-person", "http://127.0.0.1:4321/wiki/rachel-shively"),
    ("article-project", "http://127.0.0.1:4321/wiki/men-and-kings"),
    ("article-reference", "http://127.0.0.1:4321/wiki/lifeos-architecture"),
    ("category-person", "http://127.0.0.1:4321/category/person"),
    ("category-project", "http://127.0.0.1:4321/category/project"),
    ("about", "http://127.0.0.1:4321/about"),
]

OUT = pathlib.Path(r"C:/Users/leigh/projects/wikileighs/screenshots")
OUT.mkdir(exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1400, "height": 900})
        page = await ctx.new_page()
        for name, url in PAGES:
            print(f"-> {name}: {url}")
            try:
                await page.goto(url, wait_until="networkidle", timeout=20000)
            except Exception as e:
                print(f"   nav error: {e}")
                continue
            await page.wait_for_timeout(400)
            png = OUT / f"{name}.png"
            await page.screenshot(path=str(png), full_page=True)
            size = png.stat().st_size
            print(f"   wrote {png.name} ({size} bytes)")
        await browser.close()
    print("done")

asyncio.run(main())
