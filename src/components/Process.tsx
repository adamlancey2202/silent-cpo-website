"use client";

import { motion } from "framer-motion";

const steps = [
  {
    step: "01",
    title: "Discovery",
    detail: "We talk. I listen. You explain the vision — I ask the questions that matter.",
  },
  {
    step: "02",
    title: "Architecture",
    detail: "Technical blueprint, timeline, and scope. No surprises, no scope creep without consent.",
  },
  {
    step: "03",
    title: "Build",
    detail: "Iterative development with regular check-ins. You see progress, not just promises.",
  },
  {
    step: "04",
    title: "Launch & Beyond",
    detail: "Deployment, handover, and ongoing support. Your product stays maintained and evolving.",
  },
];

export function Process() {
  return (
    <section id="process" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">
              PROCESS
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-bone md:text-6xl">
              FROM SPARK
              <br />
              TO SHIPPED
            </h2>
            <p className="mt-6 max-w-md text-mist/60">
              A clear, transparent workflow designed for founders and businesses
              who value direct communication over corporate runaround.
            </p>
          </motion.div>

          <div className="space-y-0">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex gap-6 border-l border-mist/10 py-6 pl-6 transition hover:border-gold/40"
              >
                <span className="font-[family-name:var(--font-display)] text-3xl text-gold/40 transition group-hover:text-gold">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl tracking-wide text-bone">
                    {item.title.toUpperCase()}
                  </h3>
                  <p className="mt-1 text-sm text-mist/60">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
