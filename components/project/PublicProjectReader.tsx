"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Chapter } from "@/app/actions/chapters";
import type { Project } from "@/app/actions/projects";

interface PublicProjectReaderProps {
  project: Project;
  chapters: Chapter[];
  username: string;
}

export default function PublicProjectReader({
  project,
  chapters,
  username,
}: PublicProjectReaderProps) {
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    chapters[0]?.id || null
  );

  const activeChapter = chapters.find((ch) => ch.id === activeChapterId);

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
    content: activeChapter?.content || { type: "doc", content: [] },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none",
      },
    },
  });

  // Update editor content when chapter changes
  useEffect(() => {
    if (editor && activeChapter?.content) {
      editor.commands.setContent(activeChapter.content);
    }
  }, [editor, activeChapter?.id, activeChapter?.content]);

  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);

  const goToNextChapter = () => {
    const currentIndex = chapters.findIndex((ch) => ch.id === activeChapterId);
    if (currentIndex < chapters.length - 1) {
      setActiveChapterId(chapters[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPreviousChapter = () => {
    const currentIndex = chapters.findIndex((ch) => ch.id === activeChapterId);
    if (currentIndex > 0) {
      setActiveChapterId(chapters[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const currentIndex = chapters.findIndex((ch) => ch.id === activeChapterId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-text/50">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Table of contents sidebar */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col sticky top-16 h-[calc(100vh-4rem)]">
        <div className="p-4 border-b border-gray-200">
          <a
            href={`/u/${username}`}
            className="text-sm text-text/50 hover:text-text transition-colors mb-2 inline-block"
          >
            ← 返回作者頁面
          </a>
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
                onClick={() => setActiveChapterId(chapter.id)}
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
              </button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Reading content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Chapter title */}
          <h1 className="text-3xl font-bold text-text mb-8">
            {activeChapter?.title}
          </h1>

          {/* Content */}
          <div className="bg-white rounded-lg border border-gray-100 px-12 py-10">
            <EditorContent editor={editor} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 py-4 border-t border-gray-200">
            <button
              onClick={goToPreviousChapter}
              disabled={!hasPrevious}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
                ${
                  hasPrevious
                    ? "text-text/70 hover:text-text hover:bg-gray-100"
                    : "text-text/30 cursor-not-allowed"
                }
              `}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 4l-4 4 4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              上一章
            </button>

            <span className="text-sm text-text/50">
              {currentIndex + 1} / {chapters.length}
            </span>

            <button
              onClick={goToNextChapter}
              disabled={!hasNext}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
                ${
                  hasNext
                    ? "text-text/70 hover:text-text hover:bg-gray-100"
                    : "text-text/30 cursor-not-allowed"
                }
              `}
            >
              下一章
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
