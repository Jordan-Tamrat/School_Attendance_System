import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAuth(requiredRole?: "admin" | "teacher") {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  if (requiredRole === "admin" && session.user.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}
