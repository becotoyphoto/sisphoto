export interface StorageFile {
  path: string;
  bucket: string;
  size?: number;
  contentType?: string;
  lastModified?: Date;
}

export interface UploadOptions {
  contentType?: string;
  upsert?: boolean;
  cacheControl?: string;
}

export interface StorageProvider {
  name: string;

  upload(
    bucket: string,
    path: string,
    file: Buffer | Blob | File,
    options?: UploadOptions
  ): Promise<{ path: string; error?: string }>;

  download(
    bucket: string,
    path: string
  ): Promise<{ data: Buffer | null; error?: string }>;

  getPublicUrl(bucket: string, path: string): string;

  getSignedUrl(
    bucket: string,
    path: string,
    expiresIn?: number
  ): Promise<{ url: string; error?: string }>;

  delete(
    bucket: string,
    paths: string[]
  ): Promise<{ error?: string }>;

  list(
    bucket: string,
    prefix?: string
  ): Promise<{ files: StorageFile[]; error?: string }>;
}
