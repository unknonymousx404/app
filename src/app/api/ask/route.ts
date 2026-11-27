import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildSafetyAnswer,
  buildStaticAskAnswer,
  buildUnderFourAnswer,
  containsCryTraining,
  containsInventedTime,
  containsUnsafeSleepAdvice,
  detectQuestionLang,
  type AskPlanContext,
} from "@/lib/engine/ask-content";
import { buildAskSystemPrompt } from "@/lib/engine/ask-prompt";
import { hasRedFlag } from "@/lib/engine/safety";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_TIMEOUT_MS = 8_500;

const planSchema = z
  .object({
    routineStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    lastFeed: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    bedtime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })
  .optional();

const bodySchema = z.object({
  question: z.string().trim().min(1).max(1_200),
  lang: z.enum(["ar", "en"]),
  ageMonths: z.number().int().min(0).max(72),
  worstProblem: z.string().trim().max(40).optional(),
  plan: planSchema,
});

type AskBody = z.infer<typeof bodySchema>;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function fallback(body: AskBody) {
  const lang = detectQuestionLang(body.question, body.lang);
  return {
    answer: buildStaticAskAnswer(
      lang,
      body.ageMonths,
      body.worstProblem ?? "",
      body.plan,
    ),
    kind: "fallback" as const,
    fallback: true,
  };
}

/** لا نسمح بتسريب وسوم التفكير أو تنسيق Markdown إلى الواجهة. */
function cleanAnswer(value: string): string {
  return value
    .replace(/<\|?think\|?>[\s\S]*?<\/?\|?think\|?>/gi, "")
    .replace(/^```(?:markdown|text)?\s*/i, "")
    .replace(/```$/i, "")
    .replace(/^(?:Raha|راحة)\s*[:：]\s*/i, "")
    .trim();
}

const ALLOWED_ORIGIN = "https://rahamoon.vercel.app";

export async function POST(request: Request) {
  // لا استدعاء من خارج التطبيق: Origin/Referer من نطاق النشر وحده.
  const origin =
    request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  if (!origin.startsWith(ALLOWED_ORIGIN)) {
    return new NextResponse(null, { status: 403 });
  }

  let body: AskBody;

  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ fallback: true, kind: "fallback" }, 400);
    }
    body = parsed.data;
  } catch {
    return json({ fallback: true, kind: "fallback" }, 400);
  }

  const lang = detectQuestionLang(body.question, body.lang);

  // الأمان حتمي قبل النموذج: أعراض حمراء ← طبيب، وأقل من 4 أشهر ← تهدئة فقط.
  if (hasRedFlag(body.question)) {
    return json({ answer: buildSafetyAnswer(lang), kind: "safety" });
  }

  if (body.ageMonths < 4) {
    return json({
      answer: buildUnderFourAnswer(lang, body.ageMonths),
      kind: "under-four",
    });
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[ask] GROQ_API_KEY is not set — using static fallback");
    return json(fallback(body));
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: buildAskSystemPrompt({
              lang,
              ageMonths: body.ageMonths,
              worstProblem: body.worstProblem ?? "",
              plan: body.plan as AskPlanContext | undefined,
            }),
          },
          { role: "user", content: body.question },
        ],
        temperature: 0.4,
        top_p: 0.9,
        max_completion_tokens: 700,
        reasoning_effort: "low",
        reasoning_format: "hidden",
      }),
      signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      // 429 / 500 / أي خطأ من المزود: صمت تام أمام الأم، رجوع للثابت.
      console.warn(`[ask] Groq fallback: HTTP ${response.status}`);
      return json(fallback(body));
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    const answer = typeof raw === "string" ? cleanAnswer(raw) : "";

    if (
      !answer ||
      containsCryTraining(answer) ||
      containsUnsafeSleepAdvice(answer) ||
      containsInventedTime(answer, body.plan)
    ) {
      return json(fallback(body));
    }

    return json({ answer, kind: "ai" });
  } catch (error) {
    // مهلة، شبكة، JSON غير صالح — لا رسالة خطأ للواجهة.
    console.warn(
      `[ask] Groq fallback: ${error instanceof Error ? error.name : "network"}`,
    );
    return json(fallback(body));
  }
}
