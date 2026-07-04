import { getProjects } from "@/lib/data/projects";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectComposer } from "@/components/projects/project-composer";
import { Card } from "@/components/ui/card";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-neutral-50">Projects</h1>

      <Card className="mb-6">
        <ProjectComposer />
      </Card>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 py-16 text-center">
          <p className="mb-1 text-sm text-neutral-400">No projects yet.</p>
          <p className="text-xs text-neutral-600">
            Create one to get a kanban board and task list, Jira-style.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
