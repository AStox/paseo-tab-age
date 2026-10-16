export const EMOJIS = ["🟩", "🟨", "🟧", "🟥"] as const;
export type AgeEmoji = (typeof EMOJIS)[number];

const HOUR = 60 * 60 * 1000;
const PREFIX = /^[🟢🟡🟠🔴🔵🟩🟨🟧🟥🟦]\s*/u;

export function ageEmoji(ageMs: number, running: boolean): AgeEmoji {
  if (running || ageMs < 2 * HOUR) return "🟩";
  if (ageMs < 16 * HOUR) return "🟨";
  if (ageMs < 48 * HOUR) return "🟧";
  return "🟥";
}

export function applyEmoji(title: string, emoji: AgeEmoji): string {
  return `${emoji} ${title.replace(PREFIX, "")}`;
}
