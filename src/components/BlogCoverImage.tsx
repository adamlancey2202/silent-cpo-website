import Image from "next/image";
import { blogOgImageMeta, blogOgImagePath } from "@/lib/blog-media";

type Props = {
  className?: string;
  priority?: boolean;
};

/** Shared branded cover (R2 or site fallback). */
export function BlogCoverImage({ className = "", priority = false }: Props) {
  const src = blogOgImagePath();
  const { alt } = blogOgImageMeta();

  return (
    <div className={`relative mx-auto aspect-[1200/630] w-full max-w-4xl overflow-hidden rounded-2xl border border-mist/15 bg-midnight/50 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 768px"
      />
    </div>
  );
}
