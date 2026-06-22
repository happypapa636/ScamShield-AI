import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "scamshield_sid";
const VALID_SESSION = /^[a-zA-Z0-9_-]{24,80}$/;

function createSessionId() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get(SESSION_COOKIE)?.value;

  if (!existing || !VALID_SESSION.test(existing)) {
    response.cookies.set(SESSION_COOKIE, createSessionId(), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
