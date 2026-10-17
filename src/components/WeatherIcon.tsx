import React from "react";

type WeatherKind = "sun" | "sun-cloud" | "cloud" | "showers" | "rain" | "thunder" | "snow" | "unknown";

// Use the API's existing weather classification so the icon and description stay in sync.
const WEATHER_KINDS: Record<string, WeatherKind> = {
  "☀️": "sun",
  "🌤️": "sun-cloud",
  "⛅": "sun-cloud",
  "☁️": "cloud",
  "🌦️": "showers",
  "🌧️": "rain",
  "⛈️": "thunder",
  "🌨️": "snow",
};

function Sun({ small = false }: { small?: boolean }) {
  return (
    <g transform={small ? "translate(25 3) scale(.64)" : undefined}>
      <g stroke="#e9b864" strokeWidth="3.5" strokeLinecap="round">
        <path d="M40 9v4m0 48v4M12 37h4m48 0h4M20 17l3 3m34 34 3 3M20 57l3-3m34-34 3-3" />
      </g>
      <circle cx="40" cy="37" r="17" fill="#f8d58a" stroke="#edbf70" strokeWidth="2" />
      <path d="M31 31a11 11 0 0 1 9-5" stroke="#fff1cc" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  );
}

function Cloud({ rainy = false }: { rainy?: boolean }) {
  return (
    <g>
      <path d="M23 54h33a12 12 0 0 0 1-24 17 17 0 0 0-32-3 13.5 13.5 0 0 0-2 27Z"
        fill={rainy ? "#d0dce6" : "#e7edf1"} stroke={rainy ? "#a6bbcc" : "#bdccd6"} strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M29 32a11 11 0 0 1 11-7" fill="none" stroke="#f8fbfd" strokeWidth="3" strokeLinecap="round" opacity=".9" />
    </g>
  );
}

export default function WeatherIcon({ emoji }: { emoji: string }) {
  const kind = WEATHER_KINDS[emoji] ?? "unknown";
  const rainy = kind === "rain" || kind === "showers" || kind === "thunder";

  return (
    <svg className="weather-icon" viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false" data-weather-icon={kind}>
      {kind === "sun" && <Sun />}
      {(kind === "sun-cloud" || kind === "showers") && <Sun small />}
      {kind !== "sun" && kind !== "unknown" && <Cloud rainy={rainy} />}
      {(kind === "rain" || kind === "showers") && (
        <g stroke="#88b9d4" strokeWidth="4" strokeLinecap="round">
          <path d="m26 61-2 5m16-5-2 5m16-5-2 5" />
        </g>
      )}
      {kind === "thunder" && (
        <>
          <path d="m40 50-7 11h7l-3 10 13-16h-8l4-5Z" fill="#f6ce80" stroke="#e2b76c" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="m25 60-2 5m34-5-2 5" stroke="#88b9d4" strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
      {kind === "snow" && (
        <g stroke="#a4bfcf" strokeWidth="2.4" strokeLinecap="round">
          <path d="M26 59v8m-3.5-6 7 4m-7 0 7-4M51 59v8m-3.5-6 7 4m-7 0 7-4" />
          <circle cx="39" cy="68" r="1.8" fill="#a4bfcf" stroke="none" />
        </g>
      )}
      {kind === "unknown" && (
        <>
          <path d="M34 45V22a6 6 0 0 1 12 0v23a12 12 0 1 1-12 0Z" fill="#f5e8e0" stroke="#cfb9ac" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M40 34v19" stroke="#e2aa93" strokeWidth="5" strokeLinecap="round" />
          <circle cx="40" cy="56" r="6" fill="#e2aa93" />
          <path d="M51 26h5m-5 9h3" stroke="#cfb9ac" strokeWidth="2.2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
