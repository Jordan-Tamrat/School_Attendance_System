import { auth } from "@/lib/auth.edge";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = pathname === "/login";
  if (isPublic) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/students") || pathname.startsWith("/exceptions") || pathname.startsWith("/classes") || pathname.startsWith("/users") || pathname.startsWith("/settings")) {
    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
