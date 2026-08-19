"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { SamplePreview } from "@/components/showcases/sample-preview";
import { AlertCircle, FileAudio, Link2, Upload, X } from "lucide-react";

const ALLOWED_SAMPLE_CONTENT_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/aac",
  "audio/mp4",
];

const SHOWCASE_CREATE_FORM_SCHEMA = z
  .object({
    title: z.string().trim().min(3).max(120),
    participationScope: z.enum(["public", "invite-only"]),
    listenerScope: z.enum(["public", "invite-only"]),
    voterScope: z.enum(["public-authenticated", "invite-only-authenticated"]),
    blindJudgingEnabled: z.boolean(),
    maxRankedPicks: z.number().int().min(1).max(100),
    requiredSampleIds: z.array(z.string().trim().min(1)).max(50),
    submissionOpensAt: z.string().datetime({ offset: true }),
    submissionClosesAt: z.string().datetime({ offset: true }),
    votingOpensAt: z.string().datetime({ offset: true }),
    votingClosesAt: z.string().datetime({ offset: true }),
  })
  .refine(
    (data) =>
      new Date(data.submissionClosesAt) > new Date(data.submissionOpensAt),
    {
      message: "Submission close must be after submission open",
      path: ["submissionClosesAt"],
    },
  )
  .refine(
    (data) =>
      new Date(data.votingOpensAt) >= new Date(data.submissionClosesAt),
    {
      message: "Voting open must be at or after submission close",
      path: ["votingOpensAt"],
    },
  )
  .refine(
    (data) => new Date(data.votingClosesAt) > new Date(data.votingOpensAt),
    {
      message: "Voting close must be after voting open",
      path: ["votingClosesAt"],
    },
  )
  .refine(
    (data) =>
      data.listenerScope !== "invite-only" || data.voterScope === "invite-only-authenticated",
    {
      message: "Invite-only listening requires invite-only voting.",
      path: ["voterScope"],
    },
  );

type ShowcaseFormData = z.infer<typeof SHOWCASE_CREATE_FORM_SCHEMA>;

interface NewShowcaseFormProps {
  onSuccess?: () => void;
  showcaseId?: string;
  initialValues?: Partial<ShowcaseFormData>;
  alwaysOpen?: boolean;
}

