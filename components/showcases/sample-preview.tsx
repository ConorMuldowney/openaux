"use client";

import {
  classifySampleLink,
  getSoundcloudEmbedUrl,
  getYoutubeEmbedUrl,
} from "@/lib/audio-embed";
import { Link2 } from "lucide-react";

type SamplePreviewProps = {
  sample: string;
  // Presigned playback URL for uploaded (s3://) samples; unused for external links.
  audioFileUrl?: string | null;
};

export function SamplePreview({ sample, audioFileUrl }: SamplePreviewProps) {
  const kind = classifySampleLink(sample);

  if (kind === "youtube") {
    const embedUrl = getYoutubeEmbedUrl(sample);
    if (embedUrl) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <iframe
            src={embedUrl}
            title="YouTube sample preview"
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  if (kind === "soundcloud") {
    return (
      <iframe
        src={getSoundcloudEmbedUrl(sample)}
        title="SoundCloud sample preview"
        className="h-[120px] w-full rounded-lg border"
        allow="autoplay"
      />
    );
  }

  if (kind === "audio-file") {
    const src = sample.startsWith("s3://") ? audioFileUrl : sample;
    if (src) {
      return <audio controls preload="none" aria-label="Sample audio preview" className="w-full" src={src} />;
    }
    return <p className="text-sm text-muted-foreground">Preparing preview...</p>;
  }

  return (
    <a
      href={sample}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 break-all text-sm text-accent underline underline-offset-2"
    >
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      {sample}
    </a>
  );
}
