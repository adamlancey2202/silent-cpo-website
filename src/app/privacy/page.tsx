import type { Metadata } from "next";
import Link from "next/link";
import { GridBackground } from "@/components/GridBackground";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.name} — how we collect, use, and protect your personal data.`,
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "Who we are",
    content: `${siteConfig.name} ("we", "us", "our") is a digital product studio operating at ${siteConfig.url}. For data protection purposes, ${siteConfig.name} is the data controller responsible for your personal information.`,
  },
  {
    title: "What data we collect",
    content: `When you contact us via the enquiry form, we collect: your name, email address, optional phone number, project type, optional budget range, and your message. We may also collect technical data such as your IP address for security purposes (via Cloudflare Turnstile spam protection). We do not use cookies for tracking or advertising.`,
  },
  {
    title: "Why we collect it",
    content: `We process your data to respond to your enquiry and discuss potential projects. The legal basis is legitimate interest (responding to business enquiries) and, where applicable, your consent when submitting the contact form.`,
  },
  {
    title: "How long we keep it",
    content: `Enquiry data is retained for up to 24 months from your last contact, unless a business relationship is established (in which case data is retained as required for contract fulfilment and legal obligations). You may request deletion at any time.`,
  },
  {
    title: "Third parties",
    content: `We use the following service providers who may process your data on our behalf:\n\n• Hosting provider (e.g. Vercel) — serves the website\n• Cloudflare Turnstile — spam protection on the contact form\n• Stripe — payment processing (admin use only; no contact form data shared)\n\nWe do not sell your personal data to third parties.`,
  },
  {
    title: "Your rights",
    content: `Under UK GDPR, you have the right to: access your data, rectify inaccurate data, request erasure, restrict processing, data portability, and object to processing. You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.`,
  },
  {
    title: "Security",
    content: `We take appropriate technical measures to protect your data, including encrypted connections (HTTPS), access-controlled admin systems, and spam protection on public forms.`,
  },
  {
    title: "Contact",
    content: `For any privacy-related questions or to exercise your rights, contact us at ${siteConfig.contact.email}.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <GridBackground />
      <Header />
      <main className="relative min-h-screen pt-28 pb-16">
        <div className="mx-auto max-w-3xl px-6">
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">
            LEGAL
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-bone md:text-6xl">
            PRIVACY POLICY
          </h1>
          <p className="mt-4 text-sm text-mist/50">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <div className="mt-12 space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-xl tracking-wide text-bone">
                  {section.title.toUpperCase()}
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-mist/70">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-16 border-t border-mist/10 pt-8">
            <Link
              href="/"
              className="text-sm tracking-wider text-gold transition hover:text-gold/80"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
