"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface Project {
  id: string;
  title: string;
  description: string | null;
  user_id: string;
  is_public: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  word_count?: number;
  chapter_count?: number;
}

export async function createProject() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Create new project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      title: "未命名作品",
      user_id: user.id,
    })
    .select()
    .single();

  if (projectError || !project) {
    console.error("Error creating project:", projectError);
    throw new Error("Failed to create project");
  }

  // Create first chapter
  const { error: chapterError } = await supabase.from("chapters").insert({
    project_id: project.id,
    title: "第一章",
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [],
        },
      ],
    },
    order: 1,
  });

  if (chapterError) {
    console.error("Error creating first chapter:", chapterError);
    // Clean up the project if chapter creation failed
    await supabase.from("projects").delete().eq("id", project.id);
    throw new Error("Failed to create first chapter");
  }

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  // Get word count
  const { data: wordCountData } = await supabase.rpc("get_project_word_count", {
    p_project_id: projectId,
  });

  // Get chapter count
  const { count: chapterCount } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  return {
    ...data,
    word_count: wordCountData || 0,
    chapter_count: chapterCount || 0,
  };
}

export async function getPublicProject(projectId: string): Promise<Project | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("is_public", true)
    .single();

  if (error || !data) {
    return null;
  }

  // Get word count
  const { data: wordCountData } = await supabase.rpc("get_project_word_count", {
    p_project_id: projectId,
  });

  // Get public chapter count
  const { count: chapterCount } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("is_public", true);

  return {
    ...data,
    word_count: wordCountData || 0,
    chapter_count: chapterCount || 0,
  };
}

export async function getUserProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error || !projects) {
    console.error("Error fetching projects:", error);
    return [];
  }

  // Get word counts for all projects
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const { data: wordCountData } = await supabase.rpc(
        "get_project_word_count",
        { p_project_id: project.id }
      );

      const { count: chapterCount } = await supabase
        .from("chapters")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);

      return {
        ...project,
        word_count: wordCountData || 0,
        chapter_count: chapterCount || 0,
      };
    })
  );

  return projectsWithStats;
}

export async function getPublicProjectsByUserId(
  userId: string
): Promise<Project[]> {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  if (error || !projects) {
    return [];
  }

  // Get word counts for all projects
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const { data: wordCountData } = await supabase.rpc(
        "get_project_word_count",
        { p_project_id: project.id }
      );

      const { count: chapterCount } = await supabase
        .from("chapters")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .eq("is_public", true);

      return {
        ...project,
        word_count: wordCountData || 0,
        chapter_count: chapterCount || 0,
      };
    })
  );

  return projectsWithStats;
}

export async function updateProject(
  projectId: string,
  updates: {
    title?: string;
    description?: string;
    is_public?: boolean;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const updateData: Record<string, unknown> = { ...updates };

  // Set published_at when making public for the first time
  if (updates.is_public === true) {
    const { data: existingProject } = await supabase
      .from("projects")
      .select("published_at")
      .eq("id", projectId)
      .single();

    if (existingProject && !existingProject.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project");
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }

  revalidatePath("/projects");
  redirect("/projects");
}

export async function setChaptersPublicUpTo(
  projectId: string,
  upToOrder: number
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    throw new Error("Project not found");
  }

  // Set chapters with order <= upToOrder to public
  // Note: "order" is a reserved word, so we use filter() with quoted column name
  const { error: publicError } = await supabase
    .from("chapters")
    .update({ is_public: true, published_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .filter('"order"', "lte", upToOrder)
    .is("published_at", null);

  if (publicError) {
    console.error("Error setting chapters public:", publicError);
    throw new Error("Failed to set chapters public");
  }

  // Set chapters with order > upToOrder to private
  const { error: privateError } = await supabase
    .from("chapters")
    .update({ is_public: false })
    .eq("project_id", projectId)
    .filter('"order"', "gt", upToOrder);

  if (privateError) {
    console.error("Error setting chapters private:", privateError);
    throw new Error("Failed to set chapters private");
  }

  revalidatePath(`/projects/${projectId}`);
}
