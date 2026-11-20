import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

type Snapshot<T> = { value: T; etag: string | null };
type Change<T, R> = { value?: T; result: R };
const pathPrefix = "studio/v1/";
let localWrites = Promise.resolve();

function localDirectory() {
  return !process.env.VERCEL ? process.env.STUDIO_LOCAL_DATA : undefined;
}

function pathname(key: string) {
  return pathPrefix + key + ".json";
}

async function read<T>(key: string, initial: () => T): Promise<Snapshot<T>> {
  const directory = localDirectory();
  if (directory) {
    try {
      const file = await readFile(join(directory, key + ".json"), "utf8");
      return { value: JSON.parse(file) as T, etag: createHash("sha256").update(file).digest("hex") };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return { value: initial(), etag: null };
    }
  }
  const result = await get(pathname(key), { access: "private", useCache: false });
  if (!result) return { value: initial(), etag: null };
  if (result.statusCode !== 200) throw new Error("Could not read Studio records.");
  return { value: await new Response(result.stream).json() as T, etag: result.blob.etag };
}

export async function readRecord<T>(key: string, initial: () => T) {
  return (await read(key, initial)).value;
}

export async function changeRecord<T, R>(key: string, initial: () => T, change: (value: T) => Change<T, R>): Promise<R> {
  const directory = localDirectory();
  if (directory) {
    const write = localWrites.then(async () => {
      const current = await read(key, initial);
      const next = change(current.value);
      if (next.value !== undefined) {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const tempFile = join(directory, randomUUID() + ".tmp");
        await writeFile(tempFile, JSON.stringify(next.value), { mode: 0o600 });
        await rename(tempFile, join(directory, key + ".json"));
      }
      return next.result;
    });
    localWrites = write.then(() => undefined, () => undefined);
    return write;
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await read(key, initial);
    const next = change(current.value);
    if (next.value === undefined) return next.result;
    try {
      await put(pathname(key), JSON.stringify(next.value), {
        access: "private", contentType: "application/json",
        ...(current.etag ? { ifMatch: current.etag } : { addRandomSuffix: false, allowOverwrite: false }),
      });
      return next.result;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) continue;
      if (!current.etag && (await read(key, initial)).etag) continue;
      throw error;
    }
  }
  throw new Error("Studio records changed while saving. Try again.");
}
