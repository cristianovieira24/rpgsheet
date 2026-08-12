import type { Ruleset } from "./legacy";
import type { AbilityKey } from "./rules";

export type ClassLevelEntry = {
  id: string;
  classId: string;
  subclassId: string;
  ruleset: Ruleset;
  level: number;
};

type ClassRequirement = {
  all?: AbilityKey[];
  any?: AbilityKey[];
};

const requirements: Record<string, ClassRequirement> = {
  barbarian: { all: ["str"] },
  bard: { all: ["cha"] },
  cleric: { all: ["wis"] },
  druid: { all: ["wis"] },
  fighter: { any: ["str", "dex"] },
  monk: { all: ["dex", "wis"] },
  paladin: { all: ["str", "cha"] },
  ranger: { all: ["dex", "wis"] },
  rogue: { all: ["dex"] },
  sorcerer: { all: ["cha"] },
  warlock: { all: ["cha"] },
  wizard: { all: ["int"] },
};

export const classSpellAbilities: Partial<Record<string, AbilityKey>> = {
  bard: "cha",
  cleric: "wis",
  druid: "wis",
  monk: "wis",
  paladin: "cha",
  ranger: "wis",
  sorcerer: "cha",
  warlock: "cha",
  wizard: "int",
};

const abilityLabels: Record<AbilityKey, string> = {
  str: "Força",
  dex: "Destreza",
  con: "Constituição",
  int: "Inteligência",
  wis: "Sabedoria",
  cha: "Carisma",
};

export function totalClassLevels(entries: ClassLevelEntry[]) {
  return entries.reduce((sum, entry) => sum + Math.max(0, entry.level), 0);
}

export function fitClassLevelsToBudget(
  entries: ClassLevelEntry[],
  requestedBudget: number,
  preferredEntryId?: string,
) {
  if (!entries.length) return [];
  const budget = Math.max(entries.length, Math.min(20, Math.floor(requestedBudget) || 1));
  const next = entries.map((entry) => ({ ...entry, level: Math.max(1, Math.floor(entry.level) || 1) }));
  const preferredIndex = Math.max(0, next.findIndex((entry) => entry.id === preferredEntryId));
  const difference = budget - totalClassLevels(next);

  if (difference > 0) {
    next[preferredIndex] = { ...next[preferredIndex], level: next[preferredIndex].level + difference };
    return next;
  }

  if (difference < 0) {
    let excess = Math.abs(difference);
    const reductionOrder = [
      preferredIndex,
      ...next.map((_, index) => index).filter((index) => index !== preferredIndex).reverse(),
    ];
    for (const index of reductionOrder) {
      const removable = Math.min(excess, next[index].level - 1);
      if (removable <= 0) continue;
      next[index] = { ...next[index], level: next[index].level - removable };
      excess -= removable;
      if (!excess) break;
    }
  }

  return next;
}

export function redistributeClassLevel(
  entries: ClassLevelEntry[],
  requestedBudget: number,
  entryId: string,
  requestedLevel: number,
) {
  if (!entries.length) return [];
  const budget = Math.max(entries.length, Math.min(20, Math.floor(requestedBudget) || 1));
  const balanced = fitClassLevelsToBudget(entries, budget);
  const changedIndex = balanced.findIndex((entry) => entry.id === entryId);
  if (changedIndex < 0) return balanced;
  if (balanced.length === 1) return [{ ...balanced[0], level: budget }];

  const maximum = budget - (balanced.length - 1);
  const nextLevel = Math.max(1, Math.min(maximum, Math.floor(requestedLevel) || 1));
  const delta = nextLevel - balanced[changedIndex].level;
  if (!delta) return balanced;

  const next = balanced.map((entry) => ({ ...entry }));
  next[changedIndex].level = nextLevel;

  if (delta > 0) {
    let needed = delta;
    const donorOrder = changedIndex === 0
      ? next.map((_, index) => index).filter((index) => index !== changedIndex).reverse()
      : [0, ...next.map((_, index) => index).filter((index) => index !== 0 && index !== changedIndex).reverse()];
    for (const index of donorOrder) {
      const donated = Math.min(needed, next[index].level - 1);
      if (donated <= 0) continue;
      next[index].level -= donated;
      needed -= donated;
      if (!needed) break;
    }
  } else {
    const receiverIndex = changedIndex === 0 ? 1 : 0;
    next[receiverIndex].level += Math.abs(delta);
  }

  return fitClassLevelsToBudget(next, budget, changedIndex === 0 ? next[1]?.id : next[0]?.id);
}

