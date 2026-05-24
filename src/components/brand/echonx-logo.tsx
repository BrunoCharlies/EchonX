import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  /** When set, wraps the logo in a link. Omit when the parent already links home. */
  href?: string;
};

export function EchonXLogo({ className, imageClassName, priority = false, href }: Props) {
  const logo = (
    <Image
      src="/brand/echonx-logo.svg"
      alt="EchonX"
      width={360}
      height={48}
      priority={priority}
      className={cn("h-8 w-auto max-w-[180px]", imageClassName)}
    />
  );

  if (!href) {
    return <span className={cn("inline-flex items-center", className)}>{logo}</span>;
  }

  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      {logo}
    </Link>
  );
}
