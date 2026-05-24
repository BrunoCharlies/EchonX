import Image from "next/image";
import Link from "next/link";
import { APP_SHELL_HEADER_HEIGHT_PX } from "@/components/app/app-sidebar-layout";

/** Wide logomarca for footer only (`public/brand/echonx-logo-footer.png`). */
const FOOTER_LOGO_WIDTH = 1024;
const FOOTER_LOGO_HEIGHT = 614;

/** Same box as header logo — see `EchonXLogo` size `header`. */
const FOOTER_LOGO_BOX_HEIGHT_PX = APP_SHELL_HEADER_HEIGHT_PX;
const FOOTER_LOGO_BOX_WIDTH_PX = 260;

/**
 * Zoom from the left so lateral padding in the PNG does not push the wordmark right
 * of the paragraph below.
 */
const FOOTER_LOGO_ZOOM = 2.05;

type Props = {
  href?: string;
};

export function EchonXFooterLogo({ href = "/" }: Props) {
  const logo = (
    <span
      className="relative block overflow-hidden"
      style={{
        height: FOOTER_LOGO_BOX_HEIGHT_PX,
        width: FOOTER_LOGO_BOX_WIDTH_PX,
      }}
    >
      <Image
        src="/brand/echonx-logo-footer.png"
        alt="EchonX"
        width={FOOTER_LOGO_WIDTH}
        height={FOOTER_LOGO_HEIGHT}
        className="h-full w-full max-w-none object-contain object-left"
        style={{
          transform: `scale(${FOOTER_LOGO_ZOOM})`,
          transformOrigin: "left center",
        }}
      />
    </span>
  );

  return (
    <Link href={href} className="inline-block">
      {logo}
    </Link>
  );
}
