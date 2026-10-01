import Link from "next/link";

type Props = {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  className?: string;
};

export function BlogInlineCta({
  title,
  description,
  href = "#blog-contact",
  linkLabel = "Get in touch",
  className = "",
}: Props) {
  return (
    <aside className={`my-10 rounded-xl border border-mist/15 bg-midnight/30 px-6 py-5 md:px-8 ${className}`}>
      <p className="text-xs tracking-widest text-gold">NEXT STEP</p>
      <h2 className="mt-2 text-lg font-medium text-bone">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-mist/75">{description}</p>
      <Link href={href} className="mt-4 inline-block text-sm text-gold underline hover:no-underline">
        {linkLabel}
      </Link>
    </aside>
  );
}
