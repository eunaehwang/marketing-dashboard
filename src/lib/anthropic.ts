/** 공통 Claude API 호출 헬퍼 */

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CallOptions {
  model?: string;
  max_tokens?: number;
  system?: string;
  messages: Message[];
}

export type ClaudeResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string };

/** ```json ... ``` 또는 ``` ... ``` 코드펜스 제거 */
function stripFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

/**
 * Claude API를 호출하고 텍스트를 반환한다.
 * - type === "text" 블록을 모두 이어 붙임
 * - 텍스트가 없으면 stop_reason·블록 목록을 에러에 포함
 * - 코드펜스(```json)를 자동 제거
 */
export async function callClaude(opts: CallOptions): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, error: "ANTHROPIC_API_KEY가 설정되지 않았습니다." };
  }

  const { model = "claude-haiku-5-5", max_tokens = 4096, system, messages } = opts;

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });
  } catch (e) {
    return { ok: false, status: 500, error: `네트워크 오류: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    return { ok: false, status: res.status, error: `Claude API 오류 (${res.status}): ${err}` };
  }

  const data = await res.json();
  const content: Array<{ type: string; text?: string }> = data.content ?? [];

  // type==="text" 블록만 이어 붙임
  const text = content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();

  if (!text) {
    const blockTypes = content.map((b) => b.type).join(", ") || "none";
    const stopReason: string = data.stop_reason ?? "unknown";
    return {
      ok: false,
      status: 500,
      error: `응답 텍스트 없음 — stop_reason: ${stopReason}, blocks: [${blockTypes}]`,
    };
  }

  return { ok: true, text: stripFence(text) };
}

/** JSON 파싱 — 실패 시 앞 200자를 에러에 포함 */
export function parseJson<T>(text: string): { ok: true; data: T } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, error: `JSON 파싱 실패: ${text.slice(0, 200)}` };
  }
}
