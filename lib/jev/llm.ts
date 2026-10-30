import "server-only";

/**
 * Jev's model connector. With ANTHROPIC_API_KEY set, Jev calls Claude via the
 * Messages API; without it, every capability falls back to the deterministic
 * rules engine so the platform still works offline and in demos.
 */
export const jevEngine = (): "claude" | "rules" => (process.env.ANTHROPIC_API_KEY ? "claude" : "rules");

export async function claude(system: string, user: string, maxTokens = 900): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25_000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.JEV_MODEL || "claude-sonnet-5-5",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn("[jev] Claude call failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return data.content?.filter((c) => c.type === "text").map((c) => c.text).join("") ?? null;
  } catch (e) {
    console.warn("[jev] Claude call error", e);
    return null;
  }
}

/** Ask Claude for JSON and parse it; returns null on any failure so callers fall back to rules. */
export async function claudeJson<T>(system: string, user: string, maxTokens = 900): Promise<T | null> {
  const out = await claude(system + "\nRespond with a single JSON object and nothing else.", user, maxTokens);
  if (!out) return null;
  const m = out.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]) as T;
  } catch {
    return null;
  }
}
