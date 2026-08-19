import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2BucketName, getR2Client } from "@/src/storage/r2-client";

const UPLOAD_URL_EXPIRY_SECONDS = 300;
const DOWNLOAD_URL_EXPIRY_SECONDS = 300;

// Keep in sync with terraform/main.tf's "originals/" lifecycle prefix.
const ORIGINALS_PREFIX = "originals";

const ALLOWED_AUDIO_CONTENT_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/aac",
  "audio/mp4",
] as const;

export type AllowedAudioContentType = (typeof ALLOWED_AUDIO_CONTENT_TYPES)[number];

export function isAllowedAudioContentType(
  contentType: string,
): contentType is AllowedAudioContentType {
  return (ALLOWED_AUDIO_CONTENT_TYPES as readonly string[]).includes(contentType);
}

export type CreateEntryUploadUrlInput = {
  showcaseId: string;
  participantId: string;
  contentType: AllowedAudioContentType;
};

export type CreateEntryUploadUrlResult = {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
};

export async function createEntryUploadUrl(
  input: CreateEntryUploadUrlInput,
): Promise<CreateEntryUploadUrlResult> {
  const bucketName = getR2BucketName();
  const objectKey = `${ORIGINALS_PREFIX}/${input.showcaseId}/${input.participantId}/${randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    storageKey: `s3://${bucketName}/${objectKey}`,
    expiresInSeconds: UPLOAD_URL_EXPIRY_SECONDS,
  };
}

export type CreateSampleUploadUrlInput = {
  hostUserId: string;
  contentType: AllowedAudioContentType;
};

export type CreateSampleUploadUrlResult = {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
};

// Required-sample audio uploaded by a Host, independent of any particular Showcase's lifecycle.
const SAMPLES_PREFIX = "samples";

export async function createSampleUploadUrl(
  input: CreateSampleUploadUrlInput,
): Promise<CreateSampleUploadUrlResult> {
  const bucketName = getR2BucketName();
  const objectKey = `${SAMPLES_PREFIX}/${input.hostUserId}/${randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    ContentType: input.contentType,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  });

  return {
    uploadUrl,
    storageKey: `s3://${bucketName}/${objectKey}`,
    expiresInSeconds: UPLOAD_URL_EXPIRY_SECONDS,
  };
}

export type EntryStorageKeyOwnershipInput = {
  storageKey: string;
  showcaseId: string;
  participantId: string;
};

// Confirms a client-submitted storageKey actually points at the presigned location
// issued for this participant, rather than an arbitrary/other participant's object.
export function isEntryStorageKeyOwnedByParticipant(
  input: EntryStorageKeyOwnershipInput,
): boolean {
  const bucketName = getR2BucketName();
  const expectedPrefix = `s3://${bucketName}/${ORIGINALS_PREFIX}/${input.showcaseId}/${input.participantId}/`;
  return input.storageKey.startsWith(expectedPrefix);
}

// Parses the object key out of a `s3://<bucket>/<key>` storageKey issued by createSampleUploadUrl.
function parseSampleStorageKey(storageKey: string): string | null {
  const bucketName = getR2BucketName();
  const expectedPrefix = `s3://${bucketName}/${SAMPLES_PREFIX}/`;
  if (!storageKey.startsWith(expectedPrefix)) {
    return null;
  }
  return storageKey.slice(`s3://${bucketName}/`.length);
}

export type CreateSampleDownloadUrlResult = {
  downloadUrl: string;
  expiresInSeconds: number;
};

// Presigned GET for a previously uploaded required-sample; returns null for non-sample storageKeys.
export async function createSampleDownloadUrl(
  storageKey: string,
): Promise<CreateSampleDownloadUrlResult | null> {
  const objectKey = parseSampleStorageKey(storageKey);
  if (!objectKey) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
  });

  const downloadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS,
  });

  return {
    downloadUrl,
    expiresInSeconds: DOWNLOAD_URL_EXPIRY_SECONDS,
  };
}

// Parses the object key out of a `s3://<bucket>/<key>` storageKey issued by createEntryUploadUrl.
function parseEntryStorageKey(storageKey: string): string | null {
  const bucketName = getR2BucketName();
  const expectedPrefix = `s3://${bucketName}/${ORIGINALS_PREFIX}/`;
  if (!storageKey.startsWith(expectedPrefix)) {
    return null;
  }
  return storageKey.slice(`s3://${bucketName}/`.length);
}

export type CreateEntryDownloadUrlResult = {
  downloadUrl: string;
  expiresInSeconds: number;
};

// Presigned GET for a previously uploaded Entry audio file; returns null for non-entry storageKeys.
export async function createEntryDownloadUrl(
  storageKey: string,
): Promise<CreateEntryDownloadUrlResult | null> {
  const objectKey = parseEntryStorageKey(storageKey);
  if (!objectKey) {
    return null;
  }

  const command = new GetObjectCommand({
    Bucket: getR2BucketName(),
    Key: objectKey,
  });

  const downloadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: DOWNLOAD_URL_EXPIRY_SECONDS,
  });

  return {
    downloadUrl,
    expiresInSeconds: DOWNLOAD_URL_EXPIRY_SECONDS,
  };
}
