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

export type ArenaEventChoice = {
  id: string;
  label: string;
  description: string;
  result: string;
  healing?: number;
  attack?: number;
  armor?: number;
};

export type ArenaEncounter = {
  id: string;
  kind: "combat" | "event" | "boss";
  name: string;
  description: string;
  glyph: string;
  hitPoints: number;
  attack: number;
  defense: number;
  choices?: ArenaEventChoice[];
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

export const arenaEncounters: ArenaEncounter[][] = [
  [
    { id: "crypt-sentinel", kind: "combat", name: "Sentinela sem Pulso", description: "Armaduras vazias se erguem quando seus passos quebram o silêncio.", glyph: "S", hitPoints: 16, attack: 4, defense: 0 },
    {
      id: "whispering-well", kind: "event", name: "Poço das Vozes", description: "O poço repete uma lembrança sua com uma palavra diferente.", glyph: "?", hitPoints: 0, attack: 0, defense: 0,
      choices: [
        { id: "listen", label: "Escutar até o fim", description: "Arrisque encarar a lembrança para recuperar o fôlego.", result: "A voz sabia onde a dor terminava. Você recuperou 20% dos PV.", healing: 20 },
        { id: "seal", label: "Selar o poço", description: "Transforme a dúvida em força para os próximos combates.", result: "O silêncio se fechou em volta da arma. Ataque +1 nesta expedição.", attack: 1 },
      ],
    },
    { id: "crowned-ossuary", kind: "boss", name: "Ossário Coroado", description: "Mil ossos se ajoelham para formar um único rei.", glyph: "O", hitPoints: 28, attack: 6, defense: 1 },
  ],
  [
    { id: "slag-hound", kind: "combat", name: "Sabueso de Escória", description: "A coisa fareja calor, não sangue, e você ainda está vivo demais.", glyph: "C", hitPoints: 22, attack: 6, defense: 1 },
    {
      id: "drowned-anvil", kind: "event", name: "Bigorna Afogada", description: "Metal ainda quente repousa sob uma lâmina de água negra.", glyph: "◇", hitPoints: 0, attack: 0, defense: 0,
      choices: [
        { id: "forge", label: "Reforjar a arma", description: "Aceite uma queimadura breve para golpear com mais força.", result: "A arma guardou o calor. Ataque +2 nesta expedição.", attack: 2 },
        { id: "temper", label: "Temperar a armadura", description: "Use a água escura para proteger os pontos frágeis.", result: "O metal se contraiu sem partir. Armadura +1 nesta expedição.", armor: 1 },
      ],
    },
    { id: "slag-colossus", kind: "boss", name: "Colosso de Escória", description: "Cada passo dele faz a forja lembrar que já foi um vulcão.", glyph: "F", hitPoints: 38, attack: 8, defense: 2 },
  ],
  [
    { id: "thorn-stalker", kind: "combat", name: "Espreitador de Espinhos", description: "Galhos se movem contra o vento, tentando cercar o caminho.", glyph: "E", hitPoints: 30, attack: 8, defense: 2 },
    {
      id: "moonless-clearing", kind: "event", name: "Clareira sem Lua", description: "Uma fogueira impossível espera por alguém que ainda não chegou.", glyph: "✦", hitPoints: 0, attack: 0, defense: 0,
      choices: [
        { id: "rest", label: "Descansar por um instante", description: "Recupere o corpo antes que a floresta mude de ideia.", result: "A chama não aqueceu, mas a exaustão cedeu. Você recuperou 30% dos PV.", healing: 30 },
        { id: "watch", label: "Vigiar a chama", description: "Troque descanso por uma leitura melhor dos próximos movimentos.", result: "Algo piscou entre as árvores. Ataque +1 e Armadura +1.", attack: 1, armor: 1 },
      ],
    },
    { id: "eclipse-stag", kind: "boss", name: "Cervo do Eclipse", description: "Os chifres carregam uma noite que não pertence a este céu.", glyph: "V", hitPoints: 48, attack: 10, defense: 3 },
  ],
  [
    { id: "unwritten-knight", kind: "combat", name: "Cavaleiro Não Escrito", description: "A armadura se completa apenas quando você tenta observá-la.", glyph: "N", hitPoints: 38, attack: 10, defense: 3 },
    {
      id: "last-door", kind: "event", name: "A Última Porta", description: "A fechadura aceita uma certeza ou uma dúvida, nunca ambas.", glyph: "∞", hitPoints: 0, attack: 0, defense: 0,
      choices: [
        { id: "certainty", label: "Oferecer uma certeza", description: "Diga o que você sabe fazer melhor e torne isso uma arma.", result: "A porta acreditou em você. Ataque +2.", attack: 2 },
        { id: "doubt", label: "Oferecer uma dúvida", description: "Admita o que pode dar errado e prepare-se para sobreviver.", result: "A porta reconheceu prudência. Armadura +2.", armor: 2 },
      ],
    },
    { id: "interval-king", kind: "boss", name: "Rei que Não Aconteceu", description: "Ele ergue a espada como quem se recorda de todas as suas derrotas.", glyph: "R", hitPoints: 62, attack: 12, defense: 4 },
  ],
];
