import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { publishedArticles } from "@/lib/content/public";
import { blogOgImageMeta } from "@/lib/blog-media";
import { siteConfig } from "@/lib/site";
import { BlogContactSection } from "@/components/BlogContactSection";
import { BlogCoverImage } from "@/components/BlogCoverImage";
import { BlogInlineCta } from "@/components/BlogInlineCta";

export const dynamic = "force-dynamic";
const og = blogOgImageMeta();
export const metadata: Metadata = {
  title: "Insights",
  description: "Practical guidance on planning and building websites, apps and useful business tools from SilentCPO.",
  alternates: { canonical: `${siteConfig.url}/blog` },
  openGraph: {
    title: "Insights | SilentCPO",
    description: "Practical guidance on planning and building websites, apps and useful business tools.",
    url: `${siteConfig.url}/blog`,
    images: [og],
  },
  twitter: { card: "summary_large_image", images: [og.url] },
};

export default async function BlogPage() {
  const articles = await publishedArticles();
  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-6xl px-6 pb-24 pt-36">
        <BlogCoverImage className="max-w-4xl" priority />
        <p className="mt-10 text-xs tracking-widest text-gold">SILENTCPO INSIGHTS</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-6xl text-bone">CLEAR THINKING. USEFUL BUILDS.</h1>
        <p className="mt-6 max-w-2xl text-mist/75">
          Practical notes on working out what your business needs and turning it into a digital product.
        </p>
        <BlogInlineCta
          className="mt-16 max-w-2xl"
          title="Want help applying this to your business?"
          description="Browse the articles below, or skip straight to a conversation — no obligation."
          linkLabel="Use the contact form"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <article key={article.id} className="rounded-2xl border border-mist/15 p-6">
              <time className="text-xs text-mist/60" dateTime={article.publishedAt!.toISOString()}>
                {article.publishedAt!.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </time>
              <h2 className="mt-3 text-2xl text-bone">
                <Link className="hover:text-gold" href={`/blog/${article.slug}`}>
                  {article.title}
                </Link>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-mist/75">{article.data.excerpt}</p>
              <Link className="mt-6 inline-block text-sm text-gold" href={`/blog/${article.slug}`}>
                Read article<span className="sr-only">: {article.title}</span> →
              </Link>
            </article>
          ))}
        </div>
        {!articles.length && (
          <p className="mt-10 text-mist/70">
            Our first articles are on their way. In the meantime,{" "}
            <Link href="/#work" className="text-gold underline">
              explore our projects
            </Link>
            .
          </p>
        )}
        <BlogContactSection className="mt-20" />
      </main>
      <Footer />
    </>
  );
}
