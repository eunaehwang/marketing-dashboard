"use client";

import { useState } from "react";

const BRAND_KEY = "brand_profile";
const KEYWORD_KEY = "naver_keywords";
const COMPETITOR_KEY = "competitor_data";

interface ConceptItem {
  id: number;
  name: string;
  tagline: string;
  target: string;
  channels: string[];
  hook: string;
  idea: string;
  score: number;
  scoreReason: string;
}

function getSeasonLabel(m: number) {
  const map: Record<number, string> = {
    1: "1월 · 설날 시즌", 2: "2월 · 봄 준비", 3: "3월 · 봄 이사·대청소",
    4: "4월 · 봄 이사 절정", 5: "5월 · 가정의달", 6: "6월 · 장마 준비",
    7: "7월 · 장마·여름", 8: "8월 · 여름 위생 강화", 9: "9월 · 가을 이사·추석",
    10: "10월 · 가을 이사 절정", 11: "11월 · 연말 대청소 준비", 12: "12월 · 연말 대청소·김장",
  };
  return map[m] ?? `${m}월`;
}

function buildContext() {
  const month = new Date().getMonth() + 1;
  let brandInfo = "브랜드 정보 없음";
  let keywordInfo = "키워드 데이터 없음";
  let competitorInfo = "경쟁사 데이터 없음";

  try {
    const b = localStorage.getItem(BRAND_KEY);
    if (b) {
      const p = JSON.parse(b);
      brandInfo = [
        p.brandName && `브랜드명: ${p.brandName}`,
        p.industry && `업종: ${p.industry}`,
        p.products && `주요 제품: ${p.products}`,
        (p.targetAge || p.targetGender) && `타겟: ${[p.targetAge?.join(", "), p.targetGender, p.targetDescription].filter(Boolean).join(" · ")}`,
        p.toneKeywords?.length && `톤앤매너: ${p.toneKeywords.join(", ")}${p.toneDescription ? ` — ${p.toneDescription}` : ""}`,
        p.channels?.length && `채널: ${p.channels.join(", ")}`,
        p.successCases && `잘됐던 사례: ${p.successCases}`,
        p.doNotList && `하지 말 것: ${p.doNotList}`,
      ].filter(Boolean).join("\n");
    }
  } catch {}

  try {
    const k = localStorage.getItem(KEYWORD_KEY);
    if (k) {
      const d = JSON.parse(k);
      const items = (d.items || []).slice(0, 10) as Array<{ keyword: string; total: number; compIdx: string }>;
      if (items.length > 0) {
        keywordInfo = "네이버 검색광고 월간 검색량 상위 10 키워드:\n" +
          items.map((i, n) => `${n + 1}. ${i.keyword} — 합계 ${i.total.toLocaleString()}회 (경쟁도: ${i.compIdx || "-"})`).join("\n");
      }
    }
  } catch {}

  try {
    const c = localStorage.getItem(COMPETITOR_KEY);
    if (c) {
      const d = JSON.parse(c);
      const brands = (Object.values(d) as Array<{ name: string; totalVolume: number; keywords: Array<{ keyword: string; total: number }> }>)
        .sort((a, b) => (b.totalVolume || 0) - (a.totalVolume || 0))
        .slice(0, 3);
      if (brands.length > 0) {
        competitorInfo = brands.map((br) => {
          const kws = br.keywords.slice(0, 5).map((k) => `${k.keyword}(${k.total.toLocaleString()})`).join(", ");
          return `• ${br.name}: 총 검색량 ${br.totalVolume.toLocaleString()}\n  주요 키워드: ${kws}`;
        }).join("\n\n");
      }
    }
  } catch {}

  return { brandInfo, keywordInfo, competitorInfo, seasonInfo: getSeasonLabel(month) };
}

function checkData() {
  let hasBrand = false, hasKeywords = false, hasCompetitors = false;
  try { const b = localStorage.getItem(BRAND_KEY); if (b) { const p = JSON.parse(b); hasBrand = !!p.brandName; } } catch {}
  try { const k = localStorage.getItem(KEYWORD_KEY); if (k) { const d = JSON.parse(k); hasKeywords = (d.items || []).length > 0; } } catch {}
  try { const c = localStorage.getItem(COMPETITOR_KEY); if (c) { const d = JSON.parse(c); hasCompetitors = Object.keys(d).length > 0; } } catch {}
  return { hasBrand, hasKeywords, hasCompetitors };
}

