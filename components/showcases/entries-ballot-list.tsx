"use client";

import { useState } from "react";
import Link from "next/link";
import { GripVertical, ArrowUp, ArrowDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ShowcaseEntryListItem = {
  entryId: string;
  participantId: string | null;
  participantAlias: string | null;
  audioDownloadUrl: string | null;
};

type EntriesBallotListProps = {
  showcaseId: string;
  entries: ShowcaseEntryListItem[];
  canSubmit: boolean;
  canVote: boolean;
  maxRankedPicks: number;
  initialRankedEntryIds: string[];
};

function entryLabel(entry: ShowcaseEntryListItem, position: number): string {
  return entry.participantAlias ?? entry.participantId ?? `Entry ${position + 1}`;
}

function moveItem<Item>(items: Item[], fromIndex: number, toIndex: number): Item[] {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function buildInitialOrder(
  entries: ShowcaseEntryListItem[],
  initialRankedEntryIds: string[],
): string[] {
  const votableEntryIds = new Set(entries.map((entry) => entry.entryId));
  const ranked = initialRankedEntryIds.filter((entryId) => votableEntryIds.has(entryId));
  const rankedSet = new Set(ranked);
  const remaining = entries
    .filter((entry) => votableEntryIds.has(entry.entryId) && !rankedSet.has(entry.entryId))
    .map((entry) => entry.entryId);

  return [...ranked, ...remaining];
}

export function EntriesBallotList({
  showcaseId,
  entries,
  canSubmit,
  canVote,
  maxRankedPicks,
  initialRankedEntryIds,
}: EntriesBallotListProps) {
  const [order, setOrder] = useState<string[]>(() => buildInitialOrder(entries, initialRankedEntryIds));
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const entriesById = new Map(entries.map((entry) => [entry.entryId, entry]));
  function reorder(fromIndex: number, toIndex: number) {
    setOrder((current) => moveItem(current, fromIndex, toIndex));
    setStatus("idle");
  }

  async function saveRanking() {
    setStatus("saving");
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/showcases/${showcaseId}/ballot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankedEntryIds: order.slice(0, maxRankedPicks) }),
      });

      const body = (await response.json()) as { ok: true } | { ok: false; error: { message: string } };

      if (!body.ok) {
        setStatus("error");
        setErrorMessage(body.error.message);
        return;
      }

      setStatus("saved");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong while saving your ranking.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Submissions</CardTitle>
        {canSubmit ? (
          <Button asChild size="sm">
            <Link href={`/submissions/new?showcaseId=${showcaseId}`}>
              <Upload />
              Upload submission
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 ? (
          <p className="text-sm text-foreground/75">No entries have been submitted yet.</p>
        ) : (
          <ol className="space-y-2">
            {order.map((entryId, index) => {
              const entry = entriesById.get(entryId);
              if (!entry) {
                return null;
              }

              const isRanked = index < maxRankedPicks;

              return (
                <li
                  key={entryId}
                  draggable={canVote}
                  onDragStart={() => setDraggedEntryId(entryId)}
                  onDragOver={(event) => {
                    if (canVote) {
                      event.preventDefault();
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!draggedEntryId || draggedEntryId === entryId) {
                      return;
                    }
                    const fromIndex = order.indexOf(draggedEntryId);
                    reorder(fromIndex, index);
                    setDraggedEntryId(null);
                  }}
                  className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"
                >
                  {canVote ? <GripVertical className="size-4 shrink-0 text-foreground/50" /> : null}
                  <Badge variant={isRanked ? "default" : "outline"} className="shrink-0">
                    {isRanked ? `#${index + 1}` : "Unranked"}
                  </Badge>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">{entryLabel(entry, index)}</p>
                    {entry.audioDownloadUrl ? (
                      <audio
                        controls
                        preload="none"
                        aria-label={`Audio preview for ${entryLabel(entry, index)}`}
                        className="w-full"
                        src={entry.audioDownloadUrl}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">Preparing preview...</p>
                    )}
                  </div>
                  {canVote ? (
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={() => reorder(index, index - 1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Move down"
                        disabled={index === order.length - 1}
                        onClick={() => reorder(index, index + 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}

        {canVote ? (
          <div className="flex items-center gap-3">
            <Button type="button" onClick={saveRanking} disabled={status === "saving" || order.length === 0}>
              {status === "saving" ? "Saving..." : "Save ranking"}
            </Button>
            {status === "saved" ? (
              <p className="text-sm text-foreground/75">Your ranking has been saved.</p>
            ) : null}
            {status === "error" && errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
