import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { getHomeJsonLd } from "@/lib/seo";
import { FAQ } from "@/components/FAQ";
import { GridBackground } from "@/components/GridBackground";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Testimonials } from "@/components/Testimonials";
import { SelectedWork } from "@/components/SelectedWork";
import { Philosophy } from "@/components/Philosophy";
import { Capabilities } from "@/components/Capabilities";
import { Process } from "@/components/Process";
import { BlogTeaser } from "@/components/BlogTeaser";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = { alternates: { canonical: siteConfig.url } };

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(getHomeJsonLd()).replace(/</g, "\\u003c") }} />
      <GridBackground />
      <Header />
      <main>
        <Hero />
        <SelectedWork />
        <Testimonials />
        <Philosophy />
        <Capabilities />
        <Process />
        <BlogTeaser />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
