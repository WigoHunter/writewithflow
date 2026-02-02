import { redirect } from "next/navigation";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  // Documents have been migrated to projects
  // Redirect to the projects list
  redirect("/projects");
}
