"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import type { SourceReference as SourceRef } from "@/types";

interface SourceReferenceProps {
  sources: SourceRef[];
}

export function SourceReference({ sources }: SourceReferenceProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <BookOpen className="h-3 w-3" />
        <span>{sources.length} sumber</span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-1">
          {sources.map((src, i) => (
            <div
              key={`${src.topicId}-${i}`}
              className="rounded-md bg-[var(--muted)] p-2 text-xs"
            >
              <div className="font-medium text-[var(--foreground)]">
                {src.topicTitle}
              </div>
              <div className="mt-0.5 text-[var(--muted-foreground)] line-clamp-2">
                {src.snippet}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
