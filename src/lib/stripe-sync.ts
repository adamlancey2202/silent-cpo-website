import { db } from "@/lib/db";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function syncPaymentStatuses() {
  if (!isStripeConfigured()) return { synced: false };

  const stripe = getStripe();
  const [paymentLinks, invoices] = await Promise.all([
    db.paymentLink.findMany(),
    db.invoice.findMany(),
  ]);

  await Promise.all(
    invoices.map(async (invoice) => {
      try {
        const stripeInvoice = await stripe.invoices.retrieve(invoice.stripeId);
        await db.invoice.update({
          where: { id: invoice.id },
          data: {
            status: stripeInvoice.status ?? invoice.status,
            hostedUrl: stripeInvoice.hosted_invoice_url,
            pdfUrl: stripeInvoice.invoice_pdf,
          },
        });
      } catch {
        /* Stripe record may have been deleted */
      }
    })
  );

  await Promise.all(
    paymentLinks.map(async (link) => {
      if (link.status === "paid") return;

      try {
        const sessions = await stripe.checkout.sessions.list({
          payment_link: link.stripeId,
          limit: 100,
        });

        const hasPaid = sessions.data.some(
          (session) => session.payment_status === "paid"
        );

        if (hasPaid) {
          await db.paymentLink.update({
            where: { id: link.id },
            data: { status: "paid" },
          });
        }
      } catch {
        /* Link may be invalid or API unavailable */
      }
    })
  );

  return { synced: true };
}
