export interface AlertProfile {
  readonly id: string;
  readonly label: string;
  readonly codes: readonly string[];
}

export const ALERT_PROFILES: readonly AlertProfile[] = [
  {
    id: "profile-1",
    label: "プロファイル1",
    codes: ["02", "05", "32", "33", "35", "36", "37", "43"],
  },
];

/**
 * 与えられた警報コード配列が、いずれかのプリセットと完全一致（順不同、集合として同一）するか判定する
 * @param codes 現在選択中の警報コード配列（undefined または空配列は非一致として扱う）
 * @returns 一致した AlertProfile。一致するものがなければ null
 */
export function findMatchingProfile(
  codes: readonly string[] | undefined
): AlertProfile | null {
  if (!codes || codes.length === 0) return null;
  const codeSet = new Set(codes);
  for (const profile of ALERT_PROFILES) {
    if (
      profile.codes.length === codeSet.size &&
      profile.codes.every((c) => codeSet.has(c))
    ) {
      return profile;
    }
  }
  return null;
}
