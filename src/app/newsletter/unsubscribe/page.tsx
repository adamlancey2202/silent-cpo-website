import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ token?: string; status?: string }>;
};

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token, status } = await searchParams;
  const message =
    status === "done"
      ? "You're unsubscribed. You won't get new posts."
      : status === "already"
        ? "This address is already unsubscribed."
        : status === "invalid"
          ? "This unsubscribe link isn't valid."
          : null;

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-xl px-6 pb-24 pt-36">
        <p className="text-xs tracking-widest text-gold">NEWSLETTER</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl text-bone">
          Unsubscribe
        </h1>
        {message ? (
          <p className="mt-6 text-sm leading-relaxed text-mist/75">{message}</p>
        ) : token ? (
          <form method="POST" action="/api/newsletter/unsubscribe" className="mt-6 space-y-5">
            <p className="text-sm leading-relaxed text-mist/75">
              This removes you from new-post emails. It does not delete an enquiry you sent
              separately.
            </p>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="bg-gold px-6 py-3 text-sm tracking-[0.12em] text-deep transition hover:bg-gold/90"
            >
              UNSUBSCRIBE
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm leading-relaxed text-mist/75">
            Open the unsubscribe link from a newsletter email.
          </p>
        )}
        <Link href="/blog" className="mt-10 inline-block text-sm text-gold">
          ← All insights
        </Link>
      </main>
      <Footer />
    </>
  );
}
