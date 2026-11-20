import { chromium, type FullConfig } from "@playwright/test";

const WARM_UP_TIMEOUT_MS = 60_000;

/** Warms up routes and the add-to-cart action so the first test doesn't hit cold-start timeouts. */
export default async function globalSetup(config: FullConfig): Promise<void> {
  const project = config.projects[0];
  const baseURL = project?.use.baseURL;
  if (project === undefined || baseURL === undefined) {
    return;
  }

  const browser = await chromium.launch(project.use.launchOptions);
  try {
    const page = await browser.newPage({ baseURL });
    page.setDefaultTimeout(WARM_UP_TIMEOUT_MS);

    await page.goto("/search");
    await page.goto("/cart");
    await page.goto("/");

    const firstProduct = page.getByRole("article").getByRole("link").first();
    await firstProduct.waitFor();
    await firstProduct.click();
    await page.waitForURL(/\/products\//);

    // The product may be sold out; the action still runs.
    const addButton = page.getByRole("button", { name: "Add to Cart" });
    await addButton.waitFor();
    if (await addButton.isEnabled()) {
      await addButton.click();
      await page.getByRole("status").filter({ hasText: /\S/ }).waitFor();
    }
  } catch (error) {
    console.warn(
      "e2e warm-up did not complete:",
      error instanceof Error ? error.message : "unknown error",
    );
  } finally {
    await browser.close();
  }
}
