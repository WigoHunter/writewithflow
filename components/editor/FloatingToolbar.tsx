"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";

interface FloatingToolbarProps {
  editor: Editor;
}

export default function FloatingToolbar({ editor }: FloatingToolbarProps) {
  // Force re-render when editor state changes
  const [, setUpdateTrigger] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateTrigger((prev) => prev + 1);
    };

    editor.on("selectionUpdate", handleUpdate);
    editor.on("update", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("update", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  // Check if there's an actual text selection
  const { from, to } = editor.state.selection;
  const hasSelection = from !== to;

  // If minimized, show only a small expand button
  if (isMinimized) {
    return (
      <div className="z-50 w-fit">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-white rounded-lg shadow-lg border border-gray-200 p-2.5 hover:bg-gray-100 transition-all text-text/70"
          title="展開工具列"
        >
          <ExpandIcon />
        </button>
      </div>
    );
  }

  return (
    <div className="z-50 w-fit">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-3 flex flex-col items-center gap-1 min-w-[52px]">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={hasSelection && editor.isActive("bold")}
          label="粗體 (Cmd+B)"
        >
          <BoldIcon />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={hasSelection && editor.isActive("italic")}
          label="斜體 (Cmd+I)"
        >
          <ItalicIcon />
        </ToolbarButton>

        <div className="h-px w-6 bg-gray-200 my-1" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={hasSelection && editor.isActive("heading", { level: 1 })}
          label="標題 1"
        >
          H1
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={hasSelection && editor.isActive("heading", { level: 2 })}
          label="標題 2"
        >
          H2
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={hasSelection && editor.isActive("heading", { level: 3 })}
          label="標題 3"
        >
          H3
        </ToolbarButton>

        <div className="h-px w-6 bg-gray-200 my-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={hasSelection && editor.isActive("bulletList")}
          label="項目符號"
        >
          <BulletListIcon />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={hasSelection && editor.isActive("orderedList")}
          label="編號清單"
        >
          <OrderedListIcon />
        </ToolbarButton>

        <div className="h-px w-6 bg-gray-200 my-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={hasSelection && editor.isActive("blockquote")}
          label="引用"
        >
          <QuoteIcon />
        </ToolbarButton>

        <div className="h-px w-6 bg-gray-200 my-1" />

        <button
          onClick={() => setIsMinimized(true)}
          className="p-2.5 rounded-md transition-all text-sm font-medium hover:bg-gray-100 hover:scale-105 text-text/70"
          title="縮小工具列"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  label,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-2.5 rounded-md transition-all text-sm font-medium
        hover:bg-gray-100 hover:scale-105
        ${isActive ? "bg-primary text-white shadow-sm" : "text-text/70"}
      `}
      title={label}
    >
      {children}
    </button>
  );
}

// Simple SVG icons
function BoldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 2h5a3 3 0 013 3v0a3 3 0 01-3 3H4V2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 8h6a3 3 0 013 3v0a3 3 0 01-3 3H4V8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 2h4M4 14h4M10 2l-4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BulletListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="3" cy="4" r="1" fill="currentColor" />
      <circle cx="3" cy="8" r="1" fill="currentColor" />
      <circle cx="3" cy="12" r="1" fill="currentColor" />
      <path
        d="M6 4h7M6 8h7M6 12h7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="1"
        y="5"
        fontSize="6"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        1
      </text>
      <text
        x="1"
        y="9"
        fontSize="6"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        2
      </text>
      <text
        x="1"
        y="13"
        fontSize="6"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        3
      </text>
      <path
        d="M6 4h7M6 8h7M6 12h7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 4v8M5 4h8M5 8h8M5 12h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 8h12M8 2v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
