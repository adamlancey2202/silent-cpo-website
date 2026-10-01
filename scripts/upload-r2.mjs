#!/usr/bin/env node
/**
 * Upload a local file to Cloudflare R2 (S3-compatible).
 * Usage: node scripts/upload-r2.mjs <local-path> <object-key>
 * Requires: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const [localPath, objectKey] = process.argv.slice(2);
if (!localPath || !objectKey) {
  console.error("Usage: node scripts/upload-r2.mjs <local-path> <object-key>");
  process.exit(1);
}

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const bucket = process.env.R2_BUCKET_NAME?.trim();
const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim();

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET_NAME");
  process.exit(1);
}

const ext = extname(localPath).toLowerCase();
const contentType =
  ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "application/octet-stream";

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const body = readFileSync(localPath);
await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }),
);

console.log(`Uploaded s3://${bucket}/${objectKey}`);
if (publicBase) {
  const url = `${publicBase.replace(/\/$/, "")}/${objectKey.replace(/^\//, "")}`;
  console.log(`Public URL (if bucket is public): ${url}`);
  console.log(`Set BLOG_OG_IMAGE_URL=${url}`);
} else {
  console.log("Set R2_PUBLIC_BASE_URL to print the public HTTPS URL.");
}
