import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJson } from "@/lib/anthropic";
import { storeGet, storeList } from "@/lib/store";
import { getProduct } from "@/config/products";
import type { BrandProfile } from "@/types";
import type { Insight } from "@/lib/store";

export const maxDuration = 60;

// ─── 컨텍스트 수집 ────────────────────────────────────────────────────────────

interface ContextSource {
  sourceId: string;
  label: string;
  content: string;
}

interface ContextSummary {
  used: { sourceId: string; label: string }[];
  missing: { label: string }[];
}

interface GatheredContext {
  sources: ContextSource[];
  summary: ContextSummary;
  validIds: Set<string>;
  // 광고 리서치 출처 ID는 근거로 인정하지 않음 (가설 전용)
  hypothesisOnlyIds: Set<string>;
}

async function gatherContext(productId: string): Promise<GatheredContext> {
  const sources: ContextSource[] = [];
  const used: { sourceId: string; label: string }[] = [];
  const missing: { label: string }[] = [];
  const validIds = new Set<string>();
  const hypothesisOnlyIds = new Set<string>();

  // 1. 제품 설정 (항상 포함)
  const product = getProduct(productId);
  if (product) {
    const sourceId = "product_config";
    validIds.add(sourceId);
    used.push({ sourceId, label: "제품 설정 (keyMessage · targetHints)" });
    sources.push({
      sourceId,
      label: "제품 설정",
      content: `핵심 메시지: ${product.keyMessage}\n타겟 힌트: ${product.targetHints.join(", ")}\n키워드 시드: ${product.keywords.join(", ")}`,
    });
  }

  // 2. 브랜드 프로필
  try {
    const brand = await storeGet<BrandProfile>("brand_profile");
    if (brand) {
      const sourceId = "brand";
      validIds.add(sourceId);
      used.push({ sourceId, label: "브랜드 프로필" });
      sources.push({
        sourceId,
        label: "브랜드 프로필",
        content: [
          brand.brandName && `브랜드: ${brand.brandName}`,
          brand.toneKeywords?.length && `톤: ${brand.toneKeywords.join(", ")}`,
          brand.doNotList && `금지 표현: ${brand.doNotList}`,
          brand.targetDescription && `타겟: ${brand.targetDescription}`,
          brand.targetAge?.length && `연령: ${brand.targetAge.join(", ")}`,
        ].filter(Boolean).join("\n"),
      });
    } else {
      missing.push({ label: "브랜드 프로필 (미설정)" });
    }
  } catch {}

  // 3. 고객 분석 (최신 1건)
  try {
    const customerList = await storeList<{
      savedAt?: string;
      topInsight?: string;
      buyReasons?: string[];
      hesitations?: string[];
      expressions?: string[];
    }>(`product:${productId}:customer`, 1);
    const c = customerList[0];
    if (c) {
      const date = c.savedAt ? c.savedAt.split("T")[0] : "unknown";
      const sourceId = `customer_${date}`;
      validIds.add(sourceId);
      used.push({ sourceId, label: `고객 분석 (${date})` });
      sources.push({
        sourceId,
        label: `고객 분석 ${date}`,
        content: [
          c.topInsight && `핵심 인사이트: ${c.topInsight}`,
          c.buyReasons?.length && `구매 이유:\n${c.buyReasons.map((r) => `  - ${r}`).join("\n")}`,
          c.hesitations?.length && `망설임·불안:\n${c.hesitations.map((r) => `  - ${r}`).join("\n")}`,
          c.expressions?.length && `고객 표현: ${c.expressions.join(", ")}`,
        ].filter(Boolean).join("\n"),
      });
    } else {
      missing.push({ label: "고객 분석 (없음 — 2단계 먼저 진행)" });
    }
  } catch {}

  // 4. 키워드 분석 (최신 1건)
  try {
    const marketList = await storeList<{
      snapshotId?: string;
      savedAt?: string;
      keywords?: { keyword: string; pc: number; mobile: number; total: number }[];
    }>(`product:${productId}:market`, 1);
    const m = marketList[0];
    if (m?.keywords?.length) {
      const sourceId = m.snapshotId ?? `market_${m.savedAt?.split("T")[0] ?? "unknown"}`;
      validIds.add(sourceId);
      used.push({ sourceId, label: `키워드 분석 (${m.savedAt?.split("T")[0] ?? ""} · ${m.keywords.length}개)` });
      const top10 = m.keywords.slice(0, 10);
      sources.push({
        sourceId,
        label: "키워드 분석",
        content: `상위 키워드 (월간 검색량 합계 기준):\n${top10.map((k) => `  ${k.keyword}: PC ${k.pc.toLocaleString()} + 모바일 ${k.mobile.toLocaleString()} = ${k.total.toLocaleString()}`).join("\n")}`,
      });
    } else {
      missing.push({ label: "키워드 분석 (없음 — 3단계 키워드 분석 탭 조회)" });
    }
  } catch {}

  // 5. 광고 리서치 (가설로만 — 출처로 인정하되 근거로는 미인정)
  try {
    const adResearch = await storeGet<{ content?: string; fetchedAt?: string }>("research_market");
    if (adResearch?.content) {
      const date = adResearch.fetchedAt?.split("T")[0] ?? "unknown";
      const sourceId = `adresearch_${date}`;
      validIds.add(sourceId);
      hypothesisOnlyIds.add(sourceId); // 근거로 인정 안 함
      used.push({ sourceId, label: `광고 리서치 (${date}) — 가설 참고용` });
      sources.push({
        sourceId,
        label: "광고 리서치 (가설 참고용)",
        content: adResearch.content.slice(0, 1500),
      });
    } else {
      missing.push({ label: "광고 리서치 (없음 — 3단계 광고 리서치 탭)" });
    }
  } catch {}

  // 6. 판정 이력 (최근 20건)
  try {
    const verdicts = await storeList<{
      rowId: string; appeal: string; target: string;
      verdict: "O" | "X"; reason: string; recordedAt?: string;
    }>(`product:${productId}:verdicts`, 20);
    if (verdicts.length > 0) {
      verdicts.forEach((v) => {
        const sourceId = `verdict_${v.rowId}`;
        validIds.add(sourceId);
        sources.push({
          sourceId,
          label: `판정 ${v.verdict}`,
          content: `${v.verdict} 판정 — ${v.appeal} → ${v.target}: "${v.reason}"`,
        });
      });
      used.push({ sourceId: "verdicts", label: `판정 이력 ${verdicts.length}건` });
    } else {
      missing.push({ label: "판정 이력 (없음)" });
    }
  } catch {}

  // 7. 인사이트 (active)
  try {
    const insightList = await storeList<Insight>(`product:${productId}:insights`, 20);
    const active = insightList.filter((i) => i.status === "active");
    if (active.length > 0) {
      active.forEach((ins) => {
        validIds.add(ins.id);
        sources.push({
          sourceId: ins.id,
          label: `인사이트 ${ins.basis}`,
          content: `[${ins.basis}] ${ins.text}`,
        });
      });
      used.push({ sourceId: "insights", label: `인사이트 ${active.length}개 (active)` });
    } else {
      missing.push({ label: "인사이트 (없음)" });
    }
  } catch {}

  return { sources, summary: { used, missing }, validIds, hypothesisOnlyIds };
}

