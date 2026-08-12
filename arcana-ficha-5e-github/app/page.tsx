"use client";
/* eslint-disable @next/next/no-img-element */

import {
  Backpack,
  BookOpen,
  BookMarked,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Dices,
  Database,
  Download,
  Eye,
  FileUp,
  FolderPlus,
  Heart,
  Home,
  ImagePlus,
  LockKeyhole,
  Link2,
  Menu,
  Minus,
  Network,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Swords,
  Tag,
  Trash2,
  Upload,
  UserRound,
  Wand2,
  WandSparkles,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import spellsJson from "./data/spells.json";
import spellTranslationsJson from "./data/spell-translations.json";
import { supplementSpells } from "./data/supplement-spells";
import {
  abilities,
  backgrounds,
  classes,
  items,
  quickRules,
  skills,
  species,
  storyPrompts,
  type AbilityKey,
} from "./data/rules";
import {
  attackIcons,
  classProgressions,
  commonConditions,
  lineages,
  officialSpeciesCatalog,
  subclasses,
  type AccessKind,
} from "./data/progression";
import {
  backgroundFallbackPackage,
  classStartingEquipment,
  openBackgroundEquipment,
  type EquipmentOption,
} from "./data/creation";
import {
  legacyBackgrounds,
  legacyClassProgressions,
  legacyCoreSubclasses,
  legacyLineages,
  legacySpecies,
  legacySubclassLevel,
  originFeatDetails,
  type LegacyBackgroundDefinition,
  type Ruleset,
} from "./data/legacy";
import {
  automaticSpellcastingProfileId,
  cloneSpellcastingRows,
  spellcastingProfiles,
  type SpellcastingRow,
} from "./data/spellcasting";
import {
  classSpellAbilities,
  combinedCasterLevel,
  fitClassLevelsToBudget,
  hasMixedClassEditions,
  isSpellcastingEntry,
  multiclassRequirementFailures,
  normalizeClassLevelEntries,
  redistributeClassLevel,
  requirementLabel,
  totalClassLevels,
  type ClassLevelEntry,
} from "./data/multiclass";

type Section = "inicio" | "criador" | "ficha" | "progressao" | "magias" | "inventario" | "historia" | "quadro" | "biblioteca" | "regras";
type Theme = "medieval" | "highfantasy" | "darkfantasy" | "dyslexia";

type Spell = {
  id: string;
  name: string;
  level: number;
  school: string;
  classes: string[];
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  source: string;
  ptName?: string;
  access?: AccessKind;
  locked?: boolean;
  page?: number | null;
  save?: string | null;
  attack?: string | null;
  damageTypes?: string | null;
  dice?: string | null;
  conditions?: string | null;
  area?: string | null;
};

type InventoryEntry = { id: string; name: string; quantity: number; weight: number; detail: string; equipped: boolean; origin?: "class-start" | "background-start" };
type CoinState = { cp: number; sp: number; ep: number; gp: number; pp: number };
type AbilityIncreaseState = { mode: "2+1" | "1+1+1"; primary: AbilityKey; secondary: AbilityKey; tertiary: AbilityKey };
type SpeciesChoiceState = {
  skill: string;
  originFeat: string;
  spellAbility: AbilityKey | "";
  size: "Pequeno" | "Médio" | "";
};
type StoryState = {
  concept: string;
  origin: string;
  rupture: string;
  desire: string;
  fear: string;
  bond: string;
  flaw: string;
  ideal: string;
  trait: string;
  secret: string;
  openThread: string;
  fullBackstory: string;
};
type AppearanceState = { age: string; height: string; weight: string; eyes: string; hair: string; skin: string; build: string; marks: string };
type EffectState = { id: string; name: string; kind: "buff" | "debuff" | "condition"; detail: string };
type AttackState = { id: string; name: string; icon: string; quantity: number; die: number; modifier: number; detail: string };
type FeatureNote = { id: string; name: string; summary: string; source: string; access: AccessKind; origin: "classe" | "subclasse" | "espécie" | "personalizado"; baseKey?: string };
type BoardNode = { id: string; x: number; y: number; title: string; body: string; color: string; image?: string };
type BoardEdge = { from: string; to: string };
type BoardState = { id: string; name: string; nodes: BoardNode[]; edges: BoardEdge[] };
type ManualOverrides = {
  armorClass: number | null;
  initiative: number | null;
  speed: number | null;
  passivePerception: number | null;
  maxHp: number | null;
  proficiencyBonus: number | null;
  spellDc: number | null;
  spellAttack: number | null;
  skillBonuses: Record<string, number>;
  saveBonuses: Record<AbilityKey, number>;
};
type CloudCharacterRecord = { id: string; name: string; player: string; summary: string; level: number; createdAt: number; updatedAt: number };
type StaticCharacterRecord = CloudCharacterRecord & { data: string };

type CharacterState = {
  cloudId: string;
  ruleset: Ruleset;
  speciesRuleset: Ruleset;
  classRuleset: Ruleset;
  backgroundRuleset: Ruleset;
  name: string;
  player: string;
  pronouns: string;
  level: number;
  speciesId: string;
  lineageId: string;
  speciesChoices: SpeciesChoiceState;
  languages: string[];
  classId: string;
  subclassId: string;
  classLevels: ClassLevelEntry[];
  backgroundId: string;
  alignment: string;
  portrait: string;
  abilities: Record<AbilityKey, number>;
  abilityIncrease: AbilityIncreaseState;
  currentHp: number;
  tempHp: number;
  inspiration: boolean;
  proficientSkills: string[];
  selectedSpellIds: string[];
  spellcastingMode: "auto" | "manual";
  spellcastingProfileId: string;
  spellcastingRows: SpellcastingRow[];
  spellcastingAbility: AbilityKey | "";
  progressionNotes: Record<string, string>;
  inventory: InventoryEntry[];
  coins: CoinState;
  classEquipmentChoice: string;
  backgroundEquipmentChoice: string;
  classStartingGp: number;
  backgroundStartingGp: number;
  effects: EffectState[];
  attacks: AttackState[];
  featureNotes: FeatureNote[];
  appearance: AppearanceState;
  abilityMethod: "standard" | "pointbuy" | "roll" | "free";
  story: StoryState;
  notes: string;
  overrides: ManualOverrides;
};

type CharacterBundle = {
  version: number;
  character: CharacterState;
  customSpells: Spell[];
  boards: BoardState[];
  activeBoardId: string;
};

type ImportPreviewState = CharacterBundle & { fileName: string };

const defaultOverrides: ManualOverrides = {
  armorClass: null,
  initiative: null,
  speed: null,
  passivePerception: null,
  maxHp: null,
  proficiencyBonus: null,
  spellDc: null,
  spellAttack: null,
  skillBonuses: {},
  saveBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
};

const defaultBoards: BoardState[] = [{
  id: "board-main",
  name: "Personagem",
  nodes: [
    { id: "seed-1", x: 110, y: 120, title: "Conceito central", body: "Cole aqui a ideia que sustenta o personagem.", color: "violet" },
    { id: "seed-2", x: 480, y: 290, title: "Ponta solta", body: "Algo que o mestre pode desenvolver.", color: "gold" },
  ],
  edges: [{ from: "seed-1", to: "seed-2" }],
}];

const defaultCharacter: CharacterState = {
  cloudId: "",
  ruleset: "2024",
  speciesRuleset: "2024",
  classRuleset: "2024",
  backgroundRuleset: "2024",
  name: "",
  player: "",
  pronouns: "",
  level: 1,
  speciesId: "",
  lineageId: "",
  speciesChoices: { skill: "", originFeat: "", spellAbility: "", size: "" },
  languages: ["", ""],
  classId: "",
  subclassId: "",
  classLevels: [],
  backgroundId: "",
  alignment: "Neutro",
  portrait: "",
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  abilityIncrease: { mode: "2+1", primary: "str", secondary: "dex", tertiary: "con" },
  currentHp: 0,
  tempHp: 0,
  inspiration: false,
  proficientSkills: [],
  selectedSpellIds: [],
  spellcastingMode: "auto",
  spellcastingProfileId: "none",
  spellcastingRows: [],
  spellcastingAbility: "",
  progressionNotes: {},
  inventory: [],
  coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  classEquipmentChoice: "",
  backgroundEquipmentChoice: "",
  classStartingGp: 0,
  backgroundStartingGp: 0,
  effects: [],
  attacks: [],
  featureNotes: [],
  appearance: { age: "", height: "", weight: "", eyes: "", hair: "", skin: "", build: "", marks: "" },
  abilityMethod: "standard",
  story: { concept: "", origin: "", rupture: "", desire: "", fear: "", bond: "", flaw: "", ideal: "", trait: "", secret: "", openThread: "", fullBackstory: "" },
  notes: "",
  overrides: defaultOverrides,
};

const themeOptions: Array<{ id: Theme; name: string; note: string; swatches: string[] }> = [
  { id: "medieval", name: "Medieval", note: "Pergaminho, tinta e bronze", swatches: ["#e8ddc5", "#6f5134", "#a4773e"] },
  { id: "highfantasy", name: "Alta Fantasia", note: "Safira, marfim e luz arcana", swatches: ["#eef4ff", "#315da8", "#d4a94e"] },
  { id: "darkfantasy", name: "Fantasia Sombria", note: "Gótico, vinho e prata", swatches: ["#171418", "#742e49", "#b8a6b5"] },
  { id: "dyslexia", name: "Leitura confortável", note: "Alto contraste e ritmo amplo", swatches: ["#fffdf4", "#16425b", "#f3b61f"] },
];

const navItems: Array<{ id: Section; label: string; icon: typeof Home }> = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "criador", label: "Criador", icon: WandSparkles },
  { id: "ficha", label: "Ficha", icon: UserRound },
  { id: "progressao", label: "Progressão", icon: Sparkles },
  { id: "magias", label: "Magias", icon: BookOpen },
  { id: "inventario", label: "Inventário", icon: Backpack },
  { id: "historia", label: "História", icon: Wand2 },
  { id: "quadro", label: "Quadro", icon: Network },
  { id: "biblioteca", label: "Banco de fichas", icon: Database },
  { id: "regras", label: "Regras", icon: CircleHelp },
];

const schoolPt: Record<string, string> = {
  Abjuration: "Abjuração",
  Conjuration: "Conjuração",
  Divination: "Adivinhação",
  Enchantment: "Encantamento",
  Evocation: "Evocação",
  Illusion: "Ilusão",
  Necromancy: "Necromancia",
  Transmutation: "Transmutação",
};

const classIdToEnglish: Record<string, string> = {
  barbarian: "Barbarian", bard: "Bard", cleric: "Cleric", druid: "Druid", fighter: "Fighter", monk: "Monk",
  paladin: "Paladin", ranger: "Ranger", rogue: "Rogue", sorcerer: "Sorcerer", warlock: "Warlock", wizard: "Wizard",
};

const classPt: Record<string, string> = {
  Barbarian: "Bárbaro", Bard: "Bardo", Cleric: "Clérigo", Druid: "Druida", Fighter: "Guerreiro", Monk: "Monge",
  Paladin: "Paladino", Ranger: "Patrulheiro", Rogue: "Ladino", Sorcerer: "Feiticeiro", Warlock: "Bruxo", Wizard: "Mago",
};

const spellTranslations = spellTranslationsJson as Record<string, { name: string; description: string }>;

function spellPt(spell: Spell) {
  const translated = spellTranslations[spell.id];
  return {
    name: spell.ptName || translated?.name || spell.name,
    description: translated?.description || spell.description,
  };
}

function localizeSpellFact(value: string) {
  return value
    .replace(/^Action\b/, "Ação")
    .replace(/^Bonus Action\b/, "Ação Bônus")
    .replace(/^Reaction\b/, "Reação")
    .replace(/^Touch$/, "Toque")
    .replace(/^Self$/, "Pessoal")
    .replace(/^Sight$/, "À vista")
    .replace(/^Special$/, "Especial")
    .replace(/^Unlimited$/, "Ilimitado")
    .replace(/^Instantaneous$/, "Instantânea")
    .replace(/^Until dispelled$/, "Até ser dissipada")
    .replace(/^Until dispelled or triggered$/, "Até ser dissipada ou acionada")
    .replace(/^Concentration,? up to /, "Concentração, até ")
    .replace(/^Up to /, "Até ")
    .replace(/\bfeet\b/g, "metros")
    .replace(/\bfoot\b/g, "metro")
    .replace(/\bmiles\b/g, "milhas")
    .replace(/\bmile\b/g, "milha")
    .replace(/\bminutes\b/g, "minutos")
    .replace(/\bminute\b/g, "minuto")
    .replace(/\bhours\b/g, "horas")
    .replace(/\bhour\b/g, "hora")
    .replace(/\bdays\b/g, "dias")
    .replace(/\bday\b/g, "dia")
    .replace(/\brounds\b/g, "rodadas")
    .replace(/\bround\b/g, "rodada")
    .replace(/ or Ritual\b/g, " ou Ritual");
}

const SOURCE_SHORT_NAMES: Array<[string, string]> = [
  ["SRD 5.2.1", "SRD 5.2.1"],
  ["Livro do Jogador 2024", "PHB 2024"],
  ["Livro do Jogador 2014", "PHB 2014"],
  ["SRD 5.1", "SRD 5.1"],
  ["Dungeon Master's Guide 2024", "DMG 2024"],
  ["Xanathar's Guide to Everything", "XGtE"],
  ["Tasha's Cauldron of Everything", "TCoE"],
  ["Fizban's Treasury of Dragons", "FToD"],
  ["Strixhaven: A Curriculum of Chaos", "SCC"],
  ["Mordenkainen Presents: Monsters of the Multiverse", "MPMotM"],
  ["Van Richten's Guide to Ravenloft", "VRGtR"],
  ["Spelljammer: Adventures in Space", "SAiS"],
  ["Eberron: Rising from the Last War", "ERftLW"],
  ["Guildmasters' Guide to Ravnica", "GGR"],
  ["Explorer's Guide to Wildemount", "EGtW"],
  ["Sword Coast Adventurer's Guide", "SCAG"],
  ["Mythic Odysseys of Theros", "MOoT"],
  ["Dragonlance: Shadow of the Dragon Queen", "DSotDQ"],
  ["Bigby Presents: Glory of the Giants", "BPGotG"],
  ["The Wild Beyond the Witchlight", "WBtW"],
  ["Volo's Guide to Monsters", "VGtM"],
];

const ORIGIN_FEATS_2024 = [
  "Alerta",
  "Artesão",
  "Brigão de Taverna",
  "Curandeiro",
  "Habilidoso",
  "Iniciado em Magia (Clérigo)",
  "Iniciado em Magia (Druida)",
  "Iniciado em Magia (Mago)",
  "Músico",
  "Resistente",
  "Sortudo",
  "Atacante Selvagem",
] as const;

const STANDARD_LANGUAGES_2024 = [
  "Linguagem de Sinais Comum",
  "Dracônico",
  "Anão",
  "Élfico",
  "Gigante",
  "Gnômico",
  "Goblin",
  "Halfling",
  "Orc",
] as const;

const SPECIES_WITH_SIZE_CHOICE = new Set(["aasimar", "human", "tiefling"]);
const SPECIES_WITH_SPELL_ABILITY = new Set(["elf", "gnome", "tiefling"]);
const SPECIES_WITH_SKILL_CHOICE = new Set(["elf", "human"]);

function sourceShort(source: string) {
  return SOURCE_SHORT_NAMES.find(([full]) => source.includes(full))?.[1] ?? source;
}

const TRAIT_DETAILS: Record<string, string> = {
  "Resistência Celestial": "Você possui resistência a dano necrótico e a dano radiante.",
  "Mãos Curativas": "Como uma ação, toque uma criatura e role uma quantidade de d4 igual ao seu bônus de proficiência. O alvo recupera o total rolado em Pontos de Vida. Você recupera o uso após um Descanso Longo.",
  "Portador da Luz": "Você conhece o truque Luz e usa Carisma como atributo de conjuração para ele.",
  "Revelação Celestial no nível 3": "No nível 3, uma vez por Descanso Longo, você pode manifestar uma revelação celestial por 1 minuto. Ao ativá-la, escolhe Asas Celestiais, Radiância Interior ou Manto Necrótico; essa escolha não é uma sub-raça permanente.",
  "Ancestralidade Dracônica": "Escolha um ancestral entre dez tipos de dragão. A escolha define o dano do Sopro de Dragão e da Resistência a Dano: ácido, elétrico, fogo, frio ou veneno.",
  "Sopro de Dragão": "Ao realizar a ação Atacar, substitua um ataque por um cone de 4,5 m ou uma linha de 9 m por 1,5 m, escolhidos a cada uso. A salvaguarda é de Destreza contra CD 8 + Constituição + proficiência. O dano é 1d10 nos níveis 1–4, 2d10 nos 5–10, 3d10 nos 11–16 e 4d10 nos 17–20; usos iguais à proficiência por Descanso Longo.",
  "Voo Dracônico no nível 5": "A partir do nível 5, como Ação Bônus, manifeste asas espectrais por 10 minutos e receba deslocamento de voo igual ao seu deslocamento. Um uso por Descanso Longo.",
  "Sopro Cromático": "Você exala a energia de sua ancestralidade cromática em uma área. A salvaguarda, o tipo de dano e a quantidade de usos seguem sua herança e seu bônus de proficiência.",
  "Sopro Metálico": "Você exala energia ligada à sua ancestralidade metálica. Além do sopro destrutivo, níveis posteriores liberam uma exalação de controle.",
  "Sopro de Gema": "Você exala a energia incomum de sua ancestralidade de gema. O tipo de dano depende da gema escolhida e a potência cresce com seu nível.",
  "Resistência a dano": "Você possui resistência ao tipo de dano ligado à ancestralidade escolhida e sofre metade desse dano depois dos modificadores aplicáveis.",
  "Resistência Elemental": "Você possui resistência ao tipo de dano associado à ancestralidade escolhida.",
  "Visão no Escuro": "Você enxerga em luz fraca como se fosse luz plena e, na escuridão, como se fosse luz fraca; sem luz, percebe apenas tons de cinza.",
  "Visão no Escuro 36 m": "Sua visão no escuro alcança 36 metros: luz fraca conta como luz plena e escuridão como luz fraca, apenas em tons de cinza.",
  "Visão no Escuro Superior": "Sua visão no escuro alcança uma distância maior que a comum, seguindo as mesmas limitações de cor e iluminação.",
  "Voo": "Você possui deslocamento de voo. Restrições de armadura ou anatomia específicas da espécie continuam valendo quando indicadas pela fonte.",
  "Anfíbio": "Você pode respirar tanto ar quanto água.",
  "Natação": "Você possui deslocamento de natação e se move na água sem pagar o custo adicional normal de nadar.",
  "Transe": "Você não precisa dormir, magia não pode fazê-lo dormir e um Descanso Longo pode ser concluído em 4 horas de meditação consciente.",
  "Ancestralidade Feérica": "Você tem vantagem em salvaguardas para evitar ou encerrar a condição Enfeitiçado.",
  "Sentidos Aguçados": "Escolha Intuição, Percepção ou Sobrevivência. Você recebe proficiência na perícia escolhida.",
  "Astúcia Gnômica": "Você tem vantagem em salvaguardas de Inteligência, Sabedoria e Carisma.",
  "Ancestralidade Gigante": "Escolha uma dádiva de gigante. Ela pode ser usada uma quantidade de vezes igual ao bônus de proficiência, recuperando todos os usos após um Descanso Longo.",
  "Forma Grande no nível 5": "A partir do nível 5, como Ação Bônus e se houver espaço, torne-se Grande por 10 minutos. Nesse período, tem vantagem em testes de Força e +3 m de deslocamento. Um uso por Descanso Longo.",
  "Compleição Poderosa": "Você tem vantagem em testes para encerrar a condição Agarrado e conta como uma categoria de tamanho maior ao determinar capacidade de carga.",
  "Resiliência Anã": "Você possui resistência a dano de veneno e vantagem em salvaguardas para evitar ou encerrar a condição Envenenado.",
  "Tenacidade Anã": "Seu máximo de Pontos de Vida aumenta em 1 agora e novamente em 1 sempre que você ganha um nível. A ficha aplica esse bônus automaticamente.",
  "Conhecimento da Pedra": "Como ação bônus, enquanto toca pedra, você recebe Percepção às Cegas por tremores em 18 metros durante 10 minutos. Usos iguais ao bônus de proficiência por Descanso Longo.",
  "Engenhoso": "Você recebe Inspiração Heroica sempre que termina um Descanso Longo.",
  "Habilidoso": "Escolha uma perícia. Você recebe proficiência nela; a escolha feita no criador é aplicada automaticamente à ficha.",
  "Versátil": "Escolha um Talento de Origem adicional. Este benefício substitui as antigas variantes humanas de 2014; ele não concede +1 em todos os atributos.",
  "Bravura": "Você tem vantagem em salvaguardas para evitar ou encerrar a condição Amedrontado.",
  "Agilidade Halfling": "Você pode atravessar o espaço de uma criatura de tamanho maior que o seu, mas não pode terminar o movimento nesse espaço.",
  "Sorte": "Quando obtiver 1 no d20 de um Teste de d20, role novamente e use o novo resultado.",
  "Furtividade Natural": "Você pode usar a ação Esconder-se mesmo quando estiver obscurecido apenas por uma criatura de tamanho maior que o seu.",
  "Ímpeto de Adrenalina": "Use Disparada como Ação Bônus e receba PV temporários iguais à proficiência. Usos iguais à proficiência, recuperados após Descanso Curto ou Longo.",
  "Resistência Implacável": "Quando cair a 0 PV sem morrer instantaneamente, fique com 1 PV. Um uso por Descanso Longo.",
  "Linhagem Élfica": "Escolha Drow, Alto Elfo ou Elfo Silvestre. A linhagem concede um benefício no nível 1 e magias adicionais nos níveis 3 e 5; escolha Inteligência, Sabedoria ou Carisma para conjurá-las.",
  "Linhagem Gnômica": "Escolha Gnomo da Floresta ou Gnomo das Rochas e defina Inteligência, Sabedoria ou Carisma como atributo das magias concedidas.",
  "Legado Sobrenatural": "Escolha o legado Abissal, Ctônico ou Infernal. Ele concede resistência e magia nos níveis 1, 3 e 5; escolha Inteligência, Sabedoria ou Carisma para essas magias.",
  "Presença Extraplanar": "Você conhece o truque Taumaturgia e usa o mesmo atributo de conjuração escolhido para seu Legado Sobrenatural.",
  "Armadura Natural": "Seu corpo fornece uma fórmula própria de Classe de Armadura quando você não usa outra armadura; escudos ainda podem ser aplicados quando permitidos.",
  "Resistência à Magia": "Você recebe vantagem nas salvaguardas contra magias, dentro das limitações descritas pela característica.",
  "Natureza Imortal": "Sua fisiologia reduz necessidades comuns como respirar, comer, beber ou dormir. Os efeitos exatos dependem da linhagem escolhida.",
  "Tipo Feérico": "Seu tipo de criatura é Feérico, o que altera a forma como algumas magias e efeitos interagem com você.",
  "Telepatia Psiônica": "Você envia mensagens mentais a criaturas próximas dentro do alcance da característica; a comunicação não exige que o alvo responda telepaticamente.",
};

function traitDetail(name: string, speciesName: string, speciesSummary: string) {
  if (TRAIT_DETAILS[name]) return TRAIT_DETAILS[name];
  if (/resistência.*fogo/i.test(name)) return "Você possui resistência a dano de fogo e sofre metade desse tipo de dano depois dos demais modificadores.";
  if (/resistência.*frio/i.test(name)) return "Você possui resistência a dano de frio e sofre metade desse tipo de dano depois dos demais modificadores.";
  if (/resistência.*ácido/i.test(name)) return "Você possui resistência a dano de ácido e sofre metade desse tipo de dano depois dos demais modificadores.";
  if (/resistência.*el[eé]tric/i.test(name)) return "Você possui resistência a dano elétrico e sofre metade desse tipo de dano depois dos demais modificadores.";
  if (/resistência.*psíquic/i.test(name)) return "Você possui resistência a dano psíquico e sofre metade desse tipo de dano depois dos demais modificadores.";
  if (/resistência.*necrótic/i.test(name)) return "Você possui resistência a dano necrótico e sofre metade desse tipo de dano depois dos demais modificadores.";
  if (/resistência.*veneno|resiliência a veneno/i.test(name)) return "Você é especialmente resistente a veneno; a característica melhora suas salvaguardas e/ou reduz o dano de veneno recebido.";
  if (/garras|chifres|mordida/i.test(name)) return "Você possui uma arma natural. Ela usa as regras de ataque corpo a corpo e o dado, o atributo e qualquer efeito adicional indicados pela característica.";
  if (/magia|conjura/i.test(name)) return "Esta característica concede magias inatas em níveis definidos. Ela informa o atributo de conjuração, a frequência de uso e se componentes materiais são necessários.";
  if (/telepatia|ligação mental/i.test(name)) return "Você consegue estabelecer comunicação mental dentro do alcance da característica; idioma, resposta e duração seguem as limitações dessa habilidade.";
  if (/passo|salto|agilidade|deslizar|escalada|caminhada/i.test(name)) return "Esta característica altera seu deslocamento ou permite um movimento especial. Abra a fonte da espécie para conferir alcance, usos e gatilhos exatos registrados na mesa.";
  return `${name} é um traço de ${speciesName}. ${speciesSummary} Na ficha, você pode editar esta descrição para registrar usos, CD, dados e decisões específicas da sua mesa.`;
}

function featureDetail(name: string, summary: string) {
  if (name === "Melhoria de Atributo") return "Ao receber esta característica, aumente um atributo em 2 ou dois atributos em 1, respeitando o limite da opção usada pela mesa. Quando a campanha permitir talentos no lugar do aumento, você pode escolher um talento para o qual cumpra os pré-requisitos.";
  if (name === "Conjuração") return "A característica define o atributo de conjuração, as magias conhecidas ou preparadas, a quantidade de espaços e a forma de usar um foco. A CD é 8 + proficiência + modificador do atributo; o ataque mágico usa proficiência + o mesmo modificador.";
  return summary;
}

function modifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : String(value);
}

function proficiency(level: number) {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}

function pointCost(value: number) {
  const costs: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  return costs[value] ?? 99;
}

const requiredLineageSpecies = new Set([
  "dragonborn", "elf", "gnome", "goliath", "tiefling",
]);

const currentLineages = lineages.filter((entry) => entry.source === "SRD 5.2.1" || entry.source === "Livro do Jogador 2024");
const currentSubclasses = subclasses.filter((entry) => entry.source === "SRD 5.2.1" || entry.source === "Livro do Jogador 2024");
const classicSupplementLineages = lineages.filter((entry) => entry.source !== "SRD 5.2.1" && entry.source !== "Livro do Jogador 2024");
const classicSupplementSubclasses = subclasses.filter((entry) => !["SRD 5.2.1", "Livro do Jogador 2024", "Livro do Jogador 2014"].includes(entry.source) && entry.classId !== "artificer");
const classicSupplementSpecies = officialSpeciesCatalog
  .filter((entry) => !legacySpecies.some((legacy) => legacy.id === entry.id))
  .map((entry) => ({ ...entry, abilityBonuses: {}, flexibleAbilities: "plus-two-plus-one" as const, access: "official" as AccessKind, supplement: true }));

