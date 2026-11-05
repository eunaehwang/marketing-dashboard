import { Redis } from "@upstash/redis";
const kv = Redis.fromEnv();
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, content, citations, fetchedAt } = body;
    if (!type || !content) {
      return NextResponse.json({ error: "type and content required" }, { status: 400 });
    }
    await kv.set(`research_${type}`, { content, citations: citations ?? [], fetchedAt });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
