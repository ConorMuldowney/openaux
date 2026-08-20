"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { EntryComment } from "@/src/api/contracts/entry-comments";

type WaveformPlayerProps = {
  showcaseId?: string;
  entryId?: string;
  audioUrl: string;
  label: string;
  canComment: boolean;
  isCommentsExpanded: boolean;
  onToggleCommentsExpanded?: () => void;
  isDraftActive: boolean;
  onRequestCommentDraft?: () => void;
  onCloseCommentDraft?: () => void;
};

const WAVEFORM_SAMPLE_COUNT = 220;
const WAVEFORM_HEIGHT_PX = 72;
const noop = () => undefined;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remainingSeconds = wholeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Downsamples decoded PCM data into peak magnitudes so the canvas can draw a waveform
// that honestly reflects the track's actual amplitude, rather than a generic placeholder shape.
async function decodeWaveformPeaks(audioUrl: string, signal: AbortSignal): Promise<number[]> {
  const response = await fetch(audioUrl, { signal });
  const arrayBuffer = await response.arrayBuffer();
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioContext = new AudioContextClass();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / WAVEFORM_SAMPLE_COUNT));
    const peaks: number[] = [];
    for (let sampleIndex = 0; sampleIndex < WAVEFORM_SAMPLE_COUNT; sampleIndex++) {
      const start = sampleIndex * blockSize;
      let peak = 0;
      for (let offset = 0; offset < blockSize; offset++) {
        const value = Math.abs(channelData[start + offset] ?? 0);
        if (value > peak) {
          peak = value;
        }
      }
      peaks.push(peak);
    }
    return peaks;
  } finally {
    void audioContext.close();
  }
}

// Resolves a Tailwind theme color to a concrete canvas-compatible color string.
function readThemeColor(className: string): string {
  const probe = document.createElement("div");
  probe.className = className;
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return color;
}

