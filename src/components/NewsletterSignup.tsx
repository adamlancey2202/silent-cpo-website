"use client";

import { useState } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type FormState = "idle" | "loading" | "success" | "error";

const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

type Props = {
  source: string;
  className?: string;
};

export function NewsletterSignup({ source, className = "" }: Props) {
  const [state, setState] = useState<FormState>("idle");
  const [already, setAlready] = useState(false);
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
    setAlready(false);

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          name: name || undefined,
          source,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const body = (await res.json()) as { error?: string; already?: boolean };
      if (!res.ok) throw new Error(body.error ?? "Something went wrong");

      setAlready(Boolean(body.already));
      setState("success");
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
      form.reset();
    } catch (err) {
      setState("error");
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
      setErrorMsg(err instanceof Error ? err.message : "Could not sign you up");
    }
  }

  const inputClass =
    "w-full border border-mist/10 bg-midnight/50 px-4 py-3 text-sm text-bone placeholder:text-mist/30 outline-none transition focus:border-gold/40";

  return (
    <aside
      className={`rounded-xl border border-mist/15 bg-midnight/30 px-6 py-6 md:px-8 ${className}`}
    >
      <p className="text-xs tracking-widest text-gold">NEVER MISS A POST</p>
      <h2 className="mt-2 text-lg font-medium text-bone">
        New articles, plus a free strategy call.
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-mist/75">
        Sign up and I&apos;ll email you when a post goes live. Your signup includes a free
        30-minute strategy call.
      </p>

      {state === "success" ? (
        <p className="mt-5 text-sm text-green">
          {already
            ? "You're already on the list."
            : "You're on the list. Check your inbox for the strategy call."}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`newsletter-name-${source}`}
                className="mb-2 block text-[10px] tracking-[0.2em] text-gold"
              >
                NAME
              </label>
              <input
                id={`newsletter-name-${source}`}
                name="name"
                type="text"
                maxLength={100}
                autoComplete="name"
                className={inputClass}
                placeholder="Optional"
              />
            </div>
            <div>
              <label
                htmlFor={`newsletter-email-${source}`}
                className="mb-2 block text-[10px] tracking-[0.2em] text-gold"
              >
                EMAIL *
              </label>
              <input
                id={`newsletter-email-${source}`}
                name="email"
                type="email"
                required
                maxLength={200}
                autoComplete="email"
                className={inputClass}
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div key={turnstileKey}>
            <TurnstileWidget
              onVerify={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
            />
          </div>

          <p className="text-[10px] leading-relaxed text-mist/40">
            New posts only. Unsubscribe any time. See the{" "}
            <a href="/privacy" className="text-gold/70 underline hover:text-gold">
              Privacy Policy
            </a>
            .
          </p>

          <button
            type="submit"
            disabled={state === "loading"}
            className="bg-gold px-6 py-3 text-sm tracking-[0.12em] text-deep transition hover:bg-gold/90 disabled:opacity-60"
          >
            {state === "loading" ? "SIGNING UP..." : "SIGN UP"}
          </button>

          {state === "error" && <p className="text-sm text-red-400">{errorMsg}</p>}
        </form>
      )}
    </aside>
  );
}
