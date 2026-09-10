"use client";

import { motion } from "framer-motion";
import {
  Globe,
  Smartphone,
  Layers,
  Calculator,
  Users,
  Sparkles,
} from "lucide-react";

const capabilities = [
  {
    icon: Globe,
    title: "Websites & SPAs",
    description:
      "Lightning-fast marketing sites, landing pages, and single-page applications with SEO baked in from the first line of code.",
    tags: ["Next.js", "React", "SEO"],
  },
  {
    icon: Layers,
    title: "Web Apps & PWAs",
    description:
      "Full-featured web applications and progressive web apps that work offline, install like native, and scale with your business.",
    tags: ["PWA", "APIs", "Real-time"],
  },
  {
    icon: Smartphone,
    title: "Native Mobile Apps",
    description:
      "iOS and Android applications built with modern cross-platform frameworks — native performance, shared codebase.",
    tags: ["React Native", "iOS", "Android"],
  },
  {
    icon: Users,
    title: "Membership Platforms",
    description:
      "Subscription systems, gated content, user dashboards, and payment flows — everything needed to monetise your audience.",
    tags: ["Stripe", "Auth", "Dashboards"],
  },
  {
    icon: Calculator,
    title: "Calculators & Tools",
    description:
      "Interactive calculators, configurators, and bespoke digital tools that engage users and drive conversions.",
    tags: ["Interactive", "Logic", "UX"],
  },
  {
    icon: Sparkles,
    title: "Bespoke Everything",
    description:
      "If you can describe it, it can be built. Custom integrations, AI-powered features, admin panels, and internal tools.",
    tags: ["Custom", "AI-ready", "APIs"],
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="relative py-32">
      <div className="gold-line mb-32" />

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">
            CAPABILITIES
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-bone md:text-7xl">
            WHAT GETS BUILT HERE
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-mist/60">
            No templates. No cookie-cutter solutions. Every product is
            architected for your specific problem.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap, i) => (
            <motion.article
              key={cap.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative overflow-hidden border border-mist/10 bg-deep p-6 transition hover:border-green/30"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-green/5 transition group-hover:bg-green/10" />
              <cap.icon
                className="mb-4 h-6 w-6 text-green"
                strokeWidth={1.5}
              />
              <h3 className="font-[family-name:var(--font-display)] text-xl tracking-wide text-bone">
                {cap.title.toUpperCase()}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-mist/60">
                {cap.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {cap.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-[family-name:var(--font-mono)] text-[10px] tracking-wider text-mist/40"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
