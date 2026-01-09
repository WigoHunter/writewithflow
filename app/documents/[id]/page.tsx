import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/ui/Header";
import Editor from "@/components/editor/Editor";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch document
  const { data: document, error } = await supabase
    .from("documents")
    .select("id, title, content, user_id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !document) {
    redirect("/documents");
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Editor
        documentId={document.id}
        initialContent={document.content}
        initialTitle={document.title}
      />
    </main>
  );
}