// ─── 행 타입: AI 출력 ─────────────────────────────────────────────────────────

interface AiRow {
  id: string;
  appeal: string;
  target: string;
  hook: string;
  rationale: string;
  sources: string[];
}

// ─── 라우트 ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const product = getProduct(productId);
  if (!product) return NextResponse.json({ error: "unknown productId" }, { status: 400 });

  // 컨텍스트 수집
  let ctx: GatheredContext;
  try {
    ctx = await gatherContext(productId);
  } catch {
    ctx = { sources: [], summary: { used: [], missing: [] }, validIds: new Set(), hypothesisOnlyIds: new Set() };
  }

  // 프롬프트 조립
  const contextBlock = ctx.sources.length > 0
    ? ctx.sources.map((s) =>
        `### [출처 ID: ${s.sourceId}] ${s.label}\n${s.content}`
      ).join("\n\n")
    : "(수집된 데이터 없음)";

  const system = `당신은 한국 D2C 퍼포먼스 마케팅 전략가입니다.
소구(USP) × 타겟 조합의 가설 매트릭스를 만듭니다.
광고 카피에서 인증 없는 강한 표현(예방, 방지, 100% 등)은 절대 사용하지 않습니다.
출력은 반드시 아래 JSON 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON만.`;

  const userPrompt = `제품: ${product.name}

--- 제공된 데이터 (출처 ID 포함) ---
${contextBlock}
--- 끝 ---

위 데이터를 바탕으로 소구 × 타겟 조합 매트릭스를 만들어주세요.
각 행은 하나의 광고 가설입니다.

규칙:
1. 사용한 출처 ID를 sources 배열에 반드시 포함하세요 (실제로 참고한 것만).
2. type 필드는 넣지 마세요 (서버가 sources를 검증해 자동으로 판단합니다).
3. rationale은 "어떤 출처의 어떤 내용을 근거로 했는지" 구체적으로 작성하세요.
4. 데이터가 충분한 조합을 먼저, 최대 8개. 데이터가 부족하면 적게 작성하세요.
5. appeal과 target은 구체적으로 작성하세요.

JSON 형식:
{
  "rows": [
    {
      "id": "row-1",
      "appeal": "소구 (무엇을 보여줄지)",
      "target": "타겟 (누구에게)",
      "hook": "후킹 카피 한 줄 (광고 첫 1초)",
      "rationale": "근거: [출처ID]에서 ... (구체적으로)",
      "sources": ["출처ID1", "출처ID2"]
    }
  ]
}`;

  const result = await callClaude({
    max_tokens: 6000,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const parsed = parseJson<{ rows: AiRow[] }>(result.text);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 500 });
  }

  // 코드가 type 결정: sources 중 validId이면서 hypothesisOnly가 아닌 것이 1개 이상 → 근거
  const rows = (parsed.data.rows ?? [])
    .slice(0, 8)
    .map((row, i) => {
      const confirmedSources = (row.sources ?? []).filter(
        (sid) => ctx.validIds.has(sid) && !ctx.hypothesisOnlyIds.has(sid)
      );
      return {
        id: row.id ?? `row-${i + 1}`,
        appeal: row.appeal,
        target: row.target,
        hook: row.hook,
        rationale: row.rationale,
        type: confirmedSources.length > 0 ? "근거" : "가설",
        verdict: null,
        sources: row.sources ?? [],
      };
    })
    // 근거 먼저 정렬
    .sort((a, b) => (a.type === "근거" ? -1 : 1) - (b.type === "근거" ? -1 : 1));

  return NextResponse.json({
    ok: true,
    matrix: { rows },
    contextSummary: ctx.summary,
    productId,
  });
}
