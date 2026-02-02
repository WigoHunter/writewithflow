import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getPublicProject } from "@/app/actions/projects";
import { getPublicProjectChapters } from "@/app/actions/chapters";
import { PublicProjectReader } from "@/components/project";

interface PublicProjectPageProps {
  params: Promise<{ username: string; projectId: string }>;
}

export default async function PublicProjectPage({
  params,
}: PublicProjectPageProps) {
  const { username, projectId } = await params;
  const supabase = await createClient();

  // Get current user (may be null if not logged in)
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Verify the username matches the project owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) {
    notFound();
  }

  // Get the public project
  const project = await getPublicProject(projectId);

  if (!project || project.user_id !== profile.id) {
    notFound();
  }

  // Get public chapters
  const chapters = await getPublicProjectChapters(projectId);

  if (chapters.length === 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-text">Storyhenge</h1>
          </Link>
          {currentUser ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-text/70 hover:text-text transition-colors font-sans"
            >
              返回儀表板
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors font-sans"
            >
              登入
            </Link>
          )}
        </div>
      </header>

      <PublicProjectReader
        project={project}
        chapters={chapters}
        username={username}
      />
    </main>
  );
}
