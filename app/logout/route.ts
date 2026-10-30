import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function GET(req: Request) {
  await signOut();
  const u = new URL(req.url);
  const to = u.searchParams.get("to") || "/";
  return NextResponse.redirect(new URL(to.startsWith("/") ? to : "/", req.url));
}
