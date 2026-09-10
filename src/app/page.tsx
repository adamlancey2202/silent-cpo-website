import { GridBackground } from "@/components/GridBackground";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Philosophy } from "@/components/Philosophy";
import { Capabilities } from "@/components/Capabilities";
import { Process } from "@/components/Process";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <GridBackground />
      <Header />
      <main>
        <Hero />
        <Philosophy />
        <Capabilities />
        <Process />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
