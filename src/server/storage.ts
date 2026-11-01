import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
export interface StorageDriver { put(key: string, data: Buffer): Promise<void>; get(key: string): Promise<Buffer>; }
class LocalStorageDriver implements StorageDriver {
  private root = path.resolve(process.env.STORAGE_DIR ?? "./.data/storage");
  private resolve(key: string) { if (!/^[a-zA-Z0-9/_-]+\.[a-z0-9]+$/.test(key) || key.includes("..")) throw new Error("invalid_storage_key"); const target = path.resolve(this.root, key); if (!target.startsWith(this.root + path.sep)) throw new Error("invalid_storage_key"); return target; }
  async put(key: string, data: Buffer) { const target = this.resolve(key); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, data); }
  async get(key: string) { return readFile(this.resolve(key)); }
}
export function getStorage(): StorageDriver { if ((process.env.STORAGE_DRIVER ?? "local") !== "local") throw new Error("storage_driver_not_configured"); return new LocalStorageDriver(); }
export function newImageKey() { return `products/${new Date().getUTCFullYear()}/${randomUUID()}.webp`; }
