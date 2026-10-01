import { z } from "zod";
import { db } from "@/lib/db";
import { googleReportingConfigured } from "@/lib/google-credentials";

export const ga4IdSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .refine((v) => v === "" || /^G-[A-Z0-9]+$/.test(v), "Use a GA4 measurement ID like G-XXXXXXXXXX");

const ga4PropertyIdSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v === "" || /^\d{6,12}$/.test(v), "Use the numeric GA4 property ID from Admin → Property settings");

const gscSiteUrlSchema = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^https:\/\/.+/i.test(v) || /^sc-domain:[a-z0-9.-]+$/i.test(v),
    "Use https://www.yoursite.com/ or sc-domain:yoursite.com",
  );

export const siteSettingsInput = z
  .object({
    version: z.number().int().positive(),
    ga4MeasurementId: ga4IdSchema,
    ga4PropertyId: ga4PropertyIdSchema,
    gscSiteUrl: gscSiteUrlSchema,
  })
  .strict();

export type SiteSettingsView = {
  ga4MeasurementId: string;
  ga4PropertyId: string;
  gscSiteUrl: string;
  version: number;
  updatedAt: string | null;
  source: "database" | "environment" | "none";
  reportingConfigured: boolean;
};

function envGa4Id(): string {
  const raw = process.env.GA4_MEASUREMENT_ID?.trim() ?? "";
  const parsed = ga4IdSchema.safeParse(raw);
  return parsed.success ? parsed.data : "";
}

export async function getSiteSettings(): Promise<SiteSettingsView> {
  try {
    const row = await db.siteSettings.findUnique({ where: { id: "default" } });
    if (row) {
      const parsed = ga4IdSchema.safeParse(row.ga4MeasurementId ?? "");
      return {
        ga4MeasurementId: parsed.success ? parsed.data : "",
        ga4PropertyId: row.ga4PropertyId ?? "",
        gscSiteUrl: row.gscSiteUrl ?? "",
        version: row.version,
        updatedAt: row.updatedAt.toISOString(),
        source: "database",
        reportingConfigured: googleReportingConfigured(),
      };
    }
  } catch {
    /* database unavailable */
  }
  const fromEnv = envGa4Id();
  if (fromEnv) {
    return {
      ga4MeasurementId: fromEnv,
      ga4PropertyId: "",
      gscSiteUrl: "",
      version: 1,
      updatedAt: null,
      source: "environment",
      reportingConfigured: googleReportingConfigured(),
    };
  }
  return {
    ga4MeasurementId: "",
    ga4PropertyId: "",
    gscSiteUrl: "",
    version: 1,
    updatedAt: null,
    source: "none",
    reportingConfigured: googleReportingConfigured(),
  };
}

/** Active measurement ID for script injection (DB overrides env). */
export async function getActiveGa4MeasurementId(): Promise<string> {
  const settings = await getSiteSettings();
  return settings.ga4MeasurementId;
}
