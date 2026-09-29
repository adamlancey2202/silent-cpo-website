"use client";
import Link from "next/link";
export default function BlogError({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-3xl px-6 py-32 text-bone"><h1 className="text-3xl">Insights are temporarily unavailable</h1><p className="mt-4">Please try again shortly.</p><button className="mt-6 rounded border border-gold px-4 py-2" onClick={reset}>Try again</button><Link className="ml-6 text-gold" href="/">Back home</Link></main>;
}
