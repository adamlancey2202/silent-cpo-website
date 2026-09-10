"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export function Contact() {
  return (
    <section id="contact" className="relative py-32">
      <div className="gold-line mb-32" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.2fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">
              CONTACT
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-bone md:text-6xl">
              LET&apos;S BUILD
              <br />
              SOMETHING
              <br />
              WORTH USING.
            </h2>
            <p className="mt-6 max-w-sm text-mist/60">
              Tell me about your project. No pitch decks required — just your
              idea and what you&apos;re trying to achieve.
            </p>

            <div className="mt-10 space-y-4">
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="block text-sm text-bone transition hover:text-gold"
              >
                {siteConfig.contact.email}
              </a>
              <a
                href={`tel:${siteConfig.contact.phone}`}
                className="block text-sm text-bone transition hover:text-gold"
              >
                {siteConfig.contact.phoneDisplay}
              </a>
            </div>
          </motion.div>

          <div className="corner-accent glass-card relative rounded-2xl p-8">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
