type MoneyItem = {
  amount: number;
  currency: string;
  status: string;
};

const PAID_STATUSES = new Set(["paid"]);
const PIPELINE_INVOICE_STATUSES = new Set(["draft", "open", "uncollectible"]);
const PIPELINE_LINK_STATUSES = new Set(["active"]);

export function isPaid(status: string) {
  return PAID_STATUSES.has(status.toLowerCase());
}

export function isPipelineInvoice(status: string) {
  return PIPELINE_INVOICE_STATUSES.has(status.toLowerCase());
}

export function isPipelinePaymentLink(status: string) {
  return PIPELINE_LINK_STATUSES.has(status.toLowerCase());
}

export function sumAmounts(items: MoneyItem[], currency = "gbp") {
  return items
    .filter((item) => item.currency.toLowerCase() === currency.toLowerCase())
    .reduce((sum, item) => sum + item.amount, 0);
}

export function calculateRevenue({
  invoices,
  paymentLinks,
}: {
  invoices: MoneyItem[];
  paymentLinks: MoneyItem[];
}) {
  const currency = "gbp";

  const receivedInvoices = sumAmounts(
    invoices.filter((i) => isPaid(i.status)),
    currency
  );
  const receivedLinks = sumAmounts(
    paymentLinks.filter((p) => isPaid(p.status)),
    currency
  );
  const received = receivedInvoices + receivedLinks;

  const pipelineInvoices = sumAmounts(
    invoices.filter((i) => isPipelineInvoice(i.status)),
    currency
  );
  const pipelineLinks = sumAmounts(
    paymentLinks.filter((p) => isPipelinePaymentLink(p.status)),
    currency
  );
  const pipeline = pipelineInvoices + pipelineLinks;

  return {
    currency,
    received,
    pipeline,
    total: received + pipeline,
    breakdown: {
      receivedInvoices,
      receivedLinks,
      pipelineInvoices,
      pipelineLinks,
    },
  };
}

export function formatMoney(amount: number, currency = "gbp") {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
