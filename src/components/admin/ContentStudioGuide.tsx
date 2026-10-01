"use client";

import { useEffect, useState } from "react";
import type { ContentKind } from "@/lib/content/schema";

const STORAGE_KEY = "content-studio-guide-hidden";

type Props = {
  profileApproved: boolean;
  readyTopics: number;
  draftsToReview: number;
  published: number;
  automationReady: boolean;
  draftWebhookReady: boolean;
  onGoTo: (section: ContentKind | "automation") => void;
};

const stepCard =
  "relative flex gap-4 rounded-xl border border-mist/15 bg-midnight/40 p-4 md:p-5";
const stepNum =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-deep text-sm font-medium text-gold";

export function ContentStudioGuide({
  profileApproved,
  readyTopics,
  draftsToReview,
  published,
  automationReady,
  draftWebhookReady,
  onGoTo,
}: Props) {
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
          Show workflow guide
        </button>
      </p>
    );
  }

  const step1Done = profileApproved;
  const step2Done = readyTopics > 0;
  const step3Hint = draftWebhookReady ? "Use Generate draft now on the n8n tab." : "Run the draft workflow in n8n, or enable the admin button (N8N_DRAFT_WEBHOOK_URL).";
  const step4Done = published > 0;

  return (
    <div className="rounded-2xl border border-gold/25 bg-gradient-to-br from-midnight/80 to-deep/60 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-widest text-gold">YOUR WORKFLOW</p>
          <h3 className="mt-1 text-xl font-medium text-bone">From ideas to live blog posts</h3>
          <p className="mt-2 max-w-2xl text-sm text-mist/70">
            Automation helps with topics and drafts. You stay in control of what goes live.
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-mist/60 underline hover:text-mist"
          onClick={dismiss}
        >
          Hide guide
        </button>
      </div>

      <div className="mt-6 hidden items-center gap-2 text-xs text-mist/50 md:flex" aria-hidden>
        {["Profile", "Topics", "Draft", "Publish"].map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && <span className="text-gold/40">→</span>}
            <span className="rounded border border-mist/20 px-2 py-1">{label}</span>
          </span>
        ))}
      </div>

      <ol className="mt-6 space-y-4">
        <li className={stepCard}>
          <span className={stepNum} aria-hidden>1</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-bone">
              Set up the business profile {step1Done ? <span className="text-green">✓</span> : null}
            </p>
            <p className="mt-1 text-sm text-mist/70">
              Review audience, services, writing rules, and <strong className="font-normal text-mist">competitor websites</strong> (rivals, not your portfolio). Status must be <strong className="font-normal text-mist">Approved</strong> before n8n can read it.
            </p>
            {!step1Done && (
              <button type="button" className="mt-3 text-sm text-gold underline" onClick={() => onGoTo("profile")}>
                Open business profile →
              </button>
            )}
          </div>
        </li>

        <li className={stepCard}>
          <span className={stepNum} aria-hidden>2</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-bone">
              Fill the topic queue {step2Done ? <span className="text-green">✓ {readyTopics} ready</span> : null}
            </p>
            <p className="mt-1 text-sm text-mist/70">
              Run the <strong className="font-normal text-mist">topic planner</strong> in n8n (about weekly) to add up to 30 competitor-style ideas, or create topics manually and set status to <strong className="font-normal text-mist">Ready</strong>. Used topics move to <strong className="font-normal text-mist">Drafted</strong> — they are not deleted.
            </p>
            <button type="button" className="mt-3 text-sm text-gold underline" onClick={() => onGoTo("topic")}>
              View topics →
            </button>
          </div>
        </li>

        <li className={stepCard}>
          <span className={stepNum} aria-hidden>3</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-bone">Generate a draft</p>
            <p className="mt-1 text-sm text-mist/70">
              {step3Hint} Each run picks one Ready topic and creates an article in <strong className="font-normal text-mist">Draft</strong>.
              {!automationReady && " Set N8N_CONTENT_TOKEN on the server first."}
            </p>
            {draftsToReview > 0 && (
              <p className="mt-2 text-sm text-gold">{draftsToReview} draft{draftsToReview === 1 ? "" : "s"} waiting for review.</p>
            )}
            <button type="button" className="mt-3 text-sm text-gold underline" onClick={() => onGoTo("automation")}>
              n8n & history →
            </button>
          </div>
        </li>

        <li className={stepCard}>
          <span className={stepNum} aria-hidden>4</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-bone">
              Edit and publish {step4Done ? <span className="text-green">✓ {published} live</span> : null}
            </p>
            <p className="mt-1 text-sm text-mist/70">
              Open <strong className="font-normal text-mist">Articles</strong>, fix facts and tone, then set status to <strong className="font-normal text-mist">Published</strong> and save. Nothing appears on the blog until you do this.
            </p>
            <button type="button" className="mt-3 text-sm text-gold underline" onClick={() => onGoTo("article")}>
              Review articles →
            </button>
          </div>
        </li>
      </ol>

      <details className="mt-6 rounded-lg border border-mist/15 bg-deep/50 p-4 text-sm text-mist/70">
        <summary className="cursor-pointer font-medium text-mist">When to run automation again</summary>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong className="font-normal text-mist">Topic planner</strong> — when Ready topics run low; new ideas skip duplicates by title and keyword.
          </li>
          <li>
            <strong className="font-normal text-mist">Draft workflow</strong> — daily or whenever you want another draft (one topic per run).
          </li>
          <li>
            Archive Ready topics you will never write; keep Drafted topics if you want the system to avoid repeating the same angle.
          </li>
        </ul>
      </details>
    </div>
  );
}
