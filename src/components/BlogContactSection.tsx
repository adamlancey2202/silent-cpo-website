import { siteConfig } from "@/lib/site";
import { ContactForm } from "@/components/ContactForm";

type Props = {
  className?: string;
  compact?: boolean;
};

export function BlogContactSection({ className = "", compact = false }: Props) {
  return (
    <section id="blog-contact" className={`scroll-mt-28 border-t border-mist/10 pt-16 ${className}`}>
      <div className={compact ? "space-y-8" : "grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start"}>
        <div>
          <p className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">CONTACT</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-bone md:text-5xl">
            Turn the idea into a plan.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-mist/75">
            You don&apos;t need a finished specification. Tell me what you want to achieve — even if you&apos;re still
            working out what you need — and I&apos;ll respond within 24 hours.
          </p>
          <p className="mt-4 text-sm text-green">No pitch decks required.</p>
          <div className="mt-8 space-y-2 text-sm">
            <a href={`mailto:${siteConfig.contact.email}`} className="block text-bone transition hover:text-gold">
              {siteConfig.contact.email}
            </a>
            <a href={`tel:${siteConfig.contact.phone}`} className="block text-bone transition hover:text-gold">
              {siteConfig.contact.phoneDisplay}
            </a>
          </div>
        </div>
        <div className="corner-accent glass-card rounded-2xl border border-mist/15 p-6 md:p-8">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
