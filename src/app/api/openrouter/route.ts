import { NextRequest } from "next/server";

const API_KEY = process.env.OPENROUTER_API_KEY;
const OR_BASE = "https://openrouter.ai/api/v1/chat/completions";

export const maxDuration = 60;

const ALLOWED_MODELS = new Set([
  "perplexity/sonar-pro",
  "perplexity/sonar",
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-haiku-5-5",
  "anthropic/claude-sonnet-4-6",
]);
const MAX_TOKENS_LIMIT = 8000;

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return Response.json({ error: "OPENROUTER_API_KEY 환경 변수가 없습니다" }, { status: 503 });
  }

  try {
    const { model, messages, systemPrompt, stream = false, max_tokens } = await req.json();

    if (!ALLOWED_MODELS.has(model)) {
      return Response.json({ error: `허용되지 않은 모델: ${model}` }, { status: 400 });
    }

    const resolvedTokens = max_tokens ? Math.min(max_tokens, MAX_TOKENS_LIMIT) : undefined;

    const res = await fetch(OR_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://marketing-dashboard-seven-psi.vercel.app",
        "X-Title": "Prayforit Marketing Dashboard",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
          ...messages,
        ],
        stream,
        ...(resolvedTokens ? { max_tokens: resolvedTokens } : {}),
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return Response.json({ error: `OpenRouter (${res.status}): ${t}` }, { status: res.status });
    }

    if (stream) {
      // SSE → plain text stream
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const reader = res.body!.getReader();
            const decoder = new TextDecoder();
            let buf = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += decoder.decode(value, { stream: true });
              const lines = buf.split("\n");
              buf = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const p = JSON.parse(data);
                  const delta = p.choices?.[0]?.delta?.content ?? "";
                  if (delta) controller.enqueue(encoder.encode(delta));
                } catch {}
              }
            }
            controller.close();
          } catch (err) { controller.error(err); }
        },
      });
      return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    } else {
      // Non-streaming — return content + citations
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content ?? "";
      const citations: string[] = data.citations ?? [];
      return Response.json({ content, citations });
    }
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
