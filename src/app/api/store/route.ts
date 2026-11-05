import { NextRequest, NextResponse } from "next/server";
import { storeGet, storeSet, storePrepend, storeList } from "@/lib/store";

export const dynamic = "force-dynamic";

// GET /api/store?key=...&op=get|list&limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const op = searchParams.get("op") ?? "get";
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  try {
    if (op === "list") {
      const data = await storeList(key, limit);
      return NextResponse.json({ ok: true, data });
    }
    const data = await storeGet(key);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ error: "store read failed" }, { status: 500 });
  }
}

// POST /api/store
// body: { op: "set" | "prepend", key: string, value: unknown }
export async function POST(req: NextRequest) {
  let body: { op?: string; key?: string; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { op = "set", key, value } = body;
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  if (value === undefined) return NextResponse.json({ error: "value required" }, { status: 400 });

  try {
    if (op === "prepend") {
      await storePrepend(key, value);
    } else {
      await storeSet(key, value);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "store write failed" }, { status: 500 });
  }
}
