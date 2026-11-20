import { expect, test, type Locator, type Page } from "@playwright/test";

const DEBOUNCE_WAIT_MS = 1_500;

/** Waits for hydration; clicking earlier falls back to a native form POST. */
async function waitForHydration(locator: Locator): Promise<void> {
  await expect
    .poll(() =>
      locator.evaluate((node) => Object.keys(node).some((key) => key.startsWith("__reactProps"))),
    )
    .toBe(true);
}

/** Opens the first in-stock featured product and returns its name. */
async function openInStockProduct(page: Page): Promise<string> {
  await page.goto("/");
  const links = page.getByRole("article").getByRole("link");
  // Cards stream in behind Suspense.
  await expect(links.first()).toBeVisible();
  const hrefs = await links.evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLAnchorElement).getAttribute("href") ?? ""),
  );
  for (const href of hrefs) {
    await page.goto(href);
    const stock = page.getByTestId("stock-status");
    await expect(stock).toContainText(/in stock|out of stock/i);
    if (/in stock/i.test((await stock.textContent()) ?? "")) {
      return (await page.getByRole("heading", { level: 1 }).textContent()) ?? "";
    }
  }
  throw new Error("No featured product is in stock; cannot exercise add to cart.");
}

const ADD_TO_CART_TIMEOUT_MS = 20_000;

/** Adds one in-stock item. Stock is random per request, so retry if the action refuses. */
async function addOneToCart(page: Page): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const name = await openInStockProduct(page);
    const addButton = page.getByRole("button", { name: "Add to Cart" });
    await waitForHydration(addButton);
    await addButton.click();
    const status = page.getByRole("status").filter({ hasText: /\S/ });
    // Each API call takes ~2s and a new cart needs several.
    await expect(status).toBeVisible({ timeout: ADD_TO_CART_TIMEOUT_MS });
    if (((await status.textContent()) ?? "").startsWith("Added 1")) {
      return name;
    }
  }
  throw new Error("Could not add a product to the cart after 5 attempts.");
}

test.describe("home", () => {
  test("shows hero, CTA, promo (if any) and at least 6 product cards", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Gear for people who ship." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Shop all products" })).toBeVisible();

    // The promotion is optional.
    const promo = page.getByRole("complementary", { name: "Current promotion" });
    if ((await promo.count()) > 0) {
      await expect(promo).not.toBeEmpty();
    }

    await expect(page.getByRole("article").nth(5)).toBeVisible();
    expect(await page.getByRole("article").count()).toBeGreaterThanOrEqual(6);
  });
});

test.describe("product page and cart", () => {
  test("shows stock and add to cart increments the header badge", async ({ page }) => {
    await openInStockProduct(page);
    await expect(page.getByTestId("stock-status")).toContainText(/in stock/i);
    await expect(page.getByTestId("cart-count")).toHaveCount(0);

    await addOneToCart(page);
    await expect(page.getByTestId("cart-count")).toHaveText(/^1/);
    await expect(page.getByText("1 item in cart")).toBeAttached();

    // No second add: random stock may clamp it.
  });

  test("cart page: quantity changes update totals; remove shows empty state", async ({ page }) => {
    const name = await addOneToCart(page);
    await page.goto("/cart");

    const subtotal = page.getByTestId("cart-subtotal");
    const lineTotal = page.getByRole("listitem").filter({ hasText: name }).getByText(/\$/).last();
    await expect(subtotal).toBeVisible();
    const before = (await subtotal.textContent()) ?? "";
    const lineBefore = (await lineTotal.textContent()) ?? "";

    // Random stock can refuse the increase; reload and retry.
    await expect(async () => {
      await page.reload();
      const increase = page.getByRole("button", { name: `Increase quantity of ${name}` });
      await waitForHydration(increase);
      await increase.click({ timeout: 2_000 });
      await expect(page.getByTestId("cart-total-items")).toHaveText("2", { timeout: 3_000 });
    }).toPass({ timeout: 25_000 });
    await expect(subtotal).not.toHaveText(before);
    await expect(lineTotal).not.toHaveText(lineBefore);

    await page.getByRole("button", { name: `Remove ${name} from cart` }).click();
    await expect(page.getByText("Your cart is empty")).toBeVisible();
  });

  test("cart cookie is httpOnly and SameSite=Lax", async ({ page, context }) => {
    await addOneToCart(page);
    const cookie = (await context.cookies()).find((c) => c.name === "swag_cart");
    expect(cookie).toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
  });

  test("unknown product renders not-found UI with a 404 status", async ({ page }) => {
    const response = await page.goto("/products/definitely-not-a-real-product");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Product not found" })).toBeVisible();
  });
});

test.describe("search", () => {
  test("debounces, needs 3+ chars, limits to 5 results, clears, and submits on Enter", async ({
    page,
  }) => {
    await page.goto("/search");
    const input = page.getByRole("searchbox", { name: "Search products" });
    await expect(page.getByTestId("search-results")).toBeVisible();

    // Two characters: nothing should happen, even after the debounce window.
    await input.fill("sh");
    await page.waitForTimeout(DEBOUNCE_WAIT_MS);
    expect(new URL(page.url()).searchParams.has("q")).toBe(false);

    await input.fill("shirt");
    await expect(page).toHaveURL(/[?&]q=shirt(&|$)/);
    await expect(page.getByTestId("search-results")).toBeVisible();
    expect(
      await page.getByTestId("search-results").getByRole("article").count(),
    ).toBeLessThanOrEqual(5);

    await input.clear();
    await expect(page).not.toHaveURL(/[?&]q=/);
    await expect(page.getByTestId("search-results")).toBeVisible();

    // Enter submits immediately, without waiting for the debounce.
    await input.fill("mug");
    await input.press("Enter");
    await expect(page).toHaveURL(/[?&]q=mug(&|$)/);
  });

  test("category filter updates the URL", async ({ page }) => {
    await page.goto("/search");
    const select = page.getByRole("combobox", { name: "Category" });
    // Wait for the categories and hydration.
    await expect(select.locator("option")).not.toHaveCount(1);
    await waitForHydration(select);
    const options = await select
      .locator("option")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLOptionElement).value).filter((value) => value !== ""),
      );
    const [slug] = options;
    expect(slug).toBeDefined();
    await select.selectOption(slug ?? "");
    await expect(page).toHaveURL(new RegExp(`[?&]category=${slug ?? ""}(&|$)`));
    await expect(page.getByTestId("search-results")).toBeVisible();
  });
});

test.describe("security headers", () => {
  test("sets CSP, framing, sniffing and referrer protections without x-powered-by", async ({
    request,
  }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBeTruthy();
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
