import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  SWAG_API_BASE_URL: z.url({ protocol: /^https$/ }).transform((value) => value.replace(/\/+$/, "")),
  SWAG_API_BYPASS_TOKEN: z.string().min(16, "SWAG_API_BYPASS_TOKEN is missing or too short"),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/** Validated server env, parsed on first use so tests can import modules without it. */
export function getEnv(): Env {
  if (cached === undefined) {
    const result = EnvSchema.safeParse(process.env);
    if (!result.success) {
      const names = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Invalid server environment variables: ${names}`);
    }
    cached = result.data;
  }
  return cached;
}

const SiteEnvSchema = z.object({
  SITE_URL: z.url({ protocol: /^https?$/ }).optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),
});

function blankToUndefined(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === "" ? undefined : value.trim();
}

const DEFAULT_SITE_URL = "http://localhost:3000";

/** Origin for metadataBase: SITE_URL, then the Vercel production URL, then localhost. */
export function getSiteUrl(): URL {
  const { SITE_URL, VERCEL_PROJECT_PRODUCTION_URL } = SiteEnvSchema.parse({
    SITE_URL: blankToUndefined(process.env["SITE_URL"]),
    VERCEL_PROJECT_PRODUCTION_URL: blankToUndefined(process.env["VERCEL_PROJECT_PRODUCTION_URL"]),
  });
  if (SITE_URL !== undefined) {
    return new URL(SITE_URL);
  }
  if (VERCEL_PROJECT_PRODUCTION_URL !== undefined) {
    return new URL(`https://${VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  return new URL(DEFAULT_SITE_URL);
}
