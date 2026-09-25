"use client";

import { motion } from "framer-motion";

const principles = [
  {
    number: "01",
    title: "Understand the whole picture",
    body: "Your goals, customers, day-to-day workflows, and constraints all matter. I look at the whole business problem before recommending what to build.",
  },
  {
    number: "02",
    title: "Challenge the brief",
    body: "A brief is a starting point. Together we question assumptions, separate essentials from extras, and work out what you actually need to move forward.",
  },
  {
    number: "03",
    title: "Built to last",
    body: "Modern stacks, clean code, SEO from day one. Every build is engineered for performance, maintainability, and growth — not just launch day.",
  },
];

export function Philosophy() {
  return (
    <section id="philosophy" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 max-w-2xl"
        >
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">
            PHILOSOPHY
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-bone md:text-6xl">
            THE SILENT APPROACH
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-mist/70">
            I take a holistic approach to digital product development. Before
            writing code, I help you understand the problem, question what is
            needed, and shape a practical solution around your business.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {principles.map((item, i) => (
            <motion.article
              key={item.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative border border-mist/10 bg-midnight/30 p-8 transition hover:border-gold/20 hover:bg-midnight/50"
            >
              <span className="font-[family-name:var(--font-display)] text-6xl text-gold/20 transition group-hover:text-gold/40">
                {item.number}
              </span>
              <h3 className="mt-4 font-[family-name:var(--font-display)] text-2xl tracking-wide text-bone">
                {item.title.toUpperCase()}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-mist/60">
                {item.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
