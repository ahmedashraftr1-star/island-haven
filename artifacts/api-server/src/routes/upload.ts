import { Router, type IRouter } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { Storage } from "@google-cloud/storage";
import { requireAdmin } from "../lib/auth";
import { objectStorageClient, ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

router.post(
  "/admin/upload",
  requireAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "لم يتم إرسال أي ملف" });
        return;
      }
      const svc = new ObjectStorageService();
      const privateDir = svc.getPrivateObjectDir();
      const objectId = randomUUID();
      const ext = (req.file.originalname.split(".").pop() ?? "bin")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 8);
      const fullPath = `${privateDir}/uploads/${objectId}.${ext}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = (objectStorageClient as Storage).bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
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
