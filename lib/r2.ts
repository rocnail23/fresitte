import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

import { env } from "@/lib/env";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

interface UploadParams {
  keyPrefix: "categories" | "products";
  file: File;
}

export async function uploadImageToR2({ keyPrefix, file }: UploadParams) {
  if (!file.size) return null;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const extension = extractExtension(file);
  const key = `${keyPrefix}/${randomUUID()}.${extension}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    }),
  );

  const baseUrl = env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "") ??
    `https://${env.R2_BUCKET}.r2.dev`;

  return {
    key,
    url: `${baseUrl}/${key}`,
  };
}

function extractExtension(file: File) {
  const nameExt = file.name?.split(".").pop();
  if (nameExt && nameExt.length <= 5) {
    return nameExt.toLowerCase();
  }

  const mimeExt = file.type?.split("/").pop();
  if (mimeExt && mimeExt.length <= 5) {
    return mimeExt.toLowerCase();
  }

  return "bin";
}