export function WaveformPlayer({
  showcaseId,
  entryId,
  audioUrl,
  label,
  canComment,
  isCommentsExpanded,
  onToggleCommentsExpanded,
  isDraftActive,
  onRequestCommentDraft = noop,
  onCloseCommentDraft = noop,
}: WaveformPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [waveformFailed, setWaveformFailed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [comments, setComments] = useState<EntryComment[]>([]);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [internalCommentsExpanded, setInternalCommentsExpanded] = useState(false);

  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const colorsRef = useRef<{ track: string; progress: string; marker: string } | null>(null);
  const commentsExpanded = onToggleCommentsExpanded
    ? isCommentsExpanded
    : internalCommentsExpanded;

  useEffect(() => {
    const controller = new AbortController();
    decodeWaveformPeaks(audioUrl, controller.signal)
      .then((decodedPeaks) => setPeaks(decodedPeaks))
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== "AbortError") {
          setWaveformFailed(true);
        }
      });
    return () => controller.abort();
  }, [audioUrl]);

  useEffect(() => {
    if (!showcaseId || !entryId) {
      return;
    }

    let cancelled = false;

    async function loadComments() {
      try {
        const response = await fetch(`/api/showcases/${showcaseId}/entries/${entryId}/comments`);
        const body = (await response.json()) as
          | { ok: true; data: { comments: EntryComment[] } }
          | { ok: false; error: { message: string } };
        if (cancelled) {
          return;
        }
        if (!body.ok) {
          setCommentsError(body.error.message);
          return;
        }
        setComments(body.data.comments);
      } catch {
        if (!cancelled) {
          setCommentsError("Could not load comments.");
        }
      }
    }

    loadComments();
    return () => {
      cancelled = true;
    };
  }, [showcaseId, entryId]);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) {
      return;
    }

    if (!colorsRef.current) {
      colorsRef.current = {
        track: readThemeColor("text-foreground/50"),
        progress: readThemeColor("text-accent"),
        marker: readThemeColor("text-primary"),
      };
    }
    const colors = colorsRef.current;

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = WAVEFORM_HEIGHT_PX;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.scale(devicePixelRatio, devicePixelRatio);
    context.clearRect(0, 0, width, height);

    const barWidth = width / peaks.length;
    const progressRatio = duration > 0 ? currentTime / duration : 0;
    const middle = height / 2;

    peaks.forEach((peak, index) => {
      const barHeight = Math.max(2, peak * height);
      const x = index * barWidth;
      const isPlayed = index / peaks.length <= progressRatio;
      context.fillStyle = isPlayed ? colors.progress : colors.track;
      context.fillRect(x, middle - barHeight / 2, Math.max(1, barWidth - 1), barHeight);
    });

    if (duration > 0) {
      context.fillStyle = colors.marker;
      for (const comment of comments) {
        const x = (comment.timestampSeconds / duration) * width;
        context.beginPath();
        context.moveTo(x - 4, 0);
        context.lineTo(x + 4, 0);
        context.lineTo(x, 7);
        context.closePath();
        context.fill();
      }
    }
  }, [peaks, duration, currentTime, comments]);

  useEffect(() => {
    drawWaveform();
    window.addEventListener("resize", drawWaveform);
    return () => window.removeEventListener("resize", drawWaveform);
  }, [drawWaveform]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  function seekTo(timestampSeconds: number) {
    if (audioRef.current) {
      audioRef.current.currentTime = timestampSeconds;
    }
    setCurrentTime(timestampSeconds);
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!duration) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const timestampSeconds = ratio * duration;

    seekTo(timestampSeconds);

    if (canComment) {
      onRequestCommentDraft();
      setDraftTimestamp(timestampSeconds);
      setDraftBody("");
      setSubmitError(null);
    }
  }

  async function submitComment() {
    const trimmedBody = draftBody.trim();
    if (draftTimestamp === null || !trimmedBody) {
      return;
    }

    setIsSubmittingComment(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/showcases/${showcaseId}/entries/${entryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestampSeconds: draftTimestamp, body: trimmedBody }),
      });
      const responseBody = (await response.json()) as
        | { ok: true; data: EntryComment }
        | { ok: false; error: { message: string } };

      if (!responseBody.ok) {
        setSubmitError(responseBody.error.message);
        return;
      }

      setComments((current) =>
        [...current, responseBody.data].sort((a, b) => a.timestampSeconds - b.timestampSeconds),
      );
      setDraftTimestamp(null);
      setDraftBody("");
      onCloseCommentDraft();
    } catch {
      setSubmitError("Something went wrong while posting your comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  }

  return (
    <Collapsible
      open={commentsExpanded}
      onOpenChange={(open) => {
        setInternalCommentsExpanded(open);
        onToggleCommentsExpanded?.();
      }}
      className="block space-y-2"
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        className="hidden"
        aria-label={`Audio for ${label}`}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <div className="flex flex-col gap-2">
        <div className="relative min-w-0 flex-1">
          <canvas
            ref={canvasRef}
            className={cn(
              "block h-[72px] w-full cursor-pointer rounded-md bg-muted/40",
              !peaks && !waveformFailed && "animate-pulse",
            )}
            onClick={handleCanvasClick}
            role="slider"
            aria-label={`Waveform for ${label}. Click to seek${canComment ? " or add a comment" : ""}.`}
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          />
          {waveformFailed ? (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
              Waveform unavailable
            </p>
          ) : null}

          {duration > 0
            ? comments.map((comment) => (
                <Tooltip key={comment.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => seekTo(comment.timestampSeconds)}
                      className="absolute top-0 size-2.5 -translate-x-1/2 cursor-pointer rounded-full"
                      style={{ left: `${(comment.timestampSeconds / duration) * 100}%` }}
                      aria-label={`Comment at ${formatTime(comment.timestampSeconds)}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      <span className="font-medium">
                        {comment.authorAlias ?? comment.authorUserId ?? "Listener"}
                      </span>{" "}
                      at {formatTime(comment.timestampSeconds)}: {comment.body}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))
            : null}

          {isDraftActive && draftTimestamp !== null ? (
            <div
              className="mt-2 w-full space-y-2 rounded-lg border bg-popover p-2.5 text-popover-foreground shadow-md"
            >
              <p className="text-xs font-medium">Comment at {formatTime(draftTimestamp)}</p>
              <Textarea
                autoFocus
                value={draftBody}
                onChange={(event) => setDraftBody(event.target.value)}
                placeholder="Say something about this section..."
                className="min-h-16 text-xs"
                maxLength={1000}
              />
              {submitError ? <p className="text-xs text-destructive">{submitError}</p> : null}
              <div className="flex justify-end gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    setDraftTimestamp(null);
                    onCloseCommentDraft();
                  }}
                  disabled={isSubmittingComment}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="xs"
                  onClick={submitComment}
                  disabled={isSubmittingComment || !draftBody.trim()}
                >
                  {isSubmittingComment ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={togglePlayback}
            aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
          >
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </Button>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          {canComment || comments.length > 0 ? (
            <CollapsibleTrigger className="group ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
              Comments{comments.length > 0 ? ` (${comments.length})` : ""}
            </CollapsibleTrigger>
          ) : null}
        </div>
      </div>

      {canComment || comments.length > 0 ? (
        <>
          <CollapsibleContent>
            {comments.length > 0 ? (
              <ul className="mt-1 space-y-1 pl-9">
                {comments.map((comment) => (
                  <li key={comment.id}>
                    <button
                      type="button"
                      onClick={() => seekTo(comment.timestampSeconds)}
                      className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-xs hover:bg-muted"
                    >
                      <span className="shrink-0 font-mono text-muted-foreground">
                        {formatTime(comment.timestampSeconds)}
                      </span>
                      <span className="shrink-0 font-medium">
                        {comment.authorAlias ?? comment.authorUserId ?? "Listener"}
                      </span>
                      <span className="min-w-0 flex-1 break-words text-foreground/75">{comment.body}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 pl-9 text-xs text-muted-foreground">No comments yet.</p>
            )}
          </CollapsibleContent>
        </>
      ) : null}
      {commentsError ? <p className="pl-9 text-xs text-destructive">{commentsError}</p> : null}
    </Collapsible>
  );
}
