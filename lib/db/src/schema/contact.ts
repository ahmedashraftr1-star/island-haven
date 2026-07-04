import { z } from "zod";

// Pure zod contact-message contract — NO drizzle/pg imports — so the SAME schema
// validates on the backend (route) AND the frontend (client-side), shared via the
// pg-free "@workspace/db/contracts" export. Single source = validation can't drift.
// Reuses the app-wide rule of rejecting raw <> so no markup/script can be injected.

const safeText = (min: number, max: number, msg: string) =>
  z
    .string()
    .trim()
    .min(min, msg)
    .max(max, `الحدّ الأقصى ${max} حرف`)
    .regex(/^[^<>]*$/u, "رموز غير مسموح بها");

export const CONTACT_ENQUIRIES = [
  "general",
  "join",
  "partner",
  "mentor",
  "press",
  "other",
] as const;
export type ContactEnquiry = (typeof CONTACT_ENQUIRIES)[number];

export const insertContactSchema = z.object({
  name: safeText(2, 120, "الاسم قصير جدًّا"),
  email: z.string().trim().email("بريد إلكترونيّ غير صحيح").max(160),
  subject: safeText(2, 200, "الموضوع قصير").optional().or(z.literal("")),
  message: safeText(10, 2000, "الرسالة قصيرة جدًّا (10 أحرف على الأقلّ)"),
  enquiry: z.enum(CONTACT_ENQUIRIES).optional().or(z.literal("")),
});
export type ContactInput = z.infer<typeof insertContactSchema>;
