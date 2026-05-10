import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";

export function loadScriptEnv() {
  const envArg = process.argv.find((arg) => arg.startsWith("--env="));
  const explicitFile = envArg?.slice("--env=".length);
  const files = explicitFile ? [explicitFile] : [".env.local", ".env"];
  const loaded: string[] = [];

  for (const file of files) {
    const resolved = path.resolve(process.cwd(), file);
    if (!fs.existsSync(resolved)) continue;
    config({ path: resolved, override: false });
    loaded.push(file);
  }

  if (loaded.length === 0) {
    throw new Error(`No environment file found. Tried: ${files.join(", ")}`);
  }

  return loaded;
}

export function supabaseHost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? new URL(url).host : "missing-url";
}
