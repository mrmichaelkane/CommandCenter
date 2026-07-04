"use client";

import { useTransition } from "react";
import { Plus } from "lucide-react";
import { createNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";

export function NewNoteButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(async () => void (await createNote()))}
    >
      <Plus className="h-4 w-4" />
      New note
    </Button>
  );
}
