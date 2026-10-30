import { NextRequest } from "next/server";

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

export async function POST(req: NextRequest) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return Response.json({ error: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경 변수가 없습니다" }, { status: 503 });
  }

  try {
    const body = await req.json();

    const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Naver API error (${res.status}): ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
