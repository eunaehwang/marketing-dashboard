import { NextRequest, NextResponse } from "next/server";
import { storeGet, storeSet, storePrepend, storeList } from "@/lib/store";
import products from "@/config/products";

export const dynamic = "force-dynamic";

const VALID_STAGES = new Set([
  "customer", "matrix", "verdicts", "creatives",
  "insights", "market", "matrix_history",
]);
const VALID_PRODUCT_IDS = new Set(products.map((p) => p.id));
const MAX_LIMIT = 200;
const MAX_VALUE_CHARS = 500_000; // ~500KB JSON 문자열

function validateKey(key: string): boolean {
  const parts = key.split(":");
  return (
    parts.length === 3 &&
    parts[0] === "product" &&
    VALID_PRODUCT_IDS.has(parts[1]) &&
    VALID_STAGES.has(parts[2])
  );
}

function storeError(e: unknown): NextResponse {
  const msg = e instanceof Error ? e.message : "";
  if (msg === "REDIS_NOT_CONFIGURED") {
    return NextResponse.json({ error: "redis_not_configured" }, { status: 503 });
  }
  console.error("[store]", e);
  return NextResponse.json({ error: "store_error" }, { status: 500 });
}

// GET /api/store?key=...&op=get|list&limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  const op = searchParams.get("op") ?? "get";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), MAX_LIMIT);

  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  if (!validateKey(key)) return NextResponse.json({ error: "invalid key" }, { status: 400 });

  try {
    if (op === "list") {
      const data = await storeList(key, limit);
      return NextResponse.json({ ok: true, data });
    }
    const data = await storeGet(key);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    return storeError(e);
  }
}

// POST /api/store — body: { op: "set" | "prepend", key: string, value: unknown }
export async function POST(req: NextRequest) {
  let body: { op?: string; key?: string; value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { op = "set", key, value } = body;
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
  if (!validateKey(key)) return NextResponse.json({ error: "invalid key" }, { status: 400 });
  if (value === undefined) return NextResponse.json({ error: "value required" }, { status: 400 });

  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_VALUE_CHARS) {
    return NextResponse.json({ error: "value too large" }, { status: 413 });
  }

  try {
    if (op === "prepend") {
      await storePrepend(key, value);
    } else {
      await storeSet(key, value);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return storeError(e);
  }
}
