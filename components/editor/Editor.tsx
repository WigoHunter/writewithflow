"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState, useRef } from "react";
import FloatingToolbar from "./FloatingToolbar";
import ChapterSidebar from "./ChapterSidebar";
import { updateDocument } from "@/app/actions/documents";
import { useDebounce } from "@/lib/hooks/useDebounce";

interface EditorProps {
  documentId: string;
  initialContent: any;
  initialTitle: string;
}

export default function Editor({
  documentId,
  initialContent,
  initialTitle,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedContentRef = useRef<string | null>(null);
  const lastSavedTitleRef = useRef<string>(initialTitle);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-full",
      },
    },
    onUpdate: ({ editor }) => {
      // Update word count
      const text = editor.getText();
      const count = countWords(text);
      setWordCount(count);
    },
  });

  // Debounced content for auto-save (2 seconds after user stops typing)
  const debouncedContent = useDebounce(
    editor?.getJSON(),
    2000
  );

  // Auto-save when content changes
  useEffect(() => {
    if (editor && debouncedContent) {
      const currentContentString = JSON.stringify(debouncedContent);

      // Only save if content actually changed
      if (currentContentString !== lastSavedContentRef.current) {
        saveDocument(debouncedContent);
        lastSavedContentRef.current = currentContentString;
      }
    }
  }, [debouncedContent]);

  // Save document
  const saveDocument = async (content: any) => {
    setIsSaving(true);
    try {
      // IMPORTANT: Serialize to JSON string first, then parse back
      // This ensures all properties (including attrs) are preserved when passing to Server Actions
      const contentStr = JSON.stringify(content);
      const contentObj = JSON.parse(contentStr);

      await updateDocument(documentId, { content: contentObj });
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save title when it changes (2 seconds after user stops typing)
  const debouncedTitle = useDebounce(title, 2000);
  useEffect(() => {
    // Only save if title actually changed from last saved state
    if (debouncedTitle !== lastSavedTitleRef.current) {
      saveTitle(debouncedTitle);
      lastSavedTitleRef.current = debouncedTitle;
    }
  }, [debouncedTitle]);

  const saveTitle = async (newTitle: string) => {
    try {
      await updateDocument(documentId, { title: newTitle });
    } catch (error) {
      console.error("Failed to save title:", error);
    }
  };

  // Count words (supports Chinese and English)
  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;

    // Count Chinese characters
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const chineseCount = chineseChars.length;

    // Count English words
    const textWithoutChinese = text.replace(/[\u4e00-\u9fa5]/g, " ");
    const englishWords = textWithoutChinese.match(/\b[a-zA-Z]+\b/g) || [];
    const englishCount = englishWords.length;

    return chineseCount + englishCount;
  };

  // Calculate initial word count and set initial content ref
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      setWordCount(countWords(text));
      // Set initial content ref to avoid auto-save on mount
      lastSavedContentRef.current = JSON.stringify(editor.getJSON());
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex bg-background h-[calc(100vh-4rem)]">
      {/* Chapter Sidebar */}
      <ChapterSidebar editor={editor} />

      {/* Main Editor Area */}
      <div className="flex-1 py-8 overflow-y-auto scroll-smooth h-full">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-bold text-text bg-transparent border-none focus:outline-none w-full mb-2"
              placeholder="文件標題"
            />
            <div className="flex items-center gap-4 text-sm text-text/60 font-sans">
              <span>{wordCount} 字</span>
              {isSaving ? (
                <span>儲存中...</span>
              ) : lastSaved ? (
                <span>已儲存</span>
              ) : null}
            </div>
          </div>

          <FloatingToolbar editor={editor} />
          {/* A4 paper-like container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 min-h-[1056px] px-24 py-24 transition-shadow hover:shadow-md">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
