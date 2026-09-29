import { Fragment } from "react";
function inline(text: string) {
  return text.split(/(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g).map((part, index) => {
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    return link ? <a key={index} href={link[2]} className="text-gold underline underline-offset-4" rel="noopener noreferrer">{link[1]}</a> : <Fragment key={index}>{part}</Fragment>;
  });
}
export function ArticleBody({ body }: { body: string }) {
  return <div className="space-y-6 break-words text-base leading-8 text-mist/85">{body.split(/\n\s*\n/).map((block, index) => {
    const heading = /^#{1,3}\s+(.+)$/.exec(block.trim());
    if (heading) return <h2 key={index} className="pt-4 text-2xl font-medium text-bone">{inline(heading[1])}</h2>;
    if (block.split("\n").every((line) => /^-\s/.test(line))) return <ul key={index} className="list-disc space-y-2 pl-6">{block.split("\n").map((line, i) => <li key={i}>{inline(line.slice(2))}</li>)}</ul>;
    return <p key={index} className="whitespace-pre-line">{inline(block)}</p>;
  })}</div>;
}
