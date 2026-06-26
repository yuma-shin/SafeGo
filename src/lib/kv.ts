import { createHash } from "crypto";
import Redis from "ioredis";
import type { StoredSubscription } from "@/types/push";
import type { JudgmentResult } from "@/types/jma";

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");

const SUBSCRIPTIONS_SET_KEY = "subscriptions";
const STALE_THRESHOLD_DAYS = 30;

export function generateSubscriptionId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

function subKey(id: string): string {
  return `sub:${id}`;
}

export async function saveSubscription(
  id: string,
  data: StoredSubscription
): Promise<void> {
  await redis.sadd(SUBSCRIPTIONS_SET_KEY, id);
  await redis.set(subKey(id), JSON.stringify(data));
}

export async function getSubscription(
  id: string
): Promise<StoredSubscription | null> {
  const raw = await redis.get(subKey(id));
  if (!raw) return null;
  return JSON.parse(raw) as StoredSubscription;
}

export async function getAllSubscriptions(): Promise<
  Array<{ id: string; data: StoredSubscription }>
> {
  const ids = await redis.smembers(SUBSCRIPTIONS_SET_KEY);
  if (ids.length === 0) return [];

  const rawValues = await redis.mget(...ids.map(subKey));

  const results: Array<{ id: string; data: StoredSubscription }> = [];
  for (let i = 0; i < ids.length; i++) {
    const raw = rawValues[i];
    if (!raw) continue;
    results.push({ id: ids[i], data: JSON.parse(raw) as StoredSubscription });
  }
  return results;
}

export async function deleteSubscription(id: string): Promise<void> {
  await redis.srem(SUBSCRIPTIONS_SET_KEY, id);
  await redis.del(subKey(id));
}

export async function updateLastJudgment(
  id: string,
  judgment: JudgmentResult
): Promise<void> {
  const sub = await getSubscription(id);
  if (!sub) return;
  await redis.set(
    subKey(id),
    JSON.stringify({ ...sub, lastJudgment: judgment, lastSuccessAt: new Date().toISOString() })
  );
}

export async function pruneStaleSubscriptions(): Promise<number> {
  const subs = await getAllSubscriptions();
  const threshold = Date.now() - STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const { id, data } of subs) {
    if (!data.lastSuccessAt) continue;
    if (new Date(data.lastSuccessAt).getTime() < threshold) {
      await deleteSubscription(id);
      deleted++;
    }
  }
  return deleted;
}
