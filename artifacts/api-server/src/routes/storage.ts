import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import type { File } from "@google-cloud/storage";
import { requireAdmin } from "../lib/auth";
import { writeAudit, auditActor } from "../lib/audit";

const router: IRouter = Router();

const SAFE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function streamFile(file: File, res: import("express").Response, isPrivate = false) {
  const [metadata] = await file.getMetadata();
  const rawType = (metadata.contentType as string) || "application/octet-stream";
  const safeType = SAFE_CONTENT_TYPES.has(rawType) ? rawType : "application/octet-stream";
  res.setHeader("Content-Type", safeType);
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (safeType === "application/octet-stream") {
    res.setHeader("Content-Disposition", "attachment");
  }
  // Private attachments (CVs) must never sit in a shared cache; only the public
  // image uploads get the long-lived cacheable header.
  res.setHeader(
    "Cache-Control",
    isPrivate ? "private, no-store" : "public, max-age=2592000",
  );
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

// Attachments under `user-uploads/` are PRIVATE (CVs, applicant docs); images
// under `uploads/` are public. The public regex above still matches both, so this
// prefix decides who may read what.
const PRIVATE_PREFIX_RE = /^user-uploads\//;

function splatRest(req: Request): string {
  const splat = (req.params as { splat?: string[] | string }).splat;
  return Array.isArray(splat) ? splat.join("/") : splat ?? "";
}

// Gate private attachments behind requireAdmin (was previously reachable by
// anyone holding the unguessable UUID URL — a real leak). Public image uploads
// pass straight through. Every private read is audited.
function gatePrivateAttachments(req: Request, res: Response, next: NextFunction): void {
  const rest = splatRest(req);
  if (!PRIVATE_PREFIX_RE.test(rest)) {
    next();
    return;
  }
  requireAdmin(req, res, () => {
    void writeAudit({
      actor: auditActor(req),
      action: "private_attachment_accessed",
      targetType: "attachment",
      targetId: rest.slice(0, 80),
      newValue: rest,
    });
    next();
  });
}

router.get("/storage/objects/{*splat}", gatePrivateAttachments, async (req, res) => {
  try {
    const rest = splatRest(req);
    if (!UPLOAD_PATH_RE.test(rest)) {
      res.status(404).end();
      return;
    }
    const objectPath = `/objects/${rest}`;
    const svc = new ObjectStorageService();
    const file = await svc.getObjectEntityFile(objectPath);
    await streamFile(file, res, PRIVATE_PREFIX_RE.test(rest));
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