function normalizeCharacterData(raw: Partial<CharacterState>): CharacterState {
  const ruleset: Ruleset = raw.ruleset === "2014" ? "2014" : "2024";
  const speciesRuleset: Ruleset = raw.speciesRuleset === "2014" ? "2014" : raw.speciesRuleset === "2024" ? "2024" : ruleset;
  const fallbackClassRuleset: Ruleset = raw.classRuleset === "2014" ? "2014" : raw.classRuleset === "2024" ? "2024" : ruleset;
  const backgroundRuleset: Ruleset = raw.backgroundRuleset === "2014" ? "2014" : raw.backgroundRuleset === "2024" ? "2024" : ruleset;
  const fallbackClassId = classes.some((entry) => entry.id === raw.classId) ? raw.classId ?? "" : "";
  const classLevels = normalizeClassLevelEntries(raw.classLevels, {
    classId: fallbackClassId,
    subclassId: raw.subclassId ?? "",
    ruleset: fallbackClassRuleset,
    level: raw.level ?? 1,
  }, new Set(classes.map((entry) => entry.id)));
  const normalizedClassLevels = classLevels.map((entry) => {
    const pool = entry.ruleset === "2024" ? currentSubclasses : [...legacyCoreSubclasses, ...classicSupplementSubclasses];
    return {
      ...entry,
      subclassId: pool.some((subclass) => subclass.classId === entry.classId && subclass.id === entry.subclassId) ? entry.subclassId : "",
    };
  });
  const primaryClass = normalizedClassLevels[0];
  const classRuleset = primaryClass?.ruleset ?? fallbackClassRuleset;
  const classId = primaryClass?.classId ?? fallbackClassId;
  const speciesPool = speciesRuleset === "2024" ? species : [...legacySpecies, ...classicSupplementSpecies];
  const backgroundPool = backgroundRuleset === "2024" ? backgrounds : legacyBackgrounds;
  const lineagePool = speciesRuleset === "2024" ? currentLineages : [...legacyLineages, ...classicSupplementLineages];
  const subclassPool = classRuleset === "2024" ? currentSubclasses : [...legacyCoreSubclasses, ...classicSupplementSubclasses];
  const speciesId = speciesPool.some((entry) => entry.id === raw.speciesId) ? raw.speciesId ?? "" : "";
  const backgroundId = backgroundPool.some((entry) => entry.id === raw.backgroundId) ? raw.backgroundId ?? "" : "";
  const lineageId = lineagePool.some((entry) => entry.speciesId === speciesId && entry.id === raw.lineageId) ? raw.lineageId ?? "" : "";
  const subclassId = primaryClass?.subclassId ?? (subclassPool.some((entry) => entry.classId === classId && entry.id === raw.subclassId) ? raw.subclassId ?? "" : "");
  return {
    ...defaultCharacter,
    ...raw,
    cloudId: typeof raw.cloudId === "string" ? raw.cloudId : "",
    ruleset,
    speciesRuleset,
    classRuleset,
    backgroundRuleset,
    classId,
    level: normalizedClassLevels.length ? totalClassLevels(normalizedClassLevels) : Math.max(1, Math.min(20, raw.level ?? 1)),
    classLevels: normalizedClassLevels,
    speciesId,
    backgroundId,
    lineageId,
    subclassId,
    speciesChoices: { ...defaultCharacter.speciesChoices, ...(raw.speciesChoices ?? {}) },
    languages: Array.isArray(raw.languages)
      ? [raw.languages[0] ?? "", raw.languages[1] ?? ""]
      : ["", ""],
    abilityIncrease: { ...defaultCharacter.abilityIncrease, ...(raw.abilityIncrease ?? {}) },
    coins: { ...defaultCharacter.coins, ...(raw.coins ?? {}) },
    story: { ...defaultCharacter.story, ...(raw.story ?? {}) },
    appearance: { ...defaultCharacter.appearance, ...(raw.appearance ?? {}) },
    effects: Array.isArray(raw.effects) ? raw.effects : [],
    attacks: Array.isArray(raw.attacks) ? raw.attacks : [],
    featureNotes: Array.isArray(raw.featureNotes) ? raw.featureNotes : [],
    spellcastingMode: raw.spellcastingMode === "manual" ? "manual" : "auto",
    spellcastingProfileId: typeof raw.spellcastingProfileId === "string" ? raw.spellcastingProfileId : "none",
    spellcastingRows: Array.isArray(raw.spellcastingRows) ? raw.spellcastingRows : [],
    spellcastingAbility: ["str", "dex", "con", "int", "wis", "cha"].includes(raw.spellcastingAbility ?? "") ? raw.spellcastingAbility ?? "" : "",
    progressionNotes: raw.progressionNotes && typeof raw.progressionNotes === "object" ? raw.progressionNotes : {},
    overrides: {
      ...defaultOverrides,
      ...(raw.overrides ?? {}),
      skillBonuses: raw.overrides?.skillBonuses ?? {},
      saveBonuses: { ...defaultOverrides.saveBonuses, ...(raw.overrides?.saveBonuses ?? {}) },
    },
  };
}

function normalizeCharacterBundle(payload: unknown): CharacterBundle {
  if (!payload || typeof payload !== "object") throw new Error("Arquivo vazio");
  const candidate = payload as Partial<CharacterBundle> & Partial<CharacterState> & { board?: { nodes?: BoardNode[]; edges?: BoardEdge[] } };
  const rawCharacter = candidate.character ?? candidate;
  if (!rawCharacter || typeof rawCharacter !== "object" || (!Object.hasOwn(rawCharacter, "name") && !Object.hasOwn(rawCharacter, "abilities"))) {
    throw new Error("Personagem ausente");
  }
  const normalizedCharacter = { ...normalizeCharacterData(rawCharacter), cloudId: "" };
  let normalizedBoards = Array.isArray(candidate.boards) && candidate.boards.length ? candidate.boards : defaultBoards;
  if ((!Array.isArray(candidate.boards) || !candidate.boards.length) && candidate.board) {
    normalizedBoards = [{ id: "board-main", name: "Personagem", nodes: candidate.board.nodes ?? [], edges: candidate.board.edges ?? [] }];
  }
  const activeBoardId = normalizedBoards.some((board) => board.id === candidate.activeBoardId)
    ? candidate.activeBoardId as string
    : normalizedBoards[0].id;
  return {
    version: typeof candidate.version === "number" ? candidate.version : 1,
    character: normalizedCharacter,
    customSpells: Array.isArray(candidate.customSpells) ? candidate.customSpells : [],
    boards: normalizedBoards,
    activeBoardId,
  };
}

function characterSummary(snapshot: CharacterState) {
  const speciesPool = snapshot.speciesRuleset === "2024" ? species : [...legacySpecies, ...classicSupplementSpecies];
  const classSummary = snapshot.classLevels.length
    ? snapshot.classLevels.map((entry) => `${classes.find((candidate) => candidate.id === entry.classId)?.name ?? entry.classId} ${entry.level}`).join(" / ")
    : classes.find((entry) => entry.id === snapshot.classId)?.name;
  return [
    speciesPool.find((entry) => entry.id === snapshot.speciesId)?.name,
    classSummary,
  ].filter(Boolean).join(" · ");
}

const STATIC_CHARACTER_STORAGE = "arcana-github-characters-v1";

function usesStaticCharacterStorage() {
  return typeof window !== "undefined" && window.location.hostname.endsWith("github.io");
}

function readStaticCharacterRecords(): StaticCharacterRecord[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STATIC_CHARACTER_STORAGE) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeStaticCharacterRecords(records: StaticCharacterRecord[]) {
  localStorage.setItem(STATIC_CHARACTER_STORAGE, JSON.stringify(records));
}

function featureScaling(name: string, classId: string, ruleset: Ruleset = "2024") {
  if (/Inspiração (de )?Bardo/i.test(name)) return [
    ["Níveis 1–4", "d6"], ["Níveis 5–9", "d8"], ["Níveis 10–14", "d10"], ["Níveis 15–20", "d12"],
  ];
  if (name === "Ataque Furtivo" || (classId === "rogue" && /Ataque Furtivo/i.test(name))) return [
    ["Nível 1", "1d6"], ["Nível 3", "2d6"], ["Nível 5", "3d6"], ["Nível 7", "4d6"], ["Nível 9", "5d6"],
    ["Nível 11", "6d6"], ["Nível 13", "7d6"], ["Nível 15", "8d6"], ["Nível 17", "9d6"], ["Nível 19", "10d6"],
  ];
  if (name === "Fúria") return [["Níveis 1–8", "+2 de dano"], ["Níveis 9–15", "+3 de dano"], ["Níveis 16–20", "+4 de dano"]];
  if (name === "Artes Marciais") return ruleset === "2014"
    ? [["Níveis 1–4", "d4"], ["Níveis 5–10", "d6"], ["Níveis 11–16", "d8"], ["Níveis 17–20", "d10"]]
    : [["Níveis 1–4", "d6"], ["Níveis 5–10", "d8"], ["Níveis 11–16", "d10"], ["Níveis 17–20", "d12"]];
  if (/Sopro (de Dragão|Cromático|Metálico|de Gema)/i.test(name)) return [["Níveis 1–4", "1d10"], ["Níveis 5–10", "2d10"], ["Níveis 11–16", "3d10"], ["Níveis 17–20", "4d10"]];
  return null;
}

