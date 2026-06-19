# 🚀 نشر آيلاند هيفن على Replit

مشروع **monorepo (pnpm)** فيه ٣ تطبيقات: خادم API (`artifacts/api-server`)،
موقع ويب (`artifacts/ih-haven`)، وتطبيق موبايل Expo (`artifacts/ih-mobile`).
الموبايل **لا يعمل على Replit** (يحتاج Expo/سِملِيتر) — انشر الـ API + الموقع.

`.replit` مُعدّ مسبقًا: Node 24 + PostgreSQL 16 + نشر autoscale.

---

## ١. الاستيراد
- **الأسهل:** Replit → *Create Repl* → *Import from GitHub* →
  `ahmedashraftr1-star/island-haven` (خاصّ — اربط حساب GitHub).
- **أو:** ارفع `island-haven.zip`.

## ٢. تثبيت الاعتماديّات
```bash
pnpm install
```

## ٣. قاعدة البيانات
- افتح **Tools → Database** في Replit وأنشئ PostgreSQL — رح يضبط `DATABASE_URL` تلقائيًّا.
- ادفع السكيمة:
```bash
pnpm --filter @workspace/db run push
```

## ٤. المتغيّرات (Replit → Secrets)
انسخها من [`artifacts/api-server/.env.example`](artifacts/api-server/.env.example):

| المفتاح | القيمة |
|---|---|
| `DATABASE_URL` | (من قاعدة Replit — غالبًا مضبوط تلقائيًّا) |
| `SESSION_SECRET` | نصّ عشوائيّ طويل (`openssl rand -hex 32`) |
| `ADMIN_USERNAME` · `ADMIN_PASSWORD` | بيانات دخول لوحة الإدارة |
| `PORT` | منفذ الخادم (مثلاً 3001) |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | رابط الـ Repl تبعك |
| `RESEND_API_KEY` · `EMAIL_FROM` | اختياريّ (للإيميلات) |

## ٥. محتوى تجريبيّ (اختياريّ — يملأ الموقع ببيانات احترافيّة)
شغّل الخادم أوّلًا (خطوة ٦)، ثمّ:
```bash
# خبراء/فِرق/برامج/مشاريع/مواعيد + أخبار
ADMIN_USERNAME=$ADMIN_USERNAME ADMIN_PASSWORD=$ADMIN_PASSWORD \
  node artifacts/api-server/scripts/seed-incubator.mjs
# أعضاء + أعمال + إضافات
DATABASE_URL=$DATABASE_URL pnpm --filter @workspace/scripts run seed:extras
```

## ٦. التشغيل
- **API:**
```bash
pnpm --filter @workspace/api-server run dev     # build + start
```
- **الموقع:**
```bash
pnpm --filter @workspace/ih-haven run dev       # vite --host 0.0.0.0
```
الموقع يستدعي الـ API عبر مسار `/api` — تأكّد إنّ proxy فيت (`vite.config.ts`)
أو متغيّر أساس الـ API يشير لرابط الخادم على Replit.

## ٧. الدخول (بيانات البذرة الافتراضيّة)
- أدمن: `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- خبير: `mohannad@islandhaven.ps` · عضو: `member.1@islandhaven.ps` — كلمة السرّ `IslandHaven#2026`

---

> للنشر العامّ: استخدم زرّ **Deploy** (autoscale مُعدّ في `.replit`) بعد ضبط الـ Secrets.
