import { Router, type IRouter } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import type { File } from "@google-cloud/storage";

const router: IRouter = Router();

const SAFE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function streamFile(file: File, res: import("express").Response) {
  const [metadata] = await file.getMetadata();
  const rawType = (metadata.contentType as string) || "application/octet-stream";
  const safeType = SAFE_CONTENT_TYPES.has(rawType) ? rawType : "application/octet-stream";
  res.setHeader("Content-Type", safeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (safeType === "application/octet-stream") {
    res.setHeader("Content-Disposition", "attachment");
  }
  res.setHeader("Cache-Control", "public, max-age=2592000");
  if (metadata.size) res.setHeader("Content-Length", String(metadata.size));
  await new Promise<void>((resolve, reject) => {
    file
      .createReadStream()
      .on("error", reject)
      .on("end", resolve)
      .pipe(res);
  });
}

// Only paths under /uploads/<uuid>.<ext> or /user-uploads/<uuid>.<ext> are
// publicly streamable. Everything else under PRIVATE_OBJECT_DIR stays
// inaccessible from this route.
const UPLOAD_PATH_RE =
  /^(?:uploads|user-uploads)\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.[a-zA-Z0-9]{2,8}$/;

router.get("/storage/objects/{*splat}", async (req, res) => {
  try {
    const splat = (req.params as { splat?: string[] | string }).splat;
    const rest = Array.isArray(splat) ? splat.join("/") : splat ?? "";
    if (!UPLOAD_PATH_RE.test(rest)) {
      res.status(404).end();
      return;
    }
    const objectPath = `/objects/${rest}`;
    const svc = new ObjectStorageService();
    const file = await svc.getObjectEntityFile(objectPath);
    await streamFile(file, res);
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).end();
      return;
    }
    req.log?.error?.({ err }, "object download failed");
    if (!res.headersSent) res.status(500).end();
  }
});

router.get("/storage/public-objects/{*splat}", async (req, res) => {
  try {
    const splat = (req.params as { splat?: string[] | string }).splat;
    const filePath = Array.isArray(splat) ? splat.join("/") : splat ?? "";
    const svc = new ObjectStorageService();
    const file = await svc.searchPublicObject(filePath);
    if (!file) {
      res.status(404).end();
      return;
    }
    await streamFile(file, res);
  } catch (err) {
    req.log?.error?.({ err }, "public object download failed");
    if (!res.headersSent) res.status(500).end();
  }
});

export default router;
