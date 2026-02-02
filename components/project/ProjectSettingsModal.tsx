"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/app/actions/projects";
import type { Chapter } from "@/app/actions/chapters";

interface ProjectSettingsModalProps {
  project: Project;
  chapters: Chapter[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (updates: {
    title?: string;
    description?: string;
    is_public?: boolean;
  }) => Promise<void>;
  onSetPublicUpTo: (upToOrder: number) => Promise<void>;
}

export default function ProjectSettingsModal({
  project,
  chapters,
  isOpen,
  onClose,
  onUpdateProject,
  onSetPublicUpTo,
}: ProjectSettingsModalProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");
  const [isPublic, setIsPublic] = useState(project.is_public);
  const [publicUpTo, setPublicUpTo] = useState(
    chapters.filter((ch) => ch.is_public).length || 0
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(project.title);
      setDescription(project.description || "");
      setIsPublic(project.is_public);
      setPublicUpTo(chapters.filter((ch) => ch.is_public).length || 0);
    }
  }, [isOpen, project, chapters]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProject({
        title,
        description: description || undefined,
        is_public: isPublic,
      });

      if (isPublic && publicUpTo > 0) {
        await onSetPublicUpTo(publicUpTo);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-text">作品設定</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-text/60 hover:text-text transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 5l10 10M15 5l-10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              作品標題
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="輸入作品標題"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              作品簡介
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="輸入作品簡介（選填）"
            />
          </div>

          {/* Public toggle */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium text-text">公開作品</span>
                <p className="text-xs text-text/50 mt-0.5">
                  開啟後，讀者可以在你的個人頁面看到這個作品
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${isPublic ? "bg-primary" : "bg-gray-300"}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${isPublic ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
            </label>
          </div>

          {/* Public chapters selector - only show if project is public */}
          {isPublic && chapters.length > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-text mb-2">
                公開前幾章
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={chapters.length}
                  value={publicUpTo}
                  onChange={(e) => setPublicUpTo(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-text/70 w-20 text-right">
                  {publicUpTo === 0
                    ? "全部私密"
                    : publicUpTo === chapters.length
                    ? "全部公開"
                    : `前 ${publicUpTo} 章`}
                </span>
              </div>
              <p className="text-xs text-text/50 mt-2">
                拖動滑桿選擇要公開的章節數量，未公開的章節只有你能看到
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text/70 hover:text-text transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "儲存中..." : "儲存"}
          </button>
        </div>
      </div>
    </div>
  );
}
