import { z } from "zod";

// Configure the actual redemption keys securely in the destination environment.
// This archive intentionally contains no private redemption key values.
const poolSchema = z.array(z.string().min(1));
function readPool(name: string): string[] {
  const raw = process.env[name];
  if (!raw) return [];
  try { return poolSchema.parse(JSON.parse(raw)); }
  catch { throw new Error("Redemption key configuration is invalid."); }
}
export const PRO_KEYS = readPool("AXAI_PRO_KEYS");
export const BASIC_KEYS = readPool("AXAI_BASIC_KEYS");
