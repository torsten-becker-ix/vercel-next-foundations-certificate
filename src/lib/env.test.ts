import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/env";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to localhost", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(getSiteUrl().origin).toBe("http://localhost:3000");
  });

  it("falls back to the Vercel production host over https", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "shop.example.com");
    expect(getSiteUrl().origin).toBe("https://shop.example.com");
  });

  it("prefers SITE_URL", () => {
    vi.stubEnv("SITE_URL", "https://swag.example.org");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "shop.example.com");
    expect(getSiteUrl().origin).toBe("https://swag.example.org");
  });

  it("rejects an invalid SITE_URL", () => {
    vi.stubEnv("SITE_URL", "ftp://files.example.com");
    expect(() => getSiteUrl()).toThrow();
  });
});
