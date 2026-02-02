import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject, getUserProjects } from "@/app/actions/projects";
import Header from "@/components/ui/Header";
import { ProjectCard } from "@/components/project";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await getUserProjects();

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-text">我的作品</h1>
          <form action={createProject}>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors font-sans"
            >
              建立新作品
            </button>
          </form>
        </div>

        {projects.length > 0 ? (
          <div className="grid gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-text/70 font-sans mb-8">
              還沒有任何作品，開始創作吧！
            </p>
            <form action={createProject}>
              <button
                type="submit"
                className="px-8 py-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors font-sans text-lg"
              >
                建立第一部作品
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
