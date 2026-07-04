import { notFound } from "next/navigation";
import { getProject, getProjectTasks } from "@/lib/data/projects";
import { ProjectView } from "@/components/projects/project-view";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const tasks = await getProjectTasks(id);

  return <ProjectView key={project.id} project={project} tasks={tasks} />;
}
