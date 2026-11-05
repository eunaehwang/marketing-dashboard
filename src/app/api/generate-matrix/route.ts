import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { productId, productName, reviewInsight, keywords } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." }, { status: 500 });
  }

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

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 3000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Claude API 오류: ${err}` }, { status: 500 });
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text ?? "";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "응답 파싱 실패", raw }, { status: 500 });
  }

  return NextResponse.json({ ok: true, matrix: parsed, productId });
}
