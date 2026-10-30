import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 한국 마케터를 위한 AI 기획 어시스턴트입니다.

역할:
- 키워드 분석, 트렌드, 경쟁사 데이터를 바탕으로 콘텐츠 기획을 제안합니다
- 네이버/인스타그램/카카오 등 한국 플랫폼에 맞는 전략을 제시합니다
- 구체적이고 실행 가능한 아이디어를 제공합니다
- 데이터가 없을 경우 사용자에게 어떤 데이터를 제공하면 더 좋은 분석이 가능한지 안내합니다

응답 방식:
- 한국어로 응답합니다
- 간결하고 실용적으로 작성합니다
- 가능하면 구체적인 수치와 예시를 포함합니다
- 마케팅 전문 용어보다 실무에서 바로 쓸 수 있는 표현을 사용합니다`;

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt, model } = await req.json();

    const stream = await client.messages.stream({
      model: model ?? "claude-3-haiku-20240307",
      max_tokens: 1500,
      system: systemPrompt ?? SYSTEM_PROMPT,
      messages,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status = (err as { status?: number })?.status ?? 500;
    console.error("[/api/ai error]", { status, message, err });
    return Response.json({ error: `[${status}] ${message}` }, { status: 500 });
  }
}
