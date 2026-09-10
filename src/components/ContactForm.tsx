"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { TurnstileWidget } from "./TurnstileWidget";

type FormState = "idle" | "loading" | "success" | "error";

const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (turnstileEnabled && !turnstileToken) {
      setState("error");
      setErrorMsg("Please complete the security check.");
      return;
    }

    setState("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone") || undefined,
          project: data.get("project"),
          budget: data.get("budget") || undefined,
          message: data.get("message"),
          turnstileToken: turnstileToken ?? undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Something went wrong");
      }

      setState("success");
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
      form.reset();
    } catch (err) {
      setState("error");
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
      setErrorMsg(err instanceof Error ? err.message : "Failed to send");
    }
  }

  const inputClass =
    "w-full border border-mist/10 bg-midnight/50 px-4 py-3 text-sm text-bone placeholder:text-mist/30 outline-none transition focus:border-gold/40";

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-[10px] tracking-[0.2em] text-gold">
            NAME *
          </label>
          <input
            id="name"
            name="name"
            required
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-[10px] tracking-[0.2em] text-gold">
            EMAIL *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder="you@company.com"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-2 block text-[10px] tracking-[0.2em] text-gold">
            PHONE
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={inputClass}
            placeholder="Optional"
          />
        </div>
        <div>
          <label htmlFor="budget" className="mb-2 block text-[10px] tracking-[0.2em] text-gold">
            BUDGET RANGE
          </label>
          <select id="budget" name="budget" className={inputClass}>
            <option value="">Select...</option>
            <option value="under-5k">Under £5,000</option>
            <option value="5k-15k">£5,000 – £15,000</option>
            <option value="15k-50k">£15,000 – £50,000</option>
            <option value="50k-plus">£50,000+</option>
            <option value="discuss">Let&apos;s discuss</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="project" className="mb-2 block text-[10px] tracking-[0.2em] text-gold">
          PROJECT TYPE *
        </label>
        <select id="project" name="project" required className={inputClass}>
          <option value="">What are you building?</option>
          <option value="website">Website / Landing Page</option>
          <option value="webapp">Web App / PWA</option>
          <option value="mobile">Native Mobile App</option>
          <option value="platform">Membership / Platform</option>
          <option value="tool">Calculator / Tool</option>
          <option value="other">Something else</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-[10px] tracking-[0.2em] text-gold">
          TELL ME ABOUT YOUR IDEA *
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={`${inputClass} resize-none`}
          placeholder="What's the vision? What problem does it solve? What does success look like?"
        />
      </div>

      <div key={turnstileKey}>
        <TurnstileWidget
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />
      </div>

      <p className="text-[10px] leading-relaxed text-mist/40">
        By submitting, you agree to our{" "}
        <a href="/privacy" className="text-gold/70 underline hover:text-gold">
          Privacy Policy
        </a>
        . Your data is used only to respond to your enquiry.
      </p>

      <button
        type="submit"
        disabled={state === "loading" || state === "success"}
        className="group flex w-full items-center justify-center gap-2 bg-gold px-8 py-4 text-sm font-medium tracking-[0.15em] text-deep transition hover:bg-gold/90 disabled:opacity-60"
      >
        {state === "loading" ? (
          "SENDING..."
        ) : state === "success" ? (
          <>
            <CheckCircle className="h-4 w-4" />
            MESSAGE SENT
          </>
        ) : (
          <>
            SEND MESSAGE
            <Send className="h-4 w-4 transition group-hover:translate-x-1" />
          </>
        )}
      </button>

      {state === "error" && (
        <p className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {errorMsg}
        </p>
      )}

      {state === "success" && (
        <p className="text-center text-sm text-green">
          Thanks — we&apos;ll be in touch within 24 hours.
        </p>
      )}
    </motion.form>
  );
}
