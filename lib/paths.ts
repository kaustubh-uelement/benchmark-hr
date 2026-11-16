import path from "node:path";
import fs from "node:fs";

export const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_EXECUTION_ENV ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.AMPLIFY_HOSTING ||
  process.env.AWS_REGION
);

export const IS_VERCEL = IS_SERVERLESS;

function isWritable(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, `.probe-${Date.now()}`);
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return true;
  } catch {
    return false;
  }
}

export function getDataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (IS_SERVERLESS) return "/tmp/benchmark-data";
  const localDir = path.join(process.cwd(), "data");
  if (!isWritable(localDir)) {
    return "/tmp/benchmark-data";
  }
  return localDir;
}

export function getDbPath(): string {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  return path.join(getDataDir(), "benchmark.db");
}

export function getUploadsDir(sub?: string): string {
  return sub ? path.join(getDataDir(), "uploads", sub) : path.join(getDataDir(), "uploads");
}
