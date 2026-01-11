"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { Node } from "@tiptap/pm/model";

interface Chapter {
  id: string;
  level: number; // 1, 2, or 3 for h1, h2, h3
  text: string;
  pos: number; // Position in the document
}

interface ChapterSidebarProps {
  editor: Editor | null;
  title: string;
  setTitle: (title: string) => void;
  wordCount: number;
  isSaving: boolean;
  lastSaved: Date | null;
}

export default function ChapterSidebar({
  editor,
  title,
  setTitle,
  wordCount,
  isSaving,
  lastSaved
}: ChapterSidebarProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Extract headings from the editor
  useEffect(() => {
    if (!editor) return;

    const extractChapters = () => {
      const chapters: Chapter[] = [];
      const doc = editor.state.doc;

      doc.descendants((node: Node, pos: number) => {
        if (node.type.name === "heading") {
          const level = node.attrs.level;
          // Only extract h1, h2, h3
          if (level >= 1 && level <= 3) {
            chapters.push({
              id: `heading-${pos}`,
              level,
              text: node.textContent || "無標題",
              pos,
            });
          }
        }
      });

      setChapters(chapters);
    };

    // Extract on mount
    extractChapters();

    // Re-extract when editor content changes
    editor.on("update", extractChapters);

    return () => {
      editor.off("update", extractChapters);
    };
  }, [editor]);

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="sticky top-0 h-[calc(100vh-4rem)] border-r border-gray-200 bg-gray-50 flex flex-col">
        {/* Document Info - Sticky at top */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold text-text bg-transparent border-none focus:outline-none w-full mb-3 px-0"
            placeholder="文件標題"
          />
          <div className="flex items-center gap-3 text-xs text-text/60 font-sans">
            <span>{wordCount} 字</span>
            {isSaving ? (
              <span>儲存中...</span>
            ) : lastSaved ? (
              <span>已儲存</span>
            ) : null}
          </div>
        </div>

        {/* Chapter Navigation - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">章節導航</h3>
          {!editor || chapters.length === 0 ? (
            <p className="text-sm text-gray-400">
              尚無章節標題。使用標題格式（H1、H2、H3）來建立章節。
            </p>
          ) : (
            <nav>
              <ul className="space-y-1">
                {chapters.map((chapter) => (
                  <li key={chapter.id}>
                    <button
                      onClick={() => {
                        // Scroll to chapter position
                        if (editor) {
                          editor
                            .chain()
                            .focus()
                            .setTextSelection(chapter.pos)
                            .run();

                          // Scroll into view
                          const element = editor.view.domAtPos(chapter.pos).node;
                          if (element instanceof HTMLElement) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                        ${activeChapterId === chapter.id ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700 hover:bg-gray-200"}
                        ${chapter.level === 2 ? "pl-6" : ""}
                        ${chapter.level === 3 ? "pl-9" : ""}
                      `}
                    >
                      <span className="block truncate">{chapter.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </aside>
  );
}
