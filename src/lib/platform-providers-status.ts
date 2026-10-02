import { resolveDatabaseUrl } from "@/lib/database-url";
import { googleReportingConfigured } from "@/lib/google-credentials";
import {
  PLATFORM_PROVIDERS,
  type PlatformLink,
  type PlatformProviderCard,
} from "@/lib/platform-providers";
import { getSiteSettings } from "@/lib/site-settings";

function envSet(...keys: string[]) {
  return keys.some((key) => Boolean(process.env[key]?.trim()));
}

export function resolveN8nOrigin(): string | null {
  const raw = process.env.N8N_DRAFT_WEBHOOK_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function r2Configured() {
  return (
    envSet("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY") &&
    envSet("R2_BUCKET_NAME", "R2_PUBLIC_BASE_URL")
  );
}

function withN8nDashboardLink(links: PlatformLink[]): PlatformLink[] {
  const origin = resolveN8nOrigin();
  if (!origin) return links;
  const rest = links.filter((l) => l.label !== "Dashboard");
  return [{ label: "Dashboard", href: origin }, ...rest];
}

export async function buildPlatformDashboard(): Promise<PlatformProviderCard[]> {
  const settings = await getSiteSettings();
  const n8nOrigin = resolveN8nOrigin();
  const automationToken = envSet("N8N_CONTENT_TOKEN");
  const reportingAccount = googleReportingConfigured();
  const ga4Tag = Boolean(settings.ga4MeasurementId);
  const gscReporting =
    reportingAccount && Boolean(settings.gscSiteUrl.trim());

  const configured: Record<string, boolean> = {
    vercel: envSet("VERCEL", "VERCEL_ENV", "VERCEL_URL"),
    github: true,
    neon: (() => {
      const url = resolveDatabaseUrl();
      if (url) {
        return /neon\.(tech|build)/i.test(url) || /^postgres(ql)?:\/\//i.test(url);
      }
      return Object.keys(process.env).some(
        (key) => key.endsWith("_NEON_PROJECT_ID") && process.env[key]?.trim()
      );
    })(),
    render: Boolean(n8nOrigin?.includes("onrender.com")),
    "cloudflare-r2": r2Configured() || Boolean(process.env.BLOG_OG_IMAGE_URL?.trim()),
    n8n: automationToken,
    openai: envSet("OPENAI_API_KEY"),
    "cron-job": Boolean(n8nOrigin),
    stripe: envSet("STRIPE_SECRET_KEY"),
    mailersend: envSet("MAILERSEND_API_KEY") && envSet("MAILERSEND_FROM_EMAIL"),
    turnstile: envSet("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"),
    "google-analytics": ga4Tag,
    "google-search-console": gscReporting,
    "google-cloud": reportingAccount,
    "bing-webmaster": envSet("BING_SITE_VERIFICATION"),
  };

  return PLATFORM_PROVIDERS.map((provider) => {
    let links = provider.links;
    if (provider.id === "n8n") {
      links = withN8nDashboardLink(links);
    }

    return {
      ...provider,
      links,
      configured: configured[provider.id] ?? false,
    };
  });
}
