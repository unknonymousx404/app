# برومبت اليوم 00 — التجهيز: ولادة المشروع

انسخ كل ما يلي والصقه لوكيلك كرسالة واحدة.

---

أنت تبني معي منتج «راحة · RahaMoon» — مدرّب نوم رضّع ثنائي اللغة. اقرأ أولاً وبالكامل: `AGENTS.md` ثم `docs/brand.md` ثم `docs/i18n.md`. ثم نفّذ ما يلي حرفياً.

## المهمة: تجهيز مشروع Next.js داخل هذا المستودع (جذر المجلد الحالي)

1. **أنشئ تطبيق Next.js في المجلد الحالي** مع الحفاظ على `.git` و`docs/` و`prompts/` و`verify/` و`AGENTS.md` و`START-HERE.md`:
   - نفّذ: `npx create-next-app@latest temp-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack`
   - انقل كل محتويات `temp-app` (بما فيها الملفات المخفية عدا `.git` الخاص به) إلى جذر المجلد الحالي، ثم احذف `temp-app`.
   - لا تعد بشيء قبل أن يتأكد `npm run dev` أنه يعمل.

2. **ثبّت الاعتمادات**: `npm install zustand zod` و`npx shadcn@latest init` (اختر New York style) ثم `npx shadkin... npx shadcn@latest add button card progress tabs`.

3. **اكتب أول ملف: `src/lib/brand.ts`** — انسخ ثابت BRAND **حرفياً** من `docs/brand.md`.

4. **طبّق الهوية في `src/app/layout.tsx`**: خط Almarai من next/font/google (أوزان 300/400/700/800) على الوثيقة كاملة، `lang="ar" dir="rtl"` افتراضياً، والعنوان من `BRAND.storeAr`، وthemeColor ‏`#101735`.

5. **الوحة الليلية في `src/app/globals.css`**: أنشئ رموز الألوان السبعة عشر **بأسمائها وقيمها حرفياً** من جدول `docs/brand.md` (night, night-deep, ncard, nsoft, nchip, nline, nedge, nhi, nmd, nlo, ndim, gold, goldink, ngreen, nblue, ndot, frame) داخل `@theme`. أضف صنف `.ltr-inline` (direction: ltr مع isolate) وصنف `.no-scrollbar`.

6. **ابنِ صفحة التحقق في `src/app/page.tsx`**: خلفية `night-deep` بملء الشاشة، في المنتصف الهلال (CSS من brand.md) بحجم 56px وتحته لوك-أب «راحة · RahaMoon» بلون `nhi` وزر ذهبي واحد «ابدئي مجاناً — بلا بطاقة» (غير فعال — placeholder href="#") ومبدل لغة عربية/English يقلب dir كاملاً ويحفظ الاختيار في localStorage بمفتاح `raha.lang` عبر useSyncExternalStore. النصوص من ملف `src/lib/i18n.ts` (أنشئه الآن بقسم WELCOME فقط).

7. **أنشئ هيكل المجلدات الفارغ** بمستند README قصير في كل منها: `src/lib/engine/`، `src/lib/store/`، `src/components/screens/`.

8. **تأكد أن `.gitignore`** يشمل `.env` و`node_modules` و`.next`.

9. **سجل الجلسة**: أنشئ `docs/ai-log/2026-11-24.md` (بصيغة: التاريخ — اليوم 00، ما بُني، الأدوات المستخدمة، ساعات الجلسة).

10. **Commit وpush**: رسالة الـcommit: `اليوم 00: التجهيز — Next.js + الهوية + ثابت BRAND`.

## معايير القبول (أثبت كل واحد قبل الإعلان عن الاكتمال)

- [ ] `npm run dev` يعمل و`http://localhost:3000` يفتح بخلفية ليلية `#0a1226` وفي المنتصف الهلال + اللوك-أب + الزر الذهبي.
- [ ] الضغط على English يقلب الصفحة كاملة إلى LTR ويحفظ الاختيار — إعادة تحميل الصفحة تحافظ على اللغة.
- [ ] `npm run lint` نظيف بلا أخطاء.
- [ ] `git log --oneline` يظهر commit اليوم 00، و`git push` نجح.
- [ ] `docs/ai-log/2026-11-24.md` موجود ومكتوب.

عند الانتهاء اشرح لي في 5 أسطر ماذا فعلت بالضبط، ثم قل لي أي بند من معايير القبول لم يكتمل ولماذا (إن وجد).
