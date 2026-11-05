"use client";

import { useState, useEffect } from "react";

interface ConceptItem {
  id: number;
  name: string;
  tagline: string;
  target: string;
  channels: string;
  hook: string;
  idea: string;
  score: number;
  scoreReason: string;
}

interface ResearchItem {
  label: string;
  content: string;
  citations: string[];
  loading: boolean;
  done: boolean;
  error?: string;
}

type Step = 1 | 2 | 3 | 4 | 5;

// ─── Context helpers ──────────────────────────────────────────────────────────

function getSeason(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "봄";
  if (m >= 6 && m <= 8) return "여름";
  if (m >= 9 && m <= 11) return "가을";
  return "겨울";
}

function getSeasonLabel(): string {
  const m = new Date().getMonth() + 1;
  const map: Record<number, string> = {
    1: "1월 · 설날 시즌", 2: "2월 · 봄 준비", 3: "3월 · 봄 이사·대청소",
    4: "4월 · 봄 이사 절정", 5: "5월 · 가정의달", 6: "6월 · 장마 준비",
    7: "7월 · 장마·여름", 8: "8월 · 여름 위생 강화", 9: "9월 · 가을 이사·추석",
    10: "10월 · 가을 이사 절정", 11: "11월 · 연말 대청소 준비", 12: "12월 · 연말 대청소·김장",
  };
  return map[m] ?? `${m}월`;
}

function buildContext(): string {
  const parts: string[] = [];
  try {
    const bp = localStorage.getItem("brand_profile");
    if (bp) {
      const p = JSON.parse(bp);
      const targetLine = [
        p.targetAge?.join(", "),
        p.targetGender,
        p.targetDescription,
      ].filter(Boolean).join(" · ");
      const rows = [
        p.brandName    && `브랜드명: ${p.brandName}`,
        p.industry     && `업종: ${p.industry}`,
        p.products     && `주요 제품: ${p.products}`,
        targetLine     && `목표 고객: ${targetLine}`,
        p.toneKeywords?.length && `톤앤매너: ${p.toneKeywords.join(", ")}`,
        p.competitors  && `경쟁사: ${p.competitors}`,
        p.successCases && `성공 사례: ${p.successCases}`,
        p.doNotList    && `주의사항: ${p.doNotList}`,
      ].filter(Boolean).join("\n");
      if (rows) parts.push(`[브랜드 프로필]\n${rows}`);
    }
  } catch {}
  try {
    const kw = localStorage.getItem("naver_keywords");
    if (kw) {
      const parsed = JSON.parse(kw);
      const items = (parsed.items ?? parsed).slice(0, 10) as Array<{ keyword: string; total: number }>;
      if (items.length) {
        const rows = items.map((k, i) => `${i + 1}. ${k.keyword} (${(k.total ?? 0).toLocaleString()})`).join("\n");
        parts.push(`[주요 검색 키워드 TOP 10]\n${rows}`);
      }
    }
  } catch {}
  try {
    const cd = localStorage.getItem("competitor_data");
    if (cd) {
      const obj = JSON.parse(cd);
      const names = Object.keys(obj).slice(0, 5);
      if (names.length) {
        const rows = names.map((n) => {
          const top3 = (obj[n].keywords ?? []).slice(0, 3).map((k: { keyword: string }) => k.keyword).join(", ");
          return `• ${n}: ${top3}`;
        }).join("\n");
        parts.push(`[경쟁사]\n${rows}`);
      }
    }
  } catch {}
  parts.push(`[현재 시즌]\n${getSeasonLabel()}`);
  return parts.join("\n\n") || "브랜드 프로필, 키워드, 경쟁사 데이터 없음";
}

function checkData() {
  let hasBrand = false, hasKeywords = false, hasCompetitors = false;
  try {
    const b = localStorage.getItem("brand_profile");
    if (b) { const p = JSON.parse(b); hasBrand = !!(p.brandName || p.industry); }
  } catch {}
  try {
    const k = localStorage.getItem("naver_keywords");
    if (k) {
      const parsed = JSON.parse(k);
      hasKeywords = ((parsed.items ?? parsed) as unknown[]).length > 0;
    }
  } catch {}
  try {
    const c = localStorage.getItem("competitor_data");
    hasCompetitors = !!(c && Object.keys(JSON.parse(c)).length > 0);
  } catch {}
  return { hasBrand, hasKeywords, hasCompetitors };
}

