"use client";

import Link from "next/link";
import type { Project } from "@/app/actions/projects";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const formattedDate = new Date(project.updated_at).toLocaleDateString(
    "zh-TW",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="group bg-white rounded-lg border border-gray-200 p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg text-text group-hover:text-primary transition-colors truncate">
              {project.title}
            </h3>
            {project.description && (
              <p className="text-text/60 text-sm mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-text/50">
              <span>{project.chapter_count || 0} 章</span>
              <span>{(project.word_count || 0).toLocaleString()} 字</span>
              <span>更新於 {formattedDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.is_public ? (
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                公開
              </span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                私密
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