export function hasMixedClassEditions(entries: ClassLevelEntry[]) {
  return new Set(entries.map((entry) => entry.ruleset)).size > 1;
}

export function requirementLabel(classId: string) {
  const requirement = requirements[classId];
  if (!requirement) return "Sem requisito registrado";
  const all = requirement.all?.map((key) => `${abilityLabels[key]} 13`).join(" e ");
  const any = requirement.any?.map((key) => `${abilityLabels[key]} 13`).join(" ou ");
  return [all, any].filter(Boolean).join(" e ");
}

export function meetsClassRequirement(classId: string, scores: Record<AbilityKey, number>) {
  const requirement = requirements[classId];
  if (!requirement) return true;
  const meetsAll = requirement.all?.every((key) => scores[key] >= 13) ?? true;
  const meetsAny = requirement.any?.some((key) => scores[key] >= 13) ?? true;
  return meetsAll && meetsAny;
}

export function multiclassRequirementFailures(
  entries: ClassLevelEntry[],
  scores: Record<AbilityKey, number>,
) {
  if (entries.length < 2) return [];
  return entries
    .filter((entry) => !meetsClassRequirement(entry.classId, scores))
    .map((entry) => ({ classId: entry.classId, requirement: requirementLabel(entry.classId) }));
}

const fullCasters = new Set(["bard", "cleric", "druid", "sorcerer", "wizard"]);
const halfCasters = new Set(["paladin", "ranger"]);
const thirdCasterSubclasses = new Set([
  "eldritch-knight",
  "eldritch-knight-2014",
  "arcane-trickster",
  "arcane-trickster-2014",
]);

export function casterContribution(entry: ClassLevelEntry) {
  if (fullCasters.has(entry.classId)) return entry.level;
  if (halfCasters.has(entry.classId)) {
    return entry.ruleset === "2024" ? Math.ceil(entry.level / 2) : Math.floor(entry.level / 2);
  }
  if (["fighter", "rogue"].includes(entry.classId) && thirdCasterSubclasses.has(entry.subclassId)) {
    return Math.floor(entry.level / 3);
  }
  return 0;
}

export function combinedCasterLevel(entries: ClassLevelEntry[]) {
  return Math.min(20, entries.reduce((sum, entry) => sum + casterContribution(entry), 0));
}

export function isSpellcastingEntry(entry: ClassLevelEntry) {
  return entry.classId === "warlock" || casterContribution(entry) > 0;
}

export function normalizeClassLevelEntries(
  raw: unknown,
  fallback: { classId: string; subclassId: string; ruleset: Ruleset; level: number },
  validClassIds: ReadonlySet<string>,
): ClassLevelEntry[] {
  const parsed = Array.isArray(raw)
    ? raw.flatMap((candidate, index) => {
      if (!candidate || typeof candidate !== "object") return [];
      const entry = candidate as Partial<ClassLevelEntry>;
      if (!entry.classId || !validClassIds.has(entry.classId)) return [];
      return [{
        id: typeof entry.id === "string" && entry.id ? entry.id : `class-${index + 1}`,
        classId: entry.classId,
        subclassId: typeof entry.subclassId === "string" ? entry.subclassId : "",
        ruleset: entry.ruleset === "2014" ? "2014" as const : "2024" as const,
        level: Math.max(1, Math.min(20, Number(entry.level) || 1)),
      }];
    })
    : [];

  const unique = parsed.filter((entry, index) => parsed.findIndex((candidate) => candidate.classId === entry.classId) === index);
  if (unique.length) {
    let remaining = 20;
    return unique.slice(0, 12).flatMap((entry) => {
      if (remaining < 1) return [];
      const level = Math.min(entry.level, remaining);
      remaining -= level;
      return [{ ...entry, level }];
    });
  }
  if (!fallback.classId || !validClassIds.has(fallback.classId)) return [];
  return [{
    id: "class-primary",
    classId: fallback.classId,
    subclassId: fallback.subclassId,
    ruleset: fallback.ruleset,
    level: Math.max(1, Math.min(20, fallback.level)),
  }];
}
