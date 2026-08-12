import type { AbilityKey } from "./rules";
import type { Ruleset } from "./legacy";

export type CustomFeature = {
  id: string;
  name: string;
  level: number;
  description: string;
};

export type CustomSpeciesState = {
  name: string;
  ruleset: Ruleset;
  legacy: boolean;
  size: "Pequeno" | "Médio" | "Pequeno ou Médio";
  speed: number;
  fixedBonuses: Record<AbilityKey, number>;
  flexibleBonusMode: "none" | "2+1" | "1+1+1";
  fixedLanguages: string[];
  languageChoices: number;
  skillChoices: number;
  selectedSkills: string[];
  features: CustomFeature[];
};

export type CustomClassState = {
  name: string;
  ruleset: Ruleset;
  hitDie: 6 | 8 | 10 | 12;
  primaryAbilities: AbilityKey[];
  savingThrows: AbilityKey[];
  skillChoices: number;
  spellcasting: "none" | "full" | "half" | "third" | "pact";
  spellAbility: AbilityKey | "";
  features: CustomFeature[];
};

export const defaultCustomSpecies: CustomSpeciesState = {
  name: "Minha espécie",
  ruleset: "2024",
  legacy: false,
  size: "Médio",
  speed: 9,
  fixedBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
  flexibleBonusMode: "none",
  fixedLanguages: ["Comum"],
  languageChoices: 2,
  skillChoices: 0,
  selectedSkills: [],
  features: [],
};

export const defaultCustomClass: CustomClassState = {
  name: "Minha classe",
  ruleset: "2024",
  hitDie: 8,
  primaryAbilities: [],
  savingThrows: [],
  skillChoices: 2,
  spellcasting: "none",
  spellAbility: "",
  features: [],
};
