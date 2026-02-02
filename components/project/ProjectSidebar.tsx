"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import ChapterListItem from "./ChapterListItem";
import type { Chapter } from "@/app/actions/chapters";
import type { Project } from "@/app/actions/projects";

interface ProjectSidebarProps {
  project: Project;
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
  onCreateChapter: () => void;
  onDeleteChapter: (chapterId: string) => void;
  onReorderChapters: (chapterIds: string[]) => void;
  onOpenSettings: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

export default function ProjectSidebar({
  project,
  chapters,
  activeChapterId,
  onSelectChapter,
  onCreateChapter,
  onDeleteChapter,
  onReorderChapters,
  onOpenSettings,
  isSaving,
  lastSaved,
}: ProjectSidebarProps) {
  const [localChapters, setLocalChapters] = useState(chapters);
  const [isMounted, setIsMounted] = useState(false);

  // Only render DndContext on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update local chapters when props change
  if (JSON.stringify(chapters) !== JSON.stringify(localChapters)) {
    setLocalChapters(chapters);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localChapters.findIndex((ch) => ch.id === active.id);
      const newIndex = localChapters.findIndex((ch) => ch.id === over.id);

      const newOrder = arrayMove(localChapters, oldIndex, newIndex);
      setLocalChapters(newOrder);
      onReorderChapters(newOrder.map((ch) => ch.id));
    }
  };

  const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Project header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text truncate" title={project.title}>
            {project.title}
          </h2>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-gray-200 text-text/60 hover:text-text transition-colors"
            title="設定"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="8"
                cy="8"
                r="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M13.5 8a5.5 5.5 0 01-11 0 5.5 5.5 0 0111 0z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2 text-sm text-text/50">
          <span>{totalWords.toLocaleString()} 字</span>
          <span>{chapters.length} 章</span>
        </div>

        {/* Save status */}
        <div className="mt-2 text-xs text-text/40">
          {isSaving ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              儲存中...
            </span>
          ) : lastSaved ? (
            <span>
              已儲存於{" "}
              {lastSaved.toLocaleTimeString("zh-TW", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : null}
        </div>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <span className="text-xs font-medium text-text/50 uppercase tracking-wider">
            章節
          </span>
          <button
            onClick={onCreateChapter}
            className="p-1 rounded hover:bg-gray-200 text-primary hover:text-primary/80 transition-colors"
            title="新增章節"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 2v10M2 7h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {isMounted ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localChapters.map((ch) => ch.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {localChapters.map((chapter) => (
                  <ChapterListItem
                    key={chapter.id}
                    chapter={chapter}
                    isActive={chapter.id === activeChapterId}
                    onSelect={onSelectChapter}
                    onDelete={chapters.length > 1 ? onDeleteChapter : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-1">
            {localChapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`
                  group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
                  ${chapter.id === activeChapterId ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}
                `}
                onClick={() => onSelectChapter(chapter.id)}
              >
                <div className="w-[14px]" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text/40 font-mono">{chapter.order}</span>
                    <span className="truncate text-sm font-medium">{chapter.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text/50 mt-0.5">
                    <span>{chapter.word_count.toLocaleString()} 字</span>
                    {chapter.is_public && <span className="text-green-600">公開</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <a
          href={`/projects/${project.id}/preview`}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-text/70 transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 3C3 3 1 7 1 7s2 4 6 4 6-4 6-4-2-4-6-4z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="7"
              cy="7"
              r="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          全書預覽
        </a>
      </div>
    </aside>
  );
}
