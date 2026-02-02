import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/app/actions/projects";
import { getProjectChapters } from "@/app/actions/chapters";
import Header from "@/components/ui/Header";
import ProjectEditorClient from "./ProjectEditorClient";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const project = await getProject(projectId);

  if (!project) {
    redirect("/projects");
  }

  const chapters = await getProjectChapters(projectId);

  if (chapters.length === 0) {
    redirect("/projects");
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <ProjectEditorClient
        project={project}
        initialChapters={chapters}
      />
    </main>
  );
}
