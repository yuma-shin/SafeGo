import React from "react";
import {
  OFFICE_CODE_TO_PREF,
  PREFECTURE_SVG_PATHS,
} from "@/data/prefecture-paths";

interface PrefectureSilhouetteProps {
  officeCode: string;
  size?: number;
}

export default function PrefectureSilhouette({
  officeCode,
  size = 56,
}: PrefectureSilhouetteProps) {
  const prefName = OFFICE_CODE_TO_PREF[officeCode];
  const svgData = prefName ? PREFECTURE_SVG_PATHS[prefName] : null;
  if (!svgData) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={svgData.viewBox}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d={svgData.d}
        style={{
          fill: "var(--silhouette-fill)",
          stroke: "var(--silhouette-stroke)",
        }}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
