import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    POSTGRES_URL: z.url(),
    REDIS_URL: z.url(),

    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_DOMAIN: z.string(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    VERCEL_URL: z.string().optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
    EMAIL_SENDER_NAME: z.string().min(1),
    EMAIL_SENDER_ADDRESS: z.email(),

    APP_URL: z.url(),

    QUOTES_SERVICE_URL: z.url(),
    GEOGRAPHY_SERVICE_URL: z.url(),
    CRM_SERVICE_URL: z.url(),
    RATES_SERVICE_URL: z.url(),
    INTERNAL_SERVICE_TOKEN: z.string().min(16),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    REDIS_URL: process.env.REDIS_URL,

    EMAIL_SENDER_ADDRESS: process.env.EMAIL_SENDER_ADDRESS,
    EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? process.env.APP_URL,
    BETTER_AUTH_DOMAIN: process.env.BETTER_AUTH_DOMAIN,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,

    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

    QUOTES_SERVICE_URL: process.env.QUOTES_SERVICE_URL,
    GEOGRAPHY_SERVICE_URL: process.env.GEOGRAPHY_SERVICE_URL,
    CRM_SERVICE_URL: process.env.CRM_SERVICE_URL,
    RATES_SERVICE_URL: process.env.RATES_SERVICE_URL,
    INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN,
  },
  emptyStringAsUndefined: true,
  // Allow `next build` in CI / local without a full .env when explicitly opted in.
  skipValidation:
    process.env.SKIP_ENV_VALIDATION === "1" ||
    process.env.SKIP_ENV_VALIDATION === "true",
})
