import { NextRequest } from "next/server";
import { createHmac } from "crypto";

const CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID;
const API_KEY = process.env.NAVER_AD_API_KEY;
const SECRET_KEY = process.env.NAVER_AD_SECRET_KEY;
const BASE_URL = "https://api.naver.com";

function makeSignature(timestamp: string, method: string, path: string): string {
  const message = `${timestamp}.${method}.${path}`;
  return createHmac("sha256", SECRET_KEY!).update(message).digest("base64");
}

export async function GET(req: NextRequest) {
  if (!CUSTOMER_ID || !API_KEY || !SECRET_KEY) {
    return Response.json(
      { error: "NAVER_AD_CUSTOMER_ID / NAVER_AD_API_KEY / NAVER_AD_SECRET_KEY 환경 변수가 없습니다" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") ?? "";
  const path = `/keywordstool?hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`;

  const timestamp = String(Date.now());
  const signature = makeSignature(timestamp, "GET", `/keywordstool`);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": API_KEY,
        "X-Customer": CUSTOMER_ID,
        "X-Signature": signature,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Naver API (${res.status}): ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
