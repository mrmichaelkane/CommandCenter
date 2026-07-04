import { cn } from "@/lib/utils";
import { COLOR_BADGE } from "@/components/projects/project-colors";
import type { ProjectColor } from "@/lib/types";

export function ProjectKeyBadge({
  projectKey,
  color,
  className,
}: {
  projectKey: string;
  color: ProjectColor;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide",
        COLOR_BADGE[color],
        className,
      )}
    >
      {projectKey}
    </span>
  );
}
