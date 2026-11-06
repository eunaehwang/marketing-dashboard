import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJson } from "@/lib/anthropic";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { reviews, productId, productName } = await req.json();

  if (!reviews || typeof reviews !== "string" || reviews.trim().length < 10) {
    return NextResponse.json({ error: "리뷰 텍스트가 필요합니다." }, { status: 400 });
  }

  const system = `당신은 한국 D2C 브랜드의 광고 기획자입니다.
고객 리뷰를 분석해 광고 소재 기획에 바로 쓸 수 있는 인사이트를 뽑아냅니다.
출력은 반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만.`;

  const userPrompt = `제품: ${productName ?? productId}

아래는 실제 고객 리뷰입니다. 한국어 광고 기획에 필요한 인사이트를 추출해주세요.

---
${reviews.slice(0, 8000)}
---

다음 JSON 형식으로 응답하세요:
{
  "buyReasons": ["구매 이유 1", "구매 이유 2", ...],
  "hesitations": ["망설임/불안 1", "망설임/불안 2", ...],
  "expressions": ["고객이 실제로 쓴 표현 1", "고객이 실제로 쓴 표현 2", ...],
  "topInsight": "광고 기획에 가장 중요한 인사이트 한 줄",
  "note": "주의사항 또는 추가 메모 (없으면 빈 문자열)"
}

각 항목은 최소 3개, 최대 8개. buyReasons와 hesitations는 광고 소구점 관점에서 작성.`;

  const result = await callClaude({
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const parsed = parseJson(result.text);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result: parsed.data, productId });
}
