import * as React from "react";
import { cn } from "@/lib/utils";

const textareaStyles =
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** Minimal styled `<textarea>` — props tipadas via `TextareaHTMLAttributes` (sem alias de tipo exportado). */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(textareaStyles, className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