export function NewShowcaseForm({
  onSuccess,
  showcaseId,
  initialValues,
  alwaysOpen = false,
}: NewShowcaseFormProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(alwaysOpen);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiredSampleInput, setRequiredSampleInput] = useState("");
  const [isUploadingSample, setIsUploadingSample] = useState(false);
  const [sampleAudioUrls, setSampleAudioUrls] = useState<Record<string, string>>({});
  const requiredSampleFileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ShowcaseFormData>({
    resolver: zodResolver(SHOWCASE_CREATE_FORM_SCHEMA),
    defaultValues: {
      title: "",
      participationScope: "invite-only",
      listenerScope: "public",
      voterScope: "invite-only-authenticated",
      blindJudgingEnabled: true,
      maxRankedPicks: 3,
      requiredSampleIds: [],
      ...initialValues,
    },
  });
  const requiredSampleIds = useWatch({
    control: form.control,
    name: "requiredSampleIds",
  });
  const listenerScope = useWatch({
    control: form.control,
    name: "listenerScope",
  });

  useEffect(() => {
    if (listenerScope === "invite-only") {
      form.setValue("voterScope", "invite-only-authenticated", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [form, listenerScope]);

  // Fetches playback URLs for previously uploaded samples (e.g. when editing an existing showcase).
  useEffect(() => {
    const missingUploadedSampleIds = requiredSampleIds.filter(
      (sampleId) => sampleId.startsWith("s3://") && !sampleAudioUrls[sampleId],
    );
    if (missingUploadedSampleIds.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      missingUploadedSampleIds.map(async (storageKey) => {
        const response = await fetch("/api/showcases/samples/download-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storageKey }),
        });
        if (!response.ok) return null;
        const { data } = await response.json();
        return [storageKey, data.downloadUrl] as const;
      }),
    ).then((results) => {
      if (cancelled) return;
      const resolved = Object.fromEntries(results.filter((result) => result !== null));
      setSampleAudioUrls((current) => ({ ...current, ...resolved }));
    });

    return () => {
      cancelled = true;
    };
  }, [requiredSampleIds, sampleAudioUrls]);

  async function onSubmit(data: ShowcaseFormData) {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(showcaseId ? `/api/showcases/${showcaseId}` : "/api/showcases", {
        method: showcaseId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create showcase");
      }

      await response.json();
      form.reset(data);
      setRequiredSampleInput("");
      if (alwaysOpen) {
        router.push("/showcases");
      } else {
        setShowForm(false);
      }
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  function addRequiredSample() {
    const trimmed = requiredSampleInput.trim();
    if (!trimmed) return;

    if (addRequiredSampleValue(trimmed)) {
      setRequiredSampleInput("");
    }
  }

  function removeRequiredSample(id: string) {
    const currentIds = form.getValues("requiredSampleIds");
    form.setValue(
      "requiredSampleIds",
      currentIds.filter((s) => s !== id),
    );
  }

  function addRequiredSampleValue(value: string) {
    const currentIds = form.getValues("requiredSampleIds");
    if (currentIds.includes(value)) {
      setError("This sample is already added");
      return false;
    }

    if (currentIds.length >= 50) {
      setError("Maximum 50 samples allowed");
      return false;
    }

    form.setValue("requiredSampleIds", [...currentIds, value]);
    setError(null);
    return true;
  }

  async function uploadRequiredSampleFile(file: File) {
    if (!ALLOWED_SAMPLE_CONTENT_TYPES.includes(file.type)) {
      setError("Unsupported audio file type. Use MP3, WAV, FLAC, AAC, or M4A.");
      return;
    }

    try {
      setIsUploadingSample(true);
      setError(null);

      const uploadUrlResponse = await fetch("/api/showcases/samples/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });

      if (!uploadUrlResponse.ok) {
        const errorData = await uploadUrlResponse.json();
        throw new Error(errorData.error?.message || "Failed to prepare the upload");
      }

      const { data: upload } = await uploadUrlResponse.json();

      const putResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error("Failed to upload the audio file");
      }

      setSampleAudioUrls((current) => ({
        ...current,
        [upload.storageKey]: URL.createObjectURL(file),
      }));
      addRequiredSampleValue(upload.storageKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload sample file");
    } finally {
      setIsUploadingSample(false);
    }
  }

  if (!showForm && !alwaysOpen) {
    return <Button onClick={() => setShowForm(true)}>Create New Showcase</Button>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{showcaseId ? "Edit Showcase" : "Create New Showcase"}</CardTitle>
          <CardDescription>
            Configure the settings and schedule for your new showcase.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            form.reset();
            if (alwaysOpen) {
              router.push("/showcases");
            } else {
              setShowForm(false);
            }
            setError(null);
          }}
          className="h-6 w-6 shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Basic Information</h3>
                <p className="text-sm text-muted-foreground">
                  Define the title and basic settings for your showcase.
                </p>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Showcase Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Quare Grooves 2027" {...field} />
                    </FormControl>
                    <FormDescription>3-120 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Access Scopes Section - 3 column grid */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Access Scopes</h3>
                <p className="text-sm text-muted-foreground">
                  Define who can participate, listen, and vote.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="participationScope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participation Scope</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public - Anyone can submit</SelectItem>
                          <SelectItem value="invite-only">Invite Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Who can submit</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="listenerScope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listener Scope</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value: "public" | "invite-only") => {
                          field.onChange(value);
                          if (value === "invite-only") {
                            form.setValue("voterScope", "invite-only-authenticated", {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public - Anyone can listen</SelectItem>
                          <SelectItem value="invite-only">Invite Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Who can listen</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="voterScope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voter Scope</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={listenerScope === "invite-only"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public-authenticated">
                            Public - Anyone can vote
                          </SelectItem>
                          <SelectItem value="invite-only-authenticated">
                            Invite Only
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {listenerScope === "invite-only"
                          ? "Invite-only because listening is invite-only"
                          : "Who can vote"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Voting Settings Section - 2 column grid */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Voting Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how voting will work in your showcase.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="blindJudgingEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Blind Judging</FormLabel>
                        <FormDescription className="text-xs">
                          Hide creator identities
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxRankedPicks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Ranked Picks</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>1-100 entries</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Required Samples Section */}
            <FormField
              control={form.control}
              name="requiredSampleIds"
              render={() => (
                <FormItem>
                  <FormLabel>Required Samples (optional)</FormLabel>
                  <FormDescription>
                    Samples that must be used in submitted entries. Upload an audio file or paste
                    a link (YouTube, SoundCloud, direct URL, etc.).
                  </FormDescription>

                  <div className="space-y-3">
                    <Tabs defaultValue="link" className="w-full flex-col gap-0 overflow-hidden rounded-lg border">
                      <TabsList className="w-full max-w-none rounded-none border-b bg-muted/50 p-1">
                        <TabsTrigger value="link" className="py-1.5">
                          <Link2 className="h-3.5 w-3.5" />
                          Link
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="py-1.5">
                          <Upload className="h-3.5 w-3.5" />
                          Upload
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="link" className="mt-0 rounded-none border-0 bg-muted/20 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <div className="min-w-0 flex-1">
                            <Input
                              placeholder="Paste a YouTube, SoundCloud, or audio URL"
                              value={requiredSampleInput}
                              onChange={(e) => setRequiredSampleInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addRequiredSample();
                                }
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addRequiredSample}
                            disabled={!requiredSampleInput.trim()}
                            className="w-full sm:w-auto"
                          >
                            <Link2 />
                            Add link
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="upload" className="mt-0 rounded-none border-0 bg-muted/20 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground shadow-xs ring-1 ring-border">
                              <FileAudio className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium">Upload an audio sample</p>
                              <p className="truncate text-xs text-muted-foreground">
                                MP3, WAV, FLAC, AAC, or M4A
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => requiredSampleFileInputRef.current?.click()}
                            disabled={isUploadingSample}
                            className="w-full sm:w-auto"
                          >
                            {isUploadingSample ? (
                              <Spinner className="h-4 w-4" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Choose file
                          </Button>
                          <input
                            ref={requiredSampleFileInputRef}
                            type="file"
                            accept="audio/*"
                            aria-label="Upload a required sample audio file"
                            className="sr-only"
                            disabled={isUploadingSample}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file) {
                                void uploadRequiredSampleFile(file);
                              }
                            }}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>

                    {requiredSampleIds.length > 0 && (
                      <div className="space-y-3">
                        {requiredSampleIds.map((sampleId, index) => (
                          <div key={sampleId} className="space-y-2 rounded-lg border bg-muted/40 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-medium text-muted-foreground">Sample {index + 1}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRequiredSample(sampleId)}
                              >
                                Remove
                              </Button>
                            </div>
                            <SamplePreview sample={sampleId} audioFileUrl={sampleAudioUrls[sampleId]} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule Section */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Showcase Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Define when submissions and voting open and close.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="submissionOpensAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Opens</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            if (!e.target.value) {
                              field.onChange("");
                              return;
                            }
                            const [date, time] = e.target.value.split("T");
                            const isoString = `${date}T${time}:00Z`;
                            field.onChange(isoString);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="submissionClosesAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Closes</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            if (!e.target.value) {
                              field.onChange("");
                              return;
                            }
                            const [date, time] = e.target.value.split("T");
                            const isoString = `${date}T${time}:00Z`;
                            field.onChange(isoString);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="votingOpensAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting Opens</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            if (!e.target.value) {
                              field.onChange("");
                              return;
                            }
                            const [date, time] = e.target.value.split("T");
                            const isoString = `${date}T${time}:00Z`;
                            field.onChange(isoString);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="votingClosesAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting Closes</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={
                            field.value
                              ? new Date(field.value).toISOString().slice(0, 16)
                              : ""
                          }
                          onChange={(e) => {
                            if (!e.target.value) {
                              field.onChange("");
                              return;
                            }
                            const [date, time] = e.target.value.split("T");
                            const isoString = `${date}T${time}:00Z`;
                            field.onChange(isoString);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setShowForm(false);
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Spinner className="h-4 w-4" />}
                {showcaseId ? "Save Changes" : "Create Showcase"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
