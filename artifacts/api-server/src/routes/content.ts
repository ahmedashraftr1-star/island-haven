import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { z } from "zod";

const router: IRouter = Router();

export const DEFAULT_CONTENT: Record<string, unknown> = {
  hero: {
    eyebrow: "آيلاند هيفن — مساحة عمل مجانية في غزّة",
    title: "مساحة تتّسع لأحلامك",
    subtitle:
      "بيت العمل الحر، البحث، الدراسة واللقاء. نُعيد للناس مكاناً يصنعون فيه المستقبل.",
    ctaPrimary: "قدّم طلب انضمام",
    ctaSecondary: "تعرّف على القصة",
  },
  about: {
    headline: "من هي آيلاند هيفن؟",
    body:
      "مبادرة من «من الناس إلى الناس»، نوفّر مساحة عمل مجهّزة بالكهرباء والإنترنت، مفتوحة مجاناً للمبدعين والمستقلّين والباحثين عن العلم والعمل في غزّة.",
  },
  cta: {
    headline: "هل أنت جاهز لتبدأ؟",
    body: "املأ الطلب وسنتواصل معك خلال أيام.",
    button: "قدّم طلبك",
  },
  contact: {
    instagram: "https://instagram.com/ih_haven",
    email: "hello@islandhaven.ps",
    phone: "",
  },
};

router.get("/content", async (_req, res) => {
  const rows = await db.select().from(siteSettingsTable);
  const overrides: Record<string, unknown> = {};
  for (const row of rows) overrides[row.key] = row.value;
  res.json({ content: { ...DEFAULT_CONTENT, ...overrides } });
});

router.get("/admin/content", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(siteSettingsTable);
  const overrides: Record<string, unknown> = {};
  for (const row of rows) overrides[row.key] = row.value;
  res.json({
    defaults: DEFAULT_CONTENT,
    overrides,
    merged: { ...DEFAULT_CONTENT, ...overrides },
  });
});

const upsertSchema = z.object({
  value: z.unknown(),
});

router.put("/admin/content/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key ?? "");
  if (!/^[a-zA-Z0-9_\-\.]{1,64}$/.test(key)) {
    res.status(400).json({ error: "مفتاح غير صالح" });
    return;
  }
  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "قيمة غير صالحة" });
    return;
  }
  await db
    .insert(siteSettingsTable)
    .values({ key, value: parsed.data.value as object })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: parsed.data.value as object, updatedAt: sql`now()` },
    });
  res.json({ ok: true });
});

router.delete("/admin/content/:key", requireAdmin, async (req, res) => {
  const key = String(req.params.key ?? "");
  await db
    .delete(siteSettingsTable)
    .where(sql`${siteSettingsTable.key} = ${key}`);
  res.json({ ok: true });
});

export default router;
