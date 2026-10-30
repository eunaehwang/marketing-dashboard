"use client";

import { useState, useEffect, useRef } from "react";

const BRAND_KEY = "brand_profile";
const SUGGESTIONS_KEY = "ai_suggestions";
const FEEDBACK_KEY = "ai_feedback";

// Will be replaced with live API data once Google Trends is connected
const TRENDS = [
  { label: "▲ 수전·스텐 +18%", hot: true },
  { label: "▲ 육아 낙서 릴스", hot: true },
  { label: "▲ 가을 이사 시즌", hot: true },
  { label: "집들이 선물 검색", hot: false },
];

interface Suggestion {
  id: string;
  platform: string;
  platformType: "insta" | "kakao" | "naver" | "all";
  title: string;
  trendHook: string;
  copy: string;
  visual: string;
  hashtags: string[];
}

interface FeedbackItem {
  id: string;
  type: "good" | "bad" | null;
  memo: string;
  title: string;
  platform: string;
  savedAt: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  insta: "#E1306C",
  kakao: "#E6C200",
  naver: "#03C75A",
  all: "var(--accent)",
};

function PlatformDot({ type }: { type: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: 99,
        background: PLATFORM_COLORS[type] ?? "var(--fg-3)",
        flexShrink: 0,
      }}
    />
  );
}

