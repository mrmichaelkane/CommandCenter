import Link from "next/link";
import { ProjectKeyBadge } from "@/components/projects/project-key-badge";
import { COLOR_BAR, COLOR_DOT } from "@/components/projects/project-colors";
import { cn } from "@/lib/utils";
import type { ProjectWithProgress } from "@/lib/types";

export function ProjectCard({ project }: { project: ProjectWithProgress }) {
  const progress =
    project.totalCount === 0 ? 0 : Math.round((project.doneCount / project.totalCount) * 100);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 transition hover:border-neutral-700 hover:bg-neutral-900"
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", COLOR_DOT[project.color])} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-100">
          {project.name}
        </span>
        <ProjectKeyBadge projectKey={project.key} color={project.color} />
      </div>

      {project.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-neutral-500">
          {project.description}
        </p>
      )}

      <div className="mt-auto">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-neutral-500">
          <span>
            {project.doneCount}/{project.totalCount} done
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
          <div
            className={cn("h-full rounded-full transition-all", COLOR_BAR[project.color])}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
