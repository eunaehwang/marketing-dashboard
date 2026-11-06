import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJson } from "@/lib/anthropic";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { productId, productName, reviewInsight, keywords } = await req.json();

  const system = `당신은 한국 D2C 퍼포먼스 마케팅 전략가입니다.
소구(USP) × 타겟 조합의 가설 매트릭스를 만듭니다.
광고 카피에서 인증 없는 강한 표현(예방, 방지, 100% 등)은 절대 사용하지 않습니다.
출력은 반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만.`;

  const userPrompt = `제품: ${productName ?? productId}

${reviewInsight ? `고객 분석 인사이트:\n${reviewInsight}\n` : ""}
${keywords?.length ? `주요 키워드: ${keywords.join(", ")}\n` : ""}

소구 × 타겟 조합 가설 매트릭스를 만들어주세요.
각 행은 하나의 광고 가설입니다.

JSON 형식:
{
  "rows": [
    {
      "id": "row-1",
      "appeal": "소구 (무엇을 보여줄지)",
      "target": "타겟 (누구에게)",
      "hook": "후킹 카피 한 줄 (광고 첫 1초)",
      "rationale": "근거 또는 가설 (데이터 있으면 근거, 없으면 가설)",
      "type": "근거" | "가설",
      "verdict": null
    }
  ]
}

8~12개 행 작성. appeal과 target은 구체적으로.`;

  const result = await callClaude({
    max_tokens: 6000,
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

  return NextResponse.json({ ok: true, matrix: parsed.data, productId });
}
