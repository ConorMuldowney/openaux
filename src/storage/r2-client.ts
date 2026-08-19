import { S3Client } from "@aws-sdk/client-s3";

const globalForR2 = globalThis as unknown as {
  r2Client?: S3Client;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable '${name}' for R2 storage access.`);
  }
  return value;
}

export function getR2Client(): S3Client {
  if (globalForR2.r2Client) {
    return globalForR2.r2Client;
  }

  const accountId = requireEnv("R2_ACCOUNT_ID");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  if (process.env.NODE_ENV !== "production") {
    globalForR2.r2Client = client;
  }

  return client;
}

export function getR2BucketName(): string {
  return requireEnv("R2_BUCKET_NAME");
}
