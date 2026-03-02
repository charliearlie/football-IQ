"use client";

import { useCallback, useRef, useState } from "react";
import {
  Loader2,
  Upload,
  Download,
  RefreshCw,
  X,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCREENSHOT_STYLES,
  type ScreenshotStyle,
} from "@/lib/screenshots/types";

interface GeneratedScreenshot {
  id: number;
  imageBase64: string;
  headline: string;
  subtitle?: string;
  style: ScreenshotStyle;
  generationTimeMs: number;
  sourceBase64: string;
  sourceMimeType: "image/png" | "image/jpeg";
}

export function ScreenshotGenerator() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<
    "image/png" | "image/jpeg"
  >("image/png");
  const [style, setStyle] = useState<ScreenshotStyle>("hero");
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<GeneratedScreenshot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedStyle = SCREENSHOT_STYLES.find((s) => s.value === style);

  const processFile = useCallback((file: File) => {
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      setError("Please upload a PNG or JPEG image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    const mimeType =
      file.type === "image/jpeg" ? "image/jpeg" : ("image/png" as const);
    setUploadedMimeType(mimeType);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setUploadedImage(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleGenerate = async (overrides?: {
    style: ScreenshotStyle;
    headline: string;
    subtitle?: string;
    sourceBase64: string;
    sourceMimeType: "image/png" | "image/jpeg";
  }) => {
    const genStyle = overrides?.style ?? style;
    const genHeadline = overrides?.headline ?? headline;
    const genSubtitle = overrides?.subtitle ?? subtitle;
    const genSourceBase64 = overrides?.sourceBase64 ?? uploadedImage;
    const genSourceMimeType = overrides?.sourceMimeType ?? uploadedMimeType;

    if (!genSourceBase64 || !genHeadline) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/generate-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenshotBase64: genSourceBase64,
          mimeType: genSourceMimeType,
          style: genStyle,
          headline: genHeadline,
          subtitle: genSubtitle || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Generation failed";
        setError(data.feedback ? `${msg}\n\nGemini feedback: ${data.feedback}` : msg);
        return;
      }

      setGallery((prev) => [
        {
          id: Date.now(),
          imageBase64: data.imageBase64,
          headline: genHeadline,
          subtitle: genSubtitle || undefined,
          style: genStyle,
          generationTimeMs: data.generationTimeMs,
          sourceBase64: genSourceBase64,
          sourceMimeType: genSourceMimeType,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageBase64: string, index: number) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${imageBase64}`;
    link.download = `football-iq-screenshot-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canGenerate = uploadedImage && headline && !isGenerating;

  return (
    <div className="space-y-6">
      {/* Upload + Configure */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Zone */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-floodlight">
            App Screenshot
          </h3>

          {!uploadedImage ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-white/20 bg-white/[0.02] p-12 cursor-pointer hover:border-pitch-green/40 hover:bg-white/[0.04] transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-floodlight">
                  Drop a screenshot here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG or JPEG, max 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <img
                src={`data:${uploadedMimeType};base64,${uploadedImage}`}
                alt="Uploaded screenshot"
                className="w-full rounded-lg border border-white/10"
              />
              <button
                onClick={() => {
                  setUploadedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 rounded-full bg-stadium-navy/80 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-card/20"
              >
                <X className="h-4 w-4 text-floodlight" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Configure Panel */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-floodlight">Configure</h3>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Screenshot Style
            </Label>
            <Select
              value={style}
              onValueChange={(v) => {
                setStyle(v as ScreenshotStyle);
                const preset = SCREENSHOT_STYLES.find((s) => s.value === v);
                if (preset && !headline) {
                  setHeadline(preset.suggestedHeadline);
                }
              }}
            >
              <SelectTrigger className="border-white/10 bg-white/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCREENSHOT_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <span className="font-medium">{s.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {s.description}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Headline</Label>
            <Input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={selectedStyle?.suggestedHeadline ?? "Enter headline"}
              className="border-white/10 bg-white/5"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Subtitle{" "}
              <span className="text-muted-foreground/50">(optional)</span>
            </Label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional subtitle text"
              className="border-white/10 bg-white/5"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full bg-pitch-green text-stadium-navy font-bold hover:bg-pitch-green/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Generate Screenshot
              </>
            )}
          </Button>

          {isGenerating && (
            <p className="text-xs text-muted-foreground text-center">
              This usually takes 20-40 seconds
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-card/30 bg-red-card/10 px-4 py-3 text-sm text-red-card whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Gallery */}
      {gallery.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-floodlight">
              Generated Screenshots ({gallery.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              1242 x 2688px &middot; iPhone 6.5&quot;
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gallery.map((screenshot, i) => (
              <div
                key={screenshot.id}
                className="group rounded-lg border border-white/10 bg-white/5 p-3 space-y-3"
              >
                <img
                  src={`data:image/png;base64,${screenshot.imageBase64}`}
                  alt={`Screenshot: ${screenshot.headline}`}
                  className="w-full rounded-md"
                />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-floodlight truncate">
                    {screenshot.headline}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="rounded bg-white/10 px-1.5 py-0.5">
                      {
                        SCREENSHOT_STYLES.find(
                          (s) => s.value === screenshot.style,
                        )?.label
                      }
                    </span>
                    <span>
                      {(screenshot.generationTimeMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(screenshot.imageBase64, i)}
                      className="flex-1 text-xs border-white/10"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleGenerate({
                          style: screenshot.style,
                          headline: screenshot.headline,
                          subtitle: screenshot.subtitle,
                          sourceBase64: screenshot.sourceBase64,
                          sourceMimeType: screenshot.sourceMimeType,
                        })
                      }
                      disabled={isGenerating}
                      title="Regenerate with same settings"
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
