import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/app/actions/projects";
import { getProjectChapters } from "@/app/actions/chapters";
import Header from "@/components/ui/Header";
import { ProjectPreview } from "@/components/project";

interface PreviewPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
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

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <ProjectPreview project={project} chapters={chapters} />
    </main>
  );
}
