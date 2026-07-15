import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider, StorageFile, UploadOptions } from './types';

function getR2Client(): S3Client {
  const endpoint = process.env.R2_ENDPOINT_URL;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing R2 credentials: R2_ENDPOINT_URL, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Maps our logical bucket names (photos, originals) to R2 bucket names.
 * Uses env vars so bucket names aren't hardcoded.
 */
function r2Bucket(logicalBucket: string): string {
  const override = process.env[`R2_BUCKET_${logicalBucket.toUpperCase()}`];
  return override || logicalBucket;
}

function toBuffer(body: any): Buffer {
  if (Buffer.isBuffer(body)) return body;
  // Collect async iterable / readable stream
  const chunks: Buffer[] = [];
  // If it's a ReadableStream (web)
  if (typeof body.getReader === 'function') {
    return body; // will be handled differently
  }
  // Node.js stream or buffer-like
  if (typeof body.on === 'function') {
    // stream
    return body;
  }
  return Buffer.from(body);
}

export function createR2Storage(): StorageProvider {
  return {
    name: 'r2',

    async upload(bucket, path, file, options) {
      try {
        const client = getR2Client();
        const command = new PutObjectCommand({
          Bucket: r2Bucket(bucket),
          Key: path,
          Body: file as any,
          ContentType: options?.contentType,
          CacheControl: options?.cacheControl || 'public, max-age=31536000',
        });
        await client.send(command);
        return { path };
      } catch (err: any) {
        console.error(`[storage:r2] Upload failed: ${bucket}/${path}`, err.message || err);
        return { path, error: err.message || 'R2 upload failed' };
      }
    },

    async download(bucket, path) {
      try {
        const client = getR2Client();
        const command = new GetObjectCommand({
          Bucket: r2Bucket(bucket),
          Key: path,
        });
        const response = await client.send(command);
        const stream = response.Body as any;
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream) {
          chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
        }
        return { data: Buffer.concat(chunks) };
      } catch (err: any) {
        console.error(`[storage:r2] Download failed: ${bucket}/${path}`, err.message || err);
        return { data: null, error: err.message || 'R2 download failed' };
      }
    },

    getPublicUrl(bucket, path) {
      const publicUrlBase = process.env.R2_PUBLIC_URL;
      if (publicUrlBase) {
        return `${publicUrlBase.replace(/\/+$/, '')}/${r2Bucket(bucket)}/${path}`;
      }
      // Fallback: construct from endpoint
      const endpoint = process.env.R2_ENDPOINT_URL || '';
      return `${endpoint.replace(/\/+$/, '')}/${r2Bucket(bucket)}/${path}`;
    },

    async getSignedUrl(bucket, path, expiresIn = 3600) {
      try {
        const client = getR2Client();
        const command = new GetObjectCommand({
          Bucket: r2Bucket(bucket),
          Key: path,
        });
        const url = await s3GetSignedUrl(client, command, { expiresIn });
        return { url };
      } catch (err: any) {
        console.error(`[storage:r2] Signed URL failed: ${bucket}/${path}`, err.message || err);
        return { url: '', error: err.message || 'R2 signed URL failed' };
      }
    },

    async delete(bucket, paths) {
      try {
        const client = getR2Client();
        if (paths.length === 0) return {};
        const command = new DeleteObjectsCommand({
          Bucket: r2Bucket(bucket),
          Delete: {
            Objects: paths.map((Key) => ({ Key })),
          },
        });
        await client.send(command);
        return {};
      } catch (err: any) {
        console.error(`[storage:r2] Delete failed: ${bucket}`, err.message || err);
        return { error: err.message || 'R2 delete failed' };
      }
    },

    async list(bucket, prefix) {
      try {
        const client = getR2Client();
        const command = new ListObjectsV2Command({
          Bucket: r2Bucket(bucket),
          Prefix: prefix || '',
        });
        const response = await client.send(command);

        const files: StorageFile[] = (response.Contents || []).map((obj) => ({
          path: obj.Key || '',
          bucket,
          size: obj.Size,
          lastModified: obj.LastModified,
        }));

        return { files };
      } catch (err: any) {
        console.error(`[storage:r2] List failed: ${bucket}/${prefix}`, err.message || err);
        return { files: [], error: err.message || 'R2 list failed' };
      }
    },
  };
}
