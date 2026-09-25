import { faqs } from "@/lib/faqs";

export function FAQ() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">COMMON QUESTIONS</p>
          <h2 id="faq-heading" className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-bone md:text-6xl">BEFORE WE BUILD.</h2>
          <p className="mt-6 max-w-sm leading-relaxed text-mist/75">You don’t need all the answers before getting in touch. Working out what you need is part of the process.</p>
          <a href="#contact" className="mt-6 inline-block text-sm text-gold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-gold">Tell me about your idea</a>
        </div>
        <div className="divide-y divide-mist/15 border-y border-mist/15">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="cursor-pointer rounded-sm text-base font-medium text-bone marker:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">{faq.question}</summary>
              <p className="mt-4 text-sm leading-relaxed text-mist/75">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
