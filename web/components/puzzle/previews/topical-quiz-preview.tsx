"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import type { TopicalQuizContent } from "@/lib/schemas";

interface TopicalQuizPreviewProps {
  content: unknown;
}

export function TopicalQuizPreview({ content }: TopicalQuizPreviewProps) {
  const data = content as TopicalQuizContent;

  if (!data?.questions?.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Add questions to see preview
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-floodlight">Topical Quiz</h3>
        <p className="text-sm text-muted-foreground">
          5 multiple choice questions
        </p>
      </div>

      {/* Questions Preview */}
      <div className="space-y-4">
        {data.questions.map((question, qIndex) => (
          <div key={qIndex} className="glass-card p-4 space-y-3">
            {/* Question Header */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">Q{qIndex + 1}</Badge>
              {question.imageUrl && (
                <Badge variant="secondary" className="text-xs">
                  Has Image
                </Badge>
              )}
            </div>

            {/* Question Text */}
            <p className="text-sm text-floodlight">
              {question.question || "Question text..."}
            </p>

            {/* Options */}
            <div className="space-y-2">
              {question.options.map((option, optIndex) => {
                const isCorrect = optIndex === question.correctIndex;

                return (
                  <div
                    key={optIndex}
                    className={`p-2 rounded-lg flex items-center gap-2 ${
                      isCorrect
                        ? "bg-pitch-green/20 border border-pitch-green"
                        : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <span className="text-xs font-medium text-muted-foreground w-5">
                      {String.fromCharCode(65 + optIndex)}
                    </span>
                    <span className="text-sm text-floodlight flex-1">
                      {option || `Option ${String.fromCharCode(65 + optIndex)}`}
                    </span>
                    {isCorrect && (
                      <CheckCircle className="h-4 w-4 text-pitch-green" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Scoring Info */}
      <div className="text-center text-xs text-muted-foreground">
        Max Score: 10 points (2 per question)
      </div>
    </div>
  );
}
