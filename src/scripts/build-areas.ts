import { writeFileSync } from "fs";
import { join } from "path";
import type { AreaEntry } from "../types/jma";

interface JMAHierarchyEntry {
  name: string;
  enName: string;
  parent?: string;
  children?: string[];
  kana?: string;
  officeName?: string;
}

interface JMAAreaJson {
  centers: Record<string, JMAHierarchyEntry>;
  offices: Record<string, JMAHierarchyEntry>;
  class10s: Record<string, JMAHierarchyEntry>;
  class15s: Record<string, JMAHierarchyEntry>;
  class20s: Record<string, JMAHierarchyEntry>;
}

function resolveOfficeCode(
  cityParent: string,
  data: JMAAreaJson
): { officeCode: string; officeName: string } | null {
  // Traverse: class20s.parent → class15s → class10s → offices
  // Each layer has parent pointing to the next
  let current = cityParent;

  // Check if parent is in class15s
  if (data.class15s[current]) {
    const class15 = data.class15s[current];
    if (!class15.parent) return null;
    current = class15.parent;
  }

  // Check if now in class10s
  if (data.class10s[current]) {
    const class10 = data.class10s[current];
    if (!class10.parent) return null;
    current = class10.parent;
  }

  // Should now be in offices
  if (data.offices[current]) {
    return {
      officeCode: current,
      officeName: data.offices[current].name,
    };
  }

  return null;
}

async function buildAreas(): Promise<void> {
  const url = "https://www.jma.go.jp/bosai/common/const/area.json";
  console.log(`Fetching ${url}...`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch area.json: ${res.status}`);
  }

  const data = (await res.json()) as JMAAreaJson;
  const { class20s } = data;

  const areas: AreaEntry[] = [];
  let skipped = 0;

  for (const [cityCode, entry] of Object.entries(class20s)) {
    if (!entry.parent) {
      skipped++;
      continue;
    }

    const resolved = resolveOfficeCode(entry.parent, data);
    if (!resolved) {
      skipped++;
      continue;
    }

    areas.push({
      cityCode,
      cityName: entry.name,
      kana: entry.kana ?? "",
      officeCode: resolved.officeCode,
      officeName: resolved.officeName,
    });
  }

  const outputPath = join(process.cwd(), "src", "data", "areas.json");
  writeFileSync(outputPath, JSON.stringify(areas, null, 2), "utf-8");
  console.log(
    `Generated ${areas.length} entries (skipped: ${skipped}) → ${outputPath}`
  );
}

buildAreas().catch((err) => {
  console.error(err);
  process.exit(1);
});
