/**
 * Migration script: Convert documents to projects with chapters
 *
 * This script:
 * 1. Reads all documents from the database
 * 2. Creates a project for each document
 * 3. Splits document content by H2 headings into chapters
 * 4. Migrates daily_writing_stats from document_id to project_id
 *
 * Usage:
 *   npm run migrate:projects
 *
 * Required env vars (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Types
interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

interface ProseMirrorDoc {
  type: "doc";
  content?: ProseMirrorNode[];
}

interface Document {
  id: string;
  title: string;
  content: ProseMirrorDoc;
  user_id: string;
  word_count: number | null;
  is_public: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Chapter {
  title: string;
  content: ProseMirrorDoc;
  wordCount: number;
}

// Word counting (same as lib/word-count.ts)
function countWords(text: string): number {
  if (!text || text.trim().length === 0) return 0;

  const cjkChars =
    text.match(
      /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uff00-\uffef]/g
    ) || [];
  const cjkCount = cjkChars.length;

  const englishWords = text.match(/\b[a-zA-Z]+\b/g) || [];
  const englishCount = englishWords.length;

  const numbers = text.match(/\b\d+\b/g) || [];
  const numberCount = numbers.length;

  return cjkCount + englishCount + numberCount;
}

// Extract text from ProseMirror nodes
function extractText(nodes: ProseMirrorNode[]): string {
  let text = "";

  for (const node of nodes) {
    if (node.text) {
      text += node.text;
    }
    if (node.content) {
      text += extractText(node.content);
    }
    // Add space between block elements
    if (
      node.type === "paragraph" ||
      node.type === "heading" ||
      node.type === "bulletList" ||
      node.type === "orderedList" ||
      node.type === "listItem" ||
      node.type === "blockquote"
    ) {
      text += " ";
    }
  }

  return text;
}

// Extract text from a heading node
function extractHeadingText(node: ProseMirrorNode): string {
  if (!node.content) return "未命名章節";
  return extractText(node.content).trim() || "未命名章節";
}

// Split ProseMirror content by H2 headings into chapters
function splitContentByH2(content: ProseMirrorDoc): Chapter[] {
  const chapters: Chapter[] = [];
  const nodes = content.content || [];

  if (nodes.length === 0) {
    return [
      {
        title: "第一章",
        content: { type: "doc", content: [] },
        wordCount: 0,
      },
    ];
  }

  let currentTitle = "序章";
  let currentNodes: ProseMirrorNode[] = [];

  for (const node of nodes) {
    // Check if this is an H2 heading
    if (node.type === "heading" && node.attrs?.level === 2) {
      // Save the previous chapter if it has content
      if (currentNodes.length > 0) {
        const chapterContent: ProseMirrorDoc = {
          type: "doc",
          content: currentNodes,
        };
        chapters.push({
          title: currentTitle,
          content: chapterContent,
          wordCount: countWords(extractText(currentNodes)),
        });
      }

      // Start a new chapter with this heading's title
      currentTitle = extractHeadingText(node);
      currentNodes = [];
    } else {
      // Add node to current chapter
      currentNodes.push(node);
    }
  }

  // Save the last chapter
  if (currentNodes.length > 0 || chapters.length === 0) {
    const chapterContent: ProseMirrorDoc = {
      type: "doc",
      content: currentNodes,
    };
    chapters.push({
      title: currentTitle,
      content: chapterContent,
      wordCount: countWords(extractText(currentNodes)),
    });
  }

  return chapters;
}

async function main() {
  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing required environment variables:");
    console.error("  NEXT_PUBLIC_SUPABASE_URL");
    console.error("  SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("Starting migration: documents -> projects + chapters\n");

  // 1. Fetch all documents
  console.log("Fetching documents...");
  const { data: documents, error: fetchError } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("Error fetching documents:", fetchError);
    process.exit(1);
  }

  if (!documents || documents.length === 0) {
    console.log("No documents to migrate.");
    process.exit(0);
  }

  console.log(`Found ${documents.length} document(s) to migrate.\n`);

  // 2. Migrate each document
  for (const doc of documents as Document[]) {
    console.log(`\nMigrating document: "${doc.title}" (${doc.id})`);

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        title: doc.title,
        user_id: doc.user_id,
        is_public: doc.is_public,
        published_at: doc.published_at,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error(`  Error creating project:`, projectError);
      continue;
    }

    console.log(`  Created project: ${project.id}`);

    // Split content into chapters
    const chapters = splitContentByH2(doc.content);
    console.log(`  Split into ${chapters.length} chapter(s)`);

    // Create chapters
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const { error: chapterError } = await supabase.from("chapters").insert({
        project_id: project.id,
        title: chapter.title,
        content: chapter.content,
        word_count: chapter.wordCount,
        order: i + 1,
        is_public: doc.is_public, // Inherit from document
      });

      if (chapterError) {
        console.error(`  Error creating chapter "${chapter.title}":`, chapterError);
      } else {
        console.log(
          `    Chapter ${i + 1}: "${chapter.title}" (${chapter.wordCount} words)`
        );
      }
    }

    // Migrate daily_writing_stats
    const { error: statsError } = await supabase
      .from("daily_writing_stats")
      .update({ project_id: project.id })
      .eq("document_id", doc.id);

    if (statsError) {
      console.error(`  Error migrating stats:`, statsError);
    } else {
      console.log(`  Migrated writing stats`);
    }
  }

  console.log("\n\nMigration complete!");
  console.log("\nNext steps:");
  console.log("1. Verify data in projects and chapters tables");
  console.log("2. Run the cleanup migration to drop documents table");
}

main().catch(console.error);
