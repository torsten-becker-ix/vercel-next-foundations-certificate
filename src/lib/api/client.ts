import "server-only";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { ErrorEnvelopeSchema } from "@/lib/api/schemas";

const REQUEST_TIMEOUT_MS = 8_000;

export type ApiErrorKind =
  | "not_found"
  | "unauthorized"
  | "invalid_request"
  | "rate_limited"
  | "upstream"
  | "network"
  | "timeout"
  | "invalid_response"
  | "cart_expired";

function publicMessage(kind: ApiErrorKind): string {
  switch (kind) {
    case "not_found":
      return "The requested item could not be found.";
    case "invalid_request":
      return "The request was not valid.";
    case "rate_limited":
      return "Too many requests. Please try again shortly.";
    case "network":
      return "Could not reach the store. Please try again.";
    case "timeout":
      return "The store took too long to respond. Please try again.";
    case "invalid_response":
      return "The store returned an unexpected response.";
    case "cart_expired":
      return "Your cart has expired. Please start a new one.";
    case "unauthorized":
    case "upstream":
      return "The store is temporarily unavailable. Please try again.";
  }
}

/** API error with a safe user-facing message; upstream details stay out of it. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: string | null;

  constructor(kind: ApiErrorKind, status: number | null = null, code: string | null = null) {
    super(publicMessage(kind));
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 404) return "not_found";
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "upstream";
  return "invalid_request";
}

type Query = Readonly<Record<string, string | number | undefined>>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Path segments, each URI-encoded. */
  path: readonly string[];
  query?: Query;
  body?: unknown;
  cartToken?: string;
}

function buildUrl({ path, query }: Pick<RequestOptions, "path" | "query">): URL {
  const { SWAG_API_BASE_URL } = getEnv();
  const url = new URL(`${SWAG_API_BASE_URL}/${path.map(encodeURIComponent).join("/")}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  return url;
}

/** Sends the request and returns the unvalidated JSON body. */
async function send(options: RequestOptions): Promise<unknown> {
  const { SWAG_API_BYPASS_TOKEN } = getEnv();
  const headers: Record<string, string> = {
    accept: "application/json",
    "x-vercel-protection-bypass": SWAG_API_BYPASS_TOKEN,
  };
  if (options.cartToken !== undefined) {
    headers["x-cart-token"] = options.cartToken;
  }
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(options), {
      method: options.method ?? "GET",
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      redirect: "error",
    });
  } catch (error) {
    // Don't rethrow: the original error can contain the URL and headers.
    const isTimeout = error instanceof DOMException && error.name === "TimeoutError";
    throw new ApiError(isTimeout ? "timeout" : "network");
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      response.ok ? "invalid_response" : kindForStatus(response.status),
      response.status,
    );
  }

  if (!response.ok) {
    const parsed = ErrorEnvelopeSchema.safeParse(json);
    throw new ApiError(
      kindForStatus(response.status),
      response.status,
      parsed.success ? parsed.data.error.code : null,
    );
  }
  return json;
}

/** Calls the API and returns the schema-validated `data` of a success envelope. */
export async function apiRequest<T>(options: RequestOptions, dataSchema: z.ZodType<T>): Promise<T> {
  const json = await send(options);
  const parsed = z.object({ success: z.literal(true), data: dataSchema }).safeParse(json);
  if (!parsed.success) {
    throw new ApiError("invalid_response", 200);
  }
  return parsed.data.data;
}

/** Like {@link apiRequest} but also validates and returns the envelope `meta`. */
export async function apiRequestWithMeta<T, M>(
  options: RequestOptions,
  dataSchema: z.ZodType<T>,
  metaSchema: z.ZodType<M>,
): Promise<{ data: T; meta: M }> {
  const json = await send(options);
  const parsed = z
    .object({ success: z.literal(true), data: dataSchema, meta: metaSchema })
    .safeParse(json);
  if (!parsed.success) {
    throw new ApiError("invalid_response", 200);
  }
  return { data: parsed.data.data, meta: parsed.data.meta };
}
