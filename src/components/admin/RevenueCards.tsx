import { formatMoney } from "@/lib/revenue";

interface RevenueCardsProps {
  received: number;
  pipeline: number;
  total: number;
  currency: string;
  breakdown?: {
    receivedInvoices: number;
    receivedLinks: number;
    pipelineInvoices: number;
    pipelineLinks: number;
  };
}

export function RevenueCards({
  received,
  pipeline,
  total,
  currency,
  breakdown,
}: RevenueCardsProps) {
  const cards = [
    {
      label: "Total Revenue",
      value: total,
      sub: "Received + pipeline (Stripe)",
      accent: "text-bone",
      border: "border-gold/30",
    },
    {
      label: "Pipeline",
      value: pipeline,
      sub: breakdown
        ? `Invoices ${formatMoney(breakdown.pipelineInvoices, currency)} · Links ${formatMoney(breakdown.pipelineLinks, currency)}`
        : "Outstanding invoices & payment links",
      accent: "text-green",
      border: "border-green/30",
    },
    {
      label: "Received",
      value: received,
      sub: breakdown
        ? `Invoices ${formatMoney(breakdown.receivedInvoices, currency)} · Links ${formatMoney(breakdown.receivedLinks, currency)}`
        : "Paid & in the bank",
      accent: "text-gold",
      border: "border-gold/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`border bg-midnight/30 p-5 ${card.border}`}
        >
          <p className="text-[10px] tracking-[0.2em] text-mist/50">
            {card.label.toUpperCase()}
          </p>
          <p
            className={`mt-2 font-[family-name:var(--font-display)] text-4xl tracking-wide ${card.accent}`}
          >
            {formatMoney(card.value, currency)}
          </p>
          <p className="mt-2 text-[10px] leading-relaxed text-mist/40">
            {card.sub}
          </p>
        </article>
      ))}
    </div>
  );
}
