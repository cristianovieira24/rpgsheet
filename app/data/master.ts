import type { Ruleset } from "./legacy";

export type MasterNpc = {
  id: string;
  name: string;
  ruleset: Ruleset;
  level: number;
  species: string;
  className: string;
  classId: string;
  role: string;
  armorClass: number;
  hitPoints: number;
  attackBonus: number;
  saveDc: number | null;
  difficulty: "Aliado" | "Comum" | "Elite" | "Chefe";
  portrait: string;
  note: string;
};

export type ArenaReward = {
  id: string;
  name: string;
  description: string;
  classes: string[];
  attack: number;
  armor: number;
  healing: number;
};

const firstNames = [
  "Aldren", "Brunna", "Cael", "Dara", "Edrik", "Fara", "Garran", "Ilyra",
  "Joren", "Kaia", "Lucan", "Mira", "Nym", "Orin", "Petra", "Rurik",
];
const epithets = [
  "da Ponte Cinzenta", "Mão de Bronze", "do Véu", "Sete-Chaves",
  "da Lua Partida", "Sem-Bandeira", "de Pedra Fria", "Olhos de Âmbar",
];
const speciesByRules: Record<Ruleset, string[]> = {
  "2014": ["Humano", "Anão", "Elfo", "Halfling", "Meio-orc", "Tiefling", "Draconato"],
  "2024": ["Humano", "Anão", "Elfo", "Gnomo", "Golias", "Orc", "Tiefling", "Draconato"],
};
const classes = [
  { id: "barbarian", name: "Bárbaro", hitDie: 12, armor: 13, caster: false },
  { id: "bard", name: "Bardo", hitDie: 8, armor: 13, caster: true },
  { id: "cleric", name: "Clérigo", hitDie: 8, armor: 16, caster: true },
  { id: "druid", name: "Druida", hitDie: 8, armor: 14, caster: true },
  { id: "fighter", name: "Guerreiro", hitDie: 10, armor: 17, caster: false },
  { id: "monk", name: "Monge", hitDie: 8, armor: 15, caster: false },
  { id: "paladin", name: "Paladino", hitDie: 10, armor: 17, caster: true },
  { id: "ranger", name: "Patrulheiro", hitDie: 10, armor: 15, caster: true },
  { id: "rogue", name: "Ladino", hitDie: 8, armor: 14, caster: false },
  { id: "sorcerer", name: "Feiticeiro", hitDie: 6, armor: 12, caster: true },
  { id: "warlock", name: "Bruxo", hitDie: 8, armor: 13, caster: true },
  { id: "wizard", name: "Mago", hitDie: 6, armor: 12, caster: true },
];
const roles = [
  "Batedor desconfiado", "Mercenário em dívida", "Curandeira itinerante",
  "Erudito de ruínas", "Guarda desertor", "Informante bem relacionado",
  "Caçadora de monstros", "Rival honrado",
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const npcId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `npc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function generateNpc(level: number, ruleset: Ruleset): MasterNpc {
  const bounded = Math.max(1, Math.min(20, level));
  const difficulty = pick<MasterNpc["difficulty"]>(["Aliado", "Comum", "Elite", "Elite", "Chefe"]);
  const classEntry = pick(classes);
  const proficiency = 2 + Math.floor((bounded - 1) / 4);
  const primaryModifier = 3 + Math.floor((bounded - 1) / 8);
  const constitutionModifier = 2 + Math.floor((bounded - 1) / 10);
  const multiplier = difficulty === "Chefe" ? 1.65 : difficulty === "Elite" ? 1.3 : difficulty === "Aliado" ? .9 : 1;
  const armorClass = Math.min(22, classEntry.armor + Math.floor((bounded - 1) / 6) + (difficulty === "Chefe" ? 1 : 0));
  const averageHitDie = Math.floor(classEntry.hitDie / 2) + 1;
  const baseHitPoints = classEntry.hitDie + constitutionModifier + Math.max(0, bounded - 1) * (averageHitDie + constitutionModifier);
  const hitPoints = Math.max(1, Math.round(baseHitPoints * multiplier));
  return {
    id: npcId(),
    name: `${pick(firstNames)} ${pick(epithets)}`,
    ruleset,
    level: bounded,
    species: pick(speciesByRules[ruleset]),
    className: classEntry.name,
    classId: classEntry.id,
    role: pick(roles),
    armorClass,
    hitPoints,
    attackBonus: proficiency + primaryModifier + (difficulty === "Chefe" ? 1 : 0),
    saveDc: classEntry.caster ? 8 + proficiency + primaryModifier : null,
    difficulty,
    portrait: "",
    note: "Motivação: quer algo que o grupo pode oferecer, mas não revela o preço completo.",
  };
}

export const arenaRewards: ArenaReward[] = [
  { id: "arcane-lens", name: "Lente do Nono Círculo", description: "+2 de dano mágico nesta expedição.", classes: ["wizard", "sorcerer", "warlock", "bard"], attack: 2, armor: 0, healing: 0 },
  { id: "iron-oath", name: "Juramento de Ferro", description: "+2 de armadura nesta expedição.", classes: ["fighter", "paladin", "barbarian"], attack: 0, armor: 2, healing: 0 },
  { id: "silent-edge", name: "Fio Silencioso", description: "+2 de dano e iniciativa agressiva.", classes: ["rogue", "ranger", "monk"], attack: 2, armor: 0, healing: 0 },
  { id: "verdant-knot", name: "Nó Verdejante", description: "Recupere 10 PV e ganhe sustentação.", classes: ["druid", "cleric", "ranger"], attack: 0, armor: 0, healing: 10 },
  { id: "champion-mark", name: "Marca do Campeão", description: "+1 de dano para qualquer classe.", classes: [], attack: 1, armor: 0, healing: 0 },
  { id: "pilgrim-boots", name: "Botas do Peregrino", description: "+1 de armadura para qualquer classe.", classes: [], attack: 0, armor: 1, healing: 0 },
  { id: "phoenix-vial", name: "Frasco da Fênix", description: "Recupere 14 PV imediatamente.", classes: [], attack: 0, armor: 0, healing: 14 },
  { id: "loaded-fate", name: "Dado do Destino", description: "+1 de dano e +1 de armadura nesta expedição.", classes: [], attack: 1, armor: 1, healing: 0 },
];

export const arenaStages = [
  { name: "Cripta da Fome", boss: "Ossário Coroado", color: "violet" },
  { name: "Forja Afogada", boss: "Colosso de Escória", color: "ember" },
  { name: "Bosque sem Aurora", boss: "Cervo do Eclipse", color: "teal" },
  { name: "Trono do Intervalo", boss: "Rei que Não Aconteceu", color: "gold" },
];
