import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g).map((part, index) => {
    const link = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    return link ? (
      <a key={index} href={link[2]} className="text-gold underline underline-offset-4" rel="noopener noreferrer">
        {link[1]}
      </a>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    );
  });
}

type Block =
  | { kind: "heading"; level: 2 | 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] };

function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push({ kind: "list", items: list });
    list = [];
  };

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length, 4) as 2 | 3 | 4;
      const mapped: 2 | 3 | 4 = level <= 2 ? 2 : level === 3 ? 3 : 4;
      blocks.push({ kind: "heading", level: mapped, text: heading[2] });
      continue;
    }

    if (/^-\s+/.test(line)) {
      flushParagraph();
      list.push(line.replace(/^-\s+/, ""));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}

const headingClass: Record<2 | 3 | 4, string> = {
  2: "pt-4 text-2xl font-medium text-bone",
  3: "pt-3 text-xl font-medium text-bone",
  4: "pt-2 text-lg font-medium text-bone",
};

export function ArticleBody({ body }: { body: string }) {
  const blocks = parseBody(body);

  return (
    <div className="space-y-6 break-words text-base leading-8 text-mist/85">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
          return (
            <Tag key={index} className={headingClass[block.level]}>
              {inline(block.text)}
            </Tag>
          );
        }
        if (block.kind === "list") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-6">
              {block.items.map((item, i) => (
                <li key={i}>{inline(item)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {inline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
