"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createDocument() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Create new document
  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: "未命名文件",
      content: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [],
          },
        ],
      },
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating document:", error);
    throw new Error("Failed to create document");
  }

  revalidatePath("/documents");
  redirect(`/documents/${data.id}`);
}

export async function updateDocument(
  documentId: string,
  updates: { title?: string; content?: any }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating document:", error);
    throw new Error("Failed to update document");
  }

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
}

export async function deleteDocument(documentId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting document:", error);
    throw new Error("Failed to delete document");
  }

  revalidatePath("/documents");
  redirect("/documents");
}
