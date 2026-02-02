"use client";

import { useEditor, EditorContent, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState, useCallback } from "react";
import FloatingToolbar from "@/components/editor/FloatingToolbar";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { countWords, getTodayDate } from "@/lib/word-count";
import { updateChapter } from "@/app/actions/chapters";
import { trackProjectWritingStats } from "@/app/actions/writing-stats";
import type { Chapter } from "@/app/actions/chapters";

interface ChapterEditorProps {
  chapter: Chapter;
  projectId: string;
  onTitleChange: (title: string) => void;
  onSaveStatusChange: (isSaving: boolean, lastSaved: Date | null) => void;
  onWordCountChange: (totalWordCount: number) => void;
}

export default function ChapterEditor({
  chapter,
  projectId,
  onTitleChange,
  onSaveStatusChange,
  onWordCountChange,
}: ChapterEditorProps) {
  const [title, setTitle] = useState(chapter.title);
  const lastSavedContentRef = useRef<string | null>(null);
  const lastSavedTitleRef = useRef<string>(chapter.title);
  const chapterIdRef = useRef(chapter.id);

  // Reset state when chapter changes
  useEffect(() => {
    if (chapterIdRef.current !== chapter.id) {
      setTitle(chapter.title);
      lastSavedTitleRef.current = chapter.title;
      chapterIdRef.current = chapter.id;
    }
  }, [chapter.id, chapter.title]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: chapter.content as Content,
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-full",
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const count = countWords(text);
      onWordCountChange(count);
    },
  });

  // Update editor content when chapter changes
  useEffect(() => {
    if (editor && chapterIdRef.current === chapter.id) {
      // Set initial content ref to avoid auto-save on chapter switch
      lastSavedContentRef.current = JSON.stringify(editor.getJSON());
    }
  }, [editor, chapter.id]);

  // Update editor content when switching chapters
  useEffect(() => {
    if (editor && chapter.content) {
      // Check if this is a different chapter
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(chapter.content);

      if (chapterIdRef.current !== chapter.id || currentContent !== newContent) {
        editor.commands.setContent(chapter.content as Content);
        lastSavedContentRef.current = JSON.stringify(chapter.content);
        chapterIdRef.current = chapter.id;
      }
    }
  }, [editor, chapter.id, chapter.content]);

  // Debounced content for auto-save
  const debouncedContent = useDebounce(editor?.getJSON(), 2000);

  // Auto-save when content changes
  useEffect(() => {
    if (editor && debouncedContent) {
      const currentContentString = JSON.stringify(debouncedContent);

      if (currentContentString !== lastSavedContentRef.current) {
        saveContent(debouncedContent);
        lastSavedContentRef.current = currentContentString;
      }
    }
  }, [debouncedContent]);

  const saveContent = useCallback(
    async (content: unknown) => {
      onSaveStatusChange(true, null);
      try {
        const contentStr = JSON.stringify(content);
        const contentObj = JSON.parse(contentStr);
        const text = editor?.getText() || "";
        const newWordCount = countWords(text);

        await updateChapter(chapter.id, {
          content: contentObj,
          word_count: newWordCount,
        });

        // Track project writing stats (calculates total from all chapters)
        const today = getTodayDate();
        await trackProjectWritingStats(projectId, today);

        onSaveStatusChange(false, new Date());
      } catch (error) {
        console.error("Failed to save:", error);
        onSaveStatusChange(false, null);
      }
    },
    [editor, chapter.id, projectId, onSaveStatusChange]
  );

  // Save title when it changes
  const debouncedTitle = useDebounce(title, 2000);
  useEffect(() => {
    if (debouncedTitle !== lastSavedTitleRef.current) {
      saveTitle(debouncedTitle);
      lastSavedTitleRef.current = debouncedTitle;
    }
  }, [debouncedTitle]);

  const saveTitle = async (newTitle: string) => {
    try {
      await updateChapter(chapter.id, { title: newTitle });
      onTitleChange(newTitle);
    } catch (error) {
      console.error("Failed to save title:", error);
    }
  };

  // Handle title input change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  // Calculate initial word count
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      onWordCountChange(countWords(text));
      lastSavedContentRef.current = JSON.stringify(editor.getJSON());
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-text/50">載入中...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 overflow-y-auto scroll-smooth h-full">
      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Floating Toolbar */}
        <div className="absolute left-0 top-0 bottom-0 w-0">
          <div className="sticky top-8 -translate-x-full pr-4">
            <FloatingToolbar editor={editor} />
          </div>
        </div>

        {/* Paper container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[1056px] px-24 py-16 transition-shadow hover:shadow-md">
          {/* Chapter title */}
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="w-full text-2xl font-bold text-text mb-8 border-none outline-none bg-transparent"
            placeholder="章節標題"
          />

          {/* Editor content */}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
