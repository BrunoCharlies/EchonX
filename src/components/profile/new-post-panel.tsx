"use client";

import { useState } from "react";
import { PenLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostComposer } from "@/components/app/post-composer";

export function NewPostPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" className="w-full gap-2" onClick={() => setOpen(true)}>
        <PenLine className="h-4 w-4" />
        Create new post
      </Button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 px-4 py-6 backdrop-blur-sm">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close create post modal"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 z-20 h-8 w-8 rounded-full bg-background/80"
              aria-label="Close create post modal"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <PostComposer onPublished={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
