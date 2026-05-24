import Image from "next/image";
import Link from "next/link";
import { APP_SHELL_HEADER_HEIGHT_PX } from "@/components/app/app-sidebar-layout";
import { cn } from "@/lib/utils";

/** Header / app shell logomarca (`public/brand/echonx-logo.png`). Footer uses `echonx-logo-footer.png`. */
const HEADER_LOGO_WIDTH = 1024;
const HEADER_LOGO_HEIGHT = 614;

/** Same box + zoom as `EchonXFooterLogo` — footer file is not changed. */
const HEADER_LOGO_BOX_HEIGHT_PX = APP_SHELL_HEADER_HEIGHT_PX;
const HEADER_LOGO_BOX_WIDTH_PX = 260;
const HEADER_LOGO_ZOOM = 2.05;

const SIZE_STYLES = {
  header: {
    wrapper: "overflow-hidden",
    wrapperStyle: {
      height: HEADER_LOGO_BOX_HEIGHT_PX,
      width: HEADER_LOGO_BOX_WIDTH_PX,
    } as const,
    image: "object-contain object-left",
    zoom: HEADER_LOGO_ZOOM,
    transformOrigin: "left center" as const,
  },
  compact: {
    wrapper: "h-10 w-[148px] overflow-hidden",
    wrapperStyle: undefined,
    image: "object-contain object-left",
    zoom: HEADER_LOGO_ZOOM,
    transformOrigin: "left center" as const,
  },
  mini: {
    wrapper: "h-7 w-[104px] overflow-hidden",
    wrapperStyle: undefined,
    image: "object-contain object-left",
    zoom: HEADER_LOGO_ZOOM,
    transformOrigin: "left center" as const,
  },
} as const;

export type EchonXLogoSize = keyof typeof SIZE_STYLES;

export const ECHONX_LOGO_HEADER_WRAPPER_CLASS = "relative inline-flex shrink-0 items-center";
export const ECHONX_LOGO_HEADER_IMAGE_CLASS = SIZE_STYLES.header.image;

type Props = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  size?: EchonXLogoSize;
  href?: string;
};

export function EchonXLogo({
  className,
  imageClassName,
  priority = false,
  size = "header",
  href,
}: Props) {
  const styles = SIZE_STYLES[size];

  const logo = (
    <span
      className={cn(ECHONX_LOGO_HEADER_WRAPPER_CLASS, styles.wrapper, className)}
      style={styles.wrapperStyle}
    >
      <Image
        src="/brand/echonx-logo.png"
        alt="EchonX"
        width={HEADER_LOGO_WIDTH}
        height={HEADER_LOGO_HEIGHT}
        priority={priority}
        className={cn("h-full w-full max-w-none", styles.image, imageClassName)}
        style={{
          transform: `scale(${styles.zoom})`,
          transformOrigin: styles.transformOrigin,
        }}
      />
    </span>
  );

  if (!href) {
    return logo;
  }

  return (
    <Link href={href} className="inline-flex items-center">
      {logo}
    </Link>
  );
}
