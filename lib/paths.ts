import path from "node:path";

export const IS_VERCEL = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export function getDataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (IS_VERCEL) return "/tmp/benchmark-data";
  return path.join(process.cwd(), "data");
}

export function getDbPath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  return path.join(getDataDir(), "benchmark.db");
}

export function getUploadsDir(sub?: string): string {
  return sub ? path.join(getDataDir(), "uploads", sub) : path.join(getDataDir(), "uploads");
}
