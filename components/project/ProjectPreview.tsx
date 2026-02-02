"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Chapter } from "@/app/actions/chapters";
import type { Project } from "@/app/actions/projects";

interface ProjectPreviewProps {
  project: Project;
  chapters: Chapter[];
}

export default function ProjectPreview({
  project,
  chapters,
}: ProjectPreviewProps) {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    chapters[0]?.id || null
  );

  // Create read-only editor for viewing content
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: { type: "doc", content: [] },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none",
      },
    },
  });

  // Combine all chapters content for display
  useEffect(() => {
    if (editor && chapters.length > 0) {
      // Combine all chapters into one document
      const combinedContent = {
        type: "doc" as const,
        content: chapters.flatMap((chapter, index) => [
          // Add chapter title as H1
          {
            type: "heading" as const,
            attrs: { level: 1 },
            content: [{ type: "text" as const, text: chapter.title }],
          },
          // Add chapter content
          ...((chapter.content as { content?: unknown[] })?.content || []),
          // Add spacing between chapters
          ...(index < chapters.length - 1
            ? [{ type: "paragraph" as const }, { type: "paragraph" as const }]
            : []),
        ]),
      };

      editor.commands.setContent(combinedContent as Content);
    }
  }, [editor, chapters]);

  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);

  const scrollToChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
    const index = chapters.findIndex((ch) => ch.id === chapterId);
    if (index >= 0) {
      // Find the heading element and scroll to it
      const headings = document.querySelectorAll(".prose h1");
      if (headings[index]) {
        headings[index].scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-text/50">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Table of contents sidebar */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-text">{project.title}</h2>
          <div className="flex items-center gap-3 mt-2 text-sm text-text/50">
            <span>{totalWords.toLocaleString()} 字</span>
            <span>{chapters.length} 章</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <div className="text-xs font-medium text-text/50 uppercase tracking-wider px-2 py-1 mb-2">
            目錄
          </div>
          <div className="space-y-1">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => scrollToChapter(chapter.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                  ${
                    activeChapterId === chapter.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 text-text/70"
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text/40 font-mono">
                    {chapter.order}
                  </span>
                  <span className="truncate">{chapter.title}</span>
                </div>
                <div className="text-xs text-text/40 mt-0.5 pl-5">
                  {chapter.word_count.toLocaleString()} 字
                </div>
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <a
            href={`/projects/${project.id}`}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            返回編輯
          </a>
        </div>
      </aside>

      {/* Preview content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-24 py-16">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>
    </div>
  );
}
