/** All timestamps are stored as UTC "YYYY-MM-DD HH:MM:SS" so they sort and compare with SQLite's CURRENT_TIMESTAMP. */
export const toTs = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");
export const nowTs = () => toTs(new Date());
export const addHours = (h: number, from = new Date()) => toTs(new Date(from.getTime() + h * 3600_000));
export const daysAgo = (d: number, hour = 10) => {
  const x = new Date();
  x.setUTCDate(x.getUTCDate() - d);
  x.setUTCHours(hour, (d * 37) % 60, 0, 0);
  return toTs(x);
};
export const daysAhead = (d: number, hour = 10) => daysAgo(-d, hour);
export const parseTs = (s: string) => new Date(s.replace(" ", "T") + "Z");

export function relTime(s: string | null | undefined) {
  if (!s) return "—";
  const diff = Date.now() - parseTs(s).getTime();
  const future = diff < 0;
  const a = Math.abs(diff) / 1000;
  const fmt = (n: number, u: string) => `${Math.round(n)} ${u}${Math.round(n) === 1 ? "" : "s"}`;
  const out =
    a < 60 ? "just now" : a < 3600 ? fmt(a / 60, "min") : a < 86400 ? fmt(a / 3600, "hour") : a < 86400 * 45 ? fmt(a / 86400, "day") : fmt(a / (86400 * 30), "month");
  if (out === "just now") return out;
  return future ? `in ${out}` : `${out} ago`;
}

export function fmtDate(s: string | null | undefined, withTime = false) {
  if (!s) return "—";
  const d = parseTs(s);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" } : { timeZone: "Asia/Kolkata" }),
  });
}

export function money(amount: number | null | undefined, currency = "INR", compact = false) {
  if (amount == null) return "—";
  if (currency === "INR") {
    if (compact) {
      if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(amount % 1e7 ? 2 : 0)} Cr`;
      if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(amount % 1e5 ? 1 : 0)} L`;
    }
    return "₹" + amount.toLocaleString("en-IN");
  }
  const sym: Record<string, string> = { USD: "$", GBP: "£", EUR: "€" };
  if (compact && amount >= 1000) return `${sym[currency] ?? currency + " "}${Math.round(amount / 1000)}k`;
  return `${sym[currency] ?? currency + " "}${amount.toLocaleString("en-US")}`;
}
