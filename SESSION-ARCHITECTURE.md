# Island Haven — خريطة معمارية لطبقة التفاعل (Engagement Layer)

مرجع مختصر يشرح **كيف تترابط القطع** التي بُنيت هذه الجلسة. اقرأه بجانب
[`SESSION-CODE.md`](SESSION-CODE.md) (الأكواد الكاملة).
> ملف مرجعي فقط — غير مُضاف إلى git ولا يؤثّر على البناء. احذفه متى شئت.

---

## 1) حلقة التفاعل (the loop)

```
   عضو ينشر عملاً (POST /works)
        │
        ├─► إشعار "عمل جديد" لكل متابِعيه           (new_work → bell)
        ├─► شارة "first_work" / "prolific" تلقائيًا  (gamification)
        │
        ▼
   أعضاء آخرون يتفاعلون مع العمل:
        ├─ إعجاب   (POST /works/:id/like)
        ├─ حفظ     (POST /works/:id/save)  ──► تظهر في /me/saved (صفحة المحفوظات)
        └─ تعليق   (POST /works/:id/comments)
                ├─ رد على تعليق (parentId)  ──► إشعار "ردّ على تعليقك"
                ├─ تعديل تعليقه (PATCH)      ──► علامة "(عُدّل)"
                └─ شارة "conversationalist" عند 10 تعليقات
        │
        ▼
   متابعة الأعضاء (POST /users/:id/follow)
        ├─ إشعار "متابِع جديد" (مكبوح 6 ساعات/زوج لمنع الإغراق)
        ├─ شارة "well_connected" عند 10 متابِعين
        └─ خلاصة شخصية: GET /works?following=1  (أعمال مَن تتابعهم فقط)
        │
        ▼
   الملف الشخصي يعرض: عدّاد المتابِعين/المتابَعين + الشارات + الأعمال
```

كل سهمٍ هنا = استدعاء واحد في [`works.ts`](artifacts/api-server/src/routes/works.ts).

---

## 2) نموذج البيانات (الجداول الجديدة بالخط العريض)

```
users ─┬─< works ─┬─< works_likes      (إعجاب: فريد user+work)
       │          ├─< works_comments   (تعليق + parent_id ذاتي المرجع للردود + edited_at)
       │          └─< works_saves      ★ (حفظ: فريد user+work)
       │
       ├─< user_follows ★              (متابعة: follower_id → following_id، فريد الزوج)
       ├─< user_badges >─ badges       (شارات؛ awardBadgeByKey فريد user+badge)
       └─< notifications               (إشعارات داخل التطبيق؛ user_id بلا FK عمدًا)

★ = جدول جديد هذه الجلسة.  كل العلاقات onDelete: cascade (عدا notifications).
```

- **`works_comments.parent_id`**: ردّ يشير إلى تعليقه الأب. الردّ-على-ردّ يُعاد توجيهه
  إلى **الجذر** (`p.parentId ?? p.id`) فالعمق دائمًا مستوى واحد.
- **`user_follows`**: حافة موجَّهة. عدّ المتابِعين = `COUNT WHERE following_id=id`،
  عدّ المتابَعين = `COUNT WHERE follower_id=id`.
- **`notifications`**: أنواع جديدة `new_follower`، `new_work` (إضافةً إلى `work_comment`,
  `badge_awarded`…).

---

## 3) واجهة الـAPI (كلها في `works.ts`)

| المسار | الحماية | الوظيفة |
|---|---|---|
| `GET /works` | optionalUser | معرض: `?q=` بحث · `?sort=` · `?following=1` خلاصة · فلتر دور · ترقيم |
| `GET /works/:id` | optionalUser | تفاصيل + `likesCount/likedByMe/commentsCount/savedByMe` |
| `POST /works` | requireUser · `rlWork` 12/د | إنشاء → إشعار المتابِعين + شارات first_work/prolific |
| `POST /works/:id/like` | requireUser · `rlToggle` 80/د | تبديل إعجاب **ذرّي** |
| `POST /works/:id/save` | requireUser · `rlToggle` 80/د | تبديل حفظ **ذرّي** |
| `GET /me/saved` | requireUser | أعمالي المحفوظة (ترقيم) |
| `GET /works/:id/comments` | optionalUser | تعليقات متداخلة (أب + ردود) — يُخفي تعليقات المحظورين |
| `POST /works/:id/comments` | requireUser · `rlComment` 15/د | تعليق/ردّ → إشعار صاحب التعليق + صاحب العمل |
| `PATCH /works/:id/comments/:id` | requireUser | تعديل (للكاتب فقط) → `edited_at` |
| `DELETE /works/:id/comments/:id` | requireUser | حذف (الكاتب أو صاحب العمل) → cascade للردود |
| `POST /users/:id/follow` | requireUser · `rlFollow` 40/د | تبديل متابعة **ذرّي** + إشعار مكبوح |
| `GET /users/:id` | optionalUser | ملف + عدّادات المتابعة + followedByMe + شارات |

