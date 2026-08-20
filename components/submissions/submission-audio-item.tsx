"use client";

import Link from "next/link";
import { InfoIcon } from "lucide-react";
import { WaveformPlayer } from "@/components/showcases/waveform-player";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SubmissionAudioItemProps = {
  title: string;
  description: string | null;
  showcaseId: string;
  showcaseTitle: string;
  entryId: string;
  submittedAt: string;
  submittedAtLabel: string;
  audioUrl: string | null;
};

export function SubmissionAudioItem({
  title,
  description,
  showcaseId,
  showcaseTitle,
  entryId,
  submittedAt,
  submittedAtLabel,
  audioUrl,
}: SubmissionAudioItemProps) {
  return (
    <article className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold">{title}</h2>
            {description ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label={`Show details for ${title}`}>
                    <InfoIcon />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
          <Link
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            href={`/showcases/${showcaseId}`}
          >
            {showcaseTitle}
          </Link>
        </div>
        <time className="text-xs text-muted-foreground" dateTime={submittedAt}>
          {submittedAtLabel}
        </time>
      </div>
      {audioUrl ? (
        <WaveformPlayer
          audioUrl={audioUrl}
          label={title}
          showcaseId={showcaseId}
          entryId={entryId}
          canComment={false}
          isCommentsExpanded={false}
          isDraftActive={false}
        />
      ) : null}
    </article>
  );
}