export default function AiBotSection() {
  const [tab, setTab] = useState<"today" | "history">("today");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { type: "good" | "bad" | null; memo: string }>>({});
  const [memoText, setMemoText] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SUGGESTIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date === new Date().toDateString() && data.suggestions?.length) {
          setSuggestions(data.suggestions);
          setOpenId(data.suggestions[0]?.id ?? null);
        }
      }
      const fb = localStorage.getItem(FEEDBACK_KEY);
      if (fb) {
        const parsed = JSON.parse(fb);
        setFeedback(parsed.current ?? {});
        setHistory(parsed.history ?? []);
      }
    } catch {}

    fetch("/api/health")
      .then((r) => setHasApiKey(r.ok))
      .catch(() => setHasApiKey(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  };

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let brandInfo = "브랜드 정보 없음 (브랜드 프로필 먼저 입력 필요)";
      try {
        const b = localStorage.getItem(BRAND_KEY);
        if (b) {
          const p = JSON.parse(b);
          const recentFb = history
            .slice(0, 3)
            .map((h) => `${h.type === "good" ? "좋음" : "안맞음"}: ${h.title}${h.memo ? ` (메모: ${h.memo})` : ""}`)
            .join(" / ");
          brandInfo = [
            `브랜드명: ${p.brandName}`,
            `업종: ${p.industry}`,
            `주요제품: ${p.products}`,
            `타겟: ${p.targetAge?.join(", ")} ${p.targetGender} — ${p.targetDescription}`,
            `톤앤매너: ${p.toneKeywords?.join(", ")} — ${p.toneDescription}`,
            `채널: ${p.channels?.join(", ")}`,
            `잘됐던 사례: ${p.successCases}`,
            `하지 말 것: ${p.doNotList}`,
            recentFb ? `최근 피드백: ${recentFb}` : "",
          ]
            .filter(Boolean)
            .join("\n");
        }
      } catch {}

      const today = new Date();
      const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
      const trendStr = TRENDS.map((t) => `- ${t.label}`).join("\n");

      const prompt = `오늘(${dateStr}) 마케팅 기획 제안 3개를 생성해주세요.

브랜드 정보:
${brandInfo}

현재 트렌드:
${trendStr}

아래 JSON 배열 형식으로만 응답하세요. 마크다운 코드블록 없이 순수 JSON 배열만:
[
  {
    "platform": "플랫폼명 (예: 인스타그램 릴스)",
    "platformType": "insta 또는 kakao 또는 naver 또는 all 중 하나",
    "title": "기획 제목 (20자 이내, 핵심만)",
    "trendHook": "왜 지금인지 한 줄 (트렌드 근거, 40자 이내)",
    "copy": "실제 SNS에 쓸 수 있는 추천 카피 (이모지 포함, 브랜드 톤앤매너 반영)",
    "visual": "비주얼 방향 설명 (촬영·편집 방향, 주의사항 포함, 60자 이내)",
    "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3", "#해시태그4"]
  }
]`;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          systemPrompt: "당신은 한국 D2C 브랜드 전문 마케터입니다. 요청한 JSON 형식으로만 응답합니다. 절대 JSON 외 텍스트를 출력하지 마세요.",
        }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }

      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("JSON parse failed");

      const parsed: Omit<Suggestion, "id">[] = JSON.parse(match[0]);
      const withIds: Suggestion[] = parsed.map((s, i) => ({
        ...s,
        id: `${Date.now()}-${i}`,
      }));

      setSuggestions(withIds);
      setOpenId(withIds[0]?.id ?? null);
      try {
        localStorage.setItem(
          SUGGESTIONS_KEY,
          JSON.stringify({ date: new Date().toDateString(), suggestions: withIds })
        );
      } catch {}
      showToast("✦ 오늘 기획 3개 생성됐어요");
    } catch {
      showToast("생성 중 오류가 발생했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeedback = (id: string, type: "good" | "bad") => {
    setFeedback((prev) => {
      const cur = prev[id] ?? { type: null, memo: "" };
      const next = { ...cur, type: cur.type === type ? null : type };
      const updated = { ...prev, [id]: next };
      try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify({ current: updated, history })); } catch {}
      return updated;
    });
    showToast(type === "good" ? "👍 좋아요 저장됐어요" : "👎 피드백 저장됐어요");
  };

  const handleSaveMemo = (s: Suggestion) => {
    const memo = (memoText[s.id] ?? "").trim();
    if (!memo) return;
    const item: FeedbackItem = {
      id: s.id,
      type: feedback[s.id]?.type ?? null,
      memo,
      title: s.title,
      platform: s.platform,
      savedAt: new Date().toISOString(),
    };
    const newHistory = [item, ...history].slice(0, 30);
    setHistory(newHistory);
    setMemoText((p) => ({ ...p, [s.id]: "" }));
    try {
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify({ current: feedback, history: newHistory }));
    } catch {}
    showToast("💬 메모 저장됐어요");
  };

  const dateStr = (() => {
    const d = new Date();
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]}) 기준`;
  })();

  if (hasApiKey === false) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--fg)" }}>
          AI 기획봇
        </h1>
        <p className="text-xs mb-6" style={{ color: "var(--fg-3)" }}>
          브랜드 데이터 + 트렌드 기반 자동 기획 제안
        </p>
        <div
          className="rounded-xl border p-10 text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">🔑</div>
          <div className="text-sm font-bold mb-2" style={{ color: "var(--fg)" }}>
            Claude API 키가 필요합니다
          </div>
          <div className="text-xs mb-5 max-w-xs mx-auto" style={{ color: "var(--fg-3)" }}>
            Vercel 환경 변수에{" "}
            <code
              className="px-1 py-0.5 rounded text-xs"
              style={{ background: "var(--surface-2)", color: "var(--accent)", fontFamily: "monospace" }}
            >
              ANTHROPIC_API_KEY
            </code>
            를 추가해주세요
          </div>
          <div
            className="rounded-lg p-4 text-left max-w-xs mx-auto"
            style={{ background: "var(--surface-2)" }}
          >
            {["console.anthropic.com 에서 API 키 발급", "Vercel → Settings → Environment Variables", "ANTHROPIC_API_KEY = sk-ant-... 추가", "Vercel 재배포 후 사용 가능"].map((s, i) => (
              <div key={i} className="flex gap-2 text-xs mb-1.5" style={{ color: "var(--fg-3)" }}>
                <span className="font-bold flex-shrink-0" style={{ color: "var(--accent)" }}>{i + 1}.</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>
            AI 기획봇
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-3)" }}>
            {dateStr}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-opacity disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <span style={{ display: "inline-block", animation: loading ? "spin 0.8s linear infinite" : "none" }}>
            {loading ? "↻" : "✦"}
          </span>
          {loading ? "생성 중..." : "오늘 기획 생성"}
        </button>
      </div>

      {/* Trend strip */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--fg-3)", fontSize: 10, letterSpacing: "0.08em" }}
        >
          트렌드
        </span>
        {TRENDS.map((t, i) => (
          <span
            key={i}
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              background: t.hot ? "var(--accent-light, rgba(107,103,255,0.08))" : "var(--surface-2)",
              color: t.hot ? "var(--accent)" : "var(--fg-3)",
              border: `1px solid ${t.hot ? "var(--accent)" : "var(--border)"}`,
              borderColor: t.hot ? "rgba(107,103,255,0.3)" : "var(--border)",
            }}
          >
            {t.label}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex border-b mb-4"
        style={{ borderColor: "var(--border)" }}
      >
        {(["today", "history"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-xs font-bold transition-colors"
            style={{
              color: tab === t ? "var(--accent)" : "var(--fg-3)",
              borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
              marginBottom: -1,
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {t === "today" ? `오늘의 제안 ${suggestions.length || ""}` : `피드백 히스토리 ${history.length || ""}`}
          </button>
        ))}
      </div>

      {/* Today tab */}
      {tab === "today" && (
        <div className="flex flex-col gap-2.5">
          {suggestions.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="text-3xl mb-3">✦</div>
              <div className="text-sm font-bold mb-1.5" style={{ color: "var(--fg)" }}>
                오늘의 기획 제안이 아직 없어요
              </div>
              <div className="text-xs mb-5" style={{ color: "var(--fg-3)" }}>
                브랜드 데이터와 최신 트렌드를 분석해서<br />맞춤 기획 3개를 제안해드려요
              </div>
              <button
                onClick={generate}
                disabled={loading}
                className="px-5 py-2.5 rounded-full text-sm font-bold disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {loading ? "↻ 생성 중..." : "✦ 기획 생성하기"}
              </button>
            </div>
          ) : (
            suggestions.map((s, idx) => {
              const isOpen = openId === s.id;
              const fb = feedback[s.id] ?? { type: null, memo: "" };
              return (
                <div
                  key={s.id}
                  className="rounded-xl border overflow-hidden"
                  style={{
                    background: "var(--surface)",
                    borderColor: isOpen ? "var(--accent)" : "var(--border)",
                    transition: "border-color 0.15s",
                  }}
                >
                  {/* Row */}
                  <div
                    className="flex items-center gap-2.5 p-3 cursor-pointer"
                    onClick={() => setOpenId(isOpen ? null : s.id)}
                    style={{ paddingRight: 10 }}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: isOpen ? "var(--accent)" : "var(--surface-2)",
                        color: isOpen ? "#fff" : "var(--fg-3)",
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <PlatformDot type={s.platformType} />
                        <span className="text-xs" style={{ color: "var(--fg-3)" }}>
                          {s.platform}
                        </span>
                      </div>
                      <div
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--fg)" }}
                      >
                        {s.title}
                      </div>
                      <div
                        className="text-xs truncate"
                        style={{ color: "var(--fg-3)" }}
                      >
                        ↗ {s.trendHook}
                      </div>
                    </div>
                    {/* Feedback buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleFeedback(s.id, "good")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
                        style={{
                          border: `1px solid ${fb.type === "good" ? "var(--positive, #22C55E)" : "var(--border)"}`,
                          background: fb.type === "good" ? "rgba(34,197,94,0.1)" : "transparent",
                          color: fb.type === "good" ? "var(--positive, #22C55E)" : "var(--fg-3)",
                        }}
                        title="좋아요"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => toggleFeedback(s.id, "bad")}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all"
                        style={{
                          border: `1px solid ${fb.type === "bad" ? "var(--negative, #EF4444)" : "var(--border)"}`,
                          background: fb.type === "bad" ? "rgba(239,68,68,0.1)" : "transparent",
                          color: fb.type === "bad" ? "var(--negative, #EF4444)" : "var(--fg-3)",
                        }}
                        title="안 맞아요"
                      >
                        👎
                      </button>
                    </div>
                    <div
                      className="text-xs flex-shrink-0 ml-1"
                      style={{
                        color: "var(--fg-3)",
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    >
                      ▼
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div
                      className="border-t"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                    >
                      <div className="p-4 flex flex-col gap-3">
                        {/* Copy */}
                        <div>
                          <div
                            className="text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: "var(--fg-3)", fontSize: 10 }}
                          >
                            추천 카피
                          </div>
                          <div
                            className="rounded-lg p-3 text-sm italic leading-relaxed"
                            style={{
                              background: "var(--surface)",
                              borderLeft: "3px solid var(--accent)",
                              color: "var(--fg)",
                              lineHeight: 1.7,
                            }}
                          >
                            {s.copy.split("\n").map((line, i) => (
                              <span key={i}>{line}{i < s.copy.split("\n").length - 1 && <br />}</span>
                            ))}
                          </div>
                        </div>
                        {/* Visual */}
                        <div>
                          <div
                            className="text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: "var(--fg-3)", fontSize: 10 }}
                          >
                            비주얼 방향
                          </div>
                          <div className="text-xs leading-relaxed" style={{ color: "var(--fg-2)" }}>
                            🎬 {s.visual}
                          </div>
                        </div>
                        {/* Hashtags */}
                        <div className="flex flex-wrap gap-1.5">
                          {s.hashtags.map((h, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "var(--accent-light, rgba(107,103,255,0.1))", color: "var(--accent)" }}
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                        {/* Memo */}
                        <div>
                          <div
                            className="text-xs font-bold uppercase tracking-widest mb-1.5"
                            style={{ color: "var(--fg-3)", fontSize: 10 }}
                          >
                            메모 (다음 기획에 반영)
                          </div>
                          <div className="flex gap-2">
                            <textarea
                              value={memoText[s.id] ?? ""}
                              onChange={(e) => setMemoText((p) => ({ ...p, [s.id]: e.target.value }))}
                              placeholder="다음에 반영할 내용을 적어주세요. 예) 낙서보다 조명 얼룩 소재가 더 반응 좋았어요"
                              rows={2}
                              className="flex-1 rounded-lg px-3 py-2 text-xs resize-none outline-none"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                color: "var(--fg)",
                                lineHeight: 1.6,
                              }}
                              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                            />
                            <button
                              onClick={() => handleSaveMemo(s)}
                              className="px-3 rounded-lg text-xs font-bold self-stretch"
                              style={{ background: "var(--accent)", color: "#fff", border: "none" }}
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="flex flex-col gap-2">
          {history.length === 0 ? (
            <div
              className="rounded-xl border p-8 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="text-sm" style={{ color: "var(--fg-3)" }}>
                아직 피드백 히스토리가 없어요
              </div>
            </div>
          ) : (
            history.map((h, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border px-3.5 py-3"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                  style={
                    h.type === "good"
                      ? { background: "rgba(34,197,94,0.1)", color: "#22C55E" }
                      : h.type === "bad"
                      ? { background: "rgba(239,68,68,0.1)", color: "#EF4444" }
                      : { background: "rgba(245,158,11,0.1)", color: "#F59E0B" }
                  }
                >
                  {h.type === "good" ? "👍" : h.type === "bad" ? "👎" : "💬"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--fg)" }}>
                    {h.title}
                    <span className="font-normal ml-1.5" style={{ color: "var(--fg-3)" }}>
                      · {h.platform}
                    </span>
                  </div>
                  {h.memo && (
                    <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                      {h.memo}
                    </div>
                  )}
                </div>
                <div className="text-xs flex-shrink-0" style={{ color: "var(--fg-3)" }}>
                  {new Date(h.savedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Toast */}
      <div
        className="fixed left-1/2 text-xs font-bold px-4 py-2 rounded-full z-50 pointer-events-none"
        style={{
          transform: `translateX(-50%) translateY(${toastVisible ? "0" : "60px"})`,
          bottom: "max(20px, env(safe-area-inset-bottom, 0px))",
          background: "var(--fg)",
          color: "var(--bg)",
          transition: "transform 0.25s cubic-bezier(0.34,1.5,0.64,1)",
          whiteSpace: "nowrap",
        }}
      >
        {toast}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