async function streamAI(
  userPrompt: string,
  system: string,
  onChunk: (t: string) => void,
  maxTokens = 1800
): Promise<string> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt: system,
      maxTokens,
    }),
  });
  if (!res.ok) {
    let msg = `API error (${res.status})`;
    try { const e = await res.json(); if (e.error) msg = e.error; } catch {}
    throw new Error(msg);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onChunk(text);
  }
  return text;
}

function StepBar({ step }: { step: number }) {
  const labels = ["데이터 확인", "질문 증강", "컨셉 도출", "기획서"];
  return (
    <div className="flex items-start mb-6">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: done ? "#22C55E" : active ? "var(--accent)" : "var(--surface-2)",
                  color: (done || active) ? "#fff" : "var(--fg-3)",
                }}>
                {done ? "✓" : n}
              </div>
              <div className="text-center mt-1 font-medium" style={{ color: active ? "var(--accent)" : "var(--fg-3)", fontSize: 9, whiteSpace: "nowrap" }}>
                {label}
              </div>
            </div>
            {i < labels.length - 1 && (
              <div className="flex-1 h-px mt-[-12px] mx-1" style={{ background: done ? "#22C55E" : "var(--border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StreamText({ text }: { text: string }) {
  return (
    <div className="rounded-xl border p-4 text-sm leading-relaxed whitespace-pre-wrap"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg-2)", minHeight: 120 }}>
      {text || <span style={{ color: "var(--fg-3)" }}>생성 중...</span>}
    </div>
  );
}

export default function PlanningTab() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState("");
  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [recommend, setRecommend] = useState(1);
  const [selected, setSelected] = useState(1);
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);

  const status = checkData();
  const month = new Date().getMonth() + 1;

  async function runQuestions() {
    setLoading(true);
    setError(null);
    setQuestions("");
    setStep(2);
    try {
      const ctx = buildContext();
      const prompt = `다음 브랜드의 시즌 프로모션을 기획하려고 합니다.

[브랜드 정보]
${ctx.brandInfo}

[시장 키워드 데이터 (네이버 검색광고 기준)]
${ctx.keywordInfo}

[경쟁사 분석]
${ctx.competitorInfo}

[현재 시즌]
${ctx.seasonInfo}

---
위 자료를 분석해서, 최고의 프로모션 기획 결과를 얻기 위해 반드시 먼저 답해야 할 핵심 질문 10가지를 작성해 주세요.
번호와 질문만 나열하세요. 각 질문은 실무적이고 구체적이어야 합니다.`;

      await streamAI(
        prompt,
        "당신은 한국 D2C 생활용품 브랜드의 마케팅 기획 전문가입니다. 실무적이고 구체적인 답변을 제공합니다.",
        (t) => setQuestions(t)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function runConcepts() {
    setLoading(true);
    setError(null);
    setConcepts([]);
    setStep(3);
    try {
      const ctx = buildContext();
      const prompt = `아래 데이터와 핵심 질문들을 바탕으로 프로모션 컨셉 3가지를 도출해 주세요.

[브랜드 정보]
${ctx.brandInfo}

[키워드 데이터]
${ctx.keywordInfo}

[경쟁사 분석]
${ctx.competitorInfo}

[현재 시즌]
${ctx.seasonInfo}

[기획을 위한 핵심 질문들]
${questions}

---
핵심 질문들에 답하면서 최적의 프로모션 컨셉 3가지를 도출하세요.
반드시 아래 JSON 형식으로만 응답 (마크다운 코드블록 없이 순수 JSON만):
{"concepts":[{"id":1,"name":"컨셉명(15자이내)","tagline":"핵심메시지(25자이내)","target":"타겟(20자이내)","channels":["채널1","채널2"],"hook":"왜지금(40자이내)","idea":"핵심아이디어(80자이내)","score":8.5,"scoreReason":"점수근거(40자이내)"}],"recommendation":1}`;

      let full = "";
      await streamAI(
        prompt,
        "당신은 한국 D2C 생활용품 브랜드의 마케팅 기획 전문가입니다. 요청한 JSON 형식으로만 응답합니다. JSON 외 텍스트는 절대 출력하지 마세요.",
        (t) => { full = t; }
      );

      const match = full.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("컨셉 생성 파싱 실패. 다시 시도해 주세요.");
      const parsed = JSON.parse(match[0]) as { concepts: ConceptItem[]; recommendation: number };
      setConcepts(parsed.concepts ?? []);
      setRecommend(parsed.recommendation ?? 1);
      setSelected(parsed.recommendation ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function runBrief() {
    setLoading(true);
    setError(null);
    setBrief("");
    setStep(4);
    const concept = concepts.find((c) => c.id === selected) ?? concepts[0];
    if (!concept) { setError("컨셉을 선택해 주세요."); setLoading(false); return; }

    try {
      const ctx = buildContext();
      const prompt = `선택한 프로모션 컨셉으로 기획서 초안을 작성해 주세요.

[선택 컨셉]
컨셉명: ${concept.name}
핵심 메시지: ${concept.tagline}
타겟: ${concept.target}
채널: ${concept.channels.join(", ")}
왜 지금: ${concept.hook}
핵심 아이디어: ${concept.idea}

[브랜드 컨텍스트]
${ctx.brandInfo}

[시장/키워드 배경]
${ctx.keywordInfo}

[현재 시즌]
${ctx.seasonInfo}

---
아래 6개 섹션으로 실무 기획서 초안을 작성하세요. 각 섹션은 명확하고 구체적으로:

1. 📊 지금 이 시점인 이유 (시장 배경, 시즌, 키워드 트렌드 근거)
2. 🎯 타겟 고객 인사이트 (누구에게, 어떤 니즈, 구매 트리거)
3. 💡 프로모션 목적 & KPI (달성 목표, 측정 지표)
4. 🚀 핵심 컨셉 & 아이디어 (무엇을, 어떻게)
5. 📱 채널별 실행 전략 (플랫폼별 구체적 방법)
6. ⚠️ 리스크 & 보완점`;

      await streamAI(prompt, "당신은 한국 D2C 생활용품 브랜드의 마케팅 기획 전문가입니다. 실무에 바로 사용할 수 있는 기획서를 작성합니다.", (t) => setBrief(t), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep(1); setQuestions(""); setConcepts([]); setBrief(""); setError(null);
  }

  return (
    <div>
      <StepBar step={step} />

      {error && (
        <div className="rounded-lg px-4 py-3 text-xs mb-4 font-mono break-all"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
          ⚠ {error}
          <button onClick={() => setError(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* STEP 1: Data check */}
      {step === 1 && (
        <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="text-sm font-bold mb-4" style={{ color: "var(--fg)" }}>기획에 활용할 데이터 현황</div>
          <div className="flex flex-col gap-2.5 mb-5">
            {[
              { label: "브랜드 프로필", ok: status.hasBrand, hint: "브랜드 탭에서 입력" },
              { label: "키워드 분석 데이터", ok: status.hasKeywords, hint: "키워드 탭에서 데이터 수집" },
              { label: "경쟁사 분석 데이터", ok: status.hasCompetitors, hint: "경쟁사 탭에서 분석 실행" },
            ].map((d) => (
              <div key={d.label} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: d.ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)", color: d.ok ? "#22C55E" : "#EF4444" }}>
                  {d.ok ? "✓" : "✗"}
                </span>
                <span className="text-sm font-medium" style={{ color: d.ok ? "var(--fg)" : "var(--fg-3)" }}>{d.label}</span>
                {!d.ok && <span className="text-xs" style={{ color: "var(--fg-3)" }}>→ {d.hint}</span>}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg mb-5"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <span className="text-base">📅</span>
            <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>현재 시즌: {getSeasonLabel(month)}</span>
          </div>

          <div className="text-xs mb-4 leading-relaxed" style={{ color: "var(--fg-3)" }}>
            데이터가 없어도 기획을 시작할 수 있습니다. 데이터가 많을수록 더 정확한 컨셉이 나와요.
          </div>

          <button
            onClick={runQuestions}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            ✦ 기획 시작 — 질문 증강
          </button>
        </div>
      )}

      {/* STEP 2: Questions */}
      {step === 2 && (
        <div>
          <div className="rounded-xl border p-4 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>질문 증강 (Question Augmentation)</div>
            <div className="text-xs" style={{ color: "var(--fg-3)" }}>
              답을 바로 구하는 대신, 최고의 기획을 위해 먼저 답해야 할 핵심 질문을 도출합니다
            </div>
          </div>

          <StreamText text={questions} />

          {!loading && questions && (
            <button
              onClick={runConcepts}
              className="w-full mt-4 py-3 rounded-xl font-bold text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}>
              → 질문 기반 컨셉 3가지 도출
            </button>
          )}

          {loading && (
            <div className="text-center py-3 text-xs" style={{ color: "var(--fg-3)" }}>
              <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>↻</span> 질문 생성 중...
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Concepts */}
      {step === 3 && (
        <div>
          {loading && concepts.length === 0 ? (
            <div>
              <div className="text-xs mb-3 text-center" style={{ color: "var(--fg-3)" }}>
                <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>↻</span> 핵심 질문에 답하면서 컨셉을 도출하는 중...
              </div>
              <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="text-3xl mb-2">💡</div>
                <div className="text-xs" style={{ color: "var(--fg-3)" }}>데이터를 분석하고 있어요...</div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs mb-3 font-bold" style={{ color: "var(--fg-3)" }}>
                컨셉 3가지 · AI 추천: {recommend}번
              </div>
              <div className="flex flex-col gap-3 mb-4">
                {concepts.map((c) => {
                  const isSelected = selected === c.id;
                  const isRecommended = recommend === c.id;
                  return (
                    <div key={c.id}
                      onClick={() => setSelected(c.id)}
                      className="rounded-xl border p-4 cursor-pointer"
                      style={{
                        background: isSelected ? "var(--surface-2)" : "var(--surface)",
                        borderColor: isSelected ? "var(--accent)" : "var(--border)",
                        borderWidth: isSelected ? 2 : 1,
                      }}>
                      <div className="flex items-start gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: isSelected ? "var(--accent)" : "var(--surface-2)", color: isSelected ? "#fff" : "var(--fg-3)" }}>
                          {c.id}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm" style={{ color: "var(--fg)" }}>{c.name}</span>
                            {isRecommended && (
                              <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>AI 추천</span>
                            )}
                            <span className="text-xs font-bold ml-auto" style={{ color: c.score >= 8 ? "#22C55E" : "var(--accent)" }}>
                              {c.score}점
                            </span>
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>{c.tagline}</div>
                        </div>
                      </div>
                      <div className="grid gap-1.5 ml-8" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                          <span className="font-semibold">타겟 </span>{c.target}
                        </div>
                        <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                          <span className="font-semibold">채널 </span>{c.channels.join(", ")}
                        </div>
                      </div>
                      <div className="ml-8 mt-1.5 text-xs" style={{ color: "var(--fg-2)" }}>{c.idea}</div>
                      <div className="ml-8 mt-1 text-xs" style={{ color: "var(--fg-3)" }}>↗ {c.hook}</div>
                      <div className="ml-8 mt-1 text-xs italic" style={{ color: "var(--fg-3)" }}>채점 근거: {c.scoreReason}</div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={runBrief}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}>
                → {selected}번 컨셉으로 기획서 초안 작성
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Brief */}
      {step === 4 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>
              프로모션 기획서 초안
            </div>
            <div className="flex gap-2">
              {!loading && brief && (
                <button
                  onClick={() => navigator.clipboard?.writeText(brief)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold"
                  style={{ background: "var(--surface-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>
                  📋 복사
                </button>
              )}
              <button
                onClick={reset}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
                style={{ background: "var(--surface-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>
                ↺ 처음부터
              </button>
            </div>
          </div>

          {loading && !brief && (
            <div className="text-center py-3 text-xs mb-2" style={{ color: "var(--fg-3)" }}>
              <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>↻</span> 기획서 작성 중...
            </div>
          )}

          <StreamText text={brief} />
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
