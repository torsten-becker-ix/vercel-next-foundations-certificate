import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api/client";

const TOKEN = "super-secret-bypass-token";

beforeEach(() => {
  vi.stubEnv("SWAG_API_BASE_URL", "https://api.example.test/api/");
  vi.stubEnv("SWAG_API_BYPASS_TOKEN", TOKEN);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function mockFetch(response: Response | Error) {
  const fn = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("apiRequest", () => {
  it("sends the bypass header, encodes path segments and unwraps data", async () => {
    const fetchMock = mockFetch(json({ success: true, data: "ok" }));
    await expect(apiRequest({ path: ["products", "a/b?c"] }, z.string())).resolves.toBe("ok");

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.example.test/api/products/a%2Fb%3Fc");
    expect((init.headers as Record<string, string>)["x-vercel-protection-bypass"]).toBe(TOKEN);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("maps a 404 envelope to a not_found ApiError", async () => {
    mockFetch(
      json({ success: false, error: { code: "NOT_FOUND", message: "secret detail" } }, 404),
    );
    const error = await apiRequest({ path: ["x"] }, z.string()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: "not_found", status: 404, code: "NOT_FOUND" });
    expect((error as ApiError).message).not.toContain("secret detail");
  });

  it("rejects responses that fail schema validation", async () => {
    mockFetch(json({ success: true, data: 42 }));
    await expect(apiRequest({ path: ["x"] }, z.string())).rejects.toMatchObject({
      kind: "invalid_response",
    });
  });

  it("never leaks the token through network errors", async () => {
    mockFetch(new TypeError(`fetch failed for header ${TOKEN}`));
    const error = await apiRequest({ path: ["x"] }, z.string()).catch((e: unknown) => e);
    expect(error).toMatchObject({ kind: "network" });
    expect(JSON.stringify(error)).not.toContain(TOKEN);
    expect((error as ApiError).message).not.toContain(TOKEN);
  });

  it("reports timeouts", async () => {
    mockFetch(new DOMException("timed out", "TimeoutError"));
    await expect(apiRequest({ path: ["x"] }, z.string())).rejects.toMatchObject({
      kind: "timeout",
    });
  });
});
