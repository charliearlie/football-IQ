"use client";

import { useState, useEffect, useTransition } from "react";
import { Bell, Send, Users, Clock } from "lucide-react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GAME_MODES, GAME_MODE_DISPLAY_NAMES, type GameMode } from "@/lib/constants";
import { sendPushNotification, getSentNotifications, getTokenCount, getTodaysPuzzles, type TodaysPuzzle } from "./actions";

interface SentNotification {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sent_at: string;
  recipient_count: number;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [gameMode, setGameMode] = useState<GameMode | "none">("none");
  const [puzzleId, setPuzzleId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [tokenCount, setTokenCount] = useState(0);
  const [todaysPuzzles, setTodaysPuzzles] = useState<TodaysPuzzle[]>([]);

  // Load history, token count, and today's puzzles on mount
  useEffect(() => {
    getSentNotifications().then(({ notifications }) =>
      setHistory(notifications as SentNotification[])
    );
    getTokenCount().then(setTokenCount);
    getTodaysPuzzles().then(({ puzzles }) => setTodaysPuzzles(puzzles));
  }, []);

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      setResult({ type: "error", message: "Title and body are required" });
      return;
    }

    startTransition(async () => {
      const res = await sendPushNotification({
        title: title.trim(),
        body: body.trim(),
        gameMode: gameMode === "none" ? "" : gameMode,
        puzzleId: puzzleId.trim() || undefined,
      });

      if (res.success) {
        setResult({
          type: "success",
          message: `Sent to ${res.sent}/${res.total} devices${(res.failed ?? 0) > 0 ? ` (${res.failed} failed)` : ""}`,
        });
        setTitle("");
        setBody("");
        setGameMode("none");
        setPuzzleId("");
        // Refresh history
        const { notifications } = await getSentNotifications();
        setHistory(notifications as SentNotification[]);
      } else {
        setResult({ type: "error", message: res.error ?? "Failed to send" });
      }
    });
  };

  return (
    <AdminPageShell
      title="Notifications"
      subtitle="Send push notifications to all users"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        {/* Send Notification Form */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-5 w-5 text-pitch-green" />
            <h2 className="text-lg font-semibold text-floodlight">
              Compose Notification
            </h2>
          </div>

          {/* Token count */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{tokenCount} registered device{tokenCount !== 1 ? "s" : ""}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Champions League Final Quiz!"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              placeholder="Test your knowledge of tonight's epic final"
              value={body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Game Mode (optional deep link)</Label>
            <Select
              value={gameMode}
              onValueChange={(v: string) => setGameMode(v as GameMode | "none")}
            >
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="No deep link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No deep link</SelectItem>
                {GAME_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {GAME_MODE_DISPLAY_NAMES[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {gameMode !== "none" && (() => {
            const matchingPuzzles = todaysPuzzles.filter(
              (p) => p.game_mode === gameMode
            );
            return matchingPuzzles.length > 0 ? (
              <div className="space-y-2">
                <Label>Puzzle (optional deep link)</Label>
                <Select
                  value={puzzleId || "none"}
                  onValueChange={(v: string) => setPuzzleId(v === "none" ? "" : v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="No specific puzzle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific puzzle</SelectItem>
                    {matchingPuzzles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.event_title || p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tapping the notification opens this specific puzzle
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No {GAME_MODE_DISPLAY_NAMES[gameMode]} puzzles scheduled for today
              </p>
            );
          })()}

          {result && (
            <div
              className={`rounded-md px-4 py-3 text-sm ${
                result.type === "success"
                  ? "bg-pitch-green/10 text-pitch-green border border-pitch-green/20"
                  : "bg-red-card/10 text-red-card border border-red-card/20"
              }`}
            >
              {result.message}
            </div>
          )}

          <Button
            onClick={handleSend}
            disabled={isPending || !title.trim() || !body.trim()}
            className="w-full bg-pitch-green hover:bg-pitch-green/90 text-stadium-navy font-semibold"
          >
            {isPending ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to All Devices
              </>
            )}
          </Button>
        </div>

        {/* History */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-pitch-green" />
            <h2 className="text-lg font-semibold text-floodlight">
              History
            </h2>
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notifications sent yet
            </p>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Notification</TableHead>
                    <TableHead className="w-[80px] text-right">Sent</TableHead>
                    <TableHead className="w-[140px] text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((n) => (
                    <TableRow key={n.id} className="border-white/10">
                      <TableCell>
                        <div className="font-medium text-floodlight text-sm">
                          {n.title}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {n.body}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {n.recipient_count}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(n.sent_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}
