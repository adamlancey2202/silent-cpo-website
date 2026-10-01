import { z } from "zod";
import { db } from "@/lib/db";

export const ga4IdSchema = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase())
  .refine((v) => v === "" || /^G-[A-Z0-9]+$/.test(v), "Use a GA4 measurement ID like G-XXXXXXXXXX");

export const siteSettingsInput = z
  .object({
    version: z.number().int().positive(),
    ga4MeasurementId: ga4IdSchema,
  })
  .strict();

export type SiteSettingsView = {
  ga4MeasurementId: string;
  version: number;
  updatedAt: string | null;
  source: "database" | "environment" | "none";
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
        version: row.version,
        updatedAt: row.updatedAt.toISOString(),
        source: "database",
      };
    }
  } catch {
    /* database unavailable */
  }
  const fromEnv = envGa4Id();
  if (fromEnv) {
    return { ga4MeasurementId: fromEnv, version: 1, updatedAt: null, source: "environment" };
  }
  return { ga4MeasurementId: "", version: 1, updatedAt: null, source: "none" };
}

/** Active measurement ID for script injection (DB overrides env). */
export async function getActiveGa4MeasurementId(): Promise<string> {
  const settings = await getSiteSettings();
  return settings.ga4MeasurementId;
}
