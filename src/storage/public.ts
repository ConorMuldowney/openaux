import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2BucketName, getR2Client } from "@/src/storage/r2-client";

const UPLOAD_URL_EXPIRY_SECONDS = 300;

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
