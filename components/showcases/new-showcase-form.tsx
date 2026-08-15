"use client";

import { useState } from "react";
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
import { AlertCircle, X } from "lucide-react";

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

    const currentIds = form.getValues("requiredSampleIds");
    if (currentIds.includes(trimmed)) {
      setError("This sample url is already added");
      return;
    }

    if (currentIds.length >= 50) {
      setError("Maximum 50 samples allowed");
      return;
    }

    form.setValue("requiredSampleIds", [...currentIds, trimmed]);
    setRequiredSampleInput("");
    setError(null);
  }

  function removeRequiredSample(id: string) {
    const currentIds = form.getValues("requiredSampleIds");
    form.setValue(
      "requiredSampleIds",
      currentIds.filter((s) => s !== id),
    );
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
                      <Select value={field.value} onValueChange={field.onChange}>
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="public-authenticated">
                            Public (Authenticated)
                          </SelectItem>
                          <SelectItem value="invite-only-authenticated">
                            Invite Only (Authenticated)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Who can vote</FormDescription>
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
                  <FormLabel>Required Samples</FormLabel>
                  <FormDescription>
                    Samples that must be used in submitted entries
                  </FormDescription>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Sample URL"
                        value={requiredSampleInput}
                        onChange={(e) => setRequiredSampleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addRequiredSample();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addRequiredSample}
                        disabled={!requiredSampleInput.trim()}
                      >
                        Add
                      </Button>
                    </div>

                    {requiredSampleIds.length > 0 && (
                      <div className="space-y-2">
                        {requiredSampleIds.map((sampleId) => (
                          <div
                            key={sampleId}
                            className="flex items-center justify-between rounded-lg border bg-muted p-2.5"
                          >
                            <code className="text-sm">{sampleId}</code>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRequiredSample(sampleId)}
                            >
                              Remove
                            </Button>
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
