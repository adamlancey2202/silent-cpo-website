const testimonials = [
  {
    quote: "You’re a legend—you’ve exceeded my expectations.",
    client: "Kratos app client",
  },
  {
    quote: "You undersell and completely overdeliver.",
    client: "Aevum app client",
  },
  {
    quote: "This is a game changer. I love it—great work!",
    client: "Vialo app client",
  },
  {
    quote: "Exactly what we needed. Thank you so much—exciting times ahead!",
    client: "Witness Wise client",
  },
  {
    quote: "My customers love this platform. They find it so easy. You’re the best!",
    client: "Bookivo client",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" aria-labelledby="testimonials-heading" className="relative scroll-mt-24 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">CLIENT FEEDBACK</p>
        <h2 id="testimonials-heading" className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-bone md:text-6xl">IN THEIR WORDS.</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {testimonials.map(({ quote, client }) => (
            <figure key={client} className="flex flex-col rounded-2xl border border-mist/15 bg-midnight/30 p-6 md:p-8">
              <span aria-hidden="true" className="font-serif text-6xl leading-none text-gold">“</span>
              <blockquote className="flex-1 text-2xl leading-relaxed text-bone">{quote}</blockquote>
              <figcaption className="mt-6 border-t border-mist/15 pt-5 font-[family-name:var(--font-mono)] text-xs tracking-wide text-mist/75">{client}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
