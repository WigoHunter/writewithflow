"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ProseMirror JSON document format
export interface ProseMirrorDoc {
  type: "doc";
  content?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
    content?: unknown[];
    text?: string;
    marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  }>;
}

export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  content: ProseMirrorDoc;
  word_count: number;
  order: number;
  is_public: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function createChapter(
  projectId: string,
  title?: string
): Promise<Chapter> {
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

  // Get max order (note: "order" is a reserved word)
  const { data: maxOrderData } = await supabase
    .from("chapters")
    .select('"order"')
    .eq("project_id", projectId)
    .order('"order"', { ascending: false })
    .limit(1)
    .single();

  const newOrder = (maxOrderData?.order || 0) + 1;

  const { data, error } = await supabase
    .from("chapters")
    .insert({
      project_id: projectId,
      title: title || `第${newOrder}章`,
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [],
          },
        ],
      },
      order: newOrder,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error creating chapter:", error);
    throw new Error("Failed to create chapter");
  }

  revalidatePath(`/projects/${projectId}`);
  return data;
}

export async function getChapter(chapterId: string): Promise<Chapter | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("chapters")
    .select("*, projects!inner(user_id)")
    .eq("id", chapterId)
    .single();

  if (error || !data) {
    return null;
  }

  // Verify ownership
  if ((data.projects as { user_id: string }).user_id !== user.id) {
    return null;
  }

  // Remove the joined projects data
  const { projects: _, ...chapter } = data;
  return chapter as Chapter;
}

export async function getPublicChapter(
  chapterId: string
): Promise<Chapter | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("*, projects!inner(is_public)")
    .eq("id", chapterId)
    .eq("is_public", true)
    .single();

  if (error || !data) {
    return null;
  }

  // Verify project is also public
  if (!(data.projects as { is_public: boolean }).is_public) {
    return null;
  }

  const { projects: _, ...chapter } = data;
  return chapter as Chapter;
}

export async function getProjectChapters(
  projectId: string
): Promise<Chapter[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return [];
  }

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("project_id", projectId)
    .order('"order"', { ascending: true });

  if (error) {
    console.error("Error fetching chapters:", error);
    return [];
  }

  return data || [];
}

export async function getPublicProjectChapters(
  projectId: string
): Promise<Chapter[]> {
  const supabase = await createClient();

  // Verify project is public
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("is_public", true)
    .single();

  if (!project) {
    return [];
  }

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_public", true)
    .order('"order"', { ascending: true });

  if (error) {
    console.error("Error fetching public chapters:", error);
    return [];
  }

  return data || [];
}

export async function updateChapter(
  chapterId: string,
  updates: {
    title?: string;
    content?: ProseMirrorDoc;
    word_count?: number;
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

  // Verify ownership through project
  const { data: chapter } = await supabase
    .from("chapters")
    .select("project_id, projects!inner(user_id)")
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  if ((chapter.projects as unknown as { user_id: string }).user_id !== user.id) {
    throw new Error("Not authorized");
  }

  const updateData: Record<string, unknown> = { ...updates };

  // Set published_at when making public for the first time
  if (updates.is_public === true) {
    const { data: existingChapter } = await supabase
      .from("chapters")
      .select("published_at")
      .eq("id", chapterId)
      .single();

    if (existingChapter && !existingChapter.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from("chapters")
    .update(updateData)
    .eq("id", chapterId);

  if (error) {
    console.error("Error updating chapter:", error);
    throw new Error("Failed to update chapter");
  }

  // Also update the project's updated_at
  await supabase
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chapter.project_id);

  revalidatePath(`/projects/${chapter.project_id}`);
}

export async function deleteChapter(chapterId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership through project
  const { data: chapter } = await supabase
    .from("chapters")
    .select('project_id, "order", projects!inner(user_id)')
    .eq("id", chapterId)
    .single();

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  if ((chapter.projects as unknown as { user_id: string }).user_id !== user.id) {
    throw new Error("Not authorized");
  }

  // Check if this is the last chapter
  const { count } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("project_id", chapter.project_id);

  if (count && count <= 1) {
    throw new Error("Cannot delete the last chapter");
  }

  // Delete the chapter
  const { error } = await supabase.from("chapters").delete().eq("id", chapterId);

  if (error) {
    console.error("Error deleting chapter:", error);
    throw new Error("Failed to delete chapter");
  }

  // Reorder remaining chapters
  const { data: remainingChapters } = await supabase
    .from("chapters")
    .select('id, "order"')
    .eq("project_id", chapter.project_id)
    .order('"order"', { ascending: true });

  if (remainingChapters) {
    for (let i = 0; i < remainingChapters.length; i++) {
      if (remainingChapters[i].order !== i + 1) {
        await supabase
          .from("chapters")
          .update({ order: i + 1 })
          .eq("id", remainingChapters[i].id);
      }
    }
  }

  revalidatePath(`/projects/${chapter.project_id}`);
}

export async function reorderChapters(
  projectId: string,
  chapterIds: string[]
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

  // Update order for each chapter
  for (let i = 0; i < chapterIds.length; i++) {
    const { error } = await supabase
      .from("chapters")
      .update({ order: i + 1 })
      .eq("id", chapterIds[i])
      .eq("project_id", projectId);

    if (error) {
      console.error("Error reordering chapter:", error);
      throw new Error("Failed to reorder chapters");
    }
  }

  revalidatePath(`/projects/${projectId}`);
}
