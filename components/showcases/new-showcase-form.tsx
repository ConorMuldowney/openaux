"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { endOfDay, format, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { SamplePreview } from "@/components/showcases/sample-preview";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CalendarIcon,
  ChevronDown,
  FileAudio,
  Link2,
  Upload,
} from "lucide-react";

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

interface ScheduleRangeFieldProps {
  form: UseFormReturn<ShowcaseFormData>;
  label: string;
  opensAtName: "submissionOpensAt" | "votingOpensAt";
  closesAtName: "submissionClosesAt" | "votingClosesAt";
}

// Lets users pick whole calendar days; open/close times are pinned to day start/end.
function ScheduleRangeField({ form, label, opensAtName, closesAtName }: ScheduleRangeFieldProps) {
  const opensAt = useWatch({ control: form.control, name: opensAtName });
  const closesAt = useWatch({ control: form.control, name: closesAtName });
  const opensError = form.formState.errors[opensAtName]?.message;
  const closesError = form.formState.errors[closesAtName]?.message;

  const range: DateRange | undefined = opensAt
    ? { from: new Date(opensAt), to: closesAt ? new Date(closesAt) : undefined }
    : undefined;

  function handleSelect(selected: DateRange | undefined) {
    let next = selected;

    if (range?.from && range?.to && selected?.from && selected?.to) {
      // A complete range was already picked, so react-day-picker's default
      // behavior would extend/shrink it instead of starting fresh. Treat this
      // click as the start of a brand new range.
      const clickedDay =
        selected.from.getTime() !== range.from.getTime() ? selected.from : selected.to;
      next = { from: clickedDay, to: undefined };
    }

    form.setValue(opensAtName, next?.from ? startOfDay(next.from).toISOString() : "", {
      shouldValidate: Boolean(next?.from && next?.to),
      shouldDirty: true,
    });
    form.setValue(closesAtName, next?.to ? endOfDay(next.to).toISOString() : "", {
      shouldValidate: Boolean(next?.from && next?.to),
      shouldDirty: true,
    });
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !range?.from && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {range?.from ? (
              range.to ? (
                <>
                  {format(range.from, "LLL d, y")} - {format(range.to, "LLL d, y")}
                </>
              ) : (
                format(range.from, "LLL d, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="range" selected={range} onSelect={handleSelect} autoFocus />
        </PopoverContent>
      </Popover>
      {opensError && <p className="text-sm font-medium text-destructive">{String(opensError)}</p>}
      {closesError && <p className="text-sm font-medium text-destructive">{String(closesError)}</p>}
    </div>
  );
}

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
      blindJudgingEnabled: true,
      maxRankedPicks: 3,
      requiredSampleIds: [],
      ...initialValues,
      participationScope: "public",
      listenerScope: "public",
      voterScope: "public-authenticated",
    },
  });
  const requiredSampleIds = useWatch({
    control: form.control,
    name: "requiredSampleIds",
  });
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
    <Collapsible defaultOpen={!showcaseId}>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <CollapsibleTrigger className="group flex flex-1 items-start justify-between gap-2 text-left">
            <div className="space-y-1.5">
              <CardTitle>{showcaseId ? "Edit Showcase" : "Create New Showcase"}</CardTitle>
              <CardDescription>
                Configure the settings and schedule for your new showcase.
              </CardDescription>
            </div>
            <ChevronDown className="mt-1 size-4 shrink-0 text-foreground/50 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
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
                      <Select value={field.value} onValueChange={field.onChange} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public - Anyone can submit</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Public until invitations are available</FormDescription>
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
                      <Select value={field.value} onValueChange={field.onChange} disabled>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public">Public - Anyone can listen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Public until invitations are available</FormDescription>
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
                        disabled
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
                        </SelectContent>
                      </Select>
                      <FormDescription>Public until invitations are available</FormDescription>
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

            {/* Reference Samples Section */}
            <FormField
              control={form.control}
              name="requiredSampleIds"
              render={() => (
                <FormItem>
                  <FormLabel>Reference Samples (optional)</FormLabel>
                  <FormDescription>
                    Samples for participants to reference. Upload an audio file or paste a link
                    (YouTube, SoundCloud, direct URL, etc.).
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
                            aria-label="Upload a reference sample audio file"
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
                <ScheduleRangeField
                  form={form}
                  label="Submission Window"
                  opensAtName="submissionOpensAt"
                  closesAtName="submissionClosesAt"
                />

                <ScheduleRangeField
                  form={form}
                  label="Voting Window"
                  opensAtName="votingOpensAt"
                  closesAtName="votingClosesAt"
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
      </CollapsibleContent>
    </Card>
    </Collapsible>
  );
}
