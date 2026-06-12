import type { JMAAreaItem, JMAWarningData } from "@/types/jma";

function mergeWarningReports(reports: JMAWarningData[]): JMAWarningData {
  // 速報種別(dataTypeCode)ごとに最新要素を選択
  const latestPerType = new Map<string, JMAWarningData>();
  for (const item of reports) {
    const key = item.dataTypeCode ?? "__unknown__";
    const existing = latestPerType.get(key);
    if (!existing || new Date(item.reportDatetime) > new Date(existing.reportDatetime)) {
      latestPerType.set(key, item);
    }
  }

  // 全種別の class20Items を areaCode 単位で結合
  const areaMap = new Map<string, Map<string, JMAAreaItem["kinds"][number]>>();
  for (const typeData of latestPerType.values()) {
    for (const area of typeData.warning?.class20Items ?? []) {
      if (!areaMap.has(area.areaCode)) {
        areaMap.set(area.areaCode, new Map());
      }
      const kindsMap = areaMap.get(area.areaCode)!;
      for (const kind of area.kinds) {
        if (!kind.code) continue; // "発表警報・注意報はなし" はコードなし → スキップ
        kindsMap.set(kind.code, kind); // 同一コードは上書き（後勝ち）
      }
    }
  }

  const mergedClass20Items: JMAAreaItem[] = Array.from(areaMap.entries()).map(
    ([areaCode, kindsMap]) => ({ areaCode, kinds: Array.from(kindsMap.values()) })
  );

  // メタデータは全体で最新の要素から取得
  const overallLatest = reports.reduce((a, b) =>
    new Date(b.reportDatetime) > new Date(a.reportDatetime) ? b : a
  );

  return { ...overallLatest, warning: { ...overallLatest.warning, class20Items: mergedClass20Items } };
}

export class JMAFetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "JMAFetchError";
  }
}

export async function fetchJMAWarning(
  officeCode: string
): Promise<JMAWarningData> {
  if (!/^\d{6}$/.test(officeCode)) {
    throw new JMAFetchError(`Invalid officeCode: ${officeCode}`);
  }
  const url = `https://www.jma.go.jp/bosai/warning/data/r8/${officeCode}.json`;

  let response: Response;
  try {
    response = await fetch(url, { next: { revalidate: 600 } });
  } catch (err) {
    throw new JMAFetchError(
      `Network error fetching JMA warning for ${officeCode}: ${String(err)}`
    );
  }

  if (!response.ok) {
    throw new JMAFetchError(
      `JMA API returned ${response.status} for officeCode=${officeCode}`,
      response.status
    );
  }

  try {
    // /r8/ エンドポイントは速報種別(dataTypeCode)ごとの独立した配列を返す。
    // 種別ごとに最新要素を取得し、全種別の class20Items を結合する。
    const raw = (await response.json()) as JMAWarningData | JMAWarningData[];
    if (!Array.isArray(raw)) return raw;
    if (raw.length === 0) {
      throw new JMAFetchError(`Empty response for officeCode=${officeCode}`);
    }
    return mergeWarningReports(raw);
  } catch (err) {
    if (err instanceof JMAFetchError) throw err;
    throw new JMAFetchError(
      `Failed to parse JMA response for ${officeCode}: ${String(err)}`
    );
  }
}
