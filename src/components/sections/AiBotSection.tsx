"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "이번 달 키워드 트렌드를 바탕으로 콘텐츠 아이디어 3가지 제안해줘",
  "크리스마스 시즌 캠페인 기획안 작성해줘",
  "경쟁사 대비 우리 브랜드의 검색 점유율을 높이는 전략은?",
  "부정 리뷰 대응 및 브랜드 이미지 개선 방법 알려줘",
];

export default function AiBotSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }),
    })
      .then((r) => setHasApiKey(r.ok))
      .catch(() => setHasApiKey(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "죄송합니다. 응답을 가져오는 중 오류가 발생했습니다. API 키를 확인해주세요.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (hasApiKey === false) {
    return (
      <div>
        <div className="mb-7">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--fg)" }}
          >
            AI 기획봇
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
            Claude AI 기반 콘텐츠 기획 어시스턴트
          </p>
        </div>
        <div
          className="rounded-xl border p-10 text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">🔑</div>
          <div
            className="text-sm font-bold mb-2"
            style={{ color: "var(--fg)" }}
          >
            Claude API 키가 필요합니다
          </div>
          <div
            className="text-xs mb-6 max-w-sm mx-auto"
            style={{ color: "var(--fg-3)" }}
          >
            Vercel 환경 변수에{" "}
            <code
              className="px-1 py-0.5 rounded text-xs"
              style={{
                background: "var(--surface-2)",
                color: "var(--accent)",
                fontFamily: "monospace",
              }}
            >
              ANTHROPIC_API_KEY
            </code>
            를 추가해주세요
          </div>
          <div
            className="rounded-lg p-4 text-left max-w-sm mx-auto"
            style={{ background: "var(--surface-2)" }}
          >
            <div
              className="text-xs font-bold mb-2"
              style={{ color: "var(--fg-2)" }}
            >
              설정 방법
            </div>
            {[
              "console.anthropic.com 에서 API 키 발급",
              "Vercel 대시보드 → Settings → Environment Variables",
              "ANTHROPIC_API_KEY = sk-ant-... 추가",
              "Vercel 재배포 후 사용 가능",
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs mb-1.5"
                style={{ color: "var(--fg-3)" }}
              >
                <span
                  className="font-bold flex-shrink-0"
                  style={{ color: "var(--accent)" }}
                >
                  {i + 1}.
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      <div className="mb-5 flex-shrink-0">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--fg)" }}
        >
          AI 기획봇
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
          Claude AI 기반 콘텐츠 기획 어시스턴트
        </p>
      </div>

      {/* Chat area */}
      <div
        className="flex-1 rounded-xl border overflow-hidden flex flex-col"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 py-8">
              <div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
                  style={{ background: "var(--accent-light)" }}
                >
                  🤖
                </div>
                <div
                  className="text-sm font-semibold text-center mb-1"
                  style={{ color: "var(--fg)" }}
                >
                  마케팅 AI 어시스턴트
                </div>
                <div
                  className="text-xs text-center max-w-xs"
                  style={{ color: "var(--fg-3)" }}
                >
                  키워드 분석, 트렌드 데이터를 바탕으로 콘텐츠 기획을 도와드려요
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-xs px-3.5 py-2.5 rounded-lg transition-colors"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--fg-2)",
                      border: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.borderColor =
                        "var(--accent)";
                      (e.target as HTMLElement).style.color = "var(--fg)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.borderColor =
                        "var(--border)";
                      (e.target as HTMLElement).style.color = "var(--fg-2)";
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5"
                    style={{ background: "var(--accent-light)" }}
                  >
                    🤖
                  </div>
                )}
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          background: "var(--accent)",
                          color: "#fff",
                          borderRadius: "18px 18px 4px 18px",
                        }
                      : {
                          background: "var(--surface-2)",
                          color: "var(--fg)",
                          borderRadius: "4px 18px 18px 18px",
                          whiteSpace: "pre-wrap",
                        }
                  }
                >
                  {msg.content || (
                    <span
                      className="inline-flex gap-1"
                      style={{ color: "var(--fg-3)" }}
                    >
                      <span className="animate-bounce">·</span>
                      <span
                        className="animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      >
                        ·
                      </span>
                      <span
                        className="animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      >
                        ·
                      </span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 p-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          {messages.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
              {QUICK_PROMPTS.slice(0, 2).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full flex-shrink-0 transition-colors disabled:opacity-40"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--fg-3)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {prompt.length > 20 ? prompt.slice(0, 20) + "…" : prompt}
                </button>
              ))}
            </div>
          )}
          <div
            className="flex gap-2 items-end rounded-xl p-2"
            style={{ background: "var(--surface-2)" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="마케팅 전략, 콘텐츠 기획 등 무엇이든 물어보세요..."
              rows={1}
              className="flex-1 bg-transparent resize-none outline-none text-sm py-1 px-1"
              style={{ color: "var(--fg)", maxHeight: "120px" }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
              style={{ background: "var(--accent)" }}
            >
              <svg
                viewBox="0 0 16 16"
                width="14"
                height="14"
                fill="none"
                stroke="white"
                strokeWidth="1.8"
              >
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div
            className="text-center text-xs mt-1.5"
            style={{ color: "var(--fg-3)" }}
          >
            Enter로 전송 · Shift+Enter로 줄바꿈
          </div>
        </div>
      </div>
    </div>
  );
}
