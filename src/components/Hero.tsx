"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/site";

const words = ["COMPLEX", "IDEAS.", "QUIETLY", "MASTERED."];

export function Hero() {
  return (
    <section className="relative min-h-screen pt-28 pb-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_380px] lg:items-center lg:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-green/20 bg-green/5 px-4 py-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
            <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-wider text-green">
              Available for new projects
            </span>
          </motion.div>

          <h1 className="mb-6">
            {words.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="block font-[family-name:var(--font-display)] text-[clamp(3rem,10vw,7rem)] leading-[0.9] tracking-wide text-bone"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mb-8 h-0.5 w-24 origin-left bg-gold"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-4 font-[family-name:var(--font-display)] text-2xl tracking-[0.15em] text-bone/90 md:text-3xl"
          >
            YOUR IDEA. MADE REAL.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="max-w-lg text-base leading-relaxed text-mist/70"
          >
            I build the digital products others say are too complex — websites,
            web apps, PWAs, native mobile, membership platforms, and bespoke
            tools. One specialist. Zero noise. Total mastery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <a
              href="#contact"
              className="group relative overflow-hidden bg-gold px-8 py-4 text-sm font-medium tracking-[0.15em] text-deep transition hover:bg-gold/90"
            >
              <span className="relative z-10">START A CONVERSATION</span>
            </a>
            <a
              href="#capabilities"
              className="border border-mist/20 px-8 py-4 text-sm tracking-[0.15em] text-mist/80 transition hover:border-gold/40 hover:text-gold"
            >
              SEE WHAT I BUILD
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-12 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] text-mist/40"
          >
            WEBSITES / WEB APPS / NATIVE APPS / PWAs / PLATFORMS
          </motion.p>
        </div>

        <motion.aside
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative"
        >
          <div className="corner-accent glass-card relative rounded-2xl p-8">
            <div className="mb-6 flex items-center gap-4">
              <Image
                src="/images/logo.jpg"
                alt="SilentCPO"
                width={56}
                height={56}
                className="rounded-full ring-2 ring-gold/30"
              />
              <div>
                <p className="font-[family-name:var(--font-display)] text-2xl tracking-wider text-bone">
                  {siteConfig.contact.displayName.toUpperCase()}
                </p>
                <p className="text-xs tracking-[0.15em] text-gold">
                  {siteConfig.contact.title.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="space-y-5 border-t border-mist/10 pt-6">
              <div>
                <p className="mb-1 text-[10px] tracking-[0.2em] text-gold">
                  EMAIL
                </p>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-sm text-bone transition hover:text-gold"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
              <div>
                <p className="mb-1 text-[10px] tracking-[0.2em] text-gold">
                  PHONE
                </p>
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  className="text-sm text-bone transition hover:text-gold"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
              </div>
            </div>

            <p className="mt-8 text-center text-xs tracking-[0.12em] text-green/80">
              LET&apos;S BUILD SOMETHING WORTH USING.
            </p>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
