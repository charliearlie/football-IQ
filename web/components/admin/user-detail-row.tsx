"use client";

import { useEffect, useState } from "react";
import { fetchUserDetail } from "@/app/(dashboard)/admin/users/actions";
import type { UserDetailData } from "@/app/(dashboard)/admin/users/actions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GAME_MODE_DISPLAY_NAMES,
  type GameMode,
} from "@/lib/constants";

interface UserDetailRowProps {
  userId: string;
}

export function UserDetailRow({ userId }: UserDetailRowProps) {
  const [detail, setDetail] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchUserDetail(userId).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setDetail(res.data);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <tr>
        <td colSpan={6} className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-20 w-full" />
          </div>
        </td>
      </tr>
    );
  }

  if (!detail) return null;

  const { profile, attempts, hasPushToken, streaks } = detail;

  return (
    <tr>
      <td colSpan={6} className="p-0">
        <div className="border-t border-white/5 bg-white/[0.02] px-6 py-4 space-y-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={profile.is_premium ? "success" : "secondary"}>
              {profile.is_premium ? "Premium" : "Free"}
            </Badge>
            {profile.premium_purchased_at && (
              <Badge variant="outline">
                Premium since{" "}
                {new Date(profile.premium_purchased_at).toLocaleDateString(
                  "en-GB",
                  { day: "numeric", month: "short", year: "numeric" }
                )}
              </Badge>
            )}
            <Badge variant={hasPushToken ? "success" : "secondary"}>
              {hasPushToken ? "Push enabled" : "No push token"}
            </Badge>
            <Badge variant="outline">
              {profile.total_iq.toLocaleString()} IQ
            </Badge>
          </div>

          {/* Streaks */}
          {streaks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Streaks
              </p>
              <div className="flex flex-wrap gap-2">
                {streaks
                  .filter((s) => s.current_streak > 0 || s.longest_streak > 0)
                  .map((s) => (
                    <div
                      key={s.game_mode}
                      className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs"
                    >
                      <span className="text-muted-foreground">
                        {GAME_MODE_DISPLAY_NAMES[
                          s.game_mode as GameMode
                        ] ?? s.game_mode}
                      </span>
                      <span className="ml-2 text-floodlight">
                        {s.current_streak}d
                      </span>
                      <span className="ml-1 text-muted-foreground">
                        (best: {s.longest_streak}d)
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recent attempts */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Recent attempts ({attempts.length})
            </p>
            {attempts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No puzzle attempts
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-md border border-white/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                      <th className="text-left px-3 py-1.5 font-medium">
                        Mode
                      </th>
                      <th className="text-left px-3 py-1.5 font-medium">
                        Score
                      </th>
                      <th className="text-left px-3 py-1.5 font-medium">
                        Status
                      </th>
                      <th className="text-left px-3 py-1.5 font-medium">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-white/5 last:border-b-0"
                      >
                        <td className="px-3 py-1.5 text-floodlight">
                          {a.game_mode
                            ? (GAME_MODE_DISPLAY_NAMES[
                                a.game_mode as GameMode
                              ] ?? a.game_mode)
                            : "—"}
                        </td>
                        <td className="px-3 py-1.5">
                          {a.score_display ?? a.score ?? "—"}
                        </td>
                        <td className="px-3 py-1.5">
                          {a.completed ? (
                            <span className="text-pitch-green">Done</span>
                          ) : (
                            <span className="text-card-yellow">
                              In progress
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {a.completed_at
                            ? new Date(a.completed_at).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
