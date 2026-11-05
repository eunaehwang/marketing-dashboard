import { NextRequest, NextResponse } from "next/server";

const PASSWORD = process.env.DASHBOARD_PASSWORD;
const COOKIE_NAME = "dashboard_auth";
const LOGIN_PATH = "/login";

// 인증 없이 접근 가능한 경로
// /api/hermes/* 는 라우트 내부에서 x-hermes-token으로 인증하므로 middleware는 통과
const PUBLIC_PATHS = [LOGIN_PATH, "/api/auth/login", "/api/hermes"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 공개 경로는 그냥 통과
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 환경변수 미설정 시 보호 없이 통과 (로컬 개발 편의)
  if (!PASSWORD) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value === PASSWORD) {
    return NextResponse.next();
  }

  // 페이지 요청이면 로그인 화면으로 리다이렉트
  if (!pathname.startsWith("/api/")) {
    const url = req.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // API 요청이면 401
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
