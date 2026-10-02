import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArticleBody } from "@/components/ArticleBody";
import { publishedArticle } from "@/lib/content/public";
import { BlogCoverImage } from "@/components/BlogCoverImage";
import { BlogContactSection } from "@/components/BlogContactSection";
import { BlogInlineCta } from "@/components/BlogInlineCta";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { blogOgImageMeta } from "@/lib/blog-media";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";
const getArticle = cache(publishedArticle);
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticle((await params).slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: false } };
  const url = `${siteConfig.url}/blog/${article.slug}`;
  const og = blogOgImageMeta();
  return {
    title: article.data.metaTitle || article.title,
    description: article.data.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.data.metaTitle || article.title,
      description: article.data.metaDescription,
      url,
      publishedTime: article.publishedAt!.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      images: [og],
    },
    twitter: { card: "summary_large_image", images: [og.url] },
  };
}

export default async function ArticlePage({ params }: Props) {
  const article = await getArticle((await params).slug);
  if (!article) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.data.excerpt,
    datePublished: article.publishedAt!.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    mainEntityOfPage: `${siteConfig.url}/blog/${article.slug}`,
    author: { "@type": "Organization", name: "SilentCPO", url: siteConfig.url },
    publisher: { "@type": "Organization", name: "SilentCPO", url: siteConfig.url },
  };
  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-3xl px-6 pb-24 pt-36">
        <Link href="/blog" className="text-sm text-gold">
          ← All insights
        </Link>
        <BlogCoverImage className="mt-6 !max-w-3xl" priority />
        <article className="mt-8">
          <p className="text-xs text-mist/60">
            SilentCPO ·{" "}
            <time dateTime={article.publishedAt!.toISOString()}>
              {article.publishedAt!.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </time>
          </p>
          <h1 className="mt-4 break-words font-[family-name:var(--font-display)] text-5xl leading-tight text-bone md:text-6xl">
            {article.title}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-mist/75">{article.data.excerpt}</p>
          <BlogInlineCta
            className="!mt-14"
            title="Relating this to your own project?"
            description="You can keep reading for context, or tell me what you’re trying to achieve — I’ll help you work out the next step."
            linkLabel="Skip to the contact form"
          />
          <div className="mb-10 mt-8">
            <ArticleBody body={article.data.body} />
          </div>
          <BlogInlineCta
            title="Ready to talk it through?"
            description="If this article raised questions about scope, budget or the right approach, send a short note and I’ll reply within 24 hours."
            linkLabel="Send a message"
          />
          <NewsletterSignup source={article.slug ?? "blog"} className="mt-10" />
        </article>
        <BlogContactSection className="mt-4" compact />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      </main>
      <Footer />
    </>
  );
}
