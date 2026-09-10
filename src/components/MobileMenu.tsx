"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site";

const navItems = [
  { label: "Philosophy", href: "#philosophy", num: "01" },
  { label: "Capabilities", href: "#capabilities", num: "02" },
  { label: "Process", href: "#process", num: "03" },
  { label: "Contact", href: "#contact", num: "04" },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-deep/95 backdrop-blur-xl md:hidden"
            onClick={onClose}
          />

          <motion.nav
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col border-l border-mist/10 bg-midnight/95 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="absolute inset-0 grid-bg opacity-20" />

            <div className="relative flex items-center justify-between border-b border-mist/10 px-6 py-5">
              <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.25em] text-gold">
                NAVIGATION
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="group flex h-10 w-10 items-center justify-center border border-mist/10 transition hover:border-gold/40"
              >
                <span className="relative block h-4 w-4">
                  <span className="absolute left-0 top-1/2 block h-px w-4 -translate-y-1/2 rotate-45 bg-bone transition group-hover:bg-gold" />
                  <span className="absolute left-0 top-1/2 block h-px w-4 -translate-y-1/2 -rotate-45 bg-bone transition group-hover:bg-gold" />
                </span>
              </button>
            </div>

            <div className="relative flex-1 px-6 py-8">
              <ul className="space-y-1">
                {navItems.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
                  >
                    <a
                      href={item.href}
                      onClick={onClose}
                      className="group flex items-center justify-between border-b border-mist/5 py-5 transition hover:border-gold/20"
                    >
                      <div className="flex items-baseline gap-4">
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-gold/50">
                          {item.num}
                        </span>
                        <span className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-bone transition group-hover:text-gold">
                          {item.label.toUpperCase()}
                        </span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-mist/30 transition group-hover:text-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="relative border-t border-mist/10 p-6"
            >
              <a
                href={`mailto:${siteConfig.contact.email}`}
                onClick={onClose}
                className="mb-4 flex w-full items-center justify-center gap-2 bg-gold py-4 text-sm font-medium tracking-[0.15em] text-deep transition hover:bg-gold/90"
              >
                GET IN TOUCH
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <p className="text-center font-[family-name:var(--font-mono)] text-[10px] tracking-wider text-mist/40">
                {siteConfig.contact.email}
              </p>
            </motion.div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}

export function MenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="relative flex h-10 w-10 items-center justify-center border border-mist/10 transition hover:border-gold/40 md:hidden"
    >
      <span className="flex w-4 flex-col items-end gap-1.5">
        <motion.span
          animate={open ? { rotate: 45, y: 6, width: 16 } : { rotate: 0, y: 0, width: 16 }}
          className="block h-px origin-center bg-bone"
        />
        <motion.span
          animate={open ? { opacity: 0, width: 0 } : { opacity: 1, width: 10 }}
          className="block h-px bg-bone"
        />
        <motion.span
          animate={open ? { rotate: -45, y: -6, width: 16 } : { rotate: 0, y: 0, width: 14 }}
          className="block h-px origin-center bg-bone"
        />
      </span>
    </button>
  );
}
