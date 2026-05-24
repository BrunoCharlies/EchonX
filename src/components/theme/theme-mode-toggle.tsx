"use client";

import { Moon, Sun } from "lucide-react";
import { useEchonxTheme } from "@/components/theme/echonx-theme-provider";
import { cn } from "@/lib/utils";

export function ThemeModeToggle({ className }: { className?: string }) {
  const { preference: theme, setTheme } = useEchonxTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-0.5",
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme("lumos")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          theme === "lumos"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        Lumos
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          theme === "dark"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        Dark
      </button>
    </div>
  );
}
