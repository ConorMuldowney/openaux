"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileAudio, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type NewSubmissionFormProps = {
  showcaseId: string | null;
};

export function NewSubmissionForm({ showcaseId }: NewSubmissionFormProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [audioPreviewUrl]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!showcaseId || !audioFile) {
      setErrorMessage("Choose a showcase and an audio file before submitting.");
      setStatus("error");
      return;
    }

    const contentType = audioFile.type;
    const allowedContentTypes = [
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/flac",
      "audio/aac",
      "audio/mp4",
    ];

    if (!allowedContentTypes.includes(contentType)) {
      setErrorMessage("Use an MP3, WAV, FLAC, AAC, or M4A audio file.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setErrorMessage(null);

    try {
      const uploadResponse = await fetch(`/api/showcases/${showcaseId}/entries/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType }),
      });
      const uploadBody = (await uploadResponse.json()) as
        | { ok: true; data: { uploadUrl: string; storageKey: string } }
        | { ok: false; error: { message: string } };

      if (!uploadResponse.ok || !uploadBody.ok) {
        throw new Error(uploadBody.ok ? "Could not prepare the upload." : uploadBody.error.message);
      }

      const fileResponse = await fetch(uploadBody.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: audioFile,
      });

      if (!fileResponse.ok) {
        throw new Error("The audio file could not be uploaded.");
      }

      const submitResponse = await fetch(`/api/showcases/${showcaseId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          storageKey: uploadBody.data.storageKey,
          usedSampleIds: [],
        }),
      });
      const submitBody = (await submitResponse.json()) as
        | { ok: true }
        | { ok: false; error: { message: string } };

      if (!submitResponse.ok || !submitBody.ok) {
        throw new Error(submitBody.ok ? "Could not save the submission." : submitBody.error.message);
      }

      setSubmitted(true);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong while submitting.");
    }
  }

  return (
    <Card className="flex min-h-0 w-full flex-1 flex-col">
      <CardHeader>
        <CardTitle>New submission</CardTitle>
        <CardDescription>Share one piece of work with the showcase.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {submitted ? (
          <div className="space-y-4" role="status">
            <div className="rounded-lg border border-secondary bg-secondary/20 p-4">
              <p className="font-semibold">Submission received</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your audio and details have been submitted for review.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/submissions">
                <ArrowLeft />
                Back to submissions
              </Link>
            </Button>
          </div>
        ) : (
          <form className="flex flex-1 flex-col gap-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="submission-title">Title</Label>
              <Input id="submission-title" name="title" placeholder="Give your work a title" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission-description">Description</Label>
              <Textarea
                id="submission-description"
                name="description"
                placeholder="Tell listeners a little about this piece"
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submission-audio">Audio file</Label>
              <Input
                id="submission-audio"
                name="audio"
                type="file"
                accept="audio/*"
                onChange={(event) => {
                  const nextAudioFile = event.target.files?.[0] ?? null;
                  setAudioFile(nextAudioFile);
                  setAudioPreviewUrl(nextAudioFile ? URL.createObjectURL(nextAudioFile) : null);
                  setSubmitted(false);
                }}
                required
              />
              <p className="text-xs text-muted-foreground">Choose one audio file to submit.</p>
            </div>

            {audioFile && audioPreviewUrl ? (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileAudio className="size-4 text-primary" />
                  <span className="min-w-0 truncate">{audioFile.name}</span>
                </div>
                <audio
                  className="w-full"
                  controls
                  preload="metadata"
                  aria-label={`Preview of ${audioFile.name}`}
                  src={audioPreviewUrl}
                />
              </div>
            ) : null}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <Button asChild type="button" variant="ghost">
                <Link href="/submissions">
                  <ArrowLeft />
                  Cancel
                </Link>
              </Button>
              <Button type="submit" disabled={!audioFile || status === "uploading" || !showcaseId}>
                <Upload />
                {status === "uploading" ? "Uploading..." : "Submit work"}
              </Button>
            </div>
            {status === "error" && errorMessage ? (
              <p className="text-sm text-destructive" role="alert">{errorMessage}</p>
            ) : null}
          </form>
        )}
      </CardContent>
    </Card>
  );
}