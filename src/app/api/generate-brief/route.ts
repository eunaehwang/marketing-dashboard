import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { productId, productName, approvedRows, brandProfile, format = "DA" } = await req.json();

  if (!approvedRows?.length) {
    return NextResponse.json({ error: "O 판정된 행이 없습니다." }, { status: 400 });
  }

  const system = `당신은 한국 D2C 광고 제작 PD입니다.
광고작업실에 넘길 제작 요청서를 마크다운으로 작성합니다.
인증 없는 강한 표현(예방, 방지, 100% 등)은 절대 사용하지 않습니다.
간결하고 현장에서 바로 쓸 수 있게 작성합니다.`;

  const rowText = approvedRows.map((r: { appeal: string; target: string; hook: string; reason?: string }, i: number) =>
    `${i + 1}. 소구: ${r.appeal} / 타겟: ${r.target}\n   후킹카피: "${r.hook}"\n   판정이유: ${r.reason ?? "-"}`
  ).join("\n\n");

  const userPrompt = `제품: ${productName ?? productId}
${brandProfile?.toneKeywords?.length ? `톤앤매너: ${brandProfile.toneKeywords.join(", ")}` : ""}
${brandProfile?.doNotList ? `하지 말 것: ${brandProfile.doNotList}` : ""}

O 판정된 소구·타겟 조합:
${rowText}

위 조합별로 광고작업실 제작 요청서를 마크다운으로 작성해주세요.

각 조합마다:
## [소구 — 타겟]
**후킹 카피:** (채택된 카피)
**장면 설명:** (영상/이미지 첫 3초 장면)
**추가 카피:** (본문 또는 자막 2~3줄)
**소재 형태:** 영상 15s / 이미지 / 카드뉴스 중 추천 형태
**주의:** (있으면 작성)`;

  const result = await callClaude({
    max_tokens: 6000,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, brief: result.text, productId, format });
}
