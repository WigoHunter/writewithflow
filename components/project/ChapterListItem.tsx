"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Chapter } from "@/app/actions/chapters";

interface ChapterListItemProps {
  chapter: Chapter;
  isActive: boolean;
  onSelect: (chapterId: string) => void;
  onDelete?: (chapterId: string) => void;
}

export default function ChapterListItem({
  chapter,
  isActive,
  onSelect,
  onDelete,
}: ChapterListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
        ${isActive ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}
        ${isDragging ? "shadow-lg" : ""}
      `}
      onClick={() => onSelect(chapter.id)}
    >
      {/* Drag handle */}
      <button
        className="touch-none text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="4" cy="3" r="1" fill="currentColor" />
          <circle cx="10" cy="3" r="1" fill="currentColor" />
          <circle cx="4" cy="7" r="1" fill="currentColor" />
          <circle cx="10" cy="7" r="1" fill="currentColor" />
          <circle cx="4" cy="11" r="1" fill="currentColor" />
          <circle cx="10" cy="11" r="1" fill="currentColor" />
        </svg>
      </button>

      {/* Chapter info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text/40 font-mono">
            {chapter.order}
          </span>
          <span className="truncate text-sm font-medium">{chapter.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text/50 mt-0.5">
          <span>{chapter.word_count.toLocaleString()} 字</span>
          {chapter.is_public && (
            <span className="text-green-600">公開</span>
          )}
        </div>
      </div>

      {/* Delete button (hidden by default, show on hover) */}
      {onDelete && (
        <button
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(chapter.id);
          }}
          title="刪除章節"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 3l8 8M11 3l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
