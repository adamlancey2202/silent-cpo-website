"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "backlink-playbook-hidden";

const stepCard =
  "relative flex gap-4 rounded-xl border border-mist/15 bg-midnight/40 p-4 md:p-5";
const stepNum =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-deep text-sm font-medium text-gold";

export function BacklinkPlaybook() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  function dismiss() {
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function showAgain() {
    setHidden(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  if (hidden) {
    return (
      <p className="text-sm text-mist/60">
        <button type="button" className="text-gold underline hover:no-underline" onClick={showAgain}>
          Show backlink playbook
        </button>
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-midnight/80 to-deep/60 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-gold">BACKLINK PLAYBOOK</p>
          <h3 className="mt-1 text-xl font-medium text-bone">Earn links — track outreach here</h3>
          <p className="mt-2 max-w-2xl text-sm text-mist/70">
            This tab is a shortlist and reminder. Nothing is sent from the site — you copy outreach and contact people yourself.
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-mist/60 underline hover:text-mist"
          onClick={dismiss}
        >
          Hide playbook
        </button>
      </div>

      <ol className="mt-6 space-y-4">
        <li className={stepCard}>
          <span className={stepNum} aria-hidden>1</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-bone">Publish something worth citing</p>
            <p className="mt-1 text-sm text-mist/70">
              Strong <strong className="font-normal text-mist">Articles</strong> (guides, checklists, case angles) are what others link to. Use the performance snapshot above to see which blog paths get traffic.
            </p>
          </div>
        </li>

        <li className={stepCard}>
          <span className={stepNum} aria-hidden>2</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-bone">Add 2–3 opportunities per month</p>
            <p className="mt-1 text-sm text-mist/70">
              Directories, partner resource pages, newsletters, podcasts, or roundup posts. Set{" "}
              <strong className="font-normal text-mist">Opportunity URL</strong> and{" "}
              <strong className="font-normal text-mist">Your page to recommend</strong> (usually one blog post, not only the homepage).
            </p>
          </div>
        </li>

        <li className={stepCard}>
          <span className={stepNum} aria-hidden>3</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-bone">Draft outreach, then send manually</p>
            <p className="mt-1 text-sm text-mist/70">
              Write a short, specific note in <strong className="font-normal text-mist">Outreach draft</strong>. One personalised email beats mass templates. Move status to{" "}
              <strong className="font-normal text-mist">contacted</strong> when sent.
            </p>
          </div>
        </li>

        <li className={stepCard}>
          <span className={stepNum} aria-hidden>4</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-bone">Follow up and record outcomes</p>
            <p className="mt-1 text-sm text-mist/70">
              Use <strong className="font-normal text-mist">Follow-up notes</strong>. Mark <strong className="font-normal text-mist">earned</strong> when a link is live, or{" "}
              <strong className="font-normal text-mist">declined</strong> / <strong className="font-normal text-mist">archived</strong> and move on.
            </p>
          </div>
        </li>
      </ol>

      <details className="mt-6 rounded-lg border border-mist/15 bg-deep/50 p-4 text-sm text-mist/70">
        <summary className="cursor-pointer font-medium text-mist">Good first targets & what to avoid</summary>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>UK founder newsletters, Shopify/booking/MVP resource lists, happy clients (with permission), reputable directories.</li>
          <li>Partners who refer work but do not build — ask for a single line on their resources page.</li>
          <li>Avoid bought links, link farms, and spammy guest-post networks; they hurt more than they help.</li>
        </ul>
        <p className="mt-3 text-xs text-mist/55">
          Status flow: research → shortlisted → contacted → earned (or declined / archived).
        </p>
      </details>
    </div>
  );
}
