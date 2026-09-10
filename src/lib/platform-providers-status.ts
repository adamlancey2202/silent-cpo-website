import { resolveDatabaseUrl } from "@/lib/database-url";
import {
  PLATFORM_PROVIDERS,
  type PlatformProviderCard,
} from "@/lib/platform-providers";

function envSet(...keys: string[]) {
  return keys.some((key) => Boolean(process.env[key]?.trim()));
}

const CONFIGURED: Record<string, () => boolean> = {
  vercel: () => envSet("VERCEL", "VERCEL_ENV", "VERCEL_URL"),
  github: () => true,
  neon: () => {
    const url = resolveDatabaseUrl();
    if (url) {
      return /neon\.(tech|build)/i.test(url) || /^postgres(ql)?:\/\//i.test(url);
    }
    return Object.keys(process.env).some(
      (key) => key.endsWith("_NEON_PROJECT_ID") && process.env[key]?.trim()
    );
  },
  stripe: () => envSet("STRIPE_SECRET_KEY"),
  mailersend: () =>
    envSet("MAILERSEND_API_KEY") && envSet("MAILERSEND_FROM_EMAIL"),
  turnstile: () =>
    envSet("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"),
};

export function buildPlatformDashboard(): PlatformProviderCard[] {
  return PLATFORM_PROVIDERS.map((provider) => ({
    ...provider,
    configured: CONFIGURED[provider.id]?.() ?? false,
  }));
}
