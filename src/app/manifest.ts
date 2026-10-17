import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SafeGo",
    short_name: "SafeGo",
    description: "自宅・勤務地の気象警報に基づく出社可否チェッカー",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f6f4",
    theme_color: "#393939",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