function getCategory(): string {
  try {
    const bp = localStorage.getItem("brand_profile");
    if (bp) { const p = JSON.parse(bp); return p.industry ?? "생활용품"; }
  } catch {}
  return "생활용품";
}

function getCompetitorNames(): string {
  try {
    const cd = localStorage.getItem("competitor_data");
    if (cd) return Object.keys(JSON.parse(cd)).slice(0, 5).join(", ");
  } catch {}
  return "";
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function streamOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  onChunk: (t: string) => void,
  maxTokens = 2000
): Promise<void> {
  const res = await fetch("/api/openrouter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      stream: true,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(e.error ?? `HTTP ${res.status}`);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}

async function streamClaude(
  systemPrompt: string,
  userPrompt: string,
  onChunk: (t: string) => void,
  maxTokens = 2000
): Promise<void> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(e.error ?? `HTTP ${res.status}`);
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value));
  }
}

async function fetchPerplexity(prompt: string): Promise<{ content: string; citations: string[] }> {
  const res = await fetch("/api/openrouter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "perplexity/sonar-pro",
      messages: [{ role: "user", content: prompt }],
      stream: false,
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(e.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── StepBar ─────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1 as Step, label: "데이터 확인" },
  { n: 2 as Step, label: "질문 증강" },
  { n: 3 as Step, label: "웹 리서치" },
  { n: 4 as Step, label: "컨셉 기획" },
  { n: 5 as Step, label: "기획서" },
];

function StepBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center mb-6 overflow-x-auto pb-1 gap-0">
      {STEPS.map(({ n, label }, i) => {
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: done ? "#22C55E" : active ? "var(--accent)" : "var(--surface-2)",
                  color: done || active ? "#fff" : "var(--fg-3)",
                }}
              >
                {done ? "✓" : n}
              </div>
              <span className="text-xs whitespace-nowrap font-semibold" style={{ color: active ? "var(--accent)" : "var(--fg-3)", fontSize: 9 }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 mx-1 mb-4" style={{ background: done ? "#22C55E" : "var(--border)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="w-4 h-4 rounded-full border-2 shrink-0"
      style={{ borderColor: "var(--accent)", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
  );
}

function ModelTag({ model }: { model: string }) {
  return (
    <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-semibold align-middle"
      style={{ background: "rgba(99,102,241,0.1)", color: "var(--accent)", fontSize: 9 }}>
      {model}
    </span>
  );
}

function StatusRow({ label, ok, sub }: { label: string; ok: boolean; sub: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs mt-0.5 shrink-0" style={{ color: ok ? "#22C55E" : "#EF4444" }}>{ok ? "✓" : "✗"}</span>
      <div>
        <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{label}</span>
        <span className="text-xs ml-1.5" style={{ color: "var(--fg-3)" }}>{sub}</span>
      </div>
    </div>
  );
}

function ResearchCard({ item }: { item: ResearchItem }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        style={{ borderBottom: open && (item.content || item.error) ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: "var(--fg)" }}>{item.label}</span>
          {item.loading && <Spinner />}
          {item.done && !item.error && <span className="text-xs font-semibold" style={{ color: "#22C55E" }}>완료</span>}
          {item.error && <span className="text-xs font-semibold" style={{ color: "#EF4444" }}>오류</span>}
        </div>
        <span className="text-xs" style={{ color: "var(--fg-3)" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (item.content || item.error || item.loading) && (
        <div className="px-4 py-3">
          {item.loading && !item.content && <div className="text-xs" style={{ color: "var(--fg-3)" }}>검색 중...</div>}
          {item.error ? (
            <p className="text-xs font-mono" style={{ color: "#EF4444" }}>{item.error}</p>
          ) : item.content ? (
            <>
              <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: "var(--fg)", fontSize: 12 }}>
                {item.content.slice(0, 1200)}{item.content.length > 1200 ? "\n..." : ""}
              </p>
              {item.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.citations.slice(0, 5).map((c, i) => (
                    <a key={i} href={c} target="_blank" rel="noopener noreferrer"
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{ background: "var(--surface-2)", color: "var(--accent)", fontSize: 10 }}>
                      [{i + 1}] 출처
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlanningTab() {
  const [step, setStep] = useState<Step>(1);
  const [hasOR, setHasOR] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState("");
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [researchRunning, setResearchRunning] = useState(false);

  const [concepts, setConcepts] = useState<ConceptItem[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<number>(1);

  const [brief, setBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setHasOR(!!d.openRouter))
      .catch(() => setHasOR(false));
  }, []);

  const { hasBrand, hasKeywords, hasCompetitors } = checkData();

  // Step 2 ────────────────────────────────────────────────────────────────────
  const runQuestions = async () => {
    setError(null);
    setQuestionsLoading(true);
    setQuestions("");
    setStep(2);
    const ctx = buildContext();
    const season = getSeason();
    const system = `당신은 마케팅 전략 전문가입니다. 브랜드 데이터를 분석해 최고의 프로모션 기획을 위한 핵심 리서치 질문을 생성합니다.`;
    const prompt = `다음 브랜드 데이터를 바탕으로, ${season} 시즌 프로모션 기획에 꼭 필요한 핵심 리서치 질문 10개를 생성해주세요.

구성:
- 소비자 심리/행동 관련 3개
- 시장 트렌드/경쟁 환경 관련 3개
- 채널/크리에이티브 전략 관련 2개
- KPI/성과 측정 관련 2개

각 질문은 퍼플렉시티 웹 검색에서 바로 활용할 수 있는 구체적인 형태로 작성해주세요.

브랜드 데이터:
${ctx}`;
    try {
      if (hasOR) {
        await streamOpenRouter("openai/gpt-4o", system, prompt, (t) => setQuestions((q) => q + t), 1500);
      } else {
        await streamClaude(system, prompt, (t) => setQuestions((q) => q + t), 1500);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Step 3 ────────────────────────────────────────────────────────────────────
  const runResearch = async () => {
    if (!hasOR) return;
    setError(null);
    setResearchRunning(true);
    setStep(3);
    const category = getCategory();
    const competitors = getCompetitorNames();
    const season = getSeason();

    const queries = [
      {
        label: "📈 시장 트렌드",
        prompt: `한국 ${category} 시장의 최근 3개월 소비 트렌드를 분석해주세요.\n\n포함 항목:\n1. 주요 소비 트렌드 3-5가지 (각 근거 포함)\n2. SNS/디지털 콘텐츠 트렌드\n3. ${season} 시즌 특수 트렌드\n4. 가격/구매 패턴 변화\n\n한국 소비자 기준, 최신 실제 데이터 기반으로만 작성해주세요.`,
      },
      {
        label: "🏢 경쟁사 프로모션",
        prompt: `한국 ${category} 시장${competitors ? ` (${competitors})` : ""} 최근 6개월 마케팅 캠페인을 분석해주세요.\n\n포함 항목:\n1. 주요 프로모션 사례\n2. 활용 채널 및 크리에이티브 형식\n3. 고객 반응과 차별화 포인트\n4. 미개척 기회(Gap)\n\n확인 가능한 실제 사례만 작성해주세요.`,
      },
      {
        label: "💬 고객 버즈",
        prompt: `한국 소비자들의 ${category} 제품에 대한 최근 3개월 온라인 반응을 분석해주세요.\n\n네이버 블로그, 인스타그램, 유튜브, 커뮤니티 기반:\n1. 긍정 반응 TOP 3\n2. 불만/요구사항 TOP 3\n3. 자주 언급되는 감성 키워드\n4. 구매 결정 트리거\n\n실제 소비자 목소리 기반으로 작성해주세요.`,
      },
    ];

    setResearch(queries.map((q) => ({ label: q.label, content: "", citations: [], loading: false, done: false })));

    for (let i = 0; i < queries.length; i++) {
      setResearch((prev) => {
        const next = [...prev];
        next[i] = { ...next[i], loading: true };
        return next;
      });
      try {
        const result = await fetchPerplexity(queries[i].prompt);
        setResearch((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], loading: false, done: true, content: result.content, citations: result.citations ?? [] };
          return next;
        });
      } catch (e) {
        setResearch((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], loading: false, done: true, error: e instanceof Error ? e.message : String(e) };
          return next;
        });
      }
    }
    setResearchRunning(false);
  };

  // Step 4 ────────────────────────────────────────────────────────────────────
  const runConcepts = async () => {
    setError(null);
    setConceptsLoading(true);
    setConcepts([]);
    setAiRecommendation("");
    setStep(4);

    const ctx = buildContext();
    const season = getSeason();
    const researchSummary = research
      .filter((r) => r.done && r.content)
      .map((r) => `${r.label}:\n${r.content.slice(0, 700)}`)
      .join("\n\n");

    const system = `당신은 한국 마케팅 전략 전문가입니다. 브랜드 데이터와 리서치 인사이트로 창의적이고 실행 가능한 프로모션 컨셉을 도출합니다.`;
    const prompt = `다음 데이터를 바탕으로 ${season} 시즌 프로모션 컨셉 5개를 도출해주세요.

[브랜드 & 키워드 데이터]
${ctx}

[리서치 인사이트]
${researchSummary || "리서치 없음"}

[핵심 질문]
${questions.slice(0, 500)}

아래 JSON 형식으로만 응답해주세요 (마크다운 코드블록 없이):
{"concepts":[{"id":1,"name":"컨셉명","tagline":"슬로건(20자이내)","target":"핵심타겟","channels":"주요채널","hook":"크리에이티브훅","idea":"실행아이디어 2-3문장","score":85,"scoreReason":"점수이유 한문장"}],"recommendation":"추천컨셉번호와이유 2-3문장"}`;

    let full = "";
    try {
      if (hasOR) {
        await streamOpenRouter("openai/gpt-4o", system, prompt, (t) => { full += t; }, 2500);
      } else {
        await streamClaude(system, prompt, (t) => { full += t; }, 2500);
      }
      const match = full.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("JSON 파싱 실패. 다시 시도해주세요.");
      const parsed = JSON.parse(match[0]);
      setConcepts(parsed.concepts ?? []);
      setAiRecommendation(parsed.recommendation ?? "");
      if (parsed.concepts?.length) setSelectedConcept(parsed.concepts[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConceptsLoading(false);
    }
  };

  // Step 5 ────────────────────────────────────────────────────────────────────
  const runBrief = async () => {
    setError(null);
    setBriefLoading(true);
    setBrief("");
    setStep(5);

    const chosen = concepts.find((c) => c.id === selectedConcept) ?? concepts[0];
    if (!chosen) { setBriefLoading(false); return; }

    const researchSummary = research
      .filter((r) => r.done && r.content)
      .map((r) => `${r.label}:\n${r.content.slice(0, 500)}`)
      .join("\n\n");

    const system = `당신은 경험 있는 마케팅 기획자입니다. 선정된 컨셉을 바탕으로 실행 가능한 프로모션 기획서를 작성합니다.`;
    const prompt = `다음 컨셉으로 프로모션 기획서를 작성해주세요.

[선정 컨셉]
이름: ${chosen.name}
슬로건: ${chosen.tagline}
타겟: ${chosen.target}
채널: ${chosen.channels}
훅: ${chosen.hook}
아이디어: ${chosen.idea}

[리서치 인사이트]
${researchSummary || "없음"}

6개 섹션으로 작성해주세요:

📊 시점 및 이유
이 시즌에 이 프로모션을 해야 하는 이유 (시장 데이터, 경쟁 환경 기반)

🎯 타겟 인사이트
핵심 타겟의 페인포인트, 욕구, 구매 트리거

💡 목적 및 KPI
마케팅 목적 + 구체적 KPI 3개

🚀 컨셉 및 크리에이티브
컨셉 상세 전개, 메시지 하우스, 크리에이티브 방향

📱 채널 전략
채널별 콘텐츠 형식, 일정, 예산 배분 가이드

⚠️ 리스크 및 대응
예상 리스크 2-3개와 대응 방안`;

    try {
      if (hasOR) {
        await streamOpenRouter("openai/gpt-4o", system, prompt, (t) => setBrief((b) => b + t), 3000);
      } else {
        await streamClaude(system, prompt, (t) => setBrief((b) => b + t), 3000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBriefLoading(false);
    }
  };

  const reset = () => {
    setStep(1); setQuestions(""); setResearch([]); setConcepts([]);
    setAiRecommendation(""); setBrief(""); setError(null);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 pb-4">
      <StepBar step={step} />

      {error && (
        <div className="rounded-lg px-4 py-3 text-xs font-mono break-all"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
          ⚠ {error}
          <button onClick={() => setError(null)} className="ml-2 underline opacity-70">닫기</button>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>기획 전 데이터 확인</h3>

          <div className="rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-bold mb-2" style={{ color: "var(--fg-3)" }}>AI 도구 상태</div>
            <div className="flex flex-col gap-1.5">
              <StatusRow
                label={hasOR ? "GPT-4o (질문 증강 · 컨셉 · 기획서)" : "Claude Haiku (GPT-4o 대체)"}
                ok={true}
                sub={hasOR ? "OpenRouter 연결됨" : "Claude로 대체 실행"}
              />
              <StatusRow
                label="Perplexity sonar-pro (웹 리서치)"
                ok={!!hasOR}
                sub={hasOR ? "OpenRouter 연결됨" : "OPENROUTER_API_KEY 필요"}
              />
            </div>
            {hasOR === false && (
              <div className="mt-3 text-xs rounded-lg px-3 py-2"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", color: "#F59E0B" }}>
                💡 OpenRouter 없이도 기획 가능 (Claude로 대체). 웹 리서치(Step 3)는 건너뜁니다.
                <br />Vercel → Settings → Environment Variables에 <code>OPENROUTER_API_KEY</code>를 추가하세요.
              </div>
            )}
          </div>

          <div className="rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="text-xs font-bold mb-2" style={{ color: "var(--fg-3)" }}>데이터 현황</div>
            <div className="flex flex-col gap-1.5">
              <StatusRow label="브랜드 프로필" ok={hasBrand} sub={hasBrand ? "설정 완료" : "브랜드 탭에서 입력하세요"} />
              <StatusRow label="네이버 키워드" ok={hasKeywords} sub={hasKeywords ? "데이터 있음" : "키워드 분석 후 저장하세요"} />
              <StatusRow label="경쟁사 분석" ok={hasCompetitors} sub={hasCompetitors ? "데이터 있음" : "경쟁사 분석을 실행하세요"} />
            </div>
            <div className="mt-2 text-xs px-1" style={{ color: "var(--fg-3)" }}>
              📅 현재 시즌: <strong>{getSeasonLabel()}</strong>
            </div>
          </div>

          <div className="text-xs" style={{ color: "var(--fg-3)" }}>
            데이터가 없어도 시작 가능합니다. 데이터가 많을수록 더 정확한 컨셉이 나와요.
          </div>

          <button
            onClick={runQuestions}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            ✦ 기획 시작 →
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>질문 증강</h3>
            <ModelTag model={hasOR ? "GPT-4o" : "Claude"} />
            {questionsLoading && <Spinner />}
          </div>
          <p className="text-xs" style={{ color: "var(--fg-3)" }}>
            브랜드 데이터를 분석해 리서치 핵심 질문 10개를 생성합니다
          </p>
          <div className="rounded-xl border p-4 min-h-28 text-xs whitespace-pre-wrap leading-relaxed font-mono"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
            {questions || (questionsLoading ? "생성 중..." : "")}
            {questionsLoading && <span className="animate-pulse">▌</span>}
          </div>
          {!questionsLoading && questions && (
            <button
              onClick={() => { if (hasOR) runResearch(); else runConcepts(); }}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {hasOR ? "웹 리서치 시작 →" : "컨셉 기획으로 건너뛰기 →"}
            </button>
          )}
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>웹 리서치</h3>
            <ModelTag model="Perplexity sonar-pro" />
            {researchRunning && <Spinner />}
          </div>
          <p className="text-xs" style={{ color: "var(--fg-3)" }}>시장 트렌드, 경쟁사 프로모션, 고객 버즈를 실시간 웹 검색합니다</p>

          {research.map((r, i) => <ResearchCard key={i} item={r} />)}

          {!researchRunning && research.some((r) => r.done) && (
            <button
              onClick={runConcepts}
              className="w-full py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              컨셉 기획 시작 →
            </button>
          )}
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>컨셉 기획</h3>
            <ModelTag model={hasOR ? "GPT-4o" : "Claude"} />
            {conceptsLoading && <Spinner />}
          </div>
          <p className="text-xs" style={{ color: "var(--fg-3)" }}>리서치 인사이트 기반 프로모션 컨셉 5개 생성</p>

          {conceptsLoading && concepts.length === 0 && (
            <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <Spinner />
              <div className="mt-2 text-xs" style={{ color: "var(--fg-3)" }}>컨셉 도출 중...</div>
            </div>
          )}

          {!conceptsLoading && concepts.length > 0 && (
            <>
              {aiRecommendation && (
                <div className="rounded-xl border px-4 py-3"
                  style={{ background: "rgba(99,102,241,0.05)", borderColor: "rgba(99,102,241,0.25)" }}>
                  <div className="text-xs font-bold mb-1" style={{ color: "var(--accent)" }}>✦ AI 추천</div>
                  <div className="text-xs leading-relaxed" style={{ color: "var(--fg)" }}>{aiRecommendation}</div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                {concepts.map((c) => (
                  <div key={c.id}
                    onClick={() => setSelectedConcept(c.id)}
                    className="rounded-xl border p-3 cursor-pointer"
                    style={{
                      background: selectedConcept === c.id ? "rgba(99,102,241,0.05)" : "var(--surface)",
                      borderColor: selectedConcept === c.id ? "rgba(99,102,241,0.4)" : "var(--border)",
                      borderWidth: selectedConcept === c.id ? 2 : 1,
                    }}>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          background: selectedConcept === c.id ? "var(--accent)" : "var(--surface-2)",
                          color: selectedConcept === c.id ? "#fff" : "var(--fg-3)",
                        }}>
                        {c.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold" style={{ color: "var(--fg)" }}>{c.name}</span>
                          <span className="text-sm font-black shrink-0"
                            style={{ color: c.score >= 80 ? "#22C55E" : c.score >= 60 ? "#F59E0B" : "#EF4444" }}>
                            {c.score}
                          </span>
                        </div>
                        <p className="text-xs italic" style={{ color: "var(--fg-3)" }}>"{c.tagline}"</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {[`👤 ${c.target}`, `📱 ${c.channels}`, `💡 ${c.hook}`].map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-xs"
                              style={{ background: "var(--surface-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--fg-2)" }}>{c.idea}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--fg-3)", fontSize: 10 }}>{c.scoreReason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={runBrief}
                className="w-full py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                선택 컨셉으로 기획서 작성 →
              </button>
            </>
          )}
        </div>
      )}

      {/* STEP 5 */}
      {step === 5 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: "var(--fg)" }}>프로모션 기획서</h3>
              <ModelTag model={hasOR ? "GPT-4o" : "Claude"} />
              {briefLoading && <Spinner />}
            </div>
            <div className="flex gap-2">
              {brief && !briefLoading && (
                <button
                  onClick={() => navigator.clipboard.writeText(brief)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }}>
                  복사
                </button>
              )}
              {!briefLoading && (
                <button
                  onClick={reset}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{ background: "var(--surface-2)", color: "var(--fg-3)", border: "1px solid var(--border)" }}>
                  ↺ 처음부터
                </button>
              )}
            </div>
          </div>

          {briefLoading && !brief && (
            <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <Spinner />
              <div className="mt-2 text-xs" style={{ color: "var(--fg-3)" }}>기획서 작성 중...</div>
            </div>
          )}

          {brief && (
            <div className="rounded-xl border p-4 text-sm whitespace-pre-wrap leading-relaxed"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", fontSize: 13 }}>
              {brief}
              {briefLoading && <span className="animate-pulse">▌</span>}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
