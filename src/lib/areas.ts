import type { AreaEntry } from "@/types/jma";
import areasData from "@/data/areas.json";

const areas = areasData as AreaEntry[];

export function searchAreas(query: string, limit = 10): AreaEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const results: AreaEntry[] = [];
  for (const area of areas) {
    if (
      area.cityName.includes(trimmed) ||
      area.kana.includes(trimmed) ||
      area.officeName.startsWith(trimmed)
    ) {
      results.push(area);
      if (results.length >= limit) break;
    }
  }
  return results;
}
