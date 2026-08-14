export type AdvancementMode = "xp" | "milestone";

/**
 * Total de XP necessário para alcançar cada nível nas regras de 2014 e 2024.
 * O índice zero não é usado; `XP_THRESHOLDS[14]` é o piso do nível 14.
 */
export const XP_THRESHOLDS = [
  0,
  0,
  300,
  900,
  2_700,
  6_500,
  14_000,
  23_000,
  34_000,
  48_000,
  64_000,
  85_000,
  100_000,
  120_000,
  140_000,
  165_000,
  195_000,
  225_000,
  265_000,
  305_000,
  355_000,
] as const;

export function clampCharacterLevel(level: number) {
  return Math.max(1, Math.min(20, Math.floor(Number(level) || 1)));
}

export function experienceForLevel(level: number) {
  return XP_THRESHOLDS[clampCharacterLevel(level)];
}

export function levelFromExperience(experience: number) {
  const total = Math.max(0, Math.floor(Number(experience) || 0));
  for (let level = 20; level >= 1; level -= 1) {
    if (total >= XP_THRESHOLDS[level]) return level;
  }
  return 1;
}

export function experienceToNextLevel(level: number, experience: number) {
  const currentLevel = clampCharacterLevel(level);
  if (currentLevel >= 20) return 0;
  return Math.max(0, XP_THRESHOLDS[currentLevel + 1] - Math.max(0, experience));
}

export function canAdvanceOneLevel(
  mode: AdvancementMode,
  level: number,
  experience: number,
  milestoneGranted: boolean,
) {
  const currentLevel = clampCharacterLevel(level);
  if (currentLevel >= 20) return false;
  return mode === "xp"
    ? experience >= XP_THRESHOLDS[currentLevel + 1]
    : milestoneGranted;
}

export function advancementProgress(level: number, experience: number) {
  const currentLevel = clampCharacterLevel(level);
  if (currentLevel >= 20) return 1;
  const floor = XP_THRESHOLDS[currentLevel];
  const ceiling = XP_THRESHOLDS[currentLevel + 1];
  return Math.max(0, Math.min(1, (experience - floor) / (ceiling - floor)));
}
