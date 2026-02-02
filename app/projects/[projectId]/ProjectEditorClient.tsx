"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ProjectSidebar,
  ChapterEditor,
  ProjectSettingsModal,
} from "@/components/project";
import {
  createChapter,
  deleteChapter,
  reorderChapters,
  type Chapter,
} from "@/app/actions/chapters";
import {
  updateProject,
  setChaptersPublicUpTo,
  type Project,
} from "@/app/actions/projects";

interface ProjectEditorClientProps {
  project: Project;
  initialChapters: Chapter[];
}

export default function ProjectEditorClient({
  project,
  initialChapters,
}: ProjectEditorClientProps) {
  const router = useRouter();
  const [chapters, setChapters] = useState(initialChapters);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    initialChapters[0]?.id || null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const activeChapter = chapters.find((ch) => ch.id === activeChapterId);

  const handleSelectChapter = (chapterId: string) => {
    setActiveChapterId(chapterId);
  };

  const handleCreateChapter = async () => {
    try {
      const newChapter = await createChapter(project.id);
      setChapters((prev) => [...prev, newChapter]);
      setActiveChapterId(newChapter.id);
    } catch (error) {
      console.error("Failed to create chapter:", error);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (chapters.length <= 1) {
      return;
    }

    if (!confirm("確定要刪除這個章節嗎？此操作無法復原。")) {
      return;
    }

    try {
      await deleteChapter(chapterId);

      // Update local state
      const newChapters = chapters.filter((ch) => ch.id !== chapterId);
      setChapters(newChapters);

      // If the deleted chapter was active, select the first remaining chapter
      if (activeChapterId === chapterId) {
        setActiveChapterId(newChapters[0]?.id || null);
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to delete chapter:", error);
    }
  };

  const handleReorderChapters = async (chapterIds: string[]) => {
    try {
      await reorderChapters(project.id, chapterIds);

      // Update local state with new order
      const reorderedChapters = chapterIds.map((id, index) => {
        const chapter = chapters.find((ch) => ch.id === id);
        return { ...chapter!, order: index + 1 };
      });
      setChapters(reorderedChapters);
    } catch (error) {
      console.error("Failed to reorder chapters:", error);
    }
  };

  const handleTitleChange = useCallback(
    (title: string) => {
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === activeChapterId ? { ...ch, title } : ch
        )
      );
    },
    [activeChapterId]
  );

  const handleSaveStatusChange = useCallback(
    (saving: boolean, saved: Date | null) => {
      setIsSaving(saving);
      if (saved) {
        setLastSaved(saved);
      }
    },
    []
  );

  const handleWordCountChange = useCallback(
    (wordCount: number) => {
      setChapters((prev) =>
        prev.map((ch) =>
          ch.id === activeChapterId ? { ...ch, word_count: wordCount } : ch
        )
      );
    },
    [activeChapterId]
  );

  const handleUpdateProject = async (updates: {
    title?: string;
    description?: string;
    is_public?: boolean;
  }) => {
    await updateProject(project.id, updates);
    router.refresh();
  };

  const handleSetPublicUpTo = async (upToOrder: number) => {
    await setChaptersPublicUpTo(project.id, upToOrder);
    router.refresh();
  };

  return (
    <div className="flex bg-background h-[calc(100vh-4rem)]">
      <ProjectSidebar
        project={project}
        chapters={chapters}
        activeChapterId={activeChapterId}
        onSelectChapter={handleSelectChapter}
        onCreateChapter={handleCreateChapter}
        onDeleteChapter={handleDeleteChapter}
        onReorderChapters={handleReorderChapters}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      {activeChapter && (
        <ChapterEditor
          key={activeChapter.id}
          chapter={activeChapter}
          projectId={project.id}
          onTitleChange={handleTitleChange}
          onSaveStatusChange={handleSaveStatusChange}
          onWordCountChange={handleWordCountChange}
        />
      )}

      <ProjectSettingsModal
        project={project}
        chapters={chapters}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateProject={handleUpdateProject}
        onSetPublicUpTo={handleSetPublicUpTo}
      />
    </div>
  );
}
