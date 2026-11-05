import { NextRequest, NextResponse } from "next/server";

const PASSWORD = process.env.DASHBOARD_PASSWORD;
const COOKIE_NAME = "dashboard_auth";

export async function POST(req: NextRequest) {
  if (!PASSWORD) {
    return NextResponse.json({ error: "DASHBOARD_PASSWORD 환경변수가 없습니다" }, { status: 500 });
  }

  const { password, next } = await req.json().catch(() => ({ password: "", next: "/" }));

  if (password !== PASSWORD) {
    return NextResponse.json({ error: "비밀번호가 틀렸어요" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, next: next || "/" });
  res.cookies.set(COOKIE_NAME, PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30일
    path: "/",
  });
  return res;
}
