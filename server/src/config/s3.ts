/**
 * AWS S3 client singleton with presigned URL utilities.
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './index.js';

const globalForS3 = globalThis as unknown as {
  s3Client: S3Client | undefined;
};

export const s3Client =
  globalForS3.s3Client ??
  new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
    // Use custom endpoint for MinIO / local S3-compatible storage
    ...(process.env.S3_ENDPOINT && {
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: true,
    }),
  });

if (config.nodeEnv !== 'production') {
  globalForS3.s3Client = s3Client;
}

export const BUCKET_NAME = config.aws.s3BucketName;

/** Presigned URL expiry durations in seconds */
export const PRESIGNED_UPLOAD_EXPIRY = 900; // 15 minutes
export const PRESIGNED_DOWNLOAD_EXPIRY = 3600; // 1 hour

/**
 * Generate a presigned PUT URL for file uploads.
 * Disables checksums to prevent browser CORS issues with extra headers.
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  _contentLength: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_UPLOAD_EXPIRY,
    unhoistableHeaders: new Set(['x-amz-checksum-crc32']),
    signableHeaders: new Set(['host', 'content-type']),
  });
}

/**
 * Generate a presigned GET URL for file downloads.
 * Sets Content-Disposition to attachment with the original filename.
 */
export async function generatePresignedDownloadUrl(
  key: string,
  filename?: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ...(filename && {
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
  });

  return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_DOWNLOAD_EXPIRY });
}

/**
 * Generate a presigned GET URL for inline file viewing.
 * Sets Content-Disposition to inline so the browser renders it in-page.
 */
export async function generatePresignedViewUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: 'inline',
  });

  return getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_DOWNLOAD_EXPIRY });
}

export default s3Client;
