import Link from "next/link";
import { publishedArticles } from "@/lib/content/public";

export async function BlogTeaser() {
  const articles = (await publishedArticles()).slice(0, 3);

  return (
    <section id="blog" className="relative border-t border-mist/5 py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-4 font-[family-name:var(--font-mono)] text-xs tracking-[0.2em] text-gold">
              BLOG
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-bone md:text-5xl">
              Insights for founders
            </h2>
            <p className="mt-4 max-w-xl text-mist/75">
              Practical notes on planning websites, apps and business tools — without the jargon.
            </p>
          </div>
          <Link
            href="/blog"
            className="border border-gold/30 px-5 py-2.5 text-xs tracking-[0.12em] text-gold transition hover:bg-gold/10"
          >
            VIEW ALL ARTICLES
          </Link>
        </div>

        {articles.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="rounded-2xl border border-mist/15 p-6 transition hover:border-gold/25"
              >
                <time className="text-xs text-mist/60" dateTime={article.publishedAt!.toISOString()}>
                  {article.publishedAt!.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h3 className="mt-3 text-xl text-bone">
                  <Link className="hover:text-gold" href={`/blog/${article.slug}`}>
                    {article.title}
                  </Link>
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-mist/75">{article.data.excerpt}</p>
                <Link className="mt-5 inline-block text-sm text-gold" href={`/blog/${article.slug}`}>
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-10 text-mist/70">
            New articles are on the way.{" "}
            <Link href="/blog" className="text-gold underline">
              Visit the blog
            </Link>{" "}
            or{" "}
            <Link href="/#contact" className="text-gold underline">
              get in touch
            </Link>{" "}
            in the meantime.
          </p>
        )}
      </div>
    </section>
  );
}
