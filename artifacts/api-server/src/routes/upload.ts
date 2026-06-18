import { Router, type IRouter } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { Storage } from "@google-cloud/storage";
import { requireAdmin } from "../lib/auth";
import { objectStorageClient, ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();

// Hard cap mime types to images (parity with userUpload.ts) — the stored URL
// becomes a clickable href on public pages, so non-image content must not be
// accepted on the client-supplied mimetype alone.
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) cb(null, true);
    else cb(new Error("نوع الملف غير مدعوم — JPG/PNG/WEBP فقط"));
  },
});

function detectImageMime(
  buf: Buffer,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return "image/jpeg";
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  )
    return "image/png";
  if (
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

router.post(
  "/admin/upload",
  requireAdmin,
  (req, res, next) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "تعذّر رفع الملف";
        res.status(400).json({ error: msg });
        return;
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "لم يتم إرسال أي ملف" });
        return;
      }
      const detected = detectImageMime(req.file.buffer);
      if (!detected) {
        res.status(400).json({ error: "محتوى الملف ليس صورة صالحة" });
        return;
      }
      const svc = new ObjectStorageService();
      const privateDir = svc.getPrivateObjectDir();
      const objectId = randomUUID();
      const ext = EXT_BY_MIME[detected];
      const fullPath = `${privateDir}/uploads/${objectId}.${ext}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = (objectStorageClient as Storage).bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(req.file.buffer, {
        contentType: detected,
        resumable: false,
        public: false,
        metadata: { cacheControl: "public, max-age=2592000" },
      });
      const objectPath = `/objects/uploads/${objectId}.${ext}`;
      const url = `/api/storage${objectPath}`;
      res.json({ ok: true, url, objectPath });
    } catch (err) {
      req.log?.error?.({ err }, "upload failed");
      res.status(500).json({ error: "فشل الرفع" });
    }
  },
);

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) path = `/${path}`;
  const parts = path.split("/");
  return { bucketName: parts[1] ?? "", objectName: parts.slice(2).join("/") };
}

export default router;
