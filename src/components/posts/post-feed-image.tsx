import Image from "next/image";
import { cn } from "@/lib/utils";
import { isXImportedPost, type PostImageDimension } from "@/lib/posts/post-image-display";

type Props = {
  src: string;
  alt?: string;
  sizes?: string;
  className?: string;
  externalSource?: string | null;
  authorKind?: string | null;
  dimensions?: PostImageDimension | null;
};

/**
 * Native EchonX uploads use a fixed 16:9 frame.
 * X-imported media keeps the original aspect ratio from X.
 */
export function PostFeedImage({
  src,
  alt = "",
  sizes = "(max-width: 768px) 100vw, 640px",
  className,
  externalSource,
  authorKind,
  dimensions,
}: Props) {
  const natural = isXImportedPost(externalSource, authorKind);
  const frameClass = cn(
    "w-full overflow-hidden rounded-2xl border border-border/60 bg-secondary",
    className,
  );

  if (!natural) {
    return (
      <div className={cn(frameClass, "relative aspect-[16/9]")}>
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} unoptimized />
      </div>
    );
  }

  if (dimensions?.width && dimensions?.height) {
    return (
      <div className={cn(frameClass, "relative")} style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}>
        <Image src={src} alt={alt} fill className="object-contain" sizes={sizes} unoptimized />
      </div>
    );
  }

  return (
    <div className={frameClass}>
      {/* Intrinsic sizing — preserves exact uploaded pixels from X without cropping */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-auto max-h-[min(85vh,960px)] w-full object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
