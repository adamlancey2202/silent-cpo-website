import { siteConfig } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-mist/5 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="text-center md:text-left">
          <p className="font-[family-name:var(--font-display)] text-lg tracking-[0.2em] text-bone">
            SILENTCPO
          </p>
          <p className="text-xs text-mist/40">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
        </div>

        <p className="text-center text-xs tracking-[0.1em] text-green/60">
          COMPLEX IDEAS. QUIETLY MASTERED.
        </p>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-mist/40">
          <a href="/privacy" className="transition hover:text-gold">
            Privacy
          </a>
          <a href="/llms.txt" className="transition hover:text-gold">
            llms.txt
          </a>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="transition hover:text-gold"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
