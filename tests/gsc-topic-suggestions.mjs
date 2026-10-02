import assert from "node:assert/strict";
import { buildGscTopicSuggestions } from "../src/lib/gsc-topic-suggestions.ts";

const rows = [
  { query: "silentcpo blog", clicks: 0, impressions: 50, ctr: 0, position: 5 },
  { query: "mvp app cost uk", clicks: 0, impressions: 40, ctr: 0, position: 14 },
  { query: "booking system developer", clicks: 1, impressions: 80, ctr: 0.0125, position: 22 },
];

const out = buildGscTopicSuggestions(rows, { titles: [], keywords: [] });
assert.equal(out.some((s) => s.query === "silentcpo blog"), false, "skips branded");
assert.ok(out.some((s) => s.query === "mvp app cost uk"));
assert.equal(
  buildGscTopicSuggestions(rows, { titles: [], keywords: ["mvp app cost uk"] }).length,
  out.length - 1,
  "dedupes keywords",
);

console.log("PASS: gsc topic suggestions");
