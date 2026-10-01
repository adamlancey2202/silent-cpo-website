export type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

export function getGoogleServiceAccount(): ServiceAccountCredentials | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ServiceAccountCredentials;
      if (parsed.client_email && parsed.private_key) return parsed;
    } catch {
      /* fall through */
    }
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (email && key) return { client_email: email, private_key: key };
  return null;
}

export function googleReportingConfigured(): boolean {
  return Boolean(getGoogleServiceAccount());
}
