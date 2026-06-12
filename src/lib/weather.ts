import type { CurrentWeather } from "@/types/jma";

const FORECAST_CODE_MAP: Record<string, string> = {
  "460040": "460100", // 奄美地方 → 鹿児島地方
  "014030": "014100", // 十勝地方 → 釧路・根室・十勝地方
};

export function getJMAWeatherEmoji(code: string): string {
  const n = parseInt(code, 10);
  if (isNaN(n) || n < 100 || n > 499) return "🌡️";
  if (n >= 400) return "🌨️";
  if (n >= 300) {
    if (n === 308 || n === 309 || n === 313 || n === 314) return "⛈️";
    return "🌧️";
  }
  if (n >= 200) {
    if (n >= 202 && n <= 208) return "🌦️";
    return "☁️";
  }
  if (n >= 113) return "⛅";
  if (n >= 101) return "🌤️";
  return "☀️";
}

interface JMAForecastArea {
  area: { name: string; code: string };
  weatherCodes?: string[];
  weathers?: string[];
  pops?: string[];
  temps?: string[];
}

interface JMAForecastTimeSeries {
  timeDefines: string[];
  areas: JMAForecastArea[];
}

interface JMAForecastData {
  publishingOffice: string;
  reportDatetime: string;
  timeSeries: JMAForecastTimeSeries[];
}

interface AmedasObservation {
  temp?: [number, number]; // [値, 品質フラグ(0=正常)]
  [key: string]: unknown;
}

function cleanDescription(raw: string): string {
  return raw.replace(/[\s　]+/g, " ").trim();
}

// サーバー時刻からAMeDASファイルコードを計算（latest_time.txt不要）
// AMeDASファイルは3時間ブロック (00/03/06/.../21) 毎に管理
// 例: 21:00-23:59 JST のデータは YYYYMMDD_21.json に格納
function getAmedasTimeCode(minutesBack = 20): { fileCode: string; obsKey: string } {
  // UTC+9 (JST) でミリ秒表現
  const jstMs = Date.now() + 9 * 60 * 60 * 1000;
  const tenMinMs = 10 * 60 * 1000;
  const targetMs = Math.floor((jstMs - minutesBack * 60 * 1000) / tenMinMs) * tenMinMs;
  const d = new Date(targetMs);

  // getUTC* でJST時刻成分を取得（jstMsをUTCとして扱っているため）
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dy = String(d.getUTCDate()).padStart(2, "0");
  const rawHour = d.getUTCHours();
  // ファイル名は3時間区切り (0,3,6,9,12,15,18,21)
  const fileHour = String(Math.floor(rawHour / 3) * 3).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");

  return {
    fileCode: `${y}${mo}${dy}_${fileHour}`, // 例: "20260612_21"
    obsKey: `${y}${mo}${dy}${String(rawHour).padStart(2, "0")}${mi}00`, // 例: "20260612225000"
  };
}

export async function fetchJMACurrentWeather(
  officeCode: string
): Promise<CurrentWeather | null> {
  if (!/^\d{6}$/.test(officeCode)) return null;
  const forecastCode = FORECAST_CODE_MAP[officeCode] ?? officeCode;
  const forecastUrl = `https://www.jma.go.jp/bosai/forecast/data/forecast/${forecastCode}.json`;

  try {
    const forecastRes = await fetch(forecastUrl, { next: { revalidate: 3600 } });
    if (!forecastRes.ok) return null;

    const forecastData = (await forecastRes.json()) as JMAForecastData[];
    if (!forecastData?.length) return null;

    const sf = forecastData[0];
    const weatherAreas = sf.timeSeries?.[0]?.areas ?? [];
    const tempAreas = sf.timeSeries?.[2]?.areas ?? [];

    const areaIndex = weatherAreas.findIndex((a) => a.area.code === officeCode);
    const weatherArea = areaIndex >= 0 ? weatherAreas[areaIndex] : weatherAreas[0];

    const weatherCode = weatherArea?.weatherCodes?.[0] ?? "";
    const rawDescription = weatherArea?.weathers?.[0] ?? "";
    const description = cleanDescription(rawDescription) || "不明";
    const emoji = weatherCode ? getJMAWeatherEmoji(weatherCode) : "🌡️";

    const stationArea =
      areaIndex >= 0 && areaIndex < tempAreas.length
        ? tempAreas[areaIndex]
        : tempAreas[0];

    const temps = stationArea?.temps ?? [];
    const parsedMin =
      temps[0] !== "" && temps[0] !== undefined ? parseInt(temps[0], 10) : null;
    const parsedMax =
      temps[1] !== "" && temps[1] !== undefined ? parseInt(temps[1], 10) : null;
    const tempMin = parsedMin !== null && !isNaN(parsedMin) ? parsedMin : null;
    const tempMax = parsedMax !== null && !isNaN(parsedMax) ? parsedMax : null;

    // AMeDAS現在気温取得（サーバー時刻から計算）
    let temp: number | null = null;
    const stationCode = stationArea?.area.code;
    if (stationCode && /^\d{4,6}$/.test(stationCode)) {
      const { fileCode, obsKey } = getAmedasTimeCode(20);
      const amedasRes = await fetch(
        `https://www.jma.go.jp/bosai/amedas/data/point/${stationCode}/${fileCode}.json`,
        { next: { revalidate: 600 } }
      );
      if (amedasRes.ok) {
        const amedasData =
          (await amedasRes.json()) as Record<string, AmedasObservation>;
        // 対応時刻のキーで検索、なければ最新エントリにフォールバック
        const obs = amedasData[obsKey] ?? Object.values(amedasData).at(-1);
        if (obs?.temp && obs.temp[1] === 0) {
          temp = Math.round(obs.temp[0]);
        }
      }
    }

    return { weatherCode, description, emoji, temp, tempMin, tempMax };
  } catch {
    return null;
  }
}
