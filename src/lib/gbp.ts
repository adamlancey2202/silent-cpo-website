const DAY = 24 * 60 * 60 * 1000;

type Rates = { at: number; gbpPerEur: number; perEur: Record<string, number> };

let rates: Rates | null = null;

async function euroRates(): Promise<Rates | null> {
  if (rates && Date.now() - rates.at < DAY) return rates;
  try {
    const response = await fetch("https://api.frankfurter.dev/v1/latest?from=EUR");
    if (!response.ok) return rates;
    const body = (await response.json()) as { rates?: Record<string, number> };
    const gbpPerEur = body.rates?.GBP;
    if (!gbpPerEur || !body.rates) return rates;
    rates = { at: Date.now(), gbpPerEur, perEur: body.rates };
    return rates;
  } catch {
    return rates;
  }
}

function pounds(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function range(min: number, max: number) {
  return `${pounds(min)}-${pounds(max)}`.replace(/\u00a0/g, "").slice(0, 80);
}

export async function budgetInGbp(raw: string): Promise<string> {
  const value = raw.trim();
  if (!value) return "";
  if (/^£[\d,]+-£[\d,]+$/.test(value.replace(/\s/g, ""))) return value.slice(0, 80);

  const match = value.match(/^(\d[\d,]*(?:\.\d+)?)\s*-\s*(\d[\d,]*(?:\.\d+)?)\s*([A-Za-z]{3})$/);
  if (!match) return value.slice(0, 80);
  const min = Number(match[1].replace(/,/g, ""));
  const max = Number(match[2].replace(/,/g, ""));
  const currency = match[3].toUpperCase();
  if (!Number.isFinite(min) || !Number.isFinite(max)) return value.slice(0, 80);
  if (currency === "GBP") return range(min, max);

  const table = await euroRates();
  const perEur = currency === "EUR" ? 1 : table?.perEur[currency];
  if (!table || !perEur) return value.slice(0, 80);
  return range(min * (table.gbpPerEur / perEur), max * (table.gbpPerEur / perEur));
}
