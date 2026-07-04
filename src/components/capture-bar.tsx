"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function CaptureBar() {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
        setValue("");
        setFeedback({ text: body.result, isError: false });
        router.refresh();
      } catch (err) {
        setFeedback({ text: err instanceof Error ? err.message : "Something went wrong.", isError: true });
      }
    });
  };

  return (
    <div className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0 text-neutral-500" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (feedback) setFeedback(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Capture anything… e.g. “finish deck by friday”, “ran 5k” or “note: gift ideas for mum”"
          disabled={isPending}
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none disabled:opacity-60"
        />
        {isPending && <span className="text-xs text-neutral-500">thinking…</span>}
      </div>
      {feedback && (
        <p
          className={cn(
            "mx-auto mt-1.5 max-w-6xl text-xs",
            feedback.isError ? "text-red-400" : "text-emerald-400",
          )}
        >
          {feedback.text}
        </p>
      )}
    </div>
  );
}
