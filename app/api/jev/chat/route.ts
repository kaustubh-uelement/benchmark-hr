import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { jevChat, type ChatTurn, type Surface } from "@/lib/jev/assistant";

const SURFACES: Surface[] = ["console", "group", "exh1b", "golden-glove", "talent", "trustcircle", "advisory"];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { message?: string; surface?: string; history?: ChatTurn[] } | null;
  const message = body?.message?.trim();
  if (!message) return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  const surface = (SURFACES.includes(body?.surface as Surface) ? body!.surface : "group") as Surface;
  const u = await getUser();
  const history = Array.isArray(body?.history) ? body!.history.filter((h) => h && typeof h.content === "string").slice(-6) : [];
  const reply = await jevChat(message, surface, u, history);
  return NextResponse.json(reply);
}
