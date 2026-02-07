"use client";

import { ArrowDown, Sparkles, DollarSign, Shirt, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { TheThreadContent } from "@/lib/schemas";

interface TheThreadPreviewProps {
  content: unknown;
}

export function TheThreadPreview({ content }: TheThreadPreviewProps) {
  const data = content as TheThreadContent;

  // Empty state - no brands yet
  if (!data?.path?.length) {
    return (
      <div className="text-center text-gray-400 py-8">
        Add brands to see preview
      </div>
    );
  }

  // Check if any brand has content
  const hasBrandContent = data.path.some(
    (b) => b.brand_name?.trim() || b.years?.trim()
  );

  if (!hasBrandContent) {
    return (
      <div className="text-center text-gray-400 py-8">
        Enter brand details to see preview
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-white">Threads</h3>
        <p className="text-sm text-gray-400">
          Identify the club from their kit history
        </p>
      </div>

      {/* Thread Type Badge */}
      <div className="flex justify-center">
        <Badge
          variant="outline"
          className={cn(
            "uppercase text-xs flex items-center gap-1.5",
            data.thread_type === "sponsor"
              ? "border-amber-500/50 text-amber-400"
              : "border-blue-500/50 text-blue-400"
          )}
        >
          {data.thread_type === "sponsor" ? (
            <DollarSign className="h-3 w-3" />
          ) : (
            <Shirt className="h-3 w-3" />
          )}
          {data.thread_type === "sponsor" ? "Shirt Sponsors" : "Kit Suppliers"}
        </Badge>
      </div>

      {/* Brand Timeline */}
      <div className="space-y-2">
        {data.path.map((brand, index) => {
          const hasContent = brand.brand_name?.trim() || brand.years?.trim();
          const isHidden = brand.is_hidden;

          return (
            <div key={index}>
              <div
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  isHidden
                    ? "bg-amber-500/5 border-amber-500/30"
                    : hasContent
                      ? "bg-white/5 border-white/10"
                      : "bg-white/[0.02] border-dashed border-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#58CC02] w-6">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-medium",
                        isHidden
                          ? "text-gray-500 italic"
                          : hasContent ? "text-white" : "text-gray-500"
                      )}
                    >
                      {isHidden ? "???" : (brand.brand_name?.trim() || "Brand name")}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        isHidden
                          ? "text-gray-600 italic"
                          : hasContent ? "text-gray-400" : "text-gray-600"
                      )}
                    >
                      {isHidden ? "????-????" : (brand.years?.trim() || "YYYY-YYYY")}
                    </p>
                  </div>
                  {isHidden && (
                    <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-400 flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      HIDDEN
                    </Badge>
                  )}
                </div>
              </div>

              {/* Arrow connector */}
              {index < data.path.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Answer */}
      {data.correct_club_name && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-gray-400 text-center mb-2">Answer</p>
          <div className="bg-[#58CC02]/20 border border-[#58CC02] rounded-lg p-3 text-center">
            <span className="text-lg font-bold text-[#58CC02]">
              {data.correct_club_name}
            </span>
            {data.correct_club_id && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                {data.correct_club_id}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Kit Lore */}
      {data.kit_lore?.fun_fact && (
        <div className="border-t border-white/10 pt-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200/80 italic">
                {data.kit_lore.fun_fact}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scoring Preview */}
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-gray-400 text-center mb-2">Scoring (hint-based)</p>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-white/5 rounded p-2">
            <div className="text-[#58CC02] font-bold">10</div>
            <div className="text-gray-500">0 hints</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-[#FACC15] font-bold">6</div>
            <div className="text-gray-500">1 hint</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-[#FACC15] font-bold">4</div>
            <div className="text-gray-500">2 hints</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-[#EF4444] font-bold">2</div>
            <div className="text-gray-500">3 hints</div>
          </div>
        </div>
      </div>
    </div>
  );
}
