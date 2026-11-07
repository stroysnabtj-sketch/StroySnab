import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
export interface StorageDriver {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
function validKey(key: string) {
  if (!/^[a-zA-Z0-9/_-]+\.[a-z0-9]+$/.test(key) || key.includes(".."))
    throw new Error("invalid_storage_key");
  return key;
}
class LocalStorageDriver implements StorageDriver {
  private root = path.resolve(process.env.STORAGE_DIR ?? "./.data/storage");
  private resolve(key: string) {
    const target = path.resolve(this.root, validKey(key));
    if (!target.startsWith(this.root + path.sep)) throw new Error("invalid_storage_key");
    return target;
  }
  async put(key: string, data: Buffer) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
  }
  async get(key: string) {
    return readFile(this.resolve(key));
  }
  async delete(key: string) {
    try {
      await unlink(this.resolve(key));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    }
  }
}
class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  constructor() {
    this.bucket = process.env.S3_BUCKET || "";
    if (!this.bucket) throw new Error("s3_bucket_not_configured");
    this.client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
  }
  async put(key: string, data: Buffer) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: validKey(key),
        Body: data,
        ContentType: key.endsWith(".webp")
          ? "image/webp"
          : key.endsWith(".pdf")
            ? "application/pdf"
            : "application/octet-stream",
      }),
    );
  }
  async get(key: string) {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: validKey(key) }),
    );
    if (!result.Body) throw new Error("storage_object_missing");
    return Buffer.from(await result.Body.transformToByteArray());
  }
  async delete(key: string) {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: validKey(key) }));
  }
}
export function getStorage(): StorageDriver {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "s3") return new S3StorageDriver();
  if (driver !== "local") throw new Error("storage_driver_not_configured");
  return new LocalStorageDriver();
}
export function newImageKey() {
  return `products/${new Date().getUTCFullYear()}/${randomUUID()}.webp`;
}