**النمط الذرّي للتبديل** (إعجاب/حفظ/متابعة): `insert ... onConflictDoNothing().returning()`
— لو لم يُدرَج صف فالحافة موجودة ⇒ احذف. يمنع سباق الطلبات المتزامنة.

---

## 4) تدفّقات الواجهة

**الويب** ([`ih-haven/src/pages`](artifacts/ih-haven/src/pages/))
- [`Works.tsx`](artifacts/ih-haven/src/pages/Works.tsx) — معرض: بحث + ترتيب + زر «أتابِعهم» (للمسجّلين).
- [`WorkDetail.tsx`](artifacts/ih-haven/src/pages/WorkDetail.tsx) — إعجاب/حفظ/تعليقات/ردود/تعديل (تحديث تفاؤلي + تراجع عند الخطأ + حارس سباق الجلب).
- [`PublicProfile.tsx`](artifacts/ih-haven/src/pages/PublicProfile.tsx) — زر متابعة + عدّادات + شارات.
- [`Saved.tsx`](artifacts/ih-haven/src/pages/Saved.tsx) — صفحة المحفوظات (محميّة، تُحوّل الضيف للدخول).
- [`Login.tsx`](artifacts/ih-haven/src/pages/Login.tsx) — يحترم `?next=` (مع حارس open-redirect).

**الموبايل** ([`ih-mobile/app`](artifacts/ih-mobile/app/))
- [`work/[id].tsx`](artifacts/ih-mobile/app/work/%5Bid%5D.tsx) — مطابق للويب (إعجاب/حفظ/تعليقات/ردود/تعديل) عبر Bearer.
- [`member/[id].tsx`](artifacts/ih-mobile/app/member/%5Bid%5D.tsx) — متابعة + عدّادات.
- المصادقة: `Authorization: Bearer <token>` (الويب = كوكي httpOnly).

---

## 5) القواعد المتقاطعة (cross-cutting)

- **الرؤية**: `PUBLIC_WORK_STATUSES = ["visible","featured"]` + `isPublicWorkStatus()`
  مطبّقة في كل القراءات؛ `loadInteractableWork()` يبوّب التفاعل (لا تفاعل مع عمل مخفي
  أو صاحب محظور؛ المالك يرى عمله). تعليقات المحظورين تُفلتر بـ `users.status='active'`.
- **الحدّ (rate limit)**: [`lib/rateLimit.ts`](artifacts/api-server/src/lib/rateLimit.ts) — **لكل مستخدِم**
  (مفتاحه `session.userId` لا الـIP، لأن المساحة شبكة مشتركة). يُركَّب بعد `requireUser`.
- **الإشعارات**: `notify()` إدراج DB فقط (لا push)؛ متابعة جديدة مكبوحة 6h/زوج
  (`shouldNotifyNewFollower`)؛ إشعار العمل الجديد = إدراج جماعي واحد لكل المتابِعين.
- **التلعيب**: `awardBadgeByKey(userId, key)` idempotent (لا يفعل شيئًا إن لم تُسَكّ الشارة)؛
  معالم: prolific (5 أعمال)، conversationalist (10 تعليقات)، well_connected (10 متابِعين).

---

## 6) مهام النشر (deploy) — لم تُنفَّذ بعد

1. `pnpm --filter @workspace/db run push` — لإنشاء **`user_follows`** و**`works_saves`**
   وإضافة **`works_comments.parent_id`** و**`works_comments.edited_at`** (كلها إضافية وآمنة).
2. **سَكّ مفاتيح الشارات** في الإنتاج (admin UI/SQL): `prolific`, `conversationalist`,
   `well_connected`, `first_work`, `mentor_fan` — التلقائي لا يعمل قبل سكّها.
3. مهام أمنية سابقة: تدوير `ADMIN_PASSWORD` المسرَّب + `SESSION_SECRET` قوي، دفع الفرع/PR.
```

(SQL سريع للشارات إن لزم:)
```sql
INSERT INTO badges (key,name,description,icon,color,sort_order) VALUES
 ('first_work','أول عمل','نشر أول عمل','star','amber',40),
 ('prolific','مُنتِج','نشر 5 أعمال أو أكثر','layers','emerald',50),
 ('conversationalist','مُحاوِر','شارك بـ10 تعليقات','message-circle','sky',51),
 ('well_connected','مُتواصِل','وصل إلى 10 متابِعين','users','violet',52)
ON CONFLICT (key) DO NOTHING;
```
