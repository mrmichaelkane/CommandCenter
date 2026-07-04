import type { ProjectColor } from "@/lib/types";

// Tailwind needs literal class names, so each project colour is mapped
// explicitly rather than interpolated.
export const COLOR_DOT: Record<ProjectColor, string> = {
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  cyan: "bg-cyan-400",
};

export const COLOR_BADGE: Record<ProjectColor, string> = {
  violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
};

export const COLOR_BAR: Record<ProjectColor, string> = {
  violet: "bg-violet-500",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  cyan: "bg-cyan-500",
};