function cantripScaling(spell: Spell) {
  if (spell.level !== 0) return null;
  if (/Toll the Dead|Dobrar os Sinos|Toque Fúnebre/i.test(`${spell.name} ${spell.ptName ?? ""}`)) return [
    ["Níveis 1–4", "1d8; 1d12 se o alvo já perdeu PV"],
    ["Níveis 5–10", "2d8; 2d12 se o alvo já perdeu PV"],
    ["Níveis 11–16", "3d8; 3d12 se o alvo já perdeu PV"],
    ["Níveis 17–20", "4d8; 4d12 se o alvo já perdeu PV"],
  ];
  if (!spell.dice) return null;
  const dice = (spell.dice ?? "").split(/[;,/]/).map((value) => value.trim()).filter((value) => /^\d+d\d+/i.test(value));
  if (dice.length >= 4) return [["Níveis 1–4", dice[0]], ["Níveis 5–10", dice[1]], ["Níveis 11–16", dice[2]], ["Níveis 17–20", dice[3]]];
  return [["Níveis 1–4", "dano base"], ["Nível 5", "+1 dado"], ["Nível 11", "+1 dado"], ["Nível 17", "+1 dado"]];
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function IconButton({ label, children, onClick, active = false }: { label: string; children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return <button className={`icon-button ${active ? "active" : ""}`} aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function EmptyState({ icon: Icon, title, body, action, onAction }: { icon: typeof Sparkles; title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-rune"><Icon size={28} /></div>
      <h3>{title}</h3>
      <p>{body}</p>
      <button className="primary-button" onClick={onAction}>{action}<ChevronRight size={17} /></button>
    </div>
  );
}

export default function HomePage() {
  const [section, setSection] = useState<Section>("inicio");
  const [theme, setTheme] = useState<Theme>("medieval");
  const [character, setCharacter] = useState<CharacterState>(defaultCharacter);
  const [builderStep, setBuilderStep] = useState(0);
  const [themeOpen, setThemeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [savePulse, setSavePulse] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fontScale, setFontScale] = useState(100);

  const [spellSearch, setSpellSearch] = useState("");
  const [spellLevel, setSpellLevel] = useState("all");
  const [spellSchool, setSpellSchool] = useState("all");
  const [spellClass, setSpellClass] = useState("all");
  const [spellSource, setSpellSource] = useState("all");
  const [activeSpell, setActiveSpell] = useState<Spell | null>(null);
  const [customSpells, setCustomSpells] = useState<Spell[]>([]);
  const [customSpellOpen, setCustomSpellOpen] = useState(false);
  const [sheetEditOpen, setSheetEditOpen] = useState(false);

  const [inventorySearch, setInventorySearch] = useState("");
  const [storyPrompt, setStoryPrompt] = useState(storyPrompts[0]);

  const [diceOpen, setDiceOpen] = useState(true);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceSides, setDiceSides] = useState(20);
  const [diceCount, setDiceCount] = useState(1);
  const [diceModifier, setDiceModifier] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState<Array<{ expression: string; result: number }>>([]);
  const [ruleCategory, setRuleCategory] = useState("Todas");
  const [activeFeature, setActiveFeature] = useState<{ name: string; summary: string; source: string; level: number; unlocked: boolean; access: AccessKind } | null>(null);
  const [featureEditor, setFeatureEditor] = useState<FeatureNote | null>(null);
  const [selectedProgressionLevel, setSelectedProgressionLevel] = useState(1);
  const [progressionClassEntryId, setProgressionClassEntryId] = useState("");
  const [multiclassDraftClassId, setMulticlassDraftClassId] = useState("");
  const [multiclassDraftRuleset, setMulticlassDraftRuleset] = useState<Ruleset>("2024");
  const [mixedEditionWarningOpen, setMixedEditionWarningOpen] = useState(false);
  const [hideMixedEditionWarning, setHideMixedEditionWarning] = useState(false);
  const [pendingMulticlass, setPendingMulticlass] = useState<{ classId: string; ruleset: Ruleset; mode: "add" | "primary" } | null>(null);
  const [cloudRecords, setCloudRecords] = useState<CloudCharacterRecord[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null);

  const [boards, setBoards] = useState<BoardState[]>(defaultBoards);
  const [activeBoardId, setActiveBoardId] = useState(defaultBoards[0].id);
  const [boardSelected, setBoardSelected] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [boardZoom, setBoardZoom] = useState(1);
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const portraitInput = useRef<HTMLInputElement>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const libraryImportInput = useRef<HTMLInputElement>(null);

  const allSpells = useMemo(() => {
    const revised = spellsJson as Spell[];
    const revisedNames = new Set(revised.map((spell) => spell.name.trim().toLowerCase()));
    const legacyOnly = (supplementSpells as Spell[]).filter((spell) => !revisedNames.has(spell.name.trim().toLowerCase()));
    return [...revised, ...legacyOnly, ...customSpells];
  }, [customSpells]);
  const revisedSpellCount = (spellsJson as Spell[]).length;
  const legacySupplementSpells = allSpells.filter((spell) => spell.source !== "SRD 5.2.1" && spell.source !== "Criação própria");
  const legacySpellCount = legacySupplementSpells.length;
  const spellSources = Array.from(new Set(legacySupplementSpells.map((spell) => spell.source))).sort();
  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? boards[0] ?? defaultBoards[0];
  const boardNodes = activeBoard.nodes;
  const boardEdges = activeBoard.edges;
  const setBoardNodes = (updater: BoardNode[] | ((nodes: BoardNode[]) => BoardNode[])) => {
    setBoards((current) => current.map((board) => board.id === activeBoard.id
      ? { ...board, nodes: typeof updater === "function" ? updater(board.nodes) : updater }
      : board));
  };
  const setBoardEdges = (updater: BoardEdge[] | ((edges: BoardEdge[]) => BoardEdge[])) => {
    setBoards((current) => current.map((board) => board.id === activeBoard.id
      ? { ...board, edges: typeof updater === "function" ? updater(board.edges) : updater }
      : board));
  };
  const revisedSpeciesRules = character.speciesRuleset === "2024";
  const revisedClassRules = character.classRuleset === "2024";
  const revisedBackgroundRules = character.backgroundRuleset === "2024";
  // Alias temporário para os cálculos de origem; classe e espécie usam seus marcadores próprios.
  const revisedRules = revisedBackgroundRules;
  const revisedSpeciesOptions = species.map((entry) => ({ ...entry, abilityBonuses: {}, access: entry.source === "SRD 5.2.1" ? "open" as AccessKind : "official" as AccessKind, supplement: false }));
  const legacySpeciesOptions = [...legacySpecies.map((entry) => ({ ...entry, supplement: false })), ...classicSupplementSpecies];
  const activeBackgrounds = revisedBackgroundRules ? backgrounds : legacyBackgrounds;
  const activeLineages = revisedSpeciesRules ? currentLineages : [...legacyLineages, ...classicSupplementLineages];
  const activeSubclasses = revisedClassRules ? currentSubclasses : [...legacyCoreSubclasses, ...classicSupplementSubclasses];
  const allSpeciesOptions = revisedSpeciesRules ? revisedSpeciesOptions : legacySpeciesOptions;
  const classLevelEntries = character.classLevels.length
    ? character.classLevels
    : character.classId
      ? [{ id: "class-primary", classId: character.classId, subclassId: character.subclassId, ruleset: character.classRuleset, level: character.level }]
      : [];
  const primaryClassEntry = classLevelEntries[0];
  const selectedClass = classes.find((entry) => entry.id === (primaryClassEntry?.classId ?? character.classId));
  const selectedSpecies = allSpeciesOptions.find((entry) => entry.id === character.speciesId);
  const selectedBackground = activeBackgrounds.find((entry) => entry.id === character.backgroundId);
  const selectedLineage = activeLineages.find((entry) => entry.speciesId === character.speciesId && entry.id === character.lineageId);
  const selectedSubclass = activeSubclasses.find((entry) => entry.classId === (primaryClassEntry?.classId ?? character.classId) && entry.id === (primaryClassEntry?.subclassId ?? character.subclassId));
  const availableLineages = activeLineages.filter((entry) => entry.speciesId === character.speciesId);
  const availableSubclasses = activeSubclasses.filter((entry) => entry.classId === (primaryClassEntry?.classId ?? character.classId));
  const lineageIsRequired = revisedSpeciesRules
    ? requiredLineageSpecies.has(character.speciesId)
    : availableLineages.length > 0;
  const classicFlexibleProfile = !revisedBackgroundRules
    ? (revisedSpeciesRules ? "plus-two-plus-one" as const : ((selectedLineage as typeof selectedLineage & { flexibleAbilities?: "plus-two-plus-one" | "two-plus-one" })?.flexibleAbilities
      ?? (selectedSpecies as typeof selectedSpecies & { flexibleAbilities?: "plus-two-plus-one" | "two-plus-one" })?.flexibleAbilities))
    : undefined;
  const eligibleAbilityKeys = revisedBackgroundRules
    ? ((selectedBackground?.abilities ?? []) as readonly AbilityKey[])
    : abilities.map((entry) => entry.key).filter((key) => !(character.speciesId === "half-elf" && key === "cha"));
  const abilityBonuses = abilities.reduce((result, ability) => {
    result[ability.key] = 0;
    return result;
  }, {} as Record<AbilityKey, number>);
  if (revisedBackgroundRules) {
    if (character.abilityIncrease.mode === "2+1") {
      if (eligibleAbilityKeys.includes(character.abilityIncrease.primary)) abilityBonuses[character.abilityIncrease.primary] += 2;
      if (eligibleAbilityKeys.includes(character.abilityIncrease.secondary) && character.abilityIncrease.secondary !== character.abilityIncrease.primary) abilityBonuses[character.abilityIncrease.secondary] += 1;
    } else {
      const chosen = [character.abilityIncrease.primary, character.abilityIncrease.secondary, character.abilityIncrease.tertiary];
      if (new Set(chosen).size === 3) chosen.forEach((key) => { if (eligibleAbilityKeys.includes(key)) abilityBonuses[key] += 1; });
    }
  } else {
    const speciesBonuses = revisedSpeciesRules ? {} : (selectedSpecies as typeof selectedSpecies & { abilityBonuses?: Partial<Record<AbilityKey, number>> })?.abilityBonuses ?? {};
    const lineageBonuses = revisedSpeciesRules ? {} : (selectedLineage as typeof selectedLineage & { abilityBonuses?: Partial<Record<AbilityKey, number>> })?.abilityBonuses ?? {};
    abilities.forEach(({ key }) => { abilityBonuses[key] += (speciesBonuses[key] ?? 0) + (lineageBonuses[key] ?? 0); });
    if (classicFlexibleProfile === "plus-two-plus-one") {
      abilityBonuses[character.abilityIncrease.primary] += 2;
      if (character.abilityIncrease.secondary !== character.abilityIncrease.primary) abilityBonuses[character.abilityIncrease.secondary] += 1;
    }
    if (classicFlexibleProfile === "two-plus-one") {
      abilityBonuses[character.abilityIncrease.primary] += 1;
      if (character.abilityIncrease.secondary !== character.abilityIncrease.primary) abilityBonuses[character.abilityIncrease.secondary] += 1;
    }
  }
  const finalAbilities = abilities.reduce((result, ability) => {
    result[ability.key] = Math.min(20, character.abilities[ability.key] + abilityBonuses[ability.key]);
    return result;
  }, {} as Record<AbilityKey, number>);
  const classEquipment = classStartingEquipment[character.classId];
  const backgroundPackage = selectedBackground
    ? openBackgroundEquipment[selectedBackground.id] ?? backgroundFallbackPackage(selectedBackground.name, selectedBackground.tool)
    : null;
  const classDisplay = classLevelEntries.length
    ? classLevelEntries.map((entry) => `${classes.find((candidate) => candidate.id === entry.classId)?.name ?? entry.classId} ${entry.level}`).join(" / ")
    : "Classe não definida";
  const allocatedClassLevels = totalClassLevels(classLevelEntries);
  const progression = revisedClassRules ? (classProgressions[character.classId] ?? []) : (legacyClassProgressions[character.classId] ?? []);
  const classFeatureEntries = classLevelEntries.flatMap((entry) => {
    const className = classes.find((candidate) => candidate.id === entry.classId)?.name ?? entry.classId;
    const features = entry.ruleset === "2024" ? (classProgressions[entry.classId] ?? []) : (legacyClassProgressions[entry.classId] ?? []);
    return features.filter((feature) => feature.level <= entry.level).map((feature) => ({ ...feature, classId: entry.classId, className, ruleset: entry.ruleset }));
  });
  const automaticSpellProfileId = automaticSpellcastingProfileId(character.classId, character.subclassId, character.classRuleset);
  const selectedSpellcastingProfile = spellcastingProfiles.find((profile) => profile.id === (character.spellcastingMode === "auto" ? automaticSpellProfileId : character.spellcastingProfileId)) ?? spellcastingProfiles.at(-1)!;
  const effectiveSpellcastingRows = character.spellcastingMode === "manual" && character.spellcastingRows.length === 20
    ? character.spellcastingRows
    : selectedSpellcastingProfile.rows;
  const sharedCasterLevel = combinedCasterLevel(classLevelEntries);
  const sharedSpellcastingProfile = spellcastingProfiles.find((profile) => profile.id === "wizard-2024")!;
  const sharedSpellcastingRow = sharedCasterLevel > 0 ? sharedSpellcastingProfile.rows[sharedCasterLevel - 1] : null;
  const displayedSharedSpellcastingRow = character.spellcastingMode === "manual" && character.spellcastingRows.length === 20
    ? character.spellcastingRows[Math.max(0, character.level - 1)]
    : sharedSpellcastingRow;
  const pactClassEntries = classLevelEntries.filter((entry) => entry.classId === "warlock");
  const pactRows = pactClassEntries.map((entry) => ({
    entry,
    row: spellcastingProfiles.find((profile) => profile.id === `warlock-${entry.ruleset}`)?.rows[entry.level - 1],
  }));
  const spellcastingClassEntries = classLevelEntries.filter(isSpellcastingEntry);
  const calculatedPb = proficiency(character.level);
  const overrides = { ...defaultOverrides, ...character.overrides, skillBonuses: character.overrides?.skillBonuses ?? {}, saveBonuses: { ...defaultOverrides.saveBonuses, ...(character.overrides?.saveBonuses ?? {}) } };
  const pb = overrides.proficiencyBonus ?? calculatedPb;
  const conMod = modifier(finalAbilities.con);
  const dexMod = modifier(finalAbilities.dex);
  const hitDie = selectedClass?.die ?? 8;
  const hitDiceLabel = classLevelEntries.length
    ? classLevelEntries.map((entry) => `${entry.level}d${classes.find((candidate) => candidate.id === entry.classId)?.die ?? 8}`).join(" + ")
    : `1d${hitDie}`;
  const dwarfToughnessBonus = character.speciesId === "dwarf" && (revisedSpeciesRules || character.lineageId === "hill-dwarf") ? character.level : 0;
  const multiclassBaseHp = classLevelEntries.reduce((total, entry, index) => {
    const die = classes.find((candidate) => candidate.id === entry.classId)?.die ?? 8;
    const levelsUsingAverage = Math.max(0, entry.level - (index === 0 ? 1 : 0));
    return total + (index === 0 ? die + conMod : 0) + levelsUsingAverage * (Math.floor(die / 2) + 1 + conMod);
  }, 0);
  const calculatedMaxHp = selectedClass ? Math.max(character.level, multiclassBaseHp + dwarfToughnessBonus) : Math.max(1, 8 + conMod + dwarfToughnessBonus);
  const maxHp = overrides.maxHp ?? calculatedMaxHp;
  const thirdCasterAbility = ["eldritch-knight", "eldritch-knight-2014", "arcane-trickster", "arcane-trickster-2014"].includes(character.subclassId) ? "int" : null;
  const spellAbility = (character.spellcastingAbility || selectedClass?.spellAbility || thirdCasterAbility) as AbilityKey | null | undefined;
  const spellMod = spellAbility ? modifier(finalAbilities[spellAbility]) : 0;
  const spellDc = overrides.spellDc ?? 8 + pb + spellMod;
  const spellAttack = overrides.spellAttack ?? pb + spellMod;
  const spellStatsByClass = spellcastingClassEntries.map((entry) => {
    const thirdCaster = ["eldritch-knight", "eldritch-knight-2014", "arcane-trickster", "arcane-trickster-2014"].includes(entry.subclassId);
    const ability = (classSpellAbilities[entry.classId] ?? (thirdCaster ? "int" : null)) as AbilityKey | null;
    const abilityMod = ability ? modifier(finalAbilities[ability]) : 0;
    return {
      entry,
      className: classes.find((candidate) => candidate.id === entry.classId)?.name ?? entry.classId,
      ability,
      dc: 8 + pb + abilityMod,
      attack: pb + abilityMod,
    };
  });
  const multiclassFailures = multiclassRequirementFailures(classLevelEntries, finalAbilities);
  const mixedClassEditions = hasMixedClassEditions(classLevelEntries);
  const multiclassCandidate = multiclassDraftClassId
    ? { id: "candidate", classId: multiclassDraftClassId, subclassId: "", ruleset: multiclassDraftRuleset, level: 1 } as ClassLevelEntry
    : null;
  const multiclassCandidateFailures = multiclassCandidate
    ? multiclassRequirementFailures([...classLevelEntries, multiclassCandidate], finalAbilities)
    : [];
  const noClassLevelBudget = classLevelEntries.length >= character.level;
  const canAddMulticlass = Boolean(
    multiclassCandidate
    && classLevelEntries.length > 0
    && classLevelEntries.length < 12
    && classLevelEntries.length < character.level
    && !classLevelEntries.some((entry) => entry.classId === multiclassCandidate.classId)
    && multiclassCandidateFailures.length === 0
  );
  const armorClass = overrides.armorClass ?? 10 + dexMod;
  const initiative = overrides.initiative ?? dexMod;
  const movementSpeed = overrides.speed ?? selectedSpecies?.speed ?? 9;
  const speciesGrantedSkill = revisedSpeciesRules
    ? (SPECIES_WITH_SKILL_CHOICE.has(character.speciesId) ? character.speciesChoices.skill : "")
    : (["human", "half-elf"].includes(character.speciesId) ? character.speciesChoices.skill : "");
  const backgroundGrantedSkills = new Set((selectedBackground?.skills ?? []).filter((skill) => skills.some((entry) => entry.name === skill)));
  const effectiveProficientSkills = new Set([...character.proficientSkills, ...backgroundGrantedSkills, speciesGrantedSkill].filter(Boolean));
  const passivePerception = overrides.passivePerception ?? 10 + modifier(finalAbilities.wis) + (effectiveProficientSkills.has("Percepção") ? pb : 0) + (overrides.skillBonuses.Percepção ?? 0);
  const selectedSpells = allSpells.filter((spell) => character.selectedSpellIds.includes(spell.id));
  const completion = [character.name, character.speciesId, character.classId, character.backgroundId].filter(Boolean).length;
  const totalWeight = character.inventory.reduce((sum, entry) => sum + entry.weight * entry.quantity, 0);
  const carryingCapacity = Math.max(1, finalAbilities.str * 6.8);
  const carryingPercent = Math.min(140, (totalWeight / carryingCapacity) * 100);
  const pointBuyCost = Object.values(character.abilities).reduce((total, value) => total + pointCost(value), 0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem("arcana-character-v1");
        const preferences = localStorage.getItem("arcana-preferences-v1");
        const savedBoards = localStorage.getItem("arcana-boards-v2");
        const legacyBoard = localStorage.getItem("arcana-board-v1");
        const custom = localStorage.getItem("arcana-custom-spells-v1");
        const hiddenMixedWarning = localStorage.getItem("arcana-hide-mixed-multiclass-warning-v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          const normalized = normalizeCharacterData(parsed);
          setCharacter(normalized);
          setSelectedProgressionLevel(normalized.level);
        }
        if (preferences) {
          const parsed = JSON.parse(preferences);
          if (parsed.theme) setTheme(parsed.theme);
          if (parsed.fontScale) setFontScale(parsed.fontScale);
          if (parsed.reduceMotion) setReduceMotion(parsed.reduceMotion);
        }
        if (savedBoards) {
          const parsed = JSON.parse(savedBoards);
          if (Array.isArray(parsed.boards) && parsed.boards.length) {
            setBoards(parsed.boards);
            setActiveBoardId(parsed.activeBoardId ?? parsed.boards[0].id);
          }
        } else if (legacyBoard) {
          const parsed = JSON.parse(legacyBoard);
          const migrated = { id: "board-main", name: "Personagem", nodes: parsed.nodes ?? [], edges: parsed.edges ?? [] };
          setBoards([migrated]);
          setActiveBoardId(migrated.id);
        }
        if (custom) setCustomSpells(JSON.parse(custom));
        if (hiddenMixedWarning === "true") setHideMixedEditionWarning(true);
      } catch {
        // A malformed local draft should never prevent the app from opening.
      }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      localStorage.setItem("arcana-character-v1", JSON.stringify(character));
      localStorage.setItem("arcana-preferences-v1", JSON.stringify({ theme, fontScale, reduceMotion }));
      localStorage.setItem("arcana-boards-v2", JSON.stringify({ boards, activeBoardId }));
      localStorage.setItem("arcana-custom-spells-v1", JSON.stringify(customSpells));
      setSavePulse(true);
      window.setTimeout(() => setSavePulse(false), 900);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [character, theme, fontScale, reduceMotion, boards, activeBoardId, customSpells, hydrated]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", `${fontScale}%`);
  }, [fontScale]);

  const refreshCloudRecords = async () => {
    setCloudBusy(true);
    setCloudError("");
    try {
      if (usesStaticCharacterStorage()) {
        setCloudRecords(readStaticCharacterRecords().map((record) => ({
          id: record.id,
          name: record.name,
          player: record.player,
          summary: record.summary,
          level: record.level,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        })));
        return;
      }
      const response = await fetch("/api/characters", { cache: "no-store" });
      if (!response.ok) throw new Error("Falha ao consultar as fichas.");
      const payload = await response.json() as { characters?: CloudCharacterRecord[] };
      setCloudRecords(payload.characters ?? []);
    } catch {
      setCloudError("O banco não respondeu agora. Seu rascunho local continua protegido.");
    } finally {
      setCloudBusy(false);
    }
  };

  useEffect(() => {
    if (section !== "biblioteca") return;
    const timer = window.setTimeout(() => void refreshCloudRecords(), 0);
    return () => window.clearTimeout(timer);
  }, [section]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = (event.clientX - drag.startX) / boardZoom;
      const dy = (event.clientY - drag.startY) / boardZoom;
      setBoards((current) => current.map((board) => board.id === activeBoardId ? { ...board, nodes: board.nodes.map((node) => node.id === drag.id ? { ...node, x: Math.max(0, drag.x + dx), y: Math.max(0, drag.y + dy) } : node) } : board));
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [boardZoom, activeBoardId]);

  const updateCharacter = <K extends keyof CharacterState>(key: K, value: CharacterState[K]) => {
    setCharacter((current) => {
      if (key === "level") {
        const minimum = Math.max(1, current.classLevels.length);
        const requested = Math.max(minimum, Math.min(20, Number(value)));
        const classLevels = current.classLevels.length
          ? fitClassLevelsToBudget(current.classLevels, requested)
          : current.classLevels;
        return { ...current, level: requested, classLevels };
      }
      if (key === "classId" && current.classLevels.length) {
        const classId = String(value);
        const duplicateLevel = current.classLevels.slice(1).find((entry) => entry.classId === classId)?.level ?? 0;
        const classLevels = current.classLevels.map((entry, index) => index === 0 ? { ...entry, classId, subclassId: "", level: entry.level + duplicateLevel } : entry).filter((entry, index) => index === 0 || entry.classId !== classId);
        return { ...current, classId, subclassId: "", classLevels, level: current.level };
      }
      if (key === "subclassId" && current.classLevels.length) {
        const subclassId = String(value);
        const classLevels = current.classLevels.map((entry, index) => index === 0 ? { ...entry, subclassId } : entry);
        return { ...current, subclassId, classLevels };
      }
      return { ...current, [key]: value };
    });
  };

  const updateClassComposition = (updater: (entries: ClassLevelEntry[], budget: number) => ClassLevelEntry[]) => {
    setCharacter((current) => {
      const existing = current.classLevels.length
        ? current.classLevels
        : current.classId
          ? [{ id: "class-primary", classId: current.classId, subclassId: current.subclassId, ruleset: current.classRuleset, level: current.level }]
          : [];
      const budget = Math.max(1, Math.min(20, current.level));
      const unique = updater(existing, budget).filter((entry, index, entries) => entries.findIndex((candidate) => candidate.classId === entry.classId) === index);
      const admissible = unique.slice(0, Math.min(12, budget));
      const next = admissible.length ? fitClassLevelsToBudget(admissible, budget) : admissible;
      const primary = next[0];
      return {
        ...current,
        classLevels: next,
        level: budget,
        classId: primary?.classId ?? "",
        subclassId: primary?.subclassId ?? "",
        classRuleset: primary?.ruleset ?? current.classRuleset,
      };
    });
  };

  const setTotalCharacterLevel = (requestedLevel: number) => {
    setCharacter((current) => {
      const existing = current.classLevels.length
        ? current.classLevels
        : current.classId
          ? [{ id: "class-primary", classId: current.classId, subclassId: current.subclassId, ruleset: current.classRuleset, level: current.level }]
          : [];
      const minimum = Math.max(1, existing.length);
      const target = Math.max(minimum, Math.min(20, requestedLevel));
      return {
        ...current,
        level: target,
        classLevels: existing.length ? fitClassLevelsToBudget(existing, target) : current.classLevels,
      };
    });
  };

  const chooseSpecies = (speciesId: string, speciesRuleset: Ruleset = character.speciesRuleset) => {
    setCharacter((current) => ({
      ...current,
      speciesRuleset,
      speciesId,
      lineageId: "",
      speciesChoices: { skill: "", originFeat: "", spellAbility: "", size: "" },
    }));
  };

  const chooseClass = (classId: string, classRuleset: Ruleset) => {
    setCharacter((current) => {
      const existing = current.classLevels.length
        ? current.classLevels
        : current.classId
          ? [{ id: "class-primary", classId: current.classId, subclassId: current.subclassId, ruleset: current.classRuleset, level: current.level }]
          : [];
      const oldPrimary = existing[0];
      const duplicate = existing.slice(1).find((entry) => entry.classId === classId);
      const primaryLevel = Math.min(20, (oldPrimary?.level ?? current.level) + (duplicate?.level ?? 0));
      const proposed: ClassLevelEntry[] = [
        { id: oldPrimary?.id ?? "class-primary", classId, subclassId: oldPrimary?.classId === classId && oldPrimary.ruleset === classRuleset ? oldPrimary.subclassId : "", ruleset: classRuleset, level: primaryLevel },
        ...existing.slice(1).filter((entry) => entry.classId !== classId),
      ];
      const next = fitClassLevelsToBudget(proposed, current.level);
      return {
        ...current,
        classRuleset,
        classId,
        subclassId: next[0].subclassId,
        classLevels: next,
        level: current.level,
        spellcastingMode: "auto",
        spellcastingProfileId: "none",
        spellcastingRows: [],
        spellcastingAbility: "",
        classEquipmentChoice: "",
        inventory: current.inventory.filter((item) => item.origin !== "class-start"),
        coins: { ...current.coins, gp: Math.max(0, current.coins.gp - current.classStartingGp) },
        classStartingGp: 0,
      };
    });
  };

  const requestPrimaryClass = (classId: string, ruleset: Ruleset) => {
    const wouldMixEditions = classLevelEntries.slice(1).some((entry) => entry.ruleset !== ruleset);
    if (wouldMixEditions && !hideMixedEditionWarning) {
      setPendingMulticlass({ classId, ruleset, mode: "primary" });
      setMixedEditionWarningOpen(true);
      return;
    }
    chooseClass(classId, ruleset);
  };

  const updateClassEntry = (entryId: string, patch: Partial<ClassLevelEntry>) => {
    updateClassComposition((entries) => entries.map((entry) => entry.id === entryId ? { ...entry, ...patch } : entry));
  };

  const updateClassEntryLevel = (entryId: string, requestedLevel: number) => {
    updateClassComposition((entries, budget) => redistributeClassLevel(entries, budget, entryId, requestedLevel));
  };

  const removeClassEntry = (entryId: string) => {
    updateClassComposition((entries) => entries.filter((entry, index) => index === 0 || entry.id !== entryId));
  };

  const addMulticlassNow = (classId: string, ruleset: Ruleset) => {
    updateClassComposition((entries, budget) => {
      if (!entries.length || entries.some((entry) => entry.classId === classId) || entries.length >= 12 || entries.length >= budget) return entries;
      const donorIndex = entries.findIndex((entry) => entry.level > 1);
      if (donorIndex < 0) return entries;
      const next = entries.map((entry, index) => index === donorIndex ? { ...entry, level: entry.level - 1 } : entry);
      return [...next, { id: crypto.randomUUID(), classId, subclassId: "", ruleset, level: 1 }];
    });
    setMulticlassDraftClassId("");
  };

  const requestMulticlass = () => {
    if (!multiclassDraftClassId || noClassLevelBudget || classLevelEntries.some((entry) => entry.classId === multiclassDraftClassId)) return;
    const proposed = [...classLevelEntries, { id: "candidate", classId: multiclassDraftClassId, subclassId: "", ruleset: multiclassDraftRuleset, level: 1 }];
    if (multiclassRequirementFailures(proposed, finalAbilities).length) return;
    const wouldMixEditions = classLevelEntries.some((entry) => entry.ruleset !== multiclassDraftRuleset);
    if (wouldMixEditions && !hideMixedEditionWarning) {
      setPendingMulticlass({ classId: multiclassDraftClassId, ruleset: multiclassDraftRuleset, mode: "add" });
      setMixedEditionWarningOpen(true);
      return;
    }
    addMulticlassNow(multiclassDraftClassId, multiclassDraftRuleset);
  };

  const chooseBackground = (entry: (typeof backgrounds)[number] | LegacyBackgroundDefinition, backgroundRuleset: Ruleset = ("feature" in entry ? "2014" : "2024")) => {
    const allowed = entry.abilities as readonly AbilityKey[];
    setCharacter((current) => ({
      ...current,
      backgroundRuleset,
      backgroundId: entry.id,
      backgroundEquipmentChoice: "",
      inventory: current.inventory.filter((item) => item.origin !== "background-start"),
      coins: { ...current.coins, gp: Math.max(0, current.coins.gp - current.backgroundStartingGp) },
      backgroundStartingGp: 0,
      proficientSkills: current.proficientSkills.filter((skill) => {
        const previous = activeBackgrounds.find((background) => background.id === current.backgroundId);
        return !(previous?.skills as readonly string[] | undefined)?.includes(skill);
      }),
      abilityIncrease: backgroundRuleset === "2024"
        ? { mode: "2+1", primary: allowed[0], secondary: allowed[1] ?? allowed[0], tertiary: allowed[2] ?? allowed[0] }
        : current.abilityIncrease,
    }));
  };

  const editAutomaticSpellcasting = () => {
    const profile = spellcastingProfiles.find((entry) => entry.id === automaticSpellProfileId) ?? spellcastingProfiles.at(-1)!;
    setCharacter((current) => ({
      ...current,
      spellcastingMode: "manual",
      spellcastingProfileId: profile.id,
      spellcastingRows: cloneSpellcastingRows(profile.rows),
    }));
  };

  const chooseSpellcastingProfile = (profileId: string) => {
    const profile = spellcastingProfiles.find((entry) => entry.id === profileId) ?? spellcastingProfiles.at(-1)!;
    setCharacter((current) => ({
      ...current,
      spellcastingMode: "manual",
      spellcastingProfileId: profile.id,
      spellcastingRows: cloneSpellcastingRows(profile.rows),
    }));
  };

  const updateSpellcastingRow = (level: number, patch: Partial<SpellcastingRow>) => {
    setCharacter((current) => ({
      ...current,
      spellcastingRows: current.spellcastingRows.map((row) => row.level === level ? { ...row, ...patch } : row),
    }));
  };

  const updateSpellSlot = (level: number, circle: number, value: number) => {
    setCharacter((current) => ({
      ...current,
      spellcastingRows: current.spellcastingRows.map((row) => row.level === level
        ? { ...row, slots: row.slots.map((slot, index) => index === circle ? Math.max(0, value) : slot) }
        : row),
    }));
  };

  const updateOverrides = (next: Partial<ManualOverrides>) => {
    setCharacter((current) => ({
      ...current,
      overrides: { ...defaultOverrides, ...current.overrides, ...next },
    }));
  };

  const navigate = (next: Section) => {
    if (next === "progressao") {
      const entry = classLevelEntries.find((candidate) => candidate.id === progressionClassEntryId) ?? primaryClassEntry;
      if (entry) {
        setProgressionClassEntryId(entry.id);
        setSelectedProgressionLevel(entry.level);
      }
    }
    setSection(next);
    setSidebarOpen(false);
    setDiceOpen(false);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  const saveCharacterToCloud = async () => {
    setCloudBusy(true);
    setCloudError("");
    const cloudId = character.cloudId || crypto.randomUUID();
    const snapshot = { ...character, cloudId };
    try {
      if (usesStaticCharacterStorage()) {
        const now = Date.now();
        const records = readStaticCharacterRecords();
        const previous = records.find((record) => record.id === cloudId);
        const record: StaticCharacterRecord = {
          id: cloudId,
          name: snapshot.name || "Sem nome",
          player: snapshot.player,
          level: snapshot.level,
          summary: characterSummary(snapshot),
          data: JSON.stringify({ version: 5, character: snapshot, customSpells, boards, activeBoardId }),
          createdAt: previous?.createdAt ?? now,
          updatedAt: now,
        };
        writeStaticCharacterRecords([record, ...records.filter((entry) => entry.id !== cloudId)]);
        setCharacter(snapshot);
        await refreshCloudRecords();
        return;
      }
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: cloudId,
          name: snapshot.name || "Sem nome",
          player: snapshot.player,
          level: snapshot.level,
          summary: characterSummary(snapshot),
          data: { version: 5, character: snapshot, customSpells, boards, activeBoardId },
        }),
      });
      if (!response.ok) throw new Error("Falha ao salvar.");
      setCharacter(snapshot);
      await refreshCloudRecords();
    } catch {
      setCloudError("Não foi possível enviar esta ficha ao banco. O rascunho local não foi perdido.");
    } finally {
      setCloudBusy(false);
    }
  };

  const loadCharacterFromCloud = async (id: string) => {
    setCloudBusy(true);
    setCloudError("");
    try {
      if (usesStaticCharacterStorage()) {
        const record = readStaticCharacterRecords().find((entry) => entry.id === id);
        if (!record) throw new Error("Ficha não encontrada.");
        const bundle = normalizeCharacterBundle(JSON.parse(record.data));
        setCharacter({ ...bundle.character, cloudId: id });
        setSelectedProgressionLevel(bundle.character.level);
        setCustomSpells(bundle.customSpells);
        setBoards(bundle.boards);
        setActiveBoardId(bundle.activeBoardId);
        navigate("ficha");
        return;
      }
      const response = await fetch(`/api/characters/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Ficha não encontrada.");
      const record = await response.json() as { data: string };
      const bundle = normalizeCharacterBundle(JSON.parse(record.data));
      setCharacter({ ...bundle.character, cloudId: id });
      setSelectedProgressionLevel(bundle.character.level);
      setCustomSpells(bundle.customSpells);
      setBoards(bundle.boards);
      setActiveBoardId(bundle.activeBoardId);
      navigate("ficha");
    } catch {
      setCloudError("Não foi possível abrir essa ficha agora.");
    } finally {
      setCloudBusy(false);
    }
  };

  const deleteCharacterFromCloud = async (id: string) => {
    if (!window.confirm("Excluir esta ficha do banco? O rascunho que estiver aberto no dispositivo não será apagado.")) return;
    setCloudBusy(true);
    setCloudError("");
    try {
      if (usesStaticCharacterStorage()) {
        writeStaticCharacterRecords(readStaticCharacterRecords().filter((entry) => entry.id !== id));
        if (character.cloudId === id) setCharacter((current) => ({ ...current, cloudId: "" }));
        await refreshCloudRecords();
        return;
      }
      const response = await fetch(`/api/characters/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Falha ao excluir.");
      if (character.cloudId === id) setCharacter((current) => ({ ...current, cloudId: "" }));
      await refreshCloudRecords();
    } catch {
      setCloudError("Não foi possível excluir essa ficha agora.");
    } finally {
      setCloudBusy(false);
    }
  };

  const startNewCharacter = () => {
    if (!window.confirm("Começar uma ficha vazia? O personagem atual continuará no banco se você já o salvou.")) return;
    setCharacter(defaultCharacter);
    setSelectedProgressionLevel(defaultCharacter.level);
    setBuilderStep(0);
    navigate("criador");
  };

  const handlePortrait = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateCharacter("portrait", String(reader.result));
    reader.readAsDataURL(file);
  };

  const applyRecommendedAbilities = () => {
    const base: Record<AbilityKey, number> = { str: 10, dex: 12, con: 14, int: 10, wis: 13, cha: 8 };
    const patterns: Record<string, Record<AbilityKey, number>> = {
      barbarian: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      bard: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
      cleric: { str: 12, dex: 10, con: 14, int: 8, wis: 15, cha: 13 },
      druid: { str: 8, dex: 13, con: 14, int: 12, wis: 15, cha: 10 },
      fighter: { str: 15, dex: 12, con: 14, int: 10, wis: 13, cha: 8 },
      monk: { str: 10, dex: 15, con: 13, int: 8, wis: 14, cha: 12 },
      paladin: { str: 15, dex: 8, con: 13, int: 10, wis: 12, cha: 14 },
      ranger: { str: 10, dex: 15, con: 13, int: 8, wis: 14, cha: 12 },
      rogue: { str: 8, dex: 15, con: 13, int: 14, wis: 12, cha: 10 },
      sorcerer: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
      warlock: { str: 8, dex: 14, con: 13, int: 10, wis: 12, cha: 15 },
      wizard: { str: 8, dex: 13, con: 14, int: 15, wis: 12, cha: 10 },
    };
    updateCharacter("abilities", patterns[character.classId] ?? base);
  };

  const rollDie = (sides: number) => {
    if (rolling) return;
    setDiceSides(sides);
    setRolling(true);
    setDiceResult(null);
    window.setTimeout(() => {
      const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * sides) + 1);
      const result = rolls.reduce((sum, value) => sum + value, 0) + diceModifier;
      const expression = `${diceCount}d${sides}${diceModifier === 0 ? "" : diceModifier > 0 ? `+${diceModifier}` : diceModifier}`;
      setDiceResult(result);
      setRollHistory((history) => [{ expression, result }, ...history].slice(0, 8));
      setRolling(false);
    }, reduceMotion ? 80 : 720);
  };

  const rollAbilitySet = () => {
    const values = abilities.map(() => Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a).slice(0, 3).reduce((sum, value) => sum + value, 0));
    updateCharacter("abilities", Object.fromEntries(abilities.map((ability, index) => [ability.key, values[index]])) as Record<AbilityKey, number>);
  };

  const filteredSpells = useMemo(() => {
    const query = spellSearch.trim().toLowerCase();
    return allSpells.filter((spell) => {
      const translated = spellPt(spell);
      const matchSearch = !query || spell.name.toLowerCase().includes(query) || spell.description.toLowerCase().includes(query) || translated.name.toLowerCase().includes(query) || translated.description.toLowerCase().includes(query);
      const matchLevel = spellLevel === "all" || String(spell.level) === spellLevel;
      const matchSchool = spellSchool === "all" || spell.school === spellSchool;
      const matchClass = spellClass === "all" || spell.classes.includes(spellClass);
      const matchSource = spellSource === "all" || (spellSource === "open" ? spell.source === "SRD 5.2.1" : spellSource === "legacy" ? !["SRD 5.2.1", "Criação própria"].includes(spell.source) : spell.source === spellSource);
      return matchSearch && matchLevel && matchSchool && matchClass && matchSource;
    });
  }, [allSpells, spellSearch, spellLevel, spellSchool, spellClass, spellSource]);

  const toggleSpell = (id: string) => {
    const selected = character.selectedSpellIds.includes(id);
    updateCharacter("selectedSpellIds", selected ? character.selectedSpellIds.filter((entry) => entry !== id) : [...character.selectedSpellIds, id]);
  };

  const addInventory = (item: (typeof items)[number]) => {
    const existing = character.inventory.find((entry) => entry.name === item.name);
    const next = existing
      ? character.inventory.map((entry) => entry.id === existing.id ? { ...entry, quantity: entry.quantity + 1 } : entry)
      : [...character.inventory, { id: uid("item"), name: item.name, quantity: 1, weight: item.weight, detail: item.detail, equipped: false }];
    updateCharacter("inventory", next);
  };

  const applyStartingEquipment = (kind: "class" | "background", option: EquipmentOption) => {
    const origin = kind === "class" ? "class-start" : "background-start";
    setCharacter((current) => {
      const previousGp = kind === "class" ? current.classStartingGp : current.backgroundStartingGp;
      const newEntries: InventoryEntry[] = option.items.map((entry) => {
        const catalogItem = items.find((item) => item.name.toLowerCase() === entry.name.toLowerCase());
        return {
          id: uid(origin),
          name: entry.name,
          quantity: entry.quantity ?? 1,
          weight: entry.weight ?? catalogItem?.weight ?? 0,
          detail: entry.detail ?? catalogItem?.detail ?? "Equipamento inicial; edite para registrar a escolha exata.",
          equipped: false,
          origin,
        };
      });
      return {
        ...current,
        inventory: [...current.inventory.filter((entry) => entry.origin !== origin), ...newEntries],
        coins: { ...current.coins, gp: Math.max(0, current.coins.gp - previousGp + option.gp) },
        ...(kind === "class"
          ? { classEquipmentChoice: option.id, classStartingGp: option.gp }
          : { backgroundEquipmentChoice: option.id, backgroundStartingGp: option.gp }),
      };
    });
  };

  const addBoardNote = () => {
    const id = uid("note");
    setBoardNodes((nodes) => [...nodes, { id, x: 140 + Math.random() * 360, y: 120 + Math.random() * 260, title: "Nova anotação", body: "Clique para escrever.", color: ["violet", "gold", "teal"][nodes.length % 3] }]);
    setBoardSelected(id);
  };

  const createBoard = () => {
    const id = uid("board");
    const board: BoardState = { id, name: `Quadro ${boards.length + 1}`, nodes: [], edges: [] };
    setBoards((current) => [...current, board]);
    setActiveBoardId(id);
    setBoardSelected(null);
    setConnectFrom(null);
  };

  const renameActiveBoard = () => {
    const name = window.prompt("Nome deste quadro:", activeBoard.name)?.trim();
    if (!name) return;
    setBoards((current) => current.map((board) => board.id === activeBoard.id ? { ...board, name } : board));
  };

  const deleteActiveBoard = () => {
    if (boards.length === 1) return;
    if (!window.confirm(`Excluir o quadro “${activeBoard.name}” e todo o conteúdo dele?`)) return;
    const remaining = boards.filter((board) => board.id !== activeBoard.id);
    setBoards(remaining);
    setActiveBoardId(remaining[0].id);
    setBoardSelected(null);
    setConnectFrom(null);
  };

  const deleteSelectedNode = () => {
    const selected = boardNodes.find((node) => node.id === boardSelected);
    if (!selected || !window.confirm(`Excluir somente a nota “${selected.title}”?`)) return;
    setBoardNodes((nodes) => nodes.filter((node) => node.id !== selected.id));
    setBoardEdges((edges) => edges.filter((edge) => edge.from !== selected.id && edge.to !== selected.id));
    setBoardSelected(null);
  };

  const startNodeDrag = (event: ReactPointerEvent, node: BoardNode) => {
    if ((event.target as HTMLElement).closest("button, [contenteditable='true']")) return;
    dragRef.current = { id: node.id, startX: event.clientX, startY: event.clientY, x: node.x, y: node.y };
    setBoardSelected(node.id);
  };

  const clickBoardNode = (id: string) => {
    if (!connectFrom) { setBoardSelected(id); return; }
    if (connectFrom !== id && !boardEdges.some((edge) => edge.from === connectFrom && edge.to === id)) {
      setBoardEdges((edges) => [...edges, { from: connectFrom, to: id }]);
    }
    setConnectFrom(null);
  };

  const handleBoardPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const file = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"))?.getAsFile();
    if (!file) return;
    event.preventDefault();
    const reader = new FileReader();
    reader.onload = () => setBoardNodes((nodes) => [...nodes, { id: uid("image"), x: 180, y: 180, title: "Referência", body: "Imagem colada", color: "teal", image: String(reader.result) }]);
    reader.readAsDataURL(file);
  };

  const exportCharacter = () => {
    const payload = { version: 5, character, customSpells, boards, activeBoardId };
    const href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `${character.name || "personagem"}-arcana.json`;
    link.click();
    URL.revokeObjectURL(href);
  };

  const importCharacter = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const bundle = normalizeCharacterBundle(JSON.parse(String(reader.result)));
        setImportPreview({ ...bundle, fileName: file.name });
        setSettingsOpen(false);
      } catch { window.alert("Esse arquivo não parece ser uma ficha válida do Arcana."); }
      finally { event.target.value = ""; }
    };
    reader.readAsText(file);
  };

  const openImportedCharacter = () => {
    if (!importPreview) return;
    setCharacter(importPreview.character);
    setSelectedProgressionLevel(importPreview.character.level);
    setCustomSpells(importPreview.customSpells);
    setBoards(importPreview.boards);
    setActiveBoardId(importPreview.activeBoardId);
    setImportPreview(null);
    setSettingsOpen(false);
    navigate("ficha");
  };

  const saveImportedCharacterToCloud = async () => {
    if (!importPreview) return;
    setCloudBusy(true);
    setCloudError("");
    const cloudId = crypto.randomUUID();
    const snapshot = { ...importPreview.character, cloudId };
    try {
      if (usesStaticCharacterStorage()) {
        const now = Date.now();
        const record: StaticCharacterRecord = {
          id: cloudId,
          name: snapshot.name || "Sem nome",
          player: snapshot.player,
          level: snapshot.level,
          summary: characterSummary(snapshot),
          data: JSON.stringify({ version: 5, character: snapshot, customSpells: importPreview.customSpells, boards: importPreview.boards, activeBoardId: importPreview.activeBoardId }),
          createdAt: now,
          updatedAt: now,
        };
        writeStaticCharacterRecords([record, ...readStaticCharacterRecords().filter((entry) => entry.id !== cloudId)]);
        setCharacter(snapshot);
        setSelectedProgressionLevel(snapshot.level);
        setCustomSpells(importPreview.customSpells);
        setBoards(importPreview.boards);
        setActiveBoardId(importPreview.activeBoardId);
        setImportPreview(null);
        setSettingsOpen(false);
        setSection("biblioteca");
        await refreshCloudRecords();
        return;
      }
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: cloudId,
          name: snapshot.name || "Sem nome",
          player: snapshot.player,
          level: snapshot.level,
          summary: characterSummary(snapshot),
          data: { version: 5, character: snapshot, customSpells: importPreview.customSpells, boards: importPreview.boards, activeBoardId: importPreview.activeBoardId },
        }),
      });
      if (!response.ok) throw new Error("Falha ao salvar.");
      setCharacter(snapshot);
      setSelectedProgressionLevel(snapshot.level);
      setCustomSpells(importPreview.customSpells);
      setBoards(importPreview.boards);
      setActiveBoardId(importPreview.activeBoardId);
      setImportPreview(null);
      setSettingsOpen(false);
      setSection("biblioteca");
      await refreshCloudRecords();
    } catch {
      setCloudError("A ficha foi lida, mas não foi possível adicioná-la ao banco agora.");
    } finally {
      setCloudBusy(false);
    }
  };

  const openFeatureEditor = (origin: FeatureNote["origin"], defaults?: Partial<FeatureNote>) => {
    const existing = defaults?.baseKey ? character.featureNotes.find((note) => note.baseKey === defaults.baseKey) : undefined;
    setFeatureEditor(existing ?? {
      id: uid("feature"),
      name: defaults?.name ?? "Nova habilidade",
      summary: defaults?.summary ?? "Descreva como ela funciona na sua mesa.",
      source: defaults?.source ?? "Criação própria",
      access: defaults?.access ?? "custom",
      origin,
      baseKey: defaults?.baseKey,
    });
  };

  const saveFeatureNote = () => {
    if (!featureEditor) return;
    const exists = character.featureNotes.some((note) => note.id === featureEditor.id);
    updateCharacter("featureNotes", exists
      ? character.featureNotes.map((note) => note.id === featureEditor.id ? featureEditor : note)
      : [...character.featureNotes, featureEditor]);
    setFeatureEditor(null);
  };

  const addAttack = () => {
    updateCharacter("attacks", [...character.attacks, { id: uid("attack"), name: "Novo ataque", icon: "espada", quantity: 1, die: 8, modifier: 0, detail: "Alcance, tipo de dano ou condição." }]);
  };

  const addEffect = (name: string, kind: EffectState["kind"] = "condition") => {
    if (!name.trim() || character.effects.some((entry) => entry.name === name)) return;
    updateCharacter("effects", [...character.effects, { id: uid("effect"), name, kind, detail: "" }]);
  };

  const buildBackstory = () => {
    const subject = character.name || "Meu personagem";
    const paragraphs = [
      character.story.origin && `${subject} veio de ${character.story.origin.trim().replace(/[.]$/, "")}.`,
      character.story.rupture && `Essa vida mudou quando ${character.story.rupture.trim().replace(/[.]$/, "")}.`,
      character.story.desire && `Desde então, busca ${character.story.desire.trim().replace(/[.]$/, "")}.`,
      character.story.fear && `O caminho se complica porque teme ${character.story.fear.trim().replace(/[.]$/, "")}.`,
      character.story.bond && `Ainda permanece ligado a ${character.story.bond.trim().replace(/[.]$/, "")}.`,
      character.story.flaw && `Quando tenta acertar, porém, costuma ${character.story.flaw.trim().replace(/[.]$/, "")}.`,
      character.story.openThread && `Há uma pergunta que continua aberta: ${character.story.openThread.trim().replace(/[.]$/, "")}.`,
    ].filter(Boolean).join("\n\n");
    updateStory("fullBackstory", paragraphs);
  };

  const renderDashboard = () => (
    <div className="view-enter dashboard-view">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow"><Sparkles size={14} /> Seu grimório de personagem</span>
          <h1>{character.name ? <>Continue a história de <em>{character.name}</em>.</> : <>Uma ficha que ensina enquanto você <em>cria.</em></>}</h1>
          <p>{character.name ? `${selectedSpecies?.name ?? "Origem indefinida"} · ${classDisplay} · nível ${character.level}` : "Escolha uma origem, entenda cada decisão e chegue à mesa sem precisar decorar o livro inteiro."}</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => navigate("criador")}>{completion === 4 ? "Revisar personagem" : "Começar criação"}<ChevronRight size={18} /></button>
            <button className="ghost-button" onClick={() => navigate("ficha")}><Eye size={17} />Abrir ficha</button>
          </div>
        </div>
        <div className="hero-progress" aria-label={`Criação ${completion} de 4 etapas essenciais`}>
          <div><span>Progresso do personagem</span><strong>{completion}<small>/4</small></strong></div>
          <div className="hero-progress-track"><i style={{ width: `${completion * 25}%` }} /></div>
          <p>{completion === 4 ? "Base pronta para jogar" : `${4 - completion} ${4 - completion === 1 ? "escolha essencial" : "escolhas essenciais"} pela frente`}</p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">Atalhos</span><h2>Sua mesa, sem atrito</h2></div><p>Tudo salva automaticamente neste dispositivo.</p></div>
        <div className="feature-grid">
          <button className="feature-card feature-primary" onClick={() => navigate("criador")}>
            <span className="feature-icon"><WandSparkles /></span><span className="feature-kicker">Criação guiada</span><strong>{completion === 4 ? "Personagem estruturado" : `${4 - completion} decisões essenciais restantes`}</strong><p>Explicações curtas, sugestões e cálculos automáticos.</p><ChevronRight className="card-arrow" />
          </button>
          <button className="feature-card" onClick={() => navigate("magias")}>
            <span className="feature-icon"><BookOpen /></span><span className="feature-kicker">Compêndio por edição</span><strong>{revisedSpellCount + legacySpellCount} magias sem duplicatas</strong><p>{revisedSpellCount} revisadas e {legacySpellCount} exclusivas de suplementos clássicos, com fonte e edição identificadas.</p><ChevronRight className="card-arrow" />
          </button>
          <button className="feature-card" onClick={() => navigate("historia")}>
            <span className="feature-icon"><Wand2 /></span><span className="feature-kicker">Oficina narrativa</span><strong>Transforme ideia em conflito</strong><p>Perguntas que produzem história sem escrever por você.</p><ChevronRight className="card-arrow" />
          </button>
          <button className="feature-card" onClick={() => navigate("quadro")}>
            <span className="feature-icon"><Network /></span><span className="feature-kicker">Quadro livre</span><strong>Conecte pessoas e segredos</strong><p>Arraste notas, cole imagens e desenhe relações.</p><ChevronRight className="card-arrow" />
          </button>
        </div>
      </section>

      <section className="overview-grid">
        <div className="glass-panel stat-preview">
          <div className="panel-title"><span><Shield size={18} />Visão rápida</span><button onClick={() => navigate("ficha")}>Ver ficha</button></div>
          <div className="quick-stat-row">
            <div><span>CA</span><strong>{armorClass}</strong><small>{overrides.armorClass === null ? "calculada" : "ajustada"}</small></div>
            <div><span>PV</span><strong>{maxHp}</strong><small>{hitDiceLabel}</small></div>
            <div><span>Prof.</span><strong>{signed(pb)}</strong><small>nível {character.level}</small></div>
            <div><span>Iniciativa</span><strong>{signed(initiative)}</strong><small>{overrides.initiative === null ? "Destreza" : "ajustada"}</small></div>
          </div>
        </div>
        <div className="glass-panel prompt-preview">
          <div className="panel-title"><span><Sparkles size={18} />Pergunta de personagem</span><button onClick={() => setStoryPrompt(storyPrompts[Math.floor(Math.random() * storyPrompts.length)])}>Outra</button></div>
          <blockquote>“{storyPrompt}”</blockquote>
          <button className="text-link" onClick={() => navigate("historia")}>Levar para a oficina <ChevronRight size={15} /></button>
        </div>
      </section>
    </div>
  );

  const builderSteps = ["Identidade", "Espécie", "Classe", "Passado", "Atributos", "Equipamento", "Personalidade", "Revisão"];
  const chosenOriginAbilities = [character.abilityIncrease.primary, character.abilityIncrease.secondary, ...(character.abilityIncrease.mode === "1+1+1" ? [character.abilityIncrease.tertiary] : [])];
  const classicAbilityChoices = [character.abilityIncrease.primary, character.abilityIncrease.secondary];
  const abilitySelectionValid = revisedBackgroundRules
    ? Boolean(selectedBackground)
      && chosenOriginAbilities.every((key) => eligibleAbilityKeys.includes(key))
      && new Set(chosenOriginAbilities).size === chosenOriginAbilities.length
      && (character.abilityMethod !== "pointbuy" || pointBuyCost <= 27)
    : (!classicFlexibleProfile || (classicAbilityChoices.every((key) => eligibleAbilityKeys.includes(key)) && new Set(classicAbilityChoices).size === 2))
      && (character.abilityMethod !== "pointbuy" || pointBuyCost <= 27);
  const speciesTraitChoiceMissing = (() => {
    if (revisedSpeciesRules && SPECIES_WITH_SIZE_CHOICE.has(character.speciesId) && !character.speciesChoices.size) return "Escolha o tamanho dessa espécie.";
    if (revisedSpeciesRules && SPECIES_WITH_SKILL_CHOICE.has(character.speciesId) && !character.speciesChoices.skill) return "Escolha a perícia concedida pela espécie.";
    if (revisedSpeciesRules && character.speciesId === "human" && !character.speciesChoices.originFeat) return "Escolha o Talento de Origem extra do Humano.";
    if (revisedSpeciesRules && SPECIES_WITH_SPELL_ABILITY.has(character.speciesId) && !character.speciesChoices.spellAbility) return "Escolha o atributo das magias da espécie.";
    if (!revisedSpeciesRules && character.speciesId === "half-elf" && !character.speciesChoices.skill) return "Escolha uma das perícias do Meio-elfo.";
    if (!revisedSpeciesRules && character.lineageId === "variant-human" && !character.speciesChoices.skill) return "Escolha a perícia do Humano Variante.";
    if (!revisedSpeciesRules && character.lineageId === "variant-human" && !character.speciesChoices.originFeat) return "Registre o talento do Humano Variante.";
    return "";
  })();
  const languageChoiceMissing = (() => {
    if (!revisedSpeciesRules) return "";
    if (character.languages.length < 2 || character.languages.some((language) => !language)) return "Escolha os dois idiomas adicionais da origem.";
    if (new Set(character.languages).size !== character.languages.length) return "Escolha dois idiomas diferentes.";
    return "";
  })();
  const speciesChoiceMissing = speciesTraitChoiceMissing || languageChoiceMissing;
  const humanFeatConflict = character.speciesId === "human"
    && revisedSpeciesRules
    && Boolean(selectedBackground)
    && character.speciesChoices.originFeat === selectedBackground?.feat;
  const speciesSkillConflict = Boolean(speciesGrantedSkill) && backgroundGrantedSkills.has(speciesGrantedSkill);
  const builderGate = (() => {
    if (builderStep === 1 && !character.speciesId) return { ok: false, reason: "Escolha uma espécie para continuar." };
    if (builderStep === 1 && lineageIsRequired && !character.lineageId) return { ok: false, reason: "Essa espécie exige uma herança." };
    if (builderStep === 1 && speciesChoiceMissing) return { ok: false, reason: speciesChoiceMissing };
    if (builderStep === 2 && !character.classId) return { ok: false, reason: "Escolha uma classe para continuar." };
    if (builderStep === 2 && allocatedClassLevels !== character.level) return { ok: false, reason: `Distribua exatamente os ${character.level} níveis do personagem entre as classes.` };
    if (builderStep === 3 && !character.backgroundId) return { ok: false, reason: "Escolha um antecedente para continuar." };
    if (builderStep === 3 && revisedSpeciesRules && character.speciesId === "human" && !character.speciesChoices.originFeat) return { ok: false, reason: "Escolha o Talento de Origem extra do Humano." };
    if (builderStep === 3 && humanFeatConflict) return { ok: false, reason: "O talento extra do Humano deve ser diferente do talento do antecedente." };
    if (builderStep === 3 && speciesSkillConflict) return { ok: false, reason: "A perícia da espécie deve ser diferente das perícias do antecedente." };
    if (builderStep === 4 && !abilitySelectionValid) return { ok: false, reason: pointBuyCost > 27 ? "A compra de pontos passou de 27." : "Distribua os bônus da origem entre atributos diferentes." };
    if (builderStep === 4 && multiclassFailures.length) return { ok: false, reason: `A multiclasse ainda não atende: ${multiclassFailures.map((failure) => `${classes.find((entry) => entry.id === failure.classId)?.name} exige ${failure.requirement}`).join("; ")}.` };
    if (builderStep === 5 && (!character.classEquipmentChoice || !character.backgroundEquipmentChoice)) return { ok: false, reason: "Faça a escolha de equipamento da classe e do antecedente." };
    if (builderStep === 7 && multiclassFailures.length) return { ok: false, reason: "Revise os atributos exigidos pela composição multiclasse." };
    return { ok: true, reason: "" };
  })();

  const renderBuilderStep = () => {
    if (builderStep === 0) return (
      <div className="builder-content two-column-form">
        <div>
          <span className="eyebrow">Primeiro, a pessoa</span><h2>Quem vai entrar nessa história?</h2><p className="lead">Nenhuma escolha aqui prende você. Comece com o que sabe e deixe o restante em aberto.</p>
          <section className="edition-explainer" aria-label="Como as edições aparecem"><BookMarked size={19} /><div><strong>O revisado 2024 aparece primeiro; o clássico 2014 continua disponível.</strong><p>Não existe mais uma chave global. Cada espécie, classe, subclasse, antecedente e magia mostra sua edição e sua fonte no próprio cartão. Opções clássicas ficam visualmente mais discretas, mas preservam suas regras.</p></div></section>
          <label className="field-label">Nome do personagem<input value={character.name} onChange={(e) => updateCharacter("name", e.target.value)} placeholder="Ainda não sei" /></label>
          <div className="field-pair">
            <label className="field-label">Nome do jogador<input value={character.player} onChange={(e) => updateCharacter("player", e.target.value)} placeholder="Opcional" /></label>
            <label className="field-label">Pronomes<input value={character.pronouns} onChange={(e) => updateCharacter("pronouns", e.target.value)} placeholder="Ex.: ele/dele" /></label>
          </div>
          <div className="field-pair">
            <label className="field-label">Nível total inicial<input type="number" min={Math.max(1, classLevelEntries.length)} max={20} value={character.level} onChange={(e) => setTotalCharacterLevel(Number(e.target.value))} /><small>{classLevelEntries.length > 1 ? "Distribuído entre as classes na etapa Classe." : "Nível total do personagem."}</small></label>
            <label className="field-label">Tendência<select value={character.alignment} onChange={(e) => updateCharacter("alignment", e.target.value)}><option>Leal e Bom</option><option>Neutro e Bom</option><option>Caótico e Bom</option><option>Leal e Neutro</option><option>Neutro</option><option>Caótico e Neutro</option><option>Leal e Mau</option><option>Neutro e Mau</option><option>Caótico e Mau</option></select></label>
          </div>
          <details className="appearance-builder"><summary>Características físicas <ChevronRight size={16} /></summary><div className="appearance-grid">{([{ key: "age", label: "Idade" }, { key: "height", label: "Altura" }, { key: "weight", label: "Peso" }, { key: "eyes", label: "Olhos" }, { key: "hair", label: "Cabelo" }, { key: "skin", label: "Pele" }, { key: "build", label: "Porte" }, { key: "marks", label: "Marcas e cicatrizes" }] as const).map((field) => <label className="field-label" key={field.key}>{field.label}<input value={character.appearance[field.key]} onChange={(e) => updateCharacter("appearance", { ...character.appearance, [field.key]: e.target.value })} placeholder="Opcional" /></label>)}</div></details>
        </div>
        <div className="portrait-card">
          <input ref={portraitInput} type="file" accept="image/*" onChange={handlePortrait} hidden />
          <button className={`portrait-drop ${character.portrait ? "has-image" : ""}`} onClick={() => portraitInput.current?.click()} style={character.portrait ? { backgroundImage: `url(${character.portrait})` } : undefined}>
            {!character.portrait && <><ImagePlus size={30} /><strong>Adicionar retrato</strong><span>PNG, JPG ou WEBP</span></>}
            {character.portrait && <span className="portrait-change"><Upload size={15} />Trocar imagem</span>}
          </button>
          <p>O retrato fica salvo somente neste dispositivo e acompanha a exportação da ficha.</p>
        </div>
      </div>
    );
    if (builderStep === 1) return (
      <div className="builder-content">
        <span className="eyebrow">Origem física e sobrenatural</span><h2>Escolha uma espécie</h2><p className="lead">A espécie concede traços; cultura, personalidade e moral continuam sendo suas.</p>
        <div className={`edition-rule-banner ${revisedSpeciesRules ? "" : "legacy"}`}><BookMarked size={20} /><div><strong>As duas versões estão no mesmo catálogo.</strong><p>O selo de cada cartão identifica ano e livro. As opções revisadas de 2024 aparecem primeiro; as clássicas de 2014 ficam mais discretas, sem esconder suas regras ou suplementos.</p></div></div>
        {([{ edition: "2024" as Ruleset, label: "Revisado 2024", note: "Atributos vêm do antecedente; espécie não concede aumentos.", entries: revisedSpeciesOptions }, { edition: "2014" as Ruleset, label: "Clássico 2014", note: "Raça, sub-raça e opções de suplementos preservam os aumentos clássicos.", entries: legacySpeciesOptions }] as const).map((group) => <section className={`catalog-edition-section ${group.edition === "2014" ? "legacy-catalog" : ""}`} key={group.edition}><div className="edition-catalog-head"><div><span>{group.label}</span><p>{group.note}</p></div><small>{group.entries.length} opções</small></div><div className="choice-grid species-grid">{group.entries.map((entry) => {
          const lineagePool = group.edition === "2024" ? currentLineages : [...legacyLineages, ...classicSupplementLineages];
          const lineageCount = lineagePool.filter((lineage) => lineage.speciesId === entry.id).length;
          const selected = character.speciesId === entry.id && character.speciesRuleset === group.edition;
          return <button key={`${group.edition}-${entry.source}-${entry.id}`} title={entry.source} className={`choice-card species-card ${selected ? "selected" : ""}`} onClick={() => chooseSpecies(entry.id, group.edition)}><span className="choice-check">{selected ? <Check size={15} /> : entry.name.slice(0, 1)}</span><div><strong>{entry.name}</strong><small>{entry.size} · {entry.speed} m</small></div><span className="catalog-badge dlc" aria-label={`Conteúdo de ${entry.source}`}>{sourceShort(entry.source)} · {group.edition}</span><p>{entry.summary}</p><ul>{entry.traits.slice(0, 5).map((trait) => <li key={trait}>{trait}</li>)}</ul>{lineageCount > 0 && <span className="lineage-count">{lineageCount} {lineageCount === 1 ? "escolha interna" : "escolhas internas"}</span>}</button>;
        })}</div></section>)}
        {availableLineages.length > 0 && <section className="lineage-panel"><div className="section-heading compact"><div><span className="eyebrow">Escolha interna da espécie · não é subclasse</span><h3>{selectedSpecies?.name}: escolha uma herança</h3><p>Essa decisão faz parte dos traços da espécie e é obrigatória para concluir a etapa.</p></div><div className="section-meta"><span className="requirement-pill required">OBRIGATÓRIA</span><small>{availableLineages.length} opções</small></div></div><div className="lineage-grid">{availableLineages.map((entry) => <button key={`${entry.speciesId}-${entry.id}`} className={character.lineageId === entry.id ? "selected" : ""} onClick={() => updateCharacter("lineageId", entry.id)} title={entry.source}><span>{character.lineageId === entry.id ? <Check size={15} /> : <Sparkles size={15} />}</span><div className="lineage-copy"><strong>{entry.name}</strong><small>{entry.summary}</small><em>{sourceShort(entry.source)}</em></div></button>)}</div></section>}
        {selectedSpecies && availableLineages.length === 0 && <div className="no-lineage-note"><Check size={18} /><div><strong>{revisedSpeciesRules && selectedSpecies.id === "dwarf" ? "Anão 2024 não possui sub-raça." : revisedSpeciesRules && selectedSpecies.id === "human" ? "Humano 2024 não possui sub-raça." : "Nenhuma herança separada é exigida."}</strong><p>{revisedSpeciesRules && selectedSpecies.id === "human" ? "Faça abaixo as escolhas de tamanho, perícia e Talento de Origem extra. Nenhuma delas altera atributos." : !revisedSpeciesRules && selectedSpecies.supplement ? "Os atributos serão personalizados na etapa Atributos, conforme a regra opcional de origem de Tasha." : "Todos os traços já foram concedidos pela escolha principal."}</p></div></div>}
        {selectedSpecies && (revisedSpeciesRules ? (SPECIES_WITH_SIZE_CHOICE.has(selectedSpecies.id) || SPECIES_WITH_SKILL_CHOICE.has(selectedSpecies.id) || SPECIES_WITH_SPELL_ABILITY.has(selectedSpecies.id) || selectedSpecies.id === "human") : (["half-elf"].includes(selectedSpecies.id) || character.lineageId === "variant-human")) && <section className="species-options-panel"><div className="section-heading compact"><div><span className="eyebrow">Decisões obrigatórias</span><h3>Complete os traços de {selectedSpecies.name}</h3><p>Estas escolhas ficam registradas e entram nos cálculos da ficha quando aplicável.</p></div><span className={`requirement-pill ${speciesTraitChoiceMissing ? "required" : "complete"}`}>{speciesTraitChoiceMissing ? "PENDENTE" : "CONCLUÍDO"}</span></div><div className="species-option-grid">
          {revisedSpeciesRules && SPECIES_WITH_SIZE_CHOICE.has(selectedSpecies.id) && <label>Tamanho<select value={character.speciesChoices.size} onChange={(event) => updateCharacter("speciesChoices", { ...character.speciesChoices, size: event.target.value as SpeciesChoiceState["size"] })}><option value="">Escolha</option><option value="Pequeno">Pequeno</option><option value="Médio">Médio</option></select><small>Não altera seus atributos.</small></label>}
          {((revisedSpeciesRules && SPECIES_WITH_SKILL_CHOICE.has(selectedSpecies.id)) || (!revisedSpeciesRules && (selectedSpecies.id === "half-elf" || character.lineageId === "variant-human"))) && <label>Perícia concedida<select value={character.speciesChoices.skill} onChange={(event) => updateCharacter("speciesChoices", { ...character.speciesChoices, skill: event.target.value })}><option value="">Escolha</option>{(revisedSpeciesRules && selectedSpecies.id === "elf" ? ["Intuição", "Percepção", "Sobrevivência"] : skills.map((skill) => skill.name)).map((skill) => <option value={skill} key={skill}>{skill}</option>)}</select><small>A proficiência será aplicada automaticamente à ficha.</small></label>}
          {revisedSpeciesRules && selectedSpecies.id === "human" && <label>Talento de Origem extra<select value={character.speciesChoices.originFeat} onChange={(event) => updateCharacter("speciesChoices", { ...character.speciesChoices, originFeat: event.target.value })}><option value="">Escolha</option>{ORIGIN_FEATS_2024.map((feat) => <option value={feat} key={feat}>{feat}</option>)}</select><small>Concedido por Versátil, além do talento do antecedente.</small></label>}
          {!revisedSpeciesRules && character.lineageId === "variant-human" && <label>Talento do Humano Variante<input value={character.speciesChoices.originFeat} onChange={(event) => updateCharacter("speciesChoices", { ...character.speciesChoices, originFeat: event.target.value })} placeholder="Ex.: Alerta" /><small>Regra opcional: confirme a disponibilidade do talento com o mestre.</small></label>}
          {revisedSpeciesRules && SPECIES_WITH_SPELL_ABILITY.has(selectedSpecies.id) && <label>Atributo das magias da espécie<select value={character.speciesChoices.spellAbility} onChange={(event) => updateCharacter("speciesChoices", { ...character.speciesChoices, spellAbility: event.target.value as AbilityKey })}><option value="">Escolha</option><option value="int">Inteligência</option><option value="wis">Sabedoria</option><option value="cha">Carisma</option></select><small>Usado pelas magias concedidas pela linhagem ou legado.</small></label>}
        </div></section>}
        {selectedSpecies && <section className="species-options-panel language-panel"><div className="section-heading compact"><div><span className="eyebrow">{revisedSpeciesRules ? "Idiomas da origem 2024" : "Idiomas clássicos"}</span><h3>{revisedSpeciesRules ? "Comum + dois idiomas" : "Registre os idiomas concedidos"}</h3><p>{revisedSpeciesRules ? "Todo personagem conhece Comum. Escolha mais dois idiomas padrão diferentes." : "Em 2014, raça e antecedente determinam quantos idiomas extras você recebe. Estes campos são opcionais para acomodar cada combinação."}</p></div><span className={`requirement-pill ${!revisedSpeciesRules || (character.languages.every(Boolean) && new Set(character.languages).size === 2) ? "complete" : "required"}`}>{revisedSpeciesRules ? (character.languages.every(Boolean) && new Set(character.languages).size === 2 ? "CONCLUÍDO" : "OBRIGATÓRIO") : "CONFORME A ORIGEM"}</span></div><div className="species-option-grid">{[0, 1].map((index) => <label key={index}>Idioma adicional {index + 1}<select value={character.languages[index] ?? ""} onChange={(event) => { const next = [...character.languages]; next[index] = event.target.value; updateCharacter("languages", next); }}><option value="">{revisedSpeciesRules ? "Escolha" : "Nenhum"}</option>{STANDARD_LANGUAGES_2024.filter((language) => !character.languages.includes(language) || character.languages[index] === language).map((language) => <option key={language} value={language}>{language}</option>)}</select><small>{revisedSpeciesRules ? "Representa criação, cultura e experiências." : "Use somente se sua raça ou antecedente conceder esta escolha."}</small></label>)}</div></section>}
      </div>
    );
    if (builderStep === 2) return (
      <div className="builder-content">
        <span className="eyebrow">O modo de agir</span><h2>Monte sua progressão de classes</h2><p className="lead">Escolha primeiro a classe inicial. Depois, se quiser, distribua os níveis entre outras classes sem perder de vista requisitos, edição e magia.</p>
        <div className={`edition-rule-banner compact ${revisedClassRules ? "" : "legacy"}`}><BookMarked size={20} /><div><strong>A primeira classe continua sendo especial.</strong><p>Ela define Dados de Vida do 1º nível, salvaguardas e equipamento inicial. Classes adicionadas depois usam as proficiências limitadas da regra de multiclasse.</p></div></div>
        {(["2024", "2014"] as Ruleset[]).map((edition) => <section className={`catalog-edition-section ${edition === "2014" ? "legacy-catalog" : ""}`} key={edition}><div className="edition-catalog-head"><div><span>{edition === "2024" ? "Classes revisadas 2024" : "Classes clássicas 2014"}</span><p>{edition === "2024" ? "Livro do Jogador 2024 · progressão revisada" : "Livro do Jogador 2014 · compatível com subclasses clássicas"}</p></div><small>12 classes</small></div><div className="choice-grid class-grid">{classes.map((entry) => { const selected = character.classId === entry.id && character.classRuleset === edition; return <button key={`${edition}-${entry.id}`} className={`choice-card class-card ${selected ? "selected" : ""}`} onClick={() => requestPrimaryClass(entry.id, edition)}><span className="die-badge">d{entry.die}</span><div><strong>{entry.name}</strong><small>Atributo: {entry.primary}</small></div><span className="catalog-badge">PHB {edition}</span><p>{entry.summary}</p><div className="tag-row">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></button>; })}</div></section>)}
        {classLevelEntries.length > 0 && <section className="multiclass-builder-panel">
          <div className="section-heading compact"><div><span className="eyebrow">Composição atual</span><h3>{classDisplay}</h3><p>O nível total é um orçamento fechado. Alterar uma classe transfere níveis entre as trilhas; nunca aumenta o personagem sem você mudar o nível total.</p></div><div className="multiclass-total"><span>DISTRIBUÍDOS</span><strong>{allocatedClassLevels}/{character.level}</strong><small>orçamento fixo</small></div></div>
          <div className="class-budget-rule"><Shield size={18} /><div><strong>Exatamente {character.level} níveis disponíveis.</strong><p>Se uma classe subir, outra cede níveis automaticamente. Para aumentar o personagem, altere primeiro o campo Nível total.</p></div></div>
          <div className="multiclass-entry-list">{classLevelEntries.map((entry, index) => {
            const classDefinition = classes.find((candidate) => candidate.id === entry.classId);
            const subclassPool = entry.ruleset === "2024" ? currentSubclasses : [...legacyCoreSubclasses, ...classicSupplementSubclasses];
            const subclassOptions = subclassPool.filter((candidate) => candidate.classId === entry.classId);
            const unlockLevel = entry.ruleset === "2024" ? 3 : (legacySubclassLevel[entry.classId] ?? 3);
            const failure = multiclassFailures.find((candidate) => candidate.classId === entry.classId);
            return <article className={`multiclass-entry ${failure ? "invalid" : ""}`} key={entry.id}>
              <div className="multiclass-entry-main"><span className="die-badge">d{classDefinition?.die ?? 8}</span><div><span className="entry-kind">{index === 0 ? "CLASSE INICIAL" : `MULTICLASSE ${index}`}</span><strong>{classDefinition?.name}</strong><small>PHB {entry.ruleset} · requisito {requirementLabel(entry.classId)}</small></div></div>
              <label className="multiclass-level-field"><span>Níveis nesta classe</span><input type="number" min={1} max={Math.max(1, character.level - (classLevelEntries.length - 1))} value={entry.level} disabled={classLevelEntries.length === 1} onChange={(event) => updateClassEntryLevel(entry.id, Number(event.target.value))} /><small>{classLevelEntries.length === 1 ? `Todos os ${character.level} níveis pertencem a esta classe.` : "A diferença será transferida entre as outras classes."}</small></label>
              <label className="multiclass-subclass-field"><span>Subclasse</span><select value={entry.subclassId} onChange={(event) => updateClassEntry(entry.id, { subclassId: event.target.value })}><option value="">{entry.level < unlockLevel ? `Planejar para o nível ${unlockLevel}` : "Ainda não escolhida"}</option>{subclassOptions.map((subclass) => <option value={subclass.id} key={`${subclass.source}-${subclass.id}`}>{subclass.name} · {sourceShort(subclass.source)}</option>)}</select><small>{entry.level < unlockLevel ? `Benefícios começam no nível ${unlockLevel} de ${classDefinition?.name}.` : "Disponível no nível atual da classe."}</small></label>
              <div className={`multiclass-requirement ${failure ? "failed" : "met"}`}>{failure ? <CircleHelp size={16} /> : <Check size={16} />}<span>{failure ? `Ajuste os atributos: ${failure.requirement}` : classLevelEntries.length > 1 ? `Requisito atendido: ${requirementLabel(entry.classId)}` : `Se adicionar multiclasse, esta classe exigirá ${requirementLabel(entry.classId)}.`}</span></div>
              {index > 0 && <button className="bare-button multiclass-remove" aria-label={`Remover ${classDefinition?.name}`} title="Remover esta classe" onClick={() => removeClassEntry(entry.id)}><Trash2 size={16} /></button>}
            </article>;
          })}</div>
          {mixedClassEditions && <div className="mixed-edition-inline"><CircleHelp size={18} /><div><strong>Esta ficha combina regras de 2024 e 2014.</strong><p>O cálculo é permitido, mas essa combinação não foi balanceada como uma progressão única. Confirme as interações com o mestre.</p></div></div>}
          <div className="multiclass-add-panel"><div><span className="eyebrow">Adicionar outra classe</span><h4>{noClassLevelBudget ? "Nenhum nível disponível" : "Expanda a progressão"}</h4><p>{noClassLevelBudget ? `Um personagem de nível ${character.level} não pode sustentar mais de ${character.level} classes. Aumente o nível total ou remova uma classe.` : "A nova classe recebe 1 nível retirado automaticamente de uma trilha que tenha níveis disponíveis. Os requisitos de toda a composição também precisam ser atendidos."}</p></div><div className="multiclass-add-controls"><label>Classe<select value={multiclassDraftClassId} onChange={(event) => setMulticlassDraftClassId(event.target.value)} disabled={noClassLevelBudget}><option value="">Escolha uma classe</option>{classes.filter((entry) => !classLevelEntries.some((current) => current.classId === entry.id)).map((entry) => <option value={entry.id} key={entry.id}>{entry.name} · {requirementLabel(entry.id)}</option>)}</select></label><label>Edição<select value={multiclassDraftRuleset} onChange={(event) => setMulticlassDraftRuleset(event.target.value as Ruleset)} disabled={noClassLevelBudget}><option value="2024">Revisado 2024</option><option value="2014">Clássico 2014</option></select></label><button className="primary-button" disabled={!canAddMulticlass} title={noClassLevelBudget ? "Não há nível disponível para abrir outra classe." : multiclassCandidateFailures.length ? "A composição ainda não atende aos requisitos de atributo." : "Adicionar multiclasse"} onClick={requestMulticlass}><Plus size={16} />Adicionar classe</button></div>{multiclassDraftClassId && <div className={`candidate-check ${canAddMulticlass ? "valid" : "invalid"}`}><strong>{canAddMulticlass ? "Pode adicionar" : "Ainda não pode adicionar"}</strong><span>{noClassLevelBudget ? `O orçamento de ${character.level} níveis já está fechado.` : multiclassCandidateFailures.length ? multiclassCandidateFailures.map((failure) => `${classes.find((entry) => entry.id === failure.classId)?.name}: ${failure.requirement}`).join(" · ") : `Requisito ${requirementLabel(multiclassDraftClassId)} atendido.`}</span></div>}</div>
        </section>}
      </div>
    );
    if (builderStep === 3) return (
      <div className="builder-content">
        <span className="eyebrow">Antes da aventura</span><h2>De onde você veio?</h2><p className="lead">Os antecedentes revisados concedem aumentos de atributo e Talento de Origem. Os clássicos preservam a característica narrativa e deixam os aumentos com a raça. Ambos aparecem juntos, com o ano sempre visível.</p>
        {([{ edition: "2024" as Ruleset, label: "Antecedentes revisados 2024", note: "Atributos, Talento de Origem, perícias, ferramenta e equipamento.", entries: backgrounds }, { edition: "2014" as Ruleset, label: "Antecedentes clássicos 2014", note: "Perícias, ferramentas ou idiomas e característica narrativa.", entries: legacyBackgrounds }] as const).map((group) => <section className={`catalog-edition-section ${group.edition === "2014" ? "legacy-catalog" : ""}`} key={group.edition}><div className="edition-catalog-head"><div><span>{group.label}</span><p>{group.note}</p></div><small>{group.entries.length} opções</small></div><div className="choice-grid background-grid">{group.entries.map((entry) => { const legacy = "feature" in entry; const mechanic = legacy ? entry.feature : entry.feat; const selected = character.backgroundId === entry.id && character.backgroundRuleset === group.edition; return <button key={`${group.edition}-${entry.id}`} className={`choice-card background-card ${selected ? "selected" : ""}`} onClick={() => chooseBackground(entry, group.edition)}><span className="choice-check">{selected ? <Check size={15} /> : <ScrollMark />}</span><div><strong>{entry.name}</strong><small>{legacy ? `Característica: ${mechanic}` : `Talento: ${mechanic}`}</small></div><span className={`catalog-badge ${entry.edition === "custom" ? "custom" : ""}`}>{entry.edition === "custom" ? "PERSONALIZADO" : `PHB ${group.edition}`}</span><p>{entry.summary}</p><dl><div><dt>Perícias</dt><dd>{entry.skills.join(" e ")}</dd></div><div><dt>{legacy ? "Ferramentas / idiomas" : "Ferramenta"}</dt><dd>{entry.tool}</dd></div></dl></button>; })}</div></section>)}
        {selectedBackground && <section className={`background-mechanic-panel ${revisedRules ? "revised" : "legacy"}`}><div><span className="eyebrow">{revisedRules ? "Benefício mecânico do antecedente" : "Característica clássica do antecedente"}</span><h3>{revisedRules ? selectedBackground.feat : (selectedBackground as LegacyBackgroundDefinition).feature}</h3><p>{revisedRules ? (originFeatDetails[selectedBackground.feat] ?? "Este Talento de Origem é concedido automaticamente pelo antecedente e fica registrado na ficha.") : (selectedBackground as LegacyBackgroundDefinition).featureDetail}</p></div><span className="catalog-badge">{revisedRules ? "TALENTO DE ORIGEM" : "CARACTERÍSTICA 2014"}</span></section>}
        {selectedBackground && revisedSpeciesRules && revisedBackgroundRules && character.speciesId === "human" && <section className={`species-options-panel ${humanFeatConflict ? "has-conflict" : ""}`}><div className="section-heading compact"><div><span className="eyebrow">Verificação do Humano 2024</span><h3>Dois talentos de origem diferentes</h3><p>O antecedente concede <strong>{selectedBackground.feat}</strong>. O traço Versátil concede outro Talento de Origem.</p></div><span className={`requirement-pill ${humanFeatConflict ? "required" : "complete"}`}>{humanFeatConflict ? "CONFLITO" : "VÁLIDO"}</span></div><div className="species-option-grid"><label>Talento extra do Humano<select value={character.speciesChoices.originFeat} onChange={(event) => updateCharacter("speciesChoices", { ...character.speciesChoices, originFeat: event.target.value })}><option value="">Escolha</option>{ORIGIN_FEATS_2024.filter((feat) => feat !== selectedBackground.feat).map((feat) => <option value={feat} key={feat}>{feat}</option>)}</select><small>Não pode repetir o talento já concedido pelo antecedente.</small></label></div></section>}
        {selectedBackground && Boolean(speciesGrantedSkill) && <section className={`species-options-panel ${speciesSkillConflict ? "has-conflict" : ""}`}><div className="section-heading compact"><div><span className="eyebrow">Verificação de proficiência</span><h3>A perícia da espécie precisa continuar útil</h3><p>{selectedBackground.name} já concede {selectedBackground.skills.join(" e ")}. Escolha outra perícia para o traço da espécie.</p></div><span className={`requirement-pill ${speciesSkillConflict ? "required" : "complete"}`}>{speciesSkillConflict ? "REPETIDA" : "VÁLIDA"}</span></div><div className="species-option-grid"><label>Perícia de {selectedSpecies?.name}<select value={character.speciesChoices.skill} onChange={(event) => updateCharacter("speciesChoices", { ...character.speciesChoices, skill: event.target.value })}><option value="">Escolha</option>{(revisedSpeciesRules && character.speciesId === "elf" ? ["Intuição", "Percepção", "Sobrevivência"] : skills.map((skill) => skill.name)).filter((skill) => !backgroundGrantedSkills.has(skill)).map((skill) => <option value={skill} key={skill}>{skill}</option>)}</select><small>O cálculo da ficha usa as perícias do antecedente e da espécie automaticamente.</small></label></div></section>}
      </div>
    );
    if (builderStep === 4) return (
      <div className="builder-content">
        <div className="section-heading compact"><div><span className="eyebrow">O que os números significam</span><h2>Distribua os atributos</h2></div><button className="ghost-button" onClick={applyRecommendedAbilities}><Sparkles size={16} />Sugerir para {selectedClass?.name ?? "a classe"}</button></div>
        <p className="lead">Primeiro defina os valores-base. Depois, o bônus de {revisedRules ? "antecedente do revisado" : "raça e sub-raça do clássico"} entra automaticamente e mostra o valor final usado pela ficha.</p>
        <div className="method-picker">{([{ id: "standard", name: "Matriz padrão", note: "15, 14, 13, 12, 10, 8" }, { id: "pointbuy", name: "Compra de pontos", note: "27 pontos · valores de 8 a 15" }, { id: "roll", name: "Rolagem", note: "4d6, descarte o menor" }, { id: "free", name: "Livre", note: "Defina com o mestre" }] as const).map((method) => <button key={method.id} className={character.abilityMethod === method.id ? "selected" : ""} onClick={() => { updateCharacter("abilityMethod", method.id); if (method.id === "pointbuy") updateCharacter("abilities", { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }); if (method.id === "standard") updateCharacter("abilities", { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 }); }}><strong>{method.name}</strong><small>{method.note}</small></button>)}</div>
        <div className="ability-method-status">{character.abilityMethod === "pointbuy" && <span className={pointBuyCost > 27 ? "over" : ""}><strong>{27 - pointBuyCost}</strong> pontos restantes</span>}{character.abilityMethod === "roll" && <button className="ghost-button" onClick={rollAbilitySet}><Dices size={16} />Rolar os seis atributos</button>}{character.abilityMethod === "standard" && <span>Distribua a matriz como preferir; a sugestão de classe reorganiza os valores.</span>}{character.abilityMethod === "free" && <span>Valores livres até 30 para campanhas e regras próprias.</span>}</div>
        <section className={`origin-bonus-panel ${revisedRules ? "" : "legacy"}`}>
          <div className="origin-bonus-head"><div><span className="eyebrow">{revisedRules ? "Aumento concedido pelo antecedente" : "Aumento concedido pela raça"}</span><h3>{revisedRules ? (selectedBackground?.name ?? "Escolha um antecedente primeiro") : ([selectedSpecies?.name, selectedLineage?.name].filter(Boolean).join(" · ") || "Escolha uma raça primeiro")}</h3><p>{revisedRules ? (selectedBackground ? `Apenas ${eligibleAbilityKeys.map((key) => abilities.find((ability) => ability.key === key)?.name).join(", ")} podem receber estes bônus.` : "Volte à etapa Passado para liberar a distribuição.") : (classicFlexibleProfile ? "Esta origem permite escolher os atributos abaixo; as opções devem ser diferentes." : "Os aumentos fixos já foram aplicados automaticamente aos valores finais.")}</p></div><span className="catalog-badge">{revisedRules ? "REVISADO 2024" : "CLÁSSICO 2014"}</span></div>
          {revisedRules && selectedBackground && <><div className="bonus-mode-picker"><button className={character.abilityIncrease.mode === "2+1" ? "selected" : ""} onClick={() => updateCharacter("abilityIncrease", { ...character.abilityIncrease, mode: "2+1", primary: eligibleAbilityKeys[0], secondary: eligibleAbilityKeys[1] ?? eligibleAbilityKeys[0] })}><strong>+2 e +1</strong><small>Dois atributos diferentes</small></button><button className={character.abilityIncrease.mode === "1+1+1" ? "selected" : ""} onClick={() => updateCharacter("abilityIncrease", { mode: "1+1+1", primary: eligibleAbilityKeys[0], secondary: eligibleAbilityKeys[1] ?? eligibleAbilityKeys[0], tertiary: eligibleAbilityKeys[2] ?? eligibleAbilityKeys[0] })}><strong>+1, +1 e +1</strong><small>Três atributos diferentes</small></button></div><div className="bonus-select-grid">{([{ key: "primary", label: character.abilityIncrease.mode === "2+1" ? "+2 em" : "+1 em" }, { key: "secondary", label: "+1 em" }, ...(character.abilityIncrease.mode === "1+1+1" ? [{ key: "tertiary" as const, label: "+1 em" }] : [])] as Array<{ key: keyof AbilityIncreaseState; label: string }>).map((slot) => <label key={slot.key}>{slot.label}<select value={character.abilityIncrease[slot.key]} onChange={(event) => updateCharacter("abilityIncrease", { ...character.abilityIncrease, [slot.key]: event.target.value as AbilityKey })}>{eligibleAbilityKeys.map((key) => <option key={key} value={key}>{abilities.find((ability) => ability.key === key)?.name}</option>)}</select></label>)}</div></>}
          {!revisedRules && classicFlexibleProfile && <div className="bonus-select-grid classic">{([{ key: "primary", label: classicFlexibleProfile === "plus-two-plus-one" ? "+2 em" : "+1 em" }, { key: "secondary", label: "+1 em" }] as const).map((slot) => <label key={slot.key}>{slot.label}<select value={character.abilityIncrease[slot.key]} onChange={(event) => updateCharacter("abilityIncrease", { ...character.abilityIncrease, [slot.key]: event.target.value as AbilityKey })}>{eligibleAbilityKeys.map((key) => <option key={key} value={key}>{abilities.find((ability) => ability.key === key)?.name}</option>)}</select></label>)}</div>}
          {!revisedRules && selectedSpecies && <div className="applied-bonus-list">{abilities.filter((ability) => abilityBonuses[ability.key] > 0).map((ability) => <span key={ability.key}><strong>+{abilityBonuses[ability.key]}</strong> {ability.name}</span>)}</div>}
        </section>
        <div className="ability-builder">{abilities.map((ability) => { const min = character.abilityMethod === "pointbuy" ? 8 : character.abilityMethod === "free" ? 1 : 3; const max = character.abilityMethod === "pointbuy" ? 15 : character.abilityMethod === "free" ? 30 : 20; const bonus = abilityBonuses[ability.key]; return <div className={`ability-editor ${bonus ? "has-origin-bonus" : ""}`} key={ability.key}><span>{ability.short}</span><strong>{finalAbilities[ability.key]}</strong><em>{signed(modifier(finalAbilities[ability.key]))}</em><div><button aria-label={`Diminuir ${ability.name}`} onClick={() => updateCharacter("abilities", { ...character.abilities, [ability.key]: Math.max(min, character.abilities[ability.key] - 1) })}><Minus size={15} /></button><button aria-label={`Aumentar ${ability.name}`} disabled={character.abilityMethod === "pointbuy" && (pointBuyCost >= 27 || character.abilities[ability.key] >= 15)} onClick={() => updateCharacter("abilities", { ...character.abilities, [ability.key]: Math.min(max, character.abilities[ability.key] + 1) })}><Plus size={15} /></button></div><small>{ability.name}</small><span className="ability-breakdown">Base {character.abilities[ability.key]}{bonus ? ` · origem +${bonus}` : ""}</span></div>; })}</div>
        <div className="rules-tip"><CircleHelp size={19} /><div><strong>Proficiência é automática.</strong><p>Ela começa em +2 e cresce com o nível. A ficha aplica esse valor em salvaguardas, perícias e magia sempre que sua escolha conceder proficiência.</p></div></div>
      </div>
    );
    if (builderStep === 5) return (
      <div className="builder-content equipment-builder">
        <span className="eyebrow">O que você leva para a primeira sessão</span><h2>Escolha equipamento ou dinheiro.</h2><p className="lead">Classe e antecedente fazem escolhas separadas. Trocar uma opção remove somente os itens e as moedas daquela escolha anterior, sem apagar o que você adicionou manualmente.</p>
        <section className="equipment-choice-section"><div className="section-heading compact"><div><span className="eyebrow">Escolha da classe</span><h3>{selectedClass?.name ?? "Classe não definida"}</h3><p>{classEquipment ? (revisedClassRules ? `Opções de ${classEquipment.source}.` : "Pacote guiado para a versão clássica. Confirme com o mestre as combinações exatas ou substitua pelo ouro inicial da classe.") : "Volte à etapa Classe para liberar o equipamento."}</p></div>{character.classEquipmentChoice && <span className="requirement-pill complete"><Check size={13} /> APLICADO</span>}</div>{classEquipment && <div className="equipment-options">{classEquipment.options.map((entry) => <button key={entry.id} className={character.classEquipmentChoice === entry.id ? "selected" : ""} onClick={() => applyStartingEquipment("class", entry)}><span>{character.classEquipmentChoice === entry.id ? <Check size={16} /> : <Backpack size={16} />}</span><div><strong>{entry.label}</strong><p>{entry.summary}</p></div></button>)}</div>}</section>
        <section className="equipment-choice-section"><div className="section-heading compact"><div><span className="eyebrow">Escolha do antecedente</span><h3>{selectedBackground?.name ?? "Antecedente não definido"}</h3><p>{revisedRules ? "No revisado, escolha o pacote ou 50 PO para comprar os próprios itens." : "No clássico, aplique o pacote temático do antecedente; a alternativa em ouro depende da classe e da decisão do mestre."}</p></div>{character.backgroundEquipmentChoice && <span className="requirement-pill complete"><Check size={13} /> APLICADO</span>}</div>{backgroundPackage && <div className="equipment-options">{[backgroundPackage, { id: "gold", label: revisedRules ? "50 PO" : "Ouro inicial da mesa", summary: revisedRules ? "Receba 50 peças de ouro em vez do pacote." : "Registre 0 agora e ajuste a quantia após a rolagem ou definição do mestre.", items: [], gp: revisedRules ? 50 : 0 }].map((entry) => <button key={entry.id} className={character.backgroundEquipmentChoice === entry.id ? "selected" : ""} onClick={() => applyStartingEquipment("background", entry)}><span>{character.backgroundEquipmentChoice === entry.id ? <Check size={16} /> : <Backpack size={16} />}</span><div><strong>{entry.label}</strong><p>{entry.summary}</p></div></button>)}</div>}</section>
        <section className="currency-panel"><div><span className="eyebrow">Carteira</span><h3>Moedas atuais</h3><p>Edite a qualquer momento. 1 PL = 10 PO; 1 PO = 10 PP; 1 PE = 5 PP; 1 PP = 10 PC.</p></div><div className="currency-grid">{([
          ["cp", "PC", "Cobre"], ["sp", "PP", "Prata"], ["ep", "PE", "Electro"], ["gp", "PO", "Ouro"], ["pp", "PL", "Platina"],
        ] as Array<[keyof CoinState, string, string]>).map(([key, short, name]) => <label key={key}><span>{short}<small>{name}</small></span><input type="number" min={0} value={character.coins[key]} onChange={(event) => updateCharacter("coins", { ...character.coins, [key]: Math.max(0, Number(event.target.value)) })} /></label>)}</div></section>
      </div>
    );
    if (builderStep === 6) return (
      <div className="builder-content">
        <span className="eyebrow">Personalidade que produz escolhas</span><h2>Quem é essa pessoa sob pressão?</h2><p className="lead">Traço, ideal, vínculo e defeito são gatilhos de interpretação. Não precisam limitar o personagem: precisam colocá-lo em movimento.</p>
        <div className="personality-builder">{([{ key: "trait", label: "Traços de personalidade", hint: "Como as pessoas percebem seu jeito de agir?" }, { key: "ideal", label: "Ideal", hint: "Que princípio ele tenta defender?" }, { key: "bond", label: "Vínculo", hint: "Quem ou o que ele não consegue abandonar?" }, { key: "flaw", label: "Defeito", hint: "Como ele machuca tentando acertar?" }] as const).map((field) => <label className="story-field" key={field.key}><span>{field.label}</span><textarea value={character.story[field.key]} onChange={(e) => updateStory(field.key, e.target.value)} placeholder={field.hint} /></label>)}</div>
        <div className="rules-tip"><Sparkles size={19} /><div><strong>Conecte uma qualidade a um custo.</strong><p>“Corajoso” fica jogável quando vira “não aceita recuar, mesmo quando os outros pedem”. A contradição cria decisão; a lista de adjetivos, não.</p></div></div>
      </div>
    );
    return (
      <div className="builder-content review-layout">
        <div className="review-character">
          <div className="review-portrait" style={character.portrait ? { backgroundImage: `url(${character.portrait})` } : undefined}>{!character.portrait && <UserRound size={42} />}</div>
          <span className="eyebrow">Pronto para respirar</span><h2>{character.name || "Personagem sem nome"}</h2><p>{selectedSpecies?.name ?? "Espécie indefinida"} · {classDisplay} · nível {character.level}</p>
          <div className="review-tags"><span>{selectedLineage?.name ?? selectedSpecies?.name ?? "Sem espécie"}</span><span>{classDisplay}</span><span>{selectedBackground?.name ?? "Sem antecedente"}</span><span>Proficiência {signed(pb)}</span></div>
          <button className="primary-button wide" onClick={() => navigate("ficha")}>Abrir ficha completa<ChevronRight size={18} /></button>
        </div>
        <div className="review-sheet">
          <div className="quick-stat-row large"><div><span>CA</span><strong>{10 + dexMod}</strong></div><div><span>PV</span><strong>{maxHp}</strong></div><div><span>CD magia</span><strong>{spellAbility ? spellDc : "—"}</strong></div></div>
          <h3>Resumo das escolhas</h3>
          {[{ label: revisedSpeciesRules ? "Espécie" : "Raça", value: selectedSpecies?.name, note: [selectedLineage?.name, `regras ${character.speciesRuleset}`, character.speciesChoices.size, character.speciesChoices.skill && `Perícia: ${character.speciesChoices.skill}`, character.speciesChoices.originFeat && `Talento: ${character.speciesChoices.originFeat}`].filter(Boolean).join(" · ") || selectedSpecies?.traits.join(" · ") }, { label: "Idiomas", value: "Comum", note: character.languages.filter(Boolean).join(" · ") || (revisedSpeciesRules ? "Dois idiomas adicionais ainda não escolhidos" : "Conforme raça e antecedente") }, { label: classLevelEntries.length > 1 ? "Classes" : "Classe", value: classDisplay, note: `${hitDiceLabel} de vida · nível total ${character.level}${mixedClassEditions ? " · mistura 2024/2014 aprovada pela mesa" : ""}` }, { label: "Antecedente", value: selectedBackground?.name, note: selectedBackground ? `regras ${character.backgroundRuleset} · ${revisedBackgroundRules ? selectedBackground.feat : (selectedBackground as LegacyBackgroundDefinition).feature} · ${selectedBackground.skills.join(" e ")}` : "" }].map((row) => <div className="review-row" key={row.label}><span>{row.label}</span><div><strong>{row.value ?? "Não definido"}</strong><small>{row.note}</small></div></div>)}
        </div>
      </div>
    );
  };

  const renderBuilder = () => (
    <div className="view-enter builder-view">
      <div className="page-title"><div><span className="eyebrow">Criação assistida</span><h1>Construa sem se perder.</h1><p>Você pode voltar e alterar qualquer escolha.</p></div><div className="completion-orb"><strong>{Math.round((builderStep / (builderSteps.length - 1)) * 100)}%</strong><span> da jornada</span></div></div>
      <div className="builder-shell">
        <nav className="builder-steps" aria-label="Etapas da criação">{builderSteps.map((step, index) => { const reachable = index <= builderStep || (index === builderStep + 1 && builderGate.ok); return <button key={step} disabled={!reachable} className={`${builderStep === index ? "active" : ""} ${builderStep > index ? "done" : ""}`} onClick={() => reachable && setBuilderStep(index)}><span>{builderStep > index ? <Check size={14} /> : index + 1}</span><small>{step}</small></button>; })}</nav>
        <div className="builder-stage" key={builderStep}>{renderBuilderStep()}</div>
        <div className="builder-footer"><button className="ghost-button" disabled={builderStep === 0} onClick={() => setBuilderStep((step) => Math.max(0, step - 1))}><ChevronLeft size={17} />Voltar</button><span className={builderGate.ok ? "" : "gate-warning"}>{builderGate.ok ? `Etapa ${builderStep + 1} de ${builderSteps.length}` : builderGate.reason}</span>{builderStep < builderSteps.length - 1 ? <button className="primary-button" disabled={!builderGate.ok} title={builderGate.reason || "Continuar"} onClick={() => setBuilderStep((step) => Math.min(builderSteps.length - 1, step + 1))}>Continuar<ChevronRight size={17} /></button> : <button className="primary-button" disabled={!builderGate.ok} title={builderGate.reason || "Concluir"} onClick={() => navigate("ficha")}>Concluir<Check size={17} /></button>}</div>
      </div>
    </div>
  );

  const renderSheet = () => {
    if (!character.classId && !character.speciesId) return <div className="view-enter"><EmptyState icon={UserRound} title="A ficha ainda está em branco" body="Passe pelo criador para que atributos, proficiências e recursos sejam calculados com você." action="Criar personagem" onAction={() => navigate("criador")} /></div>;
    return (
      <div className="view-enter sheet-view">
        <div className="character-banner">
          <div className="sheet-portrait" style={character.portrait ? { backgroundImage: `url(${character.portrait})` } : undefined}>{!character.portrait && <UserRound size={38} />}</div>
          <div className="character-banner-copy"><span className="eyebrow">Ficha viva · espécie {character.speciesRuleset} · {classLevelEntries.length > 1 ? `${classLevelEntries.length} classes` : `classe ${character.classRuleset}`} · antecedente {character.backgroundRuleset}</span><h1>{character.name || "Sem nome"}</h1><p>{selectedSpecies?.name}{selectedLineage ? ` · ${selectedLineage.name}` : ""} · {classDisplay}</p></div>
          <label className="level-control"><span>Nível total</span><input type="number" min={Math.max(1, classLevelEntries.length)} max={20} value={character.level} onChange={(e) => setTotalCharacterLevel(Number(e.target.value))} /><small>de 20</small></label>
          <div className="proficiency-control"><span>Proficiência</span><strong>{signed(pb)}</strong><small>{character.level < 20 ? `próximo aumento no nível ${Math.min(20, Math.floor((character.level - 1) / 4) * 4 + 5)}` : "valor máximo"}</small></div>
          <button className={`inspiration-button ${character.inspiration ? "active" : ""}`} onClick={() => updateCharacter("inspiration", !character.inspiration)}><Sparkles size={18} />Inspiração</button>
          <button className="multiclass-sheet-button" title="Gerenciar classes e níveis" onClick={() => { setBuilderStep(2); navigate("criador"); }}><Network size={16} /><span>{classLevelEntries.length > 1 ? "Gerenciar classes" : "Adicionar multiclasse"}</span></button>
          <button className="sheet-edit-button" aria-label="Editar ficha" title="Editar escolhas da ficha" onClick={() => { if (revisedSpeciesRules && revisedClassRules && revisedBackgroundRules) setSheetEditOpen(true); else { setBuilderStep(1); navigate("criador"); } }}><Pencil size={17} /></button>
        </div>
        <section className="effects-bar"><div><span className="eyebrow"><Tag size={13} /> Estado atual</span>{character.effects.length === 0 && <small>Nenhuma condição, bônus ou penalidade ativa.</small>}</div><div className="effect-chips">{character.effects.map((effect) => <button key={effect.id} className={effect.kind} title="Clique para remover" onClick={() => updateCharacter("effects", character.effects.filter((entry) => entry.id !== effect.id))}><span>{effect.name}</span><X size={13} /></button>)}</div><select aria-label="Adicionar condição" defaultValue="" onChange={(e) => { if (e.target.value) addEffect(e.target.value); e.target.value = ""; }}><option value="">+ Condição</option>{commonConditions.map((condition) => <option key={condition}>{condition}</option>)}</select><button className="tiny-add buff" onClick={() => addEffect("Novo bônus", "buff")}>+ Bônus</button><button className="tiny-add debuff" onClick={() => addEffect("Nova penalidade", "debuff")}>+ Penalidade</button></section>
        <div className="sheet-grid">
          <aside className="abilities-column">{abilities.map((ability) => <div className="ability-score" key={ability.key}><span>{ability.short}</span><strong>{signed(modifier(finalAbilities[ability.key]))}</strong><small><b>{finalAbilities[ability.key]}</b>{abilityBonuses[ability.key] ? <em>origem +{abilityBonuses[ability.key]}</em> : null}</small></div>)}</aside>
          <div className="sheet-main">
            <div className="combat-stats">
              <div className="combat-stat shield-stat"><Shield size={25} /><span>Classe de Armadura</span><strong>{armorClass}</strong>{overrides.armorClass !== null && <small className="manual-mark">ajuste manual</small>}</div>
              <div className="combat-stat"><Swords size={23} /><span>Iniciativa</span><strong>{signed(initiative)}</strong>{overrides.initiative !== null && <small className="manual-mark">ajuste manual</small>}</div>
              <div className="combat-stat"><span className="speed-icon">↟</span><span>Deslocamento</span><strong>{movementSpeed}<small>m</small></strong>{overrides.speed !== null && <small className="manual-mark">ajuste manual</small>}</div>
              <div className="combat-stat"><Eye size={23} /><span>Percepção passiva</span><strong>{passivePerception}</strong>{overrides.passivePerception !== null && <small className="manual-mark">ajuste manual</small>}</div>
            </div>
            <div className="hp-panel">
              <div className="hp-title"><Heart size={20} /><span>Pontos de Vida</span><small>máximo {maxHp}</small></div>
              <div className="hp-controls"><button onClick={() => updateCharacter("currentHp", Math.max(0, (character.currentHp || maxHp) - 1))}><Minus /></button><input type="number" value={character.currentHp || maxHp} onChange={(e) => updateCharacter("currentHp", Math.min(maxHp, Math.max(0, Number(e.target.value))))} /><button onClick={() => updateCharacter("currentHp", Math.min(maxHp, (character.currentHp || maxHp) + 1))}><Plus /></button><div className="hp-bar"><span style={{ width: `${Math.min(100, ((character.currentHp || maxHp) / maxHp) * 100)}%` }} /></div></div>
              <label>PV temporários<input type="number" min={0} value={character.tempHp} onChange={(e) => updateCharacter("tempHp", Math.max(0, Number(e.target.value)))} /></label>
            </div>
            <div className="sheet-panels">
              <section className="sheet-card"><div className="panel-title"><span>Salvaguardas</span><small>Prof. {signed(pb)}</small></div>{abilities.map((ability) => { const proficient = selectedClass?.saves.includes(ability.key as never); const extra = overrides.saveBonuses[ability.key] ?? 0; return <div className="sheet-line" key={ability.key}><i className={proficient ? "filled" : ""} /><span>{ability.name}</span><strong>{signed(modifier(finalAbilities[ability.key]) + (proficient ? pb : 0) + extra)}</strong>{extra !== 0 && <small className="line-adjustment">{signed(extra)}</small>}</div>; })}</section>
              <section className="sheet-card skills-card"><div className="panel-title"><span>Perícias</span><small>Clique para treinar</small></div>{skills.map((skill) => { const speciesGranted = speciesGrantedSkill === skill.name; const backgroundGranted = backgroundGrantedSkills.has(skill.name); const manuallyProficient = character.proficientSkills.includes(skill.name); const proficient = effectiveProficientSkills.has(skill.name); const extra = overrides.skillBonuses[skill.name] ?? 0; const value = modifier(finalAbilities[skill.ability]) + (proficient ? pb : 0) + extra; return <button className="sheet-line" key={skill.name} title={speciesGranted ? `Concedida por ${selectedSpecies?.name}` : backgroundGranted ? `Concedida por ${selectedBackground?.name}` : "Clique para alternar proficiência"} onClick={() => { if (!speciesGranted && !backgroundGranted) updateCharacter("proficientSkills", manuallyProficient ? character.proficientSkills.filter((entry) => entry !== skill.name) : [...character.proficientSkills, skill.name]); }}><i className={proficient ? "filled" : ""} /><span>{skill.name}<small>{skill.ability.toUpperCase()}{speciesGranted ? ` · ${selectedSpecies?.name}` : backgroundGranted ? ` · ${selectedBackground?.name}` : ""}</small></span><strong>{signed(value)}</strong>{extra !== 0 && <small className="line-adjustment">{signed(extra)}</small>}</button>; })}</section>
              <section className="sheet-card multiclass-magic-card"><div className="panel-title"><span>Conjuração</span><small>{classLevelEntries.length > 1 ? "multiclasse" : selectedSpellcastingProfile.edition === "custom" ? "manual" : selectedSpellcastingProfile.edition}</small></div>{spellStatsByClass.length || spellAbility ? <><div className="class-spell-stats">{spellStatsByClass.length > 0 ? spellStatsByClass.map((stat) => <div key={stat.entry.id}><span>{stat.className} {stat.entry.level}<small>{stat.ability?.toUpperCase() ?? "—"} · {stat.entry.ruleset}</small></span><strong>CD {stat.dc}<small>ataque {signed(stat.attack)}</small></strong></div>) : <div><span>Progressão personalizada<small>{spellAbility?.toUpperCase()}</small></span><strong>CD {spellDc}<small>ataque {signed(spellAttack)}</small></strong></div>}</div>{displayedSharedSpellcastingRow && <div className="spell-slot-block"><span>{character.spellcastingMode === "manual" ? "Espaços personalizados" : `Espaços compartilhados · conjurador efetivo ${sharedCasterLevel}`}</span><div className="sheet-slot-summary">{displayedSharedSpellcastingRow.slots.map((count, index) => count > 0 ? <span key={index}>{index + 1}º × {count}</span> : null)}</div></div>}{pactRows.map(({ entry, row }) => row?.pactSlots ? <div className="spell-slot-block pact" key={entry.id}><span>Magia de Pacto · Bruxo {entry.level}</span><div className="sheet-slot-summary"><span>{row.pactSlots} × {row.pactLevel}º círculo</span></div></div> : null)}<button className="text-link" onClick={() => navigate("progressao")}>Abrir progressão completa <ChevronRight size={15} /></button><button className="text-link" onClick={() => navigate("magias")}>Escolher magias <ChevronRight size={15} /></button></> : <><p className="muted-copy">Nenhuma das classes atuais possui conjuração básica. Talentos ou subclasses ainda podem conceder magia.</p><button className="text-link" onClick={() => navigate("progressao")}>Configurar na Progressão <ChevronRight size={15} /></button></>}</section>
            </div>
          </div>
        </div>
        <section className="sheet-module attack-module">
          <div className="module-head"><div><span className="eyebrow"><Swords size={14} /> Ações rápidas</span><h2>Ataques e combinações</h2><p>Registre arma, magia ou combo. A expressão de dano fica pronta para consultar na mesa.</p></div><button className="ghost-button" onClick={addAttack}><Plus size={16} />Adicionar</button></div>
          {character.attacks.length === 0 ? <div className="module-empty"><Swords size={25} /><span>Nenhum ataque personalizado.</span><small>Adicione o dano da arma, uma sequência de ações ou o combo que você mais usa.</small></div> : <div className="attack-grid">{character.attacks.map((attack) => <article className="attack-card" key={attack.id}><div className="attack-card-head"><select aria-label="Ícone" value={attack.icon} onChange={(e) => updateCharacter("attacks", character.attacks.map((entry) => entry.id === attack.id ? { ...entry, icon: e.target.value } : entry))}>{attackIcons.map((icon) => <option key={icon}>{icon}</option>)}</select><input value={attack.name} onChange={(e) => updateCharacter("attacks", character.attacks.map((entry) => entry.id === attack.id ? { ...entry, name: e.target.value } : entry))} /><button className="bare-button" aria-label="Excluir ataque" onClick={() => updateCharacter("attacks", character.attacks.filter((entry) => entry.id !== attack.id))}><Trash2 size={15} /></button></div><div className="damage-expression"><label><span>Dados</span><input type="number" min={1} max={20} value={attack.quantity} onChange={(e) => updateCharacter("attacks", character.attacks.map((entry) => entry.id === attack.id ? { ...entry, quantity: Math.max(1, Number(e.target.value)) } : entry))} /></label><label><span>d</span><select value={attack.die} onChange={(e) => updateCharacter("attacks", character.attacks.map((entry) => entry.id === attack.id ? { ...entry, die: Number(e.target.value) } : entry))}>{[4, 6, 8, 10, 12, 20, 100].map((die) => <option key={die}>{die}</option>)}</select></label><label><span>Mod.</span><input type="number" value={attack.modifier} onChange={(e) => updateCharacter("attacks", character.attacks.map((entry) => entry.id === attack.id ? { ...entry, modifier: Number(e.target.value) } : entry))} /></label><strong>{attack.quantity}d{attack.die}{attack.modifier === 0 ? "" : signed(attack.modifier)}</strong></div><textarea value={attack.detail} onChange={(e) => updateCharacter("attacks", character.attacks.map((entry) => entry.id === attack.id ? { ...entry, detail: e.target.value } : entry))} /></article>)}</div>}
        </section>

        <section className="sheet-module progression-callout"><div><span className="eyebrow"><Sparkles size={14} /> Progressão integrada</span><h2>Nível, habilidades e magia agora vivem juntos.</h2><p>Abra a trilha 1–20 para consultar qualquer nível, planejar o futuro ou substituir a progressão mágica da classe.</p></div><button className="primary-button" onClick={() => navigate("progressao")}>Abrir Progressão <ChevronRight size={16} /></button></section>

        <section className="sheet-module features-module">
          <div className="module-head"><div><span className="eyebrow"><BookMarked size={14} /> Habilidades</span><h2>O que torna este personagem único</h2><p>Clique em qualquer traço para entender seu uso. O lápis edita aquele registro; o botão “+” cria um novo.</p></div><button className="ghost-button" onClick={() => openFeatureEditor("personalizado")}><Plus size={16} />Nova habilidade</button></div>
          <div className="feature-columns">
            <div>
              <div className="feature-column-head"><strong>Espécie e linhagem</strong><button aria-label="Adicionar novo traço de espécie" title="Adicionar novo traço" onClick={() => openFeatureEditor("espécie")}><Plus size={14} /></button></div>
              {selectedSpecies?.traits.map((trait) => {
                const baseKey = `${selectedSpecies.id}:trait:${trait}`;
                const override = character.featureNotes.find((note) => note.baseKey === baseKey);
                const name = override?.name ?? trait;
                const summary = override?.summary ?? traitDetail(trait, selectedSpecies.name, selectedSpecies.summary);
                return <article className="feature-note automatic interactive" key={baseKey}><button className="feature-note-main" onClick={() => setActiveFeature({ name, summary, source: override?.source ?? selectedSpecies.source, level: 1, unlocked: true, access: override?.access ?? selectedSpecies.access })}><strong>{name}</strong><p>{summary}</p><small>{selectedSpecies.name} · {sourceShort(override?.source ?? selectedSpecies.source)}</small></button><button className="feature-edit-button" aria-label={`Editar ${name}`} title="Editar este traço" onClick={() => openFeatureEditor("espécie", { name, summary, source: override?.source ?? selectedSpecies.source, access: override?.access ?? selectedSpecies.access, baseKey })}><Pencil size={14} /></button></article>;
              })}
              {selectedLineage && (() => { const baseKey = `${selectedSpecies?.id}:lineage:${selectedLineage.id}`; const override = character.featureNotes.find((note) => note.baseKey === baseKey); const name = override?.name ?? selectedLineage.name; const summary = override?.summary ?? selectedLineage.summary; return <article className="feature-note automatic interactive"><button className="feature-note-main" onClick={() => setActiveFeature({ name, summary, source: override?.source ?? selectedLineage.source, level: 1, unlocked: true, access: override?.access ?? selectedLineage.access })}><strong>{name}</strong><p>{summary}</p><small>Linhagem · {sourceShort(override?.source ?? selectedLineage.source)}</small></button><button className="feature-edit-button" aria-label={`Editar ${name}`} title="Editar esta linhagem" onClick={() => openFeatureEditor("espécie", { name, summary, source: override?.source ?? selectedLineage.source, access: override?.access ?? selectedLineage.access, baseKey })}><Pencil size={14} /></button></article>; })()}
              {character.speciesChoices.skill && <article className="feature-note automatic"><div className="feature-note-main"><strong>Perícia da espécie: {character.speciesChoices.skill}</strong><p>Proficiência concedida por {selectedSpecies?.id === "elf" ? "Sentidos Aguçados" : "Habilidoso"}; já aplicada aos cálculos da ficha.</p><small>{selectedSpecies?.name} · regras 2024</small></div></article>}
              {character.speciesChoices.originFeat && <article className="feature-note automatic"><div className="feature-note-main"><strong>Talento extra: {character.speciesChoices.originFeat}</strong><p>{revisedSpeciesRules ? "Talento de Origem adicional concedido pelo traço Versátil do Humano 2024." : "Talento concedido pela regra opcional do Humano Variante 2014."}</p><small>Humano · {revisedSpeciesRules ? "PHB 2024" : "PHB 2014"}</small></div></article>}
              {character.speciesChoices.spellAbility && <article className="feature-note automatic"><div className="feature-note-main"><strong>Atributo da magia inata: {abilities.find((entry) => entry.key === character.speciesChoices.spellAbility)?.name}</strong><p>Usado para a CD e os ataques das magias concedidas pela linhagem ou legado da espécie.</p><small>{selectedSpecies?.name} · regras 2024</small></div></article>}
              {selectedBackground && <article className="feature-note automatic interactive"><button className="feature-note-main" onClick={() => setActiveFeature({ name: revisedRules ? selectedBackground.feat : (selectedBackground as LegacyBackgroundDefinition).feature, summary: revisedRules ? (originFeatDetails[selectedBackground.feat] ?? selectedBackground.summary) : (selectedBackground as LegacyBackgroundDefinition).featureDetail, source: revisedRules ? "Livro do Jogador 2024" : "Livro do Jogador 2014", level: 1, unlocked: true, access: "official" })}><strong>{revisedRules ? `Talento de Origem: ${selectedBackground.feat}` : `Característica: ${(selectedBackground as LegacyBackgroundDefinition).feature}`}</strong><p>{revisedRules ? (originFeatDetails[selectedBackground.feat] ?? selectedBackground.summary) : (selectedBackground as LegacyBackgroundDefinition).featureDetail}</p><small>{selectedBackground.name} · {revisedRules ? "PHB 2024" : "PHB 2014"}</small></button></article>}
              {character.featureNotes.filter((note) => note.origin === "espécie" && !note.baseKey).map((note) => <FeatureNoteCard key={note.id} note={note} onOpen={() => setActiveFeature({ name: note.name, summary: note.summary, source: note.source, level: 1, unlocked: true, access: note.access })} onEdit={() => setFeatureEditor(note)} />)}
            </div>
            <div>
              <div className="feature-column-head"><strong>Classe e personalizados</strong><button aria-label="Adicionar nova habilidade de classe" title="Adicionar nova habilidade" onClick={() => openFeatureEditor("classe")}><Plus size={14} /></button></div>
              {classFeatureEntries.slice(-12).map((feature) => { const baseKey = `${feature.ruleset}:${feature.classId}:class:${feature.level}:${feature.name}`; const override = character.featureNotes.find((note) => note.baseKey === baseKey); const name = override?.name ?? feature.name; const summary = override?.summary ?? featureDetail(feature.name, feature.summary); return <article className="feature-note automatic interactive" key={baseKey}><button className="feature-note-main" onClick={() => setActiveFeature({ name, summary, source: override?.source ?? feature.source, level: feature.level, unlocked: true, access: override?.access ?? feature.access })}><strong>{name}</strong><p>{summary}</p><small>{feature.className} {feature.level} · {sourceShort(override?.source ?? feature.source)}</small></button><button className="feature-edit-button" aria-label={`Editar ${name}`} title="Editar esta habilidade" onClick={() => openFeatureEditor("classe", { name, summary, source: override?.source ?? feature.source, access: override?.access ?? feature.access, baseKey })}><Pencil size={14} /></button></article>; })}
              {character.featureNotes.filter((note) => note.origin !== "espécie" && !note.baseKey).map((note) => <FeatureNoteCard key={note.id} note={note} onOpen={() => setActiveFeature({ name: note.name, summary: note.summary, source: note.source, level: 1, unlocked: true, access: note.access })} onEdit={() => setFeatureEditor(note)} />)}
            </div>
          </div>
        </section>

        <section className="sheet-module identity-module"><div className="module-head"><div><span className="eyebrow"><UserRound size={14} /> Pessoa e passado</span><h2>Além dos números</h2></div><button className="ghost-button" onClick={() => navigate("historia")}><Pencil size={15} />Abrir oficina</button></div><div className="identity-grid"><div><h3>Aparência</h3><dl>{Object.entries({ Idade: character.appearance.age, Altura: character.appearance.height, Peso: character.appearance.weight, Olhos: character.appearance.eyes, Cabelo: character.appearance.hair, Pele: character.appearance.skin, Porte: character.appearance.build, Marcas: character.appearance.marks, Idiomas: ["Comum", ...character.languages.filter(Boolean)].join(", ") }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl></div><div><h3>Personalidade</h3><dl><div><dt>Traço</dt><dd>{character.story.trait || "—"}</dd></div><div><dt>Ideal</dt><dd>{character.story.ideal || "—"}</dd></div><div><dt>Vínculo</dt><dd>{character.story.bond || "—"}</dd></div><div><dt>Defeito</dt><dd>{character.story.flaw || "—"}</dd></div></dl></div><div className="backstory-sheet-preview"><h3>História</h3><p>{character.story.fullBackstory || character.story.concept || "Use a oficina narrativa para escrever a história completa do personagem."}</p></div></div></section>
        <section className="sheet-spellbook">
          <div className="sheet-spellbook-head"><div><span className="eyebrow"><BookMarked size={14} /> Grimório da ficha</span><h2>Magias de {character.name || "seu personagem"}</h2><p>{selectedSpells.length ? "Clique em uma magia para abrir todos os detalhes durante a sessão." : "As magias adicionadas no compêndio aparecem aqui, organizadas por círculo."}</p></div><button className="ghost-button" onClick={() => navigate("magias")}><Plus size={16} />Adicionar magias</button></div>
          {selectedSpells.length ? <div className="sheet-spell-groups">{Array.from(new Set(selectedSpells.map((spell) => spell.level))).sort((a, b) => a - b).map((level) => <div className="sheet-spell-group" key={level}><div className="spell-group-label"><strong>{level === 0 ? "Truques" : `${level}º círculo`}</strong><span>{selectedSpells.filter((spell) => spell.level === level).length}</span></div><div className="sheet-spell-list">{selectedSpells.filter((spell) => spell.level === level).map((spell) => { const translated = spellPt(spell); return <button key={spell.id} onClick={() => setActiveSpell(spell)}><span>{translated.name}</span><small>{schoolPt[spell.school] ?? spell.school}{spell.concentration ? " · Concentração" : ""}</small><ChevronRight size={15} /></button>; })}</div></div>)}</div> : <div className="spellbook-empty"><BookOpen size={28} /><span>Seu grimório ainda está vazio.</span><button className="text-link" onClick={() => navigate("magias")}>Explorar o compêndio <ChevronRight size={15} /></button></div>}
        </section>
        <textarea className="character-notes" value={character.notes} onChange={(e) => updateCharacter("notes", e.target.value)} placeholder="Anotações rápidas de sessão, condições, lembretes…" />
      </div>
    );
  };

  const renderSingleClassProgression = () => {
    const viewedLevel = Math.max(1, Math.min(20, selectedProgressionLevel));
    const viewedFeatures = progression.filter((feature) => feature.level === viewedLevel);
    const viewedMagic = effectiveSpellcastingRows[viewedLevel - 1];
    const viewedUnlocked = viewedLevel <= character.level;
    const viewedSlots = viewedMagic?.pactSlots
      ? [`${viewedMagic.pactSlots} espaços de Pacto de ${viewedMagic.pactLevel}º círculo`]
      : viewedMagic?.slots.flatMap((count, index) => count > 0 ? [`${index + 1}º × ${count}`] : []) ?? [];
    return (
      <div className="view-enter progression-view">
        <div className="page-title"><div><span className="eyebrow">Classe, nível e magia no mesmo caminho</span><h1>Progressão do personagem.</h1><p>Clique em qualquer nível para entender exatamente o que muda. A classe preenche tudo automaticamente, mas qualquer campanha pode substituir a progressão mágica ou editar cada célula.</p></div><button className="ghost-button" onClick={() => navigate("magias")}><BookOpen size={17} />Abrir compêndio</button></div>

        <section className="progression-overview">
          <div><span>Classe</span><strong>{selectedClass?.name ?? "Não definida"}</strong><small>{selectedSubclass?.name ?? `Regras ${character.classRuleset}`}</small></div>
          <div className="current-level-overview"><span>Nível atual</span><strong>{character.level}</strong><small>Bônus de proficiência {signed(proficiency(character.level))}</small></div>
          <div><span>Progressão mágica</span><strong>{selectedSpellcastingProfile.label}</strong><small>{character.spellcastingMode === "auto" ? "Sincronizada" : "Personalizada"}</small></div>
          <div><span>CD de magia</span><strong>{spellAbility ? spellDc : "—"}</strong><small>{spellAbility ? `Atributo ${spellAbility.toUpperCase()}` : "Sem atributo definido"}</small></div>
        </section>

        <section className="level-navigator-panel">
          <div className="module-head"><div><span className="eyebrow">Níveis 1–20</span><h2>Escolha um nível para investigar</h2><p>Azul indica o nível atual; níveis futuros continuam clicáveis como planejamento.</p></div><span className="requirement-pill complete">NÍVEL {viewedLevel} EM FOCO</span></div>
          <div className="level-navigator">{Array.from({ length: 20 }, (_, index) => index + 1).map((level) => { const features = progression.filter((feature) => feature.level === level); const magic = effectiveSpellcastingRows[level - 1]; const changesMagic = Boolean(magic?.pactSlots || magic?.slots.some(Boolean) || magic?.cantrips || magic?.prepared); return <button key={level} className={`${level === character.level ? "current" : ""} ${level === viewedLevel ? "selected" : ""} ${level > character.level ? "future" : ""}`} onClick={() => setSelectedProgressionLevel(level)}><span>{level}</span><div><strong>Nível {level}</strong><small>{features.length ? features.map((feature) => feature.name).join(" · ") : changesMagic ? "A magia continua evoluindo" : "Progressão contínua"}</small></div></button>; })}</div>
        </section>

        <section className="level-inspector">
          <div className="level-inspector-head"><div><span className="eyebrow">Leitura do nível</span><h2>Nível {viewedLevel}</h2><p>{viewedUnlocked ? "Este nível já faz parte da ficha." : "Prévia de um nível futuro — você pode planejar e anotar sem alterar o nível atual."}</p></div>{viewedLevel !== character.level && <button className="primary-button" onClick={() => updateCharacter("level", viewedLevel)}>Definir como nível atual</button>}</div>
          <div className="level-inspector-grid">
            <article><span className="inspector-label">Estrutura</span><dl><div><dt>Bônus de proficiência</dt><dd>{signed(proficiency(viewedLevel))}</dd></div><div><dt>Dado de Vida</dt><dd>d{hitDie}</dd></div><div><dt>Classe</dt><dd>{selectedClass?.name ?? "—"}</dd></div></dl></article>
            <article className="level-features"><span className="inspector-label">Habilidades recebidas</span>{viewedFeatures.length ? viewedFeatures.map((feature) => <button key={`${feature.level}-${feature.name}`} onClick={() => setActiveFeature({ ...feature, unlocked: viewedUnlocked })}><strong>{feature.name}</strong><small>{feature.summary}</small><ChevronRight size={16} /></button>) : <div className="level-empty"><strong>Nenhuma habilidade nova da classe</strong><p>O personagem ainda melhora por Pontos de Vida, proficiência, recursos anteriores ou progressão mágica.</p></div>}</article>
            <article><span className="inspector-label">Conjuração neste nível</span><dl><div><dt>Truques</dt><dd>{viewedMagic?.cantrips ?? "—"}</dd></div><div><dt>{selectedSpellcastingProfile.preparedLabel}</dt><dd>{viewedMagic?.prepared ?? "por fórmula"}</dd></div></dl><div className="viewed-slots">{viewedSlots.length ? viewedSlots.map((slot) => <span key={slot}>{slot}</span>) : <small>Sem espaços de magia neste nível.</small>}</div></article>
          </div>
          <label className="progression-note"><span>Anotação personalizada do nível {viewedLevel}</span><textarea value={character.progressionNotes[String(viewedLevel)] ?? ""} onChange={(event) => updateCharacter("progressionNotes", { ...character.progressionNotes, [String(viewedLevel)]: event.target.value })} placeholder="Ex.: talento concedido pelo mestre, característica da subclasse, melhoria alternativa…" /></label>
        </section>

        <section className="spellcasting-controls progression-magic-controls">
          <div><span className="eyebrow">Motor de conjuração</span><h3>{character.spellcastingMode === "auto" ? "Seguindo classe e subclasse" : "Exceção personalizada ativa"}</h3><p>{character.spellcastingMode === "auto" ? `A tabela foi derivada de ${selectedClass?.name ?? "nenhuma classe"}${selectedSubclass ? ` · ${selectedSubclass.name}` : ""}, edição ${character.classRuleset}.` : "Você escolheu uma tabela independente da classe. É assim que um Guerreiro pode receber a progressão de Mago, por exemplo."}</p></div>
          <div className="spellcasting-control-fields">
            <label>{character.spellcastingMode === "auto" ? "Usar uma exceção" : "Tabela-base da exceção"}<select value={character.spellcastingMode === "auto" ? "" : character.spellcastingProfileId} onChange={(event) => event.target.value && chooseSpellcastingProfile(event.target.value)}><option value="">Seguir classe/subclasse</option>{spellcastingProfiles.filter((profile) => profile.id !== "none").map((profile) => <option key={profile.id} value={profile.id}>{profile.label} · {profile.edition}</option>)}</select></label>
            <label>Atributo de conjuração<select value={character.spellcastingAbility} onChange={(event) => updateCharacter("spellcastingAbility", event.target.value as AbilityKey | "")}><option value="">Automático pela classe</option>{abilities.map((ability) => <option value={ability.key} key={ability.key}>{ability.name}</option>)}</select></label>
            {character.spellcastingMode === "auto" ? <button className="ghost-button" onClick={editAutomaticSpellcasting}><Pencil size={15} />Editar célula por célula</button> : <button className="ghost-button" onClick={() => setCharacter((current) => ({ ...current, spellcastingMode: "auto", spellcastingRows: [] }))}><Sparkles size={15} />Restaurar classe</button>}
          </div>
        </section>

        <section className="spellcasting-table-panel progression-table-panel">
          <div className="module-head"><div><span className="eyebrow">Tabela unificada</span><h2>Classe e magia, nível por nível</h2><p>Cada linha mostra bônus de proficiência, habilidades novas e espaços de magia. Clique na linha para abrir o nível acima.</p></div><span className={`requirement-pill ${character.spellcastingMode === "manual" ? "required" : "complete"}`}>{character.spellcastingMode === "manual" ? "EDIÇÃO MANUAL" : "SINCRONIZADA"}</span></div>
          <div className="spellcasting-table-scroll"><table className="spellcasting-table progression-table"><thead><tr><th>Nível</th><th>Prof.</th><th>Características</th><th>Truques</th><th>{selectedSpellcastingProfile.preparedLabel}</th>{Array.from({ length: 9 }, (_, index) => <th key={index}>{index + 1}º</th>)}<th>Pacto</th><th>Observação</th></tr></thead><tbody>{effectiveSpellcastingRows.map((row) => { const manual = character.spellcastingMode === "manual"; const features = progression.filter((feature) => feature.level === row.level); return <tr key={row.level} className={`${row.level === character.level ? "current" : ""} ${row.level === viewedLevel ? "selected-row" : ""}`} onClick={() => setSelectedProgressionLevel(row.level)}><th>{row.level}</th><td>{signed(proficiency(row.level))}</td><td className="feature-cell">{features.length ? features.map((feature) => feature.name).join(" · ") : "—"}</td><td>{manual ? <input aria-label={`Truques no nível ${row.level}`} type="number" min={0} value={row.cantrips ?? ""} onClick={(event) => event.stopPropagation()} onChange={(event) => updateSpellcastingRow(row.level, { cantrips: event.target.value === "" ? null : Number(event.target.value) })} /> : row.cantrips ?? "—"}</td><td>{manual ? <input aria-label={`${selectedSpellcastingProfile.preparedLabel} no nível ${row.level}`} type="number" min={0} value={row.prepared ?? ""} onClick={(event) => event.stopPropagation()} onChange={(event) => updateSpellcastingRow(row.level, { prepared: event.target.value === "" ? null : Number(event.target.value) })} /> : row.prepared ?? "fórmula"}</td>{row.slots.map((slot, circle) => <td key={circle}>{manual ? <input aria-label={`Espaços de ${circle + 1}º círculo no nível ${row.level}`} type="number" min={0} value={slot} onClick={(event) => event.stopPropagation()} onChange={(event) => updateSpellSlot(row.level, circle, Number(event.target.value))} /> : slot || "—"}</td>)}<td>{manual ? <div className="pact-inputs"><input aria-label={`Espaços de pacto no nível ${row.level}`} type="number" min={0} value={row.pactSlots} onClick={(event) => event.stopPropagation()} onChange={(event) => updateSpellcastingRow(row.level, { pactSlots: Number(event.target.value) })} /><span>×</span><input aria-label={`Círculo dos espaços de pacto no nível ${row.level}`} type="number" min={0} max={9} value={row.pactLevel} onClick={(event) => event.stopPropagation()} onChange={(event) => updateSpellcastingRow(row.level, { pactLevel: Number(event.target.value) })} /></div> : row.pactSlots ? `${row.pactSlots}× ${row.pactLevel}º` : "—"}</td><td>{manual ? <input className="note-input" aria-label={`Observação do nível ${row.level}`} value={row.note} onClick={(event) => event.stopPropagation()} onChange={(event) => updateSpellcastingRow(row.level, { note: event.target.value })} /> : row.note || character.progressionNotes[String(row.level)] || "—"}</td></tr>; })}</tbody></table></div>
        </section>
        <section className="spellcasting-footnote"><BookMarked size={18} /><div><strong>Automático não significa engessado</strong><p>Conjuradores completos, meio conjuradores, Magia de Pacto e subclasses de um terço recebem suas tabelas próprias. A exceção permite trocar o modelo inteiro; “Editar célula por célula” transforma a tabela atual em uma versão exclusiva da ficha.</p></div></section>
      </div>
    );
  };

  const renderProgression = () => {
    if (classLevelEntries.length <= 1) return renderSingleClassProgression();

    const focusedEntry = classLevelEntries.find((entry) => entry.id === progressionClassEntryId) ?? classLevelEntries[0];
    const focusedClass = classes.find((entry) => entry.id === focusedEntry.classId);
    const focusedProgression = focusedEntry.ruleset === "2024" ? (classProgressions[focusedEntry.classId] ?? []) : (legacyClassProgressions[focusedEntry.classId] ?? []);
    const focusedProfileId = automaticSpellcastingProfileId(focusedEntry.classId, focusedEntry.subclassId, focusedEntry.ruleset);
    const focusedProfile = spellcastingProfiles.find((profile) => profile.id === focusedProfileId) ?? spellcastingProfiles.at(-1)!;
    const focusedRows = focusedProfile.rows;
    const viewedLevel = Math.max(1, Math.min(20, selectedProgressionLevel));
    const viewedFeatures = focusedProgression.filter((feature) => feature.level === viewedLevel);
    const viewedMagic = focusedRows[viewedLevel - 1];
    const viewedUnlocked = viewedLevel <= focusedEntry.level;
    const maximumFocusedLevel = character.level - (classLevelEntries.length - 1);
    const canApplyViewedLevel = viewedLevel <= maximumFocusedLevel;
    const requiredTotalLevel = viewedLevel + classLevelEntries.length - 1;
    const focusedSpellStat = spellStatsByClass.find((stat) => stat.entry.id === focusedEntry.id);
    return (
      <div className="view-enter progression-view multiclass-progression-view">
        <div className="page-title"><div><span className="eyebrow">Progressão multiclasse</span><h1>Cada classe cresce na própria trilha.</h1><p>O nível total controla proficiência e truques. O nível de cada classe libera suas habilidades, subclasse e magias preparadas ou conhecidas.</p></div><button className="ghost-button" onClick={() => { setBuilderStep(2); navigate("criador"); }}><Network size={17} />Gerenciar classes</button></div>

        <section className="multiclass-track-picker"><div className="module-head"><div><span className="eyebrow">Composição · {allocatedClassLevels}/{character.level} níveis distribuídos</span><h2>{classDisplay}</h2><p>Escolha uma trilha para consultar ou redistribuir. O nível total permanece fixo; uma classe só cresce usando níveis cedidos pelas outras.</p></div><span className={`requirement-pill ${multiclassFailures.length ? "required" : "complete"}`}>{multiclassFailures.length ? "REQUISITOS PENDENTES" : "ORÇAMENTO FECHADO"}</span></div><div className="multiclass-track-grid">{classLevelEntries.map((entry, index) => { const definition = classes.find((candidate) => candidate.id === entry.classId); const active = entry.id === focusedEntry.id; return <button key={entry.id} className={active ? "active" : ""} onClick={() => { setProgressionClassEntryId(entry.id); setSelectedProgressionLevel(entry.level); }}><span>{index === 0 ? "INICIAL" : `CLASSE ${index + 1}`}</span><strong>{definition?.name}</strong><small>Nível {entry.level} · {entry.ruleset} · d{definition?.die}</small><i style={{ width: `${entry.level / character.level * 100}%` }} /></button>; })}</div></section>

        <section className="multiclass-magic-overview"><div className="module-head"><div><span className="eyebrow">Motor inteligente de magia</span><h2>Espaços combinados; repertórios separados.</h2><p>Você aprende e prepara magias como membro individual de cada classe. Apenas os espaços comuns são combinados. Magia de Pacto permanece separada e recupera conforme Bruxo.</p></div>{character.spellcastingMode === "manual" && <span className="requirement-pill required">EXCEÇÃO MANUAL</span>}</div><div className="magic-engine-grid"><article><span>Nível de conjurador efetivo</span><strong>{sharedCasterLevel || "—"}</strong><small>Completo + metade/terço conforme classe, subclasse e edição.</small></article><article className="shared-slots"><span>{character.spellcastingMode === "manual" ? "Espaços personalizados" : "Espaços compartilhados"}</span><div>{displayedSharedSpellcastingRow?.slots.some(Boolean) ? displayedSharedSpellcastingRow.slots.map((count, index) => count ? <b key={index}>{index + 1}º × {count}</b> : null) : <small>Nenhum espaço comum.</small>}</div></article>{pactRows.map(({ entry, row }) => <article className="pact-slots" key={entry.id}><span>Magia de Pacto · Bruxo {entry.level}</span><strong>{row?.pactSlots ? `${row.pactSlots} × ${row.pactLevel}º` : "—"}</strong><small>Separados; retornam em Descanso Curto ou Longo.</small></article>)}</div><div className="class-casting-grid">{spellStatsByClass.map((stat) => <article key={stat.entry.id}><span>{stat.className} {stat.entry.level}<small>{stat.entry.ruleset}</small></span><dl><div><dt>Atributo</dt><dd>{stat.ability?.toUpperCase() ?? "—"}</dd></div><div><dt>CD</dt><dd>{stat.dc}</dd></div><div><dt>Ataque</dt><dd>{signed(stat.attack)}</dd></div></dl></article>)}</div></section>

        <section className="progression-overview"><div><span>Trilha em foco</span><strong>{focusedClass?.name}</strong><small>{focusedEntry.ruleset} · nível {focusedEntry.level} nessa classe</small></div><div className="current-level-overview"><span>Nível total</span><strong>{character.level}</strong><small>Proficiência {signed(pb)}</small></div><div><span>Progressão da classe</span><strong>{focusedProfile.label}</strong><small>{focusedProfile.kind === "pact" ? "Magia de Pacto separada" : focusedProfile.description}</small></div><div><span>Conjuração da classe</span><strong>{focusedSpellStat ? `CD ${focusedSpellStat.dc}` : "—"}</strong><small>{focusedSpellStat?.ability ? `${focusedSpellStat.ability.toUpperCase()} · ataque ${signed(focusedSpellStat.attack)}` : "Sem conjuração nesta trilha"}</small></div></section>

        <section className="level-navigator-panel"><div className="module-head"><div><span className="eyebrow">Níveis de {focusedClass?.name} 1–20</span><h2>Investigue a trilha da classe</h2><p>O marcador atual usa o nível de {focusedClass?.name}; a proficiência continua usando o nível total do personagem.</p></div><span className="requirement-pill complete">NÍVEL {viewedLevel} EM FOCO</span></div><div className="level-navigator">{Array.from({ length: 20 }, (_, index) => index + 1).map((level) => { const features = focusedProgression.filter((feature) => feature.level === level); const magic = focusedRows[level - 1]; const changesMagic = Boolean(magic?.pactSlots || magic?.slots.some(Boolean) || magic?.cantrips || magic?.prepared); return <button key={level} className={`${level === focusedEntry.level ? "current" : ""} ${level === viewedLevel ? "selected" : ""} ${level > focusedEntry.level ? "future" : ""}`} onClick={() => setSelectedProgressionLevel(level)}><span>{level}</span><div><strong>{focusedClass?.name} {level}</strong><small>{features.length ? features.map((feature) => feature.name).join(" · ") : changesMagic ? "A conjuração da classe evolui" : "Progressão contínua"}</small></div></button>; })}</div></section>

        <section className="level-inspector"><div className="level-inspector-head"><div><span className="eyebrow">Leitura da classe</span><h2>{focusedClass?.name} {viewedLevel}</h2><p>{viewedUnlocked ? `Este nível já faz parte da trilha de ${focusedClass?.name}.` : canApplyViewedLevel ? `Pode ser aplicado sem alterar o nível total ${character.level}; a diferença será retirada das outras classes.` : `Não cabe no orçamento atual. Mantendo todas as classes, o personagem precisaria ser pelo menos nível ${requiredTotalLevel}.`}</p></div>{viewedLevel !== focusedEntry.level && <button className="primary-button" disabled={!canApplyViewedLevel} title={canApplyViewedLevel ? "Redistribuir níveis sem alterar o nível total" : `Aumente o nível total para pelo menos ${requiredTotalLevel}`} onClick={() => updateClassEntryLevel(focusedEntry.id, viewedLevel)}>{canApplyViewedLevel ? `Redistribuir para ${focusedClass?.name} ${viewedLevel}` : `Exige nível total ${requiredTotalLevel}`}</button>}</div><div className="level-inspector-grid"><article><span className="inspector-label">Estrutura</span><dl><div><dt>Nível da classe</dt><dd>{viewedLevel}</dd></div><div><dt>Orçamento total</dt><dd>{character.level}</dd></div><div><dt>Máximo nesta composição</dt><dd>{maximumFocusedLevel}</dd></div><div><dt>Proficiência do personagem</dt><dd>{signed(proficiency(character.level))}</dd></div><div><dt>Dado de Vida</dt><dd>d{focusedClass?.die}</dd></div></dl></article><article className="level-features"><span className="inspector-label">Habilidades recebidas</span>{viewedFeatures.length ? viewedFeatures.map((feature) => <button key={`${feature.level}-${feature.name}`} onClick={() => setActiveFeature({ ...feature, unlocked: viewedUnlocked })}><strong>{feature.name}</strong><small>{feature.summary}</small><ChevronRight size={16} /></button>) : <div className="level-empty"><strong>Nenhuma habilidade nova</strong><p>Dados de Vida e recursos anteriores ainda acompanham este nível.</p></div>}</article><article><span className="inspector-label">Magia desta classe</span><dl><div><dt>Truques da classe</dt><dd>{viewedMagic?.cantrips ?? "—"}</dd></div><div><dt>{focusedProfile.preparedLabel}</dt><dd>{viewedMagic?.prepared ?? "por fórmula"}</dd></div></dl><div className="viewed-slots">{focusedProfile.kind === "pact" && viewedMagic?.pactSlots ? <span>{viewedMagic.pactSlots} espaços de Pacto de {viewedMagic.pactLevel}º</span> : <small>Os espaços comuns reais aparecem no motor combinado acima.</small>}</div></article></div><label className="progression-note"><span>Anotação de {focusedClass?.name} {viewedLevel}</span><textarea value={character.progressionNotes[`${focusedEntry.id}:${viewedLevel}`] ?? ""} onChange={(event) => updateCharacter("progressionNotes", { ...character.progressionNotes, [`${focusedEntry.id}:${viewedLevel}`]: event.target.value })} placeholder="Talento, escolha de subclasse, regra do mestre ou lembrete desta trilha…" /></label></section>

        <section className="spellcasting-controls progression-magic-controls"><div><span className="eyebrow">Exceção da mesa</span><h3>{character.spellcastingMode === "auto" ? "Cálculo oficial combinado" : "Tabela personalizada ativa"}</h3><p>{character.spellcastingMode === "auto" ? "A ficha combina automaticamente os níveis de conjurador. Use uma exceção somente quando uma regra da mesa ou subclasse exigir outra tabela." : "A tabela manual substitui os espaços compartilhados do personagem; Magia de Pacto continua indicada separadamente."}</p></div><div className="spellcasting-control-fields"><label>{character.spellcastingMode === "auto" ? "Usar uma exceção" : "Tabela-base da exceção"}<select value={character.spellcastingMode === "auto" ? "" : character.spellcastingProfileId} onChange={(event) => event.target.value && chooseSpellcastingProfile(event.target.value)}><option value="">Seguir cálculo multiclasse</option>{spellcastingProfiles.filter((profile) => profile.id !== "none").map((profile) => <option key={profile.id} value={profile.id}>{profile.label} · {profile.edition}</option>)}</select></label>{character.spellcastingMode === "auto" ? <button className="ghost-button" onClick={() => { const base = sharedSpellcastingProfile; setCharacter((current) => ({ ...current, spellcastingMode: "manual", spellcastingProfileId: base.id, spellcastingRows: cloneSpellcastingRows(base.rows) })); }}><Pencil size={15} />Editar espaços por nível total</button> : <button className="ghost-button" onClick={() => setCharacter((current) => ({ ...current, spellcastingMode: "auto", spellcastingRows: [] }))}><Sparkles size={15} />Restaurar cálculo oficial</button>}</div></section>

        {character.spellcastingMode === "manual" && <section className="spellcasting-table-panel progression-table-panel"><div className="module-head"><div><span className="eyebrow">Tabela excepcional</span><h2>Espaços por nível total</h2><p>Esta tabela substitui somente o conjunto compartilhado. Clique e edite as células para refletir a regra da mesa.</p></div><span className="requirement-pill required">EDIÇÃO MANUAL</span></div><div className="spellcasting-table-scroll"><table className="spellcasting-table progression-table"><thead><tr><th>Nível total</th>{Array.from({ length: 9 }, (_, index) => <th key={index}>{index + 1}º</th>)}<th>Observação</th></tr></thead><tbody>{effectiveSpellcastingRows.map((row) => <tr key={row.level} className={row.level === character.level ? "current" : ""}><th>{row.level}</th>{row.slots.map((slot, circle) => <td key={circle}><input aria-label={`Espaços de ${circle + 1}º círculo no nível total ${row.level}`} type="number" min={0} value={slot} onChange={(event) => updateSpellSlot(row.level, circle, Number(event.target.value))} /></td>)}<td><input className="note-input" aria-label={`Observação do nível total ${row.level}`} value={row.note} onChange={(event) => updateSpellcastingRow(row.level, { note: event.target.value })} /></td></tr>)}</tbody></table></div></section>}

        <section className="spellcasting-footnote"><BookMarked size={18} /><div><strong>Mago + Bruxo, sem escolher um vencedor</strong><p>O Mago mantém grimório, preparo por nível de Mago e Inteligência. O Bruxo mantém magias de Bruxo, Carisma e espaços de Pacto. Os espaços de Pacto podem conjurar magias preparadas de outra classe, e os espaços comuns podem conjurar magias de Bruxo, desde que a magia seja conhecida ou preparada.</p></div></section>
      </div>
    );
  };

  const renderSpells = () => (
    <div className="view-enter compendium-view">
      <div className="page-title"><div><span className="eyebrow">Compêndio por edição e fonte</span><h1>Magias sem labirinto.</h1><p>{revisedSpellCount} magias revisadas do SRD 5.2.1 e {legacySpellCount} magias únicas de suplementos clássicos, sem duplicar nomes que já receberam versão 2024.</p></div><button className="primary-button" onClick={() => setCustomSpellOpen(true)}><Plus size={17} />Criar magia</button></div>
      <div className="filter-bar">
        <label className="search-field"><Search size={18} /><input value={spellSearch} onChange={(e) => setSpellSearch(e.target.value)} placeholder="Buscar por nome ou efeito…" /></label>
        <select value={spellLevel} onChange={(e) => setSpellLevel(e.target.value)}><option value="all">Todos os círculos</option><option value="0">Truques</option>{Array.from({ length: 9 }, (_, index) => <option value={index + 1} key={index + 1}>Círculo {index + 1}</option>)}</select>
        <select value={spellSchool} onChange={(e) => setSpellSchool(e.target.value)}><option value="all">Todas as escolas</option>{Object.entries(schoolPt).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select>
        <select value={spellClass} onChange={(e) => setSpellClass(e.target.value)}><option value="all">Todas as classes</option>{classes.filter((entry) => entry.spellAbility).map((entry) => <option value={classIdToEnglish[entry.id]} key={entry.id}>{entry.name}</option>)}</select>
        <select value={spellSource} onChange={(e) => setSpellSource(e.target.value)}><option value="all">Todas as fontes</option><option value="open">SRD 5.2.1 · revisado</option><option value="legacy">Todos os suplementos clássicos</option>{spellSources.map((source) => <option key={source} value={source}>{sourceShort(source)} · {source}</option>)}<option value="Criação própria">Criações próprias</option></select>
      </div>
      <div className="book-source-strip expanded"><span><BookOpen size={14} />Coleções</span><button className={spellSource === "open" ? "active" : ""} onClick={() => setSpellSource(spellSource === "open" ? "all" : "open")}><strong>Revisado 2024 · 5.5e</strong><small>{revisedSpellCount} magias · SRD 5.2.1</small></button><button className={spellSource === "legacy" ? "active" : ""} onClick={() => setSpellSource(spellSource === "legacy" ? "all" : "legacy")}><strong>Suplementos clássicos · 5e</strong><small>{legacySpellCount} magias únicas · XGtE, TCoE, FToD e SCC</small></button><p>Em um personagem revisado, use a versão 2024 quando ela existir. As opções antigas que não foram reimpressas continuam identificadas como legado compatível.</p></div>
      <div className="result-meta"><span><strong>{filteredSpells.length}</strong> resultados</span><span>{character.selectedSpellIds.length} na sua ficha</span></div>
      <div className="spell-grid">{filteredSpells.slice(0, 100).map((spell) => { const translated = spellPt(spell); const legacy = !["SRD 5.2.1", "Criação própria"].includes(spell.source); return <article className={`spell-card ${legacy ? "legacy" : ""}`} key={spell.id} onClick={() => setActiveSpell(spell)}><div className="spell-level">{spell.level === 0 ? "T" : spell.level}</div><div className="spell-card-copy"><span>{schoolPt[spell.school] ?? spell.school}{spell.ritual ? " · Ritual" : ""}</span><h3>{translated.name}</h3>{translated.name !== spell.name && <small className="original-spell-name">{spell.name}</small>}<small className="spell-source-line" title={spell.source}><b>{sourceShort(spell.source)}</b> · {legacy ? "LEGADO 5e" : spell.source === "SRD 5.2.1" ? "REVISADO 5.5e" : "PERSONALIZADA"}{spell.page ? ` · p. ${spell.page}` : ""}</small><p>{localizeSpellFact(spell.castingTime)} · {localizeSpellFact(spell.range)}</p><div className="tag-row">{spell.save && <span>Salv. {spell.save}</span>}{spell.dice && <span>{spell.dice}</span>}{spell.concentration && <span>Concentração</span>}{spell.classes.slice(0, 2).map((entry) => <span key={entry}>{classPt[entry] ?? entry}</span>)}</div></div><button className={`spell-add ${character.selectedSpellIds.includes(spell.id) ? "selected" : ""}`} aria-label={character.selectedSpellIds.includes(spell.id) ? "Remover da ficha" : "Adicionar à ficha"} onClick={(event) => { event.stopPropagation(); toggleSpell(spell.id); }}>{character.selectedSpellIds.includes(spell.id) ? <Check size={17} /> : <Plus size={17} />}</button></article>; })}</div>
      {filteredSpells.length > 100 && <p className="list-limit">Mostrando os primeiros 100 resultados. Use os filtros para encontrar uma magia específica.</p>}
    </div>
  );

  const renderInventory = () => {
    const filteredItems = items.filter((item) => `${item.name} ${item.type} ${item.detail}`.toLowerCase().includes(inventorySearch.toLowerCase()));
    return (
      <div className="view-enter inventory-view">
        <div className="page-title"><div><span className="eyebrow">Equipamento</span><h1>O que você carrega importa.</h1><p>Adicione itens abertos do SRD ou controle os seus próprios.</p></div><div className={`weight-badge ${carryingPercent > 100 ? "over" : ""}`}><Backpack size={19} /><strong>{totalWeight.toFixed(1)} <small>/ {carryingCapacity.toFixed(1)} kg</small></strong><span>{carryingPercent > 100 ? "acima da capacidade" : "capacidade por Força"}</span><i><b style={{ width: `${Math.min(100, carryingPercent)}%` }} /></i></div></div>
        <section className="currency-panel inventory-currency"><div><span className="eyebrow">Carteira</span><h3>Moedas</h3><p>PC cobre · PP prata · PE electro · PO ouro · PL platina.</p></div><div className="currency-grid">{([ ["cp", "PC", "Cobre"], ["sp", "PP", "Prata"], ["ep", "PE", "Electro"], ["gp", "PO", "Ouro"], ["pp", "PL", "Platina"] ] as Array<[keyof CoinState, string, string]>).map(([key, short, name]) => <label key={key}><span>{short}<small>{name}</small></span><input type="number" min={0} value={character.coins[key]} onChange={(event) => updateCharacter("coins", { ...character.coins, [key]: Math.max(0, Number(event.target.value)) })} /></label>)}</div></section>
        <div className="inventory-layout">
          <section className="catalog-panel"><label className="search-field"><Search size={18} /><input value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="Buscar equipamento…" /></label><div className="item-catalog">{filteredItems.map((item) => <button key={item.name} onClick={() => addInventory(item)}><span><strong>{item.name}</strong><small>{item.type} · {item.cost}</small></span><p>{item.detail}</p><Plus size={17} /></button>)}</div></section>
          <section className="backpack-panel"><div className="panel-title"><span><Backpack size={18} />Na mochila</span><span className="panel-inline-actions"><small>{character.inventory.length} tipos de item</small><button aria-label="Criar equipamento" title="Criar equipamento" onClick={() => updateCharacter("inventory", [...character.inventory, { id: uid("item"), name: "Item personalizado", quantity: 1, weight: 0, detail: "Clique nos campos para editar", equipped: false }])}><Pencil size={14} /></button></span></div>{character.inventory.length === 0 ? <div className="mini-empty"><Backpack size={27} /><p>Sua mochila está vazia.</p><span>Escolha algo no catálogo.</span></div> : <div className="inventory-list">{character.inventory.map((entry) => <div className="inventory-row" key={entry.id}><button className={`equip-toggle ${entry.equipped ? "active" : ""}`} onClick={() => updateCharacter("inventory", character.inventory.map((item) => item.id === entry.id ? { ...item, equipped: !item.equipped } : item))}>{entry.equipped ? <Check size={14} /> : null}</button><div className="editable-item-copy"><input value={entry.name} onChange={(e) => updateCharacter("inventory", character.inventory.map((item) => item.id === entry.id ? { ...item, name: e.target.value } : item))} /><input value={entry.detail} onChange={(e) => updateCharacter("inventory", character.inventory.map((item) => item.id === entry.id ? { ...item, detail: e.target.value } : item))} /></div><div className="quantity-control"><button onClick={() => updateCharacter("inventory", character.inventory.map((item) => item.id === entry.id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item))}><Minus size={13} /></button><span>{entry.quantity}</span><button onClick={() => updateCharacter("inventory", character.inventory.map((item) => item.id === entry.id ? { ...item, quantity: item.quantity + 1 } : item))}><Plus size={13} /></button></div><label className="editable-weight"><input aria-label={`Peso de ${entry.name}`} type="number" min={0} step={0.1} value={entry.weight} onChange={(e) => updateCharacter("inventory", character.inventory.map((item) => item.id === entry.id ? { ...item, weight: Math.max(0, Number(e.target.value)) } : item))} /><span>kg</span></label><button className="bare-button" onClick={() => updateCharacter("inventory", character.inventory.filter((item) => item.id !== entry.id))}><Trash2 size={16} /></button></div>)}</div>}</section>
        </div>
      </div>
    );
  };

  const updateStory = (key: keyof StoryState, value: string) => updateCharacter("story", { ...character.story, [key]: value });
  const storyFields: Array<{ key: keyof StoryState; label: string; hint: string }> = [
    { key: "concept", label: "Conceito em uma frase", hint: "Ex.: um curandeiro que teme ser necessário demais." },
    { key: "origin", label: "Origem: o mundo normal", hint: "Onde vivia, com quem e qual rotina parecia permanente?" },
    { key: "rupture", label: "Ruptura: o que tornou a aventura inevitável?", hint: "Uma escolha, perda, dívida, descoberta ou convite recusado." },
    { key: "desire", label: "O que ele realmente quer?", hint: "Um objetivo ativo, não apenas uma qualidade." },
    { key: "fear", label: "O que torna esse desejo perigoso?", hint: "Medo, custo, contradição ou consequência." },
    { key: "bond", label: "Quem ancora essa pessoa ao mundo?", hint: "Uma pessoa, lugar, juramento ou memória." },
    { key: "flaw", label: "Como ele machuca tentando acertar?", hint: "Um defeito que produz decisões durante o jogo." },
    { key: "secret", label: "O que ele não conta?", hint: "Pode ser algo que o próprio personagem ainda não entende." },
    { key: "openThread", label: "Ponta solta para o mestre", hint: "Uma pergunta sem resposta, deliberadamente." },
  ];

  const renderStory = () => (
    <div className="view-enter story-view">
      <div className="page-title"><div><span className="eyebrow">Oficina narrativa</span><h1>História não é currículo.</h1><p>É origem, ruptura, desejo, contradição e decisões que ainda não aconteceram.</p></div><button className="ghost-button" onClick={() => setStoryPrompt(storyPrompts[Math.floor(Math.random() * storyPrompts.length)])}><Sparkles size={16} />Nova provocação</button></div>
      <div className="story-method"><div><span>1</span><strong>Origem</strong><small>O que parecia normal?</small></div><i /><div><span>2</span><strong>Ruptura</strong><small>O que não pôde ser ignorado?</small></div><i /><div><span>3</span><strong>Desejo</strong><small>O que o faz agir?</small></div><i /><div><span>4</span><strong>Contradição</strong><small>Como ele próprio complica tudo?</small></div><i /><div><span>5</span><strong>Ponta solta</strong><small>O que pertence ao mestre?</small></div></div>
      <div className="story-prompt-card"><span>Pergunta do oráculo</span><blockquote>“{storyPrompt}”</blockquote><button onClick={() => updateStory("openThread", character.story.openThread ? `${character.story.openThread}\n${storyPrompt}` : storyPrompt)}>Usar como ponta solta<ChevronRight size={15} /></button></div>
      <div className="story-layout"><section className="story-form">{storyFields.map((field, index) => <label className="story-field" key={field.key}><span><i>{String(index + 1).padStart(2, "0")}</i>{field.label}</span><textarea value={character.story[field.key]} onChange={(e) => updateStory(field.key, e.target.value)} placeholder={field.hint} /></label>)}</section><aside className="story-preview"><span className="eyebrow">Síntese viva</span><h2>{character.name || "Seu personagem"}</h2><p className="story-concept">{character.story.concept || "Defina o conceito para vê-lo nascer aqui."}</p><div className="story-thread"><small>Veio de</small><strong>{character.story.origin || "um lugar ainda sem forma"}</strong></div><div className="story-thread"><small>Ele deseja</small><strong>{character.story.desire || "algo que ainda não foi nomeado"}</strong></div><div className="story-thread"><small>mas teme</small><strong>{character.story.fear || "o preço de conseguir"}</strong></div><div className="story-thread"><small>e deixa ao mestre</small><strong>{character.story.openThread || "uma pergunta ainda em branco"}</strong></div><p className="story-advice">Uma boa história entrega ao mestre ferramentas, não conclusões. Deixe ao menos uma relação, ameaça ou lembrança sem explicação definitiva.</p></aside></div>
      <section className="backstory-editor"><div className="module-head"><div><span className="eyebrow"><BookOpen size={14} /> História completa</span><h2>Transforme as respostas em narrativa</h2><p>O botão monta apenas um primeiro esqueleto. A voz, as cenas e as escolhas continuam sendo suas.</p></div><button className="primary-button" onClick={buildBackstory}><Sparkles size={16} />Montar rascunho</button></div><textarea value={character.story.fullBackstory} onChange={(e) => updateStory("fullBackstory", e.target.value)} placeholder="Conte aqui a história do personagem com suas próprias palavras…" /></section>
    </div>
  );

  const renderBoard = () => (
    <div className="view-enter board-view">
      <div className="page-title board-title"><div><span className="eyebrow">Mapas mentais livres</span><h1>Conecte o que ainda não faz sentido.</h1><p>Crie quantos quadros precisar. Cada um guarda suas próprias notas, imagens e relações.</p></div><div className="board-toolbar"><button className="ghost-button" onClick={addBoardNote}><Plus size={16} />Nota</button><button className={`ghost-button ${connectFrom ? "active" : ""}`} disabled={!boardSelected} onClick={() => setConnectFrom(boardSelected)}><Link2 size={16} />{connectFrom ? "Escolha o destino" : "Conectar"}</button><label className="zoom-control">{Math.round(boardZoom * 100)}%<input type="range" min="0.65" max="1.25" step="0.05" value={boardZoom} onChange={(e) => setBoardZoom(Number(e.target.value))} /></label>{boardSelected && <IconButton label="Excluir somente a nota selecionada" onClick={deleteSelectedNode}><Trash2 size={17} /></IconButton>}</div></div>
      <div className="board-switcher"><div className="board-tabs" role="tablist" aria-label="Seus quadros">{boards.map((board) => <button role="tab" aria-selected={board.id === activeBoard.id} className={board.id === activeBoard.id ? "active" : ""} key={board.id} onClick={() => { setActiveBoardId(board.id); setBoardSelected(null); setConnectFrom(null); }}>{board.name}<small>{board.nodes.length}</small></button>)}</div><div className="board-actions"><button className="ghost-button" onClick={createBoard}><FolderPlus size={16} />Novo quadro</button><button className="bare-button board-rename" onClick={renameActiveBoard} title="Renomear quadro"><Pencil size={16} /></button>{boards.length > 1 && <button className="bare-button board-delete" onClick={deleteActiveBoard} title="Excluir este quadro"><Trash2 size={16} /></button>}</div></div>
      <div className="mindmap-frame" tabIndex={0} onPaste={handleBoardPaste} onClick={(event) => { if (event.target === event.currentTarget) setBoardSelected(null); }}>
        <div className="paste-hint"><ImagePlus size={15} />Ctrl + V para colar uma imagem</div>
        <div className="mindmap-world" style={{ transform: `scale(${boardZoom})` }}>
          <svg className="board-lines" width="1400" height="850">{boardEdges.map((edge, index) => { const from = boardNodes.find((node) => node.id === edge.from); const to = boardNodes.find((node) => node.id === edge.to); if (!from || !to) return null; const x1 = from.x + 110, y1 = from.y + 70, x2 = to.x + 110, y2 = to.y + 70; return <g key={`${edge.from}-${edge.to}-${index}`}><path d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`} /><circle cx={x2} cy={y2} r="3" /></g>; })}</svg>
          {boardNodes.map((node) => <article key={node.id} className={`board-node ${node.color} ${boardSelected === node.id ? "selected" : ""} ${connectFrom === node.id ? "connecting" : ""}`} style={{ left: node.x, top: node.y }} onPointerDown={(event) => startNodeDrag(event, node)} onClick={() => clickBoardNode(node.id)}>{node.image && <img src={node.image} alt="Referência colada" draggable={false} />}<strong contentEditable suppressContentEditableWarning onBlur={(e) => setBoardNodes((nodes) => nodes.map((entry) => entry.id === node.id ? { ...entry, title: e.currentTarget.textContent || "Sem título" } : entry))}>{node.title}</strong><p contentEditable suppressContentEditableWarning onBlur={(e) => setBoardNodes((nodes) => nodes.map((entry) => entry.id === node.id ? { ...entry, body: e.currentTarget.textContent || "" } : entry))}>{node.body}</p></article>)}
        </div>
      </div>
    </div>
  );

  const renderLibrary = () => (
    <div className="view-enter library-view">
      <div className="page-title"><div><span className="eyebrow">Banco persistente</span><h1>Suas fichas, além deste dispositivo.</h1><p>Salve versões completas no banco do Arcana, abra outro personagem ou importe uma ficha enviada por um jogador.</p></div><div className="page-title-actions"><button className="ghost-button" onClick={startNewCharacter}><Plus size={16} />Nova ficha</button><button className="ghost-button" onClick={() => libraryImportInput.current?.click()}><FileUp size={16} />Importar ficha</button><input ref={libraryImportInput} type="file" accept="application/json,.json" onChange={importCharacter} hidden /><button className="primary-button" onClick={saveCharacterToCloud} disabled={cloudBusy}><Save size={16} />{character.cloudId ? "Atualizar ficha" : "Salvar ficha atual"}</button></div></div>
      <section className="library-current"><div className="library-avatar">{character.portrait ? <img src={character.portrait} alt="" /> : <UserRound size={26} />}</div><div><span className="eyebrow">Aberta agora</span><h2>{character.name || "Ficha ainda sem nome"}</h2><p>{[selectedSpecies?.name, classDisplay, `nível ${character.level}`].filter(Boolean).join(" · ")}</p></div><span className={`cloud-state ${character.cloudId ? "saved" : ""}`}>{character.cloudId ? "NO BANCO" : "SÓ NESTE DISPOSITIVO"}</span></section>
      {cloudError && <div className="cloud-error"><CircleHelp size={18} /><span>{cloudError}</span><button onClick={refreshCloudRecords}>Tentar novamente</button></div>}
      <div className="library-heading"><div><span className="eyebrow">Personagens salvos</span><h2>Banco de fichas</h2></div><button className="bare-button" onClick={refreshCloudRecords} disabled={cloudBusy}><RotateCcw size={16} /></button></div>
      {cloudBusy && !cloudRecords.length ? <div className="library-loading"><Database size={24} /><span>Consultando o banco…</span></div> : cloudRecords.length ? <div className="library-grid">{cloudRecords.map((record) => <article key={record.id} className={record.id === character.cloudId ? "active" : ""}><div className="library-card-top"><span>NÍVEL {record.level}</span><small>{new Date(record.updatedAt).toLocaleDateString("pt-BR")}</small></div><h3>{record.name}</h3><p>{record.summary || "Personagem sem resumo mecânico"}</p><small>{record.player ? `Jogador: ${record.player}` : "Jogador não informado"}</small><div><button className="ghost-button" onClick={() => loadCharacterFromCloud(record.id)} disabled={cloudBusy}>Abrir ficha</button><button className="bare-button danger" aria-label={`Excluir ${record.name}`} onClick={() => deleteCharacterFromCloud(record.id)} disabled={cloudBusy}><Trash2 size={16} /></button></div></article>)}</div> : <div className="library-empty"><Database size={31} /><h3>O banco ainda está vazio.</h3><p>Salve a ficha aberta para criar o primeiro registro persistente.</p><button className="primary-button" onClick={saveCharacterToCloud} disabled={cloudBusy}><Save size={16} />Salvar primeira ficha</button></div>}
    </div>
  );

  const renderRules = () => {
    const filteredRules = quickRules.filter((rule) => ruleCategory === "Todas" || rule.category === ruleCategory);
    const columns = [filteredRules.filter((_, index) => index % 2 === 0), filteredRules.filter((_, index) => index % 2 === 1)];
    return (
      <div className="view-enter rules-view">
        <div className="page-title"><div><span className="eyebrow">Consulta rápida</span><h1>Regras no momento certo.</h1><p>Resumos para a mesa; cada cartão abre sem empurrar ou esticar o cartão da outra coluna.</p></div><a className="ghost-button" href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">Abrir SRD oficial<ChevronRight size={16} /></a></div>
        <div className="rule-categories">{["Todas", ...Array.from(new Set(quickRules.map((rule) => rule.category)))].map((category) => <button key={category} className={ruleCategory === category ? "active" : ""} onClick={() => setRuleCategory(category)}>{category}</button>)}</div>
        <div className="rules-grid">{columns.map((column, columnIndex) => <div className="rules-column" key={columnIndex}>{column.map((rule) => { const index = filteredRules.indexOf(rule); return <details key={rule.title}><summary><span>{String(index + 1).padStart(2, "0")}</span><strong>{rule.title}<small>{rule.category}</small></strong><ChevronRight size={17} /></summary><p>{rule.body}</p></details>; })}</div>)}</div>
        <section className="source-panel"><div><BookOpen size={24} /><span><strong>Bases de regras</strong><small>SRD 5.2.1 revisado · SRD 5.1 clássico</small></span></div><p>O modo 2024 usa o SRD 5.2.1. O modo 2014 preserva opções do SRD 5.1 e identifica conteúdo compatível de suplementos por livro. As duas bases são disponibilizadas pela Wizards of the Coast sob a licença Creative Commons Attribution 4.0.</p><small>Arcana é uma ferramenta independente compatível com a quinta edição. Resumos de opções não abertas são redação editorial própria e não substituem os livros. Não é afiliada nem endossada pela Wizards of the Coast.</small></section>
      </div>
    );
  };

  const renderSection = () => {
    switch (section) {
      case "criador": return renderBuilder();
      case "ficha": return renderSheet();
      case "progressao": return renderProgression();
      case "magias": return renderSpells();
      case "inventario": return renderInventory();
      case "historia": return renderStory();
      case "quadro": return renderBoard();
      case "biblioteca": return renderLibrary();
      case "regras": return renderRules();
      default: return renderDashboard();
    }
  };

  return (
    <div className={`app-shell ${reduceMotion ? "reduce-motion" : ""}`} data-theme={theme} style={{ "--font-scale": `${fontScale}%` } as CSSProperties}>
      <div className="ambient-layer"><i /><i /><i /></div>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="brand" onClick={() => navigate("inicio")}><span className="brand-mark">A</span><span><strong>ARCANA</strong><small>Ficha 5e</small></span></button>
        <nav>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? "active" : ""} onClick={() => navigate(id)}><Icon size={19} /><span>{label}</span>{section === id && <i />}</button>)}</nav>
        <div className="sidebar-foot"><button onClick={() => setSettingsOpen(true)}><Settings size={18} /><span>Ajustes</span></button><div className="autosave"><i className={savePulse ? "pulse" : ""} /><span>{savePulse ? "Salvo agora" : "Salvamento local"}</span></div></div>
      </aside>
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}

      <div className="app-main">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setSidebarOpen(true)}><Menu /></button>
          <div className="breadcrumb"><span>Arcana</span><ChevronRight size={13} /><strong>{navItems.find((item) => item.id === section)?.label}</strong></div>
          <div className="top-actions">
            <div className="theme-picker-wrap"><button className="theme-trigger" onClick={() => setThemeOpen((open) => !open)}><Palette size={17} /><span>{themeOptions.find((entry) => entry.id === theme)?.name}</span><ChevronRight size={14} /></button>{themeOpen && <div className="theme-popover"><div className="popover-title"><span>Estilo da ficha</span><button onClick={() => setThemeOpen(false)}><X size={16} /></button></div>{themeOptions.map((entry) => <button key={entry.id} className={theme === entry.id ? "active" : ""} onClick={() => { setTheme(entry.id); setThemeOpen(false); }}><span className="theme-swatches">{entry.swatches.map((color) => <i style={{ background: color }} key={color} />)}</span><span><strong>{entry.name}</strong><small>{entry.note}</small></span>{theme === entry.id && <Check size={16} />}</button>)}</div>}</div>
            <IconButton label="Ajustes" onClick={() => setSettingsOpen(true)}><Settings size={18} /></IconButton>
          </div>
        </header>
        {mixedEditionWarningOpen && pendingMulticlass && <div className="modal-layer" onMouseDown={() => { setMixedEditionWarningOpen(false); setPendingMulticlass(null); }}><article className="modal mixed-edition-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => { setMixedEditionWarningOpen(false); setPendingMulticlass(null); }}><X /></button><span className="eyebrow"><CircleHelp size={14} /> Compatibilidade entre edições</span><h2>Você está misturando classes de 2024 e 2014.</h2><p className="lead">A ficha consegue calcular níveis, requisitos e espaços de magia, mas essas versões não foram projetadas como uma única progressão balanceada. Algumas características podem se sobrepor ou produzir combinações mais fortes do que o esperado.</p><div className="mixed-edition-advice"><Shield size={20} /><div><strong>Converse com o mestre antes da sessão.</strong><p>Continuar não bloqueia a ficha. A mesa só precisa decidir como resolver conflitos entre os textos das duas edições.</p></div></div><label className="warning-checkbox"><input type="checkbox" checked={hideMixedEditionWarning} onChange={(event) => setHideMixedEditionWarning(event.target.checked)} /><span>Não mostrar este aviso novamente neste dispositivo</span></label><div className="modal-actions"><button className="ghost-button" onClick={() => { setMixedEditionWarningOpen(false); setPendingMulticlass(null); }}>Cancelar</button><button className="primary-button" onClick={() => { if (hideMixedEditionWarning) localStorage.setItem("arcana-hide-mixed-multiclass-warning-v1", "true"); if (pendingMulticlass.mode === "primary") chooseClass(pendingMulticlass.classId, pendingMulticlass.ruleset); else addMulticlassNow(pendingMulticlass.classId, pendingMulticlass.ruleset); setMixedEditionWarningOpen(false); setPendingMulticlass(null); }}><Check size={16} />Continuar mesmo assim</button></div></article></div>}
        <main className="content-area">{renderSection()}</main>
      </div>

      <div className={`dice-dock ${diceOpen ? "open" : ""}`}>
        <button className="dice-toggle" onClick={() => setDiceOpen((open) => !open)}><Dices size={20} /><span>Dados</span>{diceResult && <strong>{diceResult}</strong>}</button>
        {diceOpen && <div className="dice-panel"><div className="dice-expression"><label><span>Quantidade</span><input type="number" min={1} max={20} value={diceCount} onChange={(e) => setDiceCount(Math.min(20, Math.max(1, Number(e.target.value))))} /></label><label><span>Modificador</span><input type="number" min={-99} max={99} value={diceModifier} onChange={(e) => setDiceModifier(Math.min(99, Math.max(-99, Number(e.target.value))))} /></label><strong>{diceCount}d{diceSides}{diceModifier === 0 ? "" : signed(diceModifier)}</strong></div><div className="dice-stage"><div key={`${diceSides}-${rolling}-${diceResult}`} className={`die-shape d${diceSides} ${rolling ? "rolling" : ""}`}><span>{rolling ? "?" : diceResult ?? diceSides}</span></div><div><small>{rolling ? "O destino está girando…" : diceResult !== null ? `Resultado de ${diceCount}d${diceSides}${diceModifier === 0 ? "" : signed(diceModifier)}` : "Escolha um dado"}</small>{diceResult !== null && <strong>{diceResult}</strong>}</div></div><div className="dice-list">{[4, 6, 8, 10, 12, 20, 100].map((sides) => <button key={sides} onClick={() => rollDie(sides)} disabled={rolling}>d{sides}</button>)}</div>{rollHistory.length > 0 && <div className="roll-history">{rollHistory.slice(0, 5).map((roll, index) => <span key={`${roll.expression}-${index}`}>{roll.expression}<strong>{roll.result}</strong></span>)}</div>}</div>}
      </div>

      {activeSpell && <div className="modal-layer" onMouseDown={() => setActiveSpell(null)}><article className="modal spell-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setActiveSpell(null)}><X /></button><div className="spell-modal-head"><div className="spell-level large">{activeSpell.level === 0 ? "T" : activeSpell.level}</div><div><span className="eyebrow">{schoolPt[activeSpell.school] ?? activeSpell.school} · {sourceShort(activeSpell.source)}{activeSpell.page ? ` · página ${activeSpell.page}` : ""}</span><h2>{spellPt(activeSpell).name}</h2><p>{activeSpell.classes.map((entry) => classPt[entry] ?? entry).join(" · ")}</p>{spellPt(activeSpell).name !== activeSpell.name && <small className="original-spell-name">Nome original: {activeSpell.name}</small>}</div></div><div className="spell-facts"><div><span>Tempo de Conjuração</span><strong>{localizeSpellFact(activeSpell.castingTime)}</strong></div><div><span>Alcance</span><strong>{localizeSpellFact(activeSpell.range)}</strong></div><div><span>Duração</span><strong>{localizeSpellFact(activeSpell.duration)}</strong></div><div><span>Componentes</span><strong>{activeSpell.components}</strong></div>{activeSpell.save && <div><span>Salvaguarda</span><strong>{activeSpell.save}</strong></div>}{activeSpell.attack && <div><span>Ataque</span><strong>{activeSpell.attack}</strong></div>}{activeSpell.dice && <div><span>Dados registrados</span><strong>{activeSpell.dice}</strong></div>}{activeSpell.damageTypes && <div><span>Tipo de dano</span><strong>{activeSpell.damageTypes}</strong></div>}{activeSpell.conditions && <div><span>Condições</span><strong>{activeSpell.conditions}</strong></div>}{activeSpell.area && <div><span>Área / alvo</span><strong>{activeSpell.area}</strong></div>}</div>{cantripScaling(activeSpell) && <div className="scaling-panel"><span>Progressão exata por nível de personagem</span><div>{cantripScaling(activeSpell)?.map(([range, value]) => <p key={range}><strong>{range}</strong><em>{value}</em></p>)}</div></div>}<div className="spell-description"><span>Como funciona</span><p>{spellPt(activeSpell).description}</p></div><div className="spell-source-detail"><BookOpen size={16} /><span>Fonte: <strong>{activeSpell.source}</strong>{activeSpell.page ? `, página ${activeSpell.page}` : ""}</span></div><button className={`primary-button wide ${character.selectedSpellIds.includes(activeSpell.id) ? "selected" : ""}`} onClick={() => toggleSpell(activeSpell.id)}>{character.selectedSpellIds.includes(activeSpell.id) ? <><Check size={17} />Adicionada à ficha</> : <><Plus size={17} />Adicionar à ficha</>}</button></article></div>}

      {activeFeature && <div className="modal-layer" onMouseDown={() => setActiveFeature(null)}><article className={`modal feature-modal ${activeFeature.unlocked ? "" : "locked"}`} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setActiveFeature(null)}><X /></button><div className="feature-modal-level">{activeFeature.unlocked ? <Check size={18} /> : <LockKeyhole size={18} />}<span>Nível {activeFeature.level}</span></div><SourceBadge access={activeFeature.access} source={activeFeature.source} /><h2>{activeFeature.name}</h2><div className="feature-explanation"><span>Como funciona</span><p>{featureDetail(activeFeature.name, activeFeature.summary)}</p></div>{featureScaling(activeFeature.name, character.classId, character.classRuleset) && <div className="scaling-panel"><span>Progressão exata por nível</span><div>{featureScaling(activeFeature.name, character.classId, character.classRuleset)?.map(([range, value]) => <p key={range}><strong>{range}</strong><em>{value}</em></p>)}</div></div>}{!activeFeature.unlocked && <div className="locked-message"><LockKeyhole size={18} /><div><strong>Nível insuficiente</strong><span>Esta é apenas uma prévia. A habilidade será liberada quando o personagem alcançar o nível {activeFeature.level}.</span></div></div>}</article></div>}

      {featureEditor && <div className="modal-layer" onMouseDown={() => setFeatureEditor(null)}><article className="modal feature-editor-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setFeatureEditor(null)}><X /></button><span className="eyebrow"><Pencil size={14} /> Editor de habilidade</span><h2>{featureEditor.baseKey ? "Ajustar habilidade da ficha" : "Criar nova habilidade"}</h2><p className="lead">Registre a versão que realmente vale nesta mesa: usos, dados, CD, duração e qualquer alteração do mestre.</p><label className="field-label">Nome<input value={featureEditor.name} onChange={(event) => setFeatureEditor({ ...featureEditor, name: event.target.value })} /></label><label className="field-label">Descrição mecânica<textarea value={featureEditor.summary} onChange={(event) => setFeatureEditor({ ...featureEditor, summary: event.target.value })} /></label><label className="field-label">Fonte<input value={featureEditor.source} onChange={(event) => setFeatureEditor({ ...featureEditor, source: event.target.value, access: "custom" })} /></label><div className="modal-actions">{character.featureNotes.some((note) => note.id === featureEditor.id) && <button className="danger-button" onClick={() => { updateCharacter("featureNotes", character.featureNotes.filter((note) => note.id !== featureEditor.id)); setFeatureEditor(null); }}><Trash2 size={16} />Excluir ajuste</button>}<button className="primary-button" disabled={!featureEditor.name.trim() || !featureEditor.summary.trim()} onClick={saveFeatureNote}><Save size={16} />Salvar habilidade</button></div></article></div>}

      {customSpellOpen && <CustomSpellModal onClose={() => setCustomSpellOpen(false)} onCreate={(spell) => { setCustomSpells((current) => [...current, spell]); setCustomSpellOpen(false); setActiveSpell(spell); }} />}

      {sheetEditOpen && <div className="modal-layer" onMouseDown={() => setSheetEditOpen(false)}><article className="modal sheet-edit-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSheetEditOpen(false)}><X /></button><span className="eyebrow"><SlidersHorizontal size={14} /> Ajustes da mesa</span><h2>Edite sem quebrar os cálculos.</h2><p className="lead">Atributos alteram a base do personagem. Os demais campos substituem ou somam ao cálculo automático e podem ser limpos a qualquer momento.</p><section><div className="edit-section-head"><h3>Identidade mecânica</h3><small>Somente opções compatíveis com a criação 2024</small></div><div className="identity-edit-grid"><label>Espécie<select value={character.speciesId} onChange={(e) => chooseSpecies(e.target.value)}>{species.map((entry) => <option value={entry.id} key={entry.id}>{entry.name} · {sourceShort(entry.source)}</option>)}</select></label><label>Herança interna<select value={character.lineageId} onChange={(e) => updateCharacter("lineageId", e.target.value)} disabled={!availableLineages.length}><option value="">Sem escolha</option>{availableLineages.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label><label>Classe<select value={character.classId} onChange={(e) => { updateCharacter("classId", e.target.value); updateCharacter("subclassId", ""); }}>{classes.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label><label>Subclasse<select value={character.subclassId} onChange={(e) => updateCharacter("subclassId", e.target.value)}><option value="">Ainda não escolhida</option>{availableSubclasses.map((entry) => <option value={entry.id} key={entry.id}>{entry.name} · {entry.source}</option>)}</select></label><label>Antecedente<select value={character.backgroundId} onChange={(e) => { const entry = backgrounds.find((background) => background.id === e.target.value); if (entry) chooseBackground(entry); }}>{backgrounds.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label><label>Nível<input type="number" min={1} max={20} value={character.level} onChange={(e) => updateCharacter("level", Math.min(20, Math.max(1, Number(e.target.value))))} /></label></div></section><section><div className="edit-section-head"><h3>Atributos permanentes</h3><small>Valor-base · o bônus da origem continua separado</small></div><div className="edit-ability-grid">{abilities.map((ability) => <label key={ability.key}><span>{ability.short}</span><input type="number" min={1} max={30} value={character.abilities[ability.key]} onChange={(event) => updateCharacter("abilities", { ...character.abilities, [ability.key]: Math.min(30, Math.max(1, Number(event.target.value))) })} /><small>Final {finalAbilities[ability.key]} · {signed(modifier(finalAbilities[ability.key]))}</small></label>)}</div></section><section><div className="edit-section-head"><h3>Valores substituídos</h3><small>Vazio = voltar ao automático</small></div><div className="override-grid">{([{ key: "armorClass", label: "Classe de Armadura", automatic: 10 + dexMod }, { key: "initiative", label: "Iniciativa", automatic: dexMod }, { key: "speed", label: "Deslocamento (m)", automatic: selectedSpecies?.speed ?? 9 }, { key: "passivePerception", label: "Percepção passiva", automatic: 10 + modifier(finalAbilities.wis) + (effectiveProficientSkills.has("Percepção") ? pb : 0) }, { key: "maxHp", label: "PV máximos", automatic: calculatedMaxHp }, { key: "proficiencyBonus", label: "Bônus de Proficiência", automatic: calculatedPb }, { key: "spellDc", label: "CD para resistir magia", automatic: 8 + pb + spellMod }, { key: "spellAttack", label: "Ataque mágico", automatic: pb + spellMod }] as const).map((field) => <label key={field.key}><span>{field.label}<small>Automático: {signed(field.automatic).replace("+", "")}</small></span><input type="number" placeholder={String(field.automatic)} value={overrides[field.key] ?? ""} onChange={(event) => updateOverrides({ [field.key]: event.target.value === "" ? null : Number(event.target.value) })} /></label>)}</div></section><section><div className="edit-section-head"><h3>Ajustes de perícias</h3><small>Somados depois de atributo e proficiência</small></div><div className="bonus-grid">{skills.map((skill) => <label key={skill.name}><span>{skill.name}</span><input type="number" value={overrides.skillBonuses[skill.name] ?? 0} onChange={(event) => updateOverrides({ skillBonuses: { ...overrides.skillBonuses, [skill.name]: Number(event.target.value) } })} /></label>)}</div></section><section><div className="edit-section-head"><h3>Ajustes de salvaguardas</h3><small>Bônus ou penalidade adicional</small></div><div className="bonus-grid saves">{abilities.map((ability) => <label key={ability.key}><span>{ability.name}</span><input type="number" value={overrides.saveBonuses[ability.key] ?? 0} onChange={(event) => updateOverrides({ saveBonuses: { ...overrides.saveBonuses, [ability.key]: Number(event.target.value) } })} /></label>)}</div></section><div className="modal-actions"><button className="ghost-button" onClick={() => updateCharacter("overrides", defaultOverrides)}><RotateCcw size={16} />Limpar ajustes</button><button className="primary-button" onClick={() => setSheetEditOpen(false)}><Check size={16} />Concluir edição</button></div></article></div>}

      {settingsOpen && <div className="modal-layer" onMouseDown={() => setSettingsOpen(false)}><article className="modal settings-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSettingsOpen(false)}><X /></button><span className="eyebrow">Preferências</span><h2>Faça a ficha parecer sua.</h2><section><h3>Estilo visual</h3><div className="settings-themes">{themeOptions.map((entry) => <button key={entry.id} className={theme === entry.id ? "active" : ""} onClick={() => setTheme(entry.id)}><span className="theme-swatches">{entry.swatches.map((color) => <i style={{ background: color }} key={color} />)}</span><strong>{entry.name}</strong>{theme === entry.id && <Check size={15} />}</button>)}</div></section><section><h3>Leitura e movimento</h3><div className="settings-preview" aria-live="polite"><strong style={{ fontSize: `${fontScale / 100}rem` }}>Aa — Texto de exemplo</strong><span>{fontScale}% · animações {reduceMotion ? "reduzidas" : "ativas"}</span></div><label className="setting-row"><span><strong>Tamanho do texto</strong><small>A alteração acontece em toda a interface.</small></span><input aria-label="Tamanho do texto" type="range" min="90" max="125" step="5" value={fontScale} onChange={(e) => setFontScale(Number(e.target.value))} /></label><div className="setting-row"><span><strong>Reduzir animações</strong><small>{reduceMotion ? "Transições e movimentos estão reduzidos." : "Transições e movimentos estão ativos."}</small></span><button aria-pressed={reduceMotion} className={`switch ${reduceMotion ? "on" : ""}`} onClick={() => setReduceMotion((value) => !value)}><i /></button></div></section><section><h3>Seus dados</h3><div className="settings-actions"><button className="ghost-button" onClick={exportCharacter}><Download size={16} />Exportar ficha</button><button className="ghost-button" onClick={() => importInput.current?.click()}><FileUp size={16} />Importar ficha</button><input ref={importInput} type="file" accept="application/json" onChange={importCharacter} hidden /><button className="danger-button" onClick={() => { if (window.confirm("Apagar o personagem salvo neste dispositivo?")) setCharacter(defaultCharacter); }}><RotateCcw size={16} />Recomeçar</button></div></section></article></div>}

      {importPreview && <div className="modal-layer" onMouseDown={() => !cloudBusy && setImportPreview(null)}><article className="modal import-preview-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Fechar importação" disabled={cloudBusy} onClick={() => setImportPreview(null)}><X /></button><span className="eyebrow"><FileUp size={14} /> Ficha encontrada</span><h2>Conferir antes de importar.</h2><p className="lead">Nada foi substituído ainda. Você pode apenas abrir a ficha neste dispositivo ou adicioná-la ao banco permanente do mestre.</p><section className="import-preview-card"><div className="library-avatar">{importPreview.character.portrait ? <img src={importPreview.character.portrait} alt="" /> : <UserRound size={27} />}</div><div><span>{importPreview.fileName}</span><h3>{importPreview.character.name || "Ficha sem nome"}</h3><p>{characterSummary(importPreview.character) || "Origem e classe ainda não definidas"}</p></div><strong>NÍVEL {importPreview.character.level}</strong></section><div className="import-preview-facts"><div><span>Jogador</span><strong>{importPreview.character.player || "Não informado"}</strong></div><div><span>Formato</span><strong>Arcana v{importPreview.version}</strong></div><div><span>Magias próprias</span><strong>{importPreview.customSpells.length}</strong></div><div><span>Quadros</span><strong>{importPreview.boards.length}</strong></div></div>{cloudError && <div className="cloud-error"><CircleHelp size={18} /><span>{cloudError}</span></div>}<div className="import-safety-note"><Shield size={18} /><p>A ficha importada recebe um registro novo. Ela nunca sobrescreve automaticamente o personagem que já está aberto ou salvo no banco.</p></div><div className="modal-actions"><button className="ghost-button" onClick={openImportedCharacter} disabled={cloudBusy}><Eye size={16} />Abrir sem salvar</button><button className="primary-button" onClick={saveImportedCharacterToCloud} disabled={cloudBusy}><Database size={16} />{cloudBusy ? "Adicionando…" : "Adicionar ao banco"}</button></div></article></div>}
    </div>
  );
}

function ScrollMark() {
  return <span className="scroll-mark">§</span>;
}

function SourceBadge({ access, source }: { access: AccessKind; source: string }) {
  return <span className={`source-badge ${access}`} title={source}><i />{access === "custom" ? "Personalizado" : sourceShort(source)}<small>{source}</small></span>;
}

function FeatureNoteCard({ note, onOpen, onEdit }: { note: FeatureNote; onOpen: () => void; onEdit: () => void }) {
  return <article className="feature-note editable interactive"><button className="feature-note-main" onClick={onOpen}><strong>{note.name}</strong><p>{note.summary}</p><small>{sourceShort(note.source)}</small></button><button className="feature-edit-button" aria-label={`Editar ${note.name}`} title="Editar esta habilidade" onClick={onEdit}><Pencil size={14} /></button></article>;
}

function CustomSpellModal({ onClose, onCreate }: { onClose: () => void; onCreate: (spell: Spell) => void }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState(0);
  const [school, setSchool] = useState("Evocation");
  const [castingTime, setCastingTime] = useState("Ação");
  const [range, setRange] = useState("18 metros");
  const [duration, setDuration] = useState("Instantânea");
  const [components, setComponents] = useState("V, S");
  const [description, setDescription] = useState("");
  const create = () => {
    if (!name.trim() || !description.trim()) return;
    onCreate({ id: uid("homebrew"), name: name.trim(), level, school, classes: ["Homebrew"], castingTime, range, components, duration, concentration: duration.toLowerCase().includes("concentração"), ritual: castingTime.toLowerCase().includes("ritual"), description, source: "Criação própria" });
  };
  return <div className="modal-layer" onMouseDown={onClose}><article className="modal custom-spell-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X /></button><span className="eyebrow">Oficina arcana</span><h2>Criar uma magia</h2><p className="lead">Registre primeiro a intenção; números podem ser equilibrados com o mestre.</p><div className="custom-spell-grid"><label className="field-label wide-field">Nome<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da magia" /></label><label className="field-label">Círculo<select value={level} onChange={(e) => setLevel(Number(e.target.value))}><option value={0}>Truque</option>{Array.from({ length: 9 }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1}</option>)}</select></label><label className="field-label">Escola<select value={school} onChange={(e) => setSchool(e.target.value)}>{Object.entries(schoolPt).map(([key, value]) => <option value={key} key={key}>{value}</option>)}</select></label><label className="field-label">Tempo<input value={castingTime} onChange={(e) => setCastingTime(e.target.value)} /></label><label className="field-label">Alcance<input value={range} onChange={(e) => setRange(e.target.value)} /></label><label className="field-label">Duração<input value={duration} onChange={(e) => setDuration(e.target.value)} /></label><label className="field-label">Componentes<input value={components} onChange={(e) => setComponents(e.target.value)} /></label><label className="field-label wide-field">Descrição<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que acontece, quais testes são feitos e como evolui em círculos superiores?" /></label></div><button className="primary-button wide" disabled={!name.trim() || !description.trim()} onClick={create}><Save size={17} />Salvar magia própria</button></article></div>;
}
