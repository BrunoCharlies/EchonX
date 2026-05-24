import { cn } from "@/lib/utils";

/** Premium Audiopost card — compact padding, no clip on hover */
export const audiopostCardClass = (className?: string) =>
  cn(
    "rounded-2xl border border-white/[0.05] bg-[rgba(10,14,20,0.78)] shadow-none backdrop-blur-[16px]",
    "transition-[transform,box-shadow] duration-[220ms] ease-out hover:-translate-y-0.5",
    className,
  );

export const audiopostCardPadding = "p-4";

export const audiopostSectionLabelClass =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-primary";

export const audiopostIconBtnClass =
  "h-[38px] w-[38px] shrink-0 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]";

export const audiopostPlayBtnClass =
  "h-12 w-12 shrink-0 rounded-full border-2 border-primary/80 bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,255,255,0.32)]";
