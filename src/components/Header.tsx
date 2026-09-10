"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { siteConfig } from "@/lib/site";
import { MobileMenu, MenuButton } from "./MobileMenu";

const navItems = [
  { label: "Philosophy", href: "#philosophy" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="fixed top-0 z-50 w-full border-b border-mist/5 bg-deep/80 backdrop-blur-lg"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="group flex items-center gap-3">
            <Image
              src="/images/logo.jpg"
              alt="SilentCPO logo"
              width={40}
              height={40}
              className="rounded-full ring-1 ring-gold/20 transition group-hover:ring-gold/50"
              priority
            />
            <div>
              <span className="block font-[family-name:var(--font-display)] text-lg tracking-[0.2em] text-bone">
                SILENTCPO
              </span>
              <span className="block text-[10px] tracking-[0.15em] text-mist/60">
                DIGITAL PRODUCT STUDIO
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs tracking-[0.12em] text-mist/70 transition hover:text-gold"
              >
                {item.label.toUpperCase()}
              </a>
            ))}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="border border-gold/30 px-4 py-2 text-xs tracking-[0.12em] text-gold transition hover:bg-gold/10"
            >
              GET IN TOUCH
            </a>
          </nav>

          <MenuButton open={menuOpen} onClick={() => setMenuOpen(!menuOpen)} />
        </div>
      </motion.header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
