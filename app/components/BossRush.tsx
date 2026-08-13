"use client";

import { ArrowUp, Biohazard, Bolt, Coins, Crosshair, Crown, Eclipse, Flame, Hammer, Heart, HeartPulse, MoonStar, Mountain, Navigation, Orbit, Pause, Play, RotateCcw, Shield, ShoppingBag, Snowflake, Sparkles, Sun, Swords, Timer, WandSparkles, Waves, Wind, X, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type HeroClass = "warrior" | "archer" | "mage";
type Rarity = "common" | "uncommon" | "rare" | "legendary" | "mythic" | "curse";
type GodId = "flame" | "tide" | "gale" | "frost" | "shadow" | "radiance" | "venom" | "storm" | "blood" | "stone" | "moon" | "sun" | "wild";
type BoonSlot = "attack" | "dash" | "technique1" | "technique2" | "ultimate" | "passive";
type SlotBoon = { god: GodId; rarity: Rarity; rank: number; name: string };
type Phase = "select" | "ready" | "horde" | "level-up" | "danger" | "boss-grace" | "boss" | "stage-clear" | "victory" | "defeat";
type EnemyKind = "crawler" | "runner" | "brute" | "shooter" | "dasher" | "orbiter" | "splitter" | "bomb";
type Ultimate = "war-cry" | "guardian" | "earthbreaker" | "arrow-storm" | "void-rain" | "phantom-hunt" | "arcane-cataclysm" | "time-stop" | "singularity";
type Point = { x: number; y: number };
type Projectile = Point & {
  id: number; vx: number; vy: number; radius: number; damage: number; hostile: boolean; life: number;
  pierce: number; area: number; slow: number; color: string; split: number; hitIds: number[];
  turn?: number; accel?: number; shape?: "orb" | "shard" | "ember"; god?: GodId; special?: "attack" | "technique" | "summon";
};
type Affliction = { burnTime: number; burnDps: number; poisonTime: number; poisonStacks: number; bloodStacks: number; frostTime: number; frostStacks: number; fearTime: number; stunTime: number; solarTime: number; solarStacks: number; statusTick: number };
type Enemy = Point & Affliction & { id: number; kind: EnemyKind; hp: number; maxHp: number; speed: number; radius: number; contact: number; cooldown: number; state: number; dx: number; dy: number; strafe: number };
type Fragment = Point & { id: number; value: number; pulse: number };
type Zone = Point & { id: number; radius: number; life: number; slow: number; damage: number; tick: number; color: string; hostile: boolean; kind?: "field" | "trap" | "meteor"; armed?: number; triggered?: boolean; god?: GodId; push?: number; stun?: number; pull?: number; fear?: number };
type Summon = Point & { id: number; hp: number; maxHp: number; damage: number; radius: number; cooldown: number; color: string; god: GodId; orbit: number };
type Direction = "up" | "right" | "down" | "left";
type ParryStrike = { id: number; direction: Direction; eta: number; speed: number; resolved: boolean };
type EchoTrail = { id: number; points: Point[]; telegraph: number; active: number; cursor: number; tick: number; color: string };
type Hazard = Point & {
  id: number;
  kind: "laser" | "memory" | "circle";
  x2: number;
  y2: number;
  width: number;
  telegraph: number;
  telegraphMax?: number;
  active: number;
  activeMax?: number;
  damage: number;
  color: string;
  safe?: boolean;
  vx?: number;
  vy?: number;
  omega?: number;
  centerX?: number;
  centerY?: number;
  radius?: number;
};
type FloatText = Point & { id: number; text: string; color: string; life: number };
type Relic = Point & { id: number; hp: number; maxHp: number };

type Build = {
  classId: HeroClass; name: string; attackName: string; trait: string; accent: string;
  maxHp: number; hp: number; moveSpeed: number; damage: number; attackRange: number; projectileSpeed: number; attackInterval: number;
  projectileCount: number; spread: number; pierce: number; armor: number; critChance: number; critDamage: number; magnet: number; xpGain: number;
  luck: number; regen: number; area: number; fireballInterval: number; rageInterval: number; slowFieldInterval: number; multishotEvery: number;
  ultimate: Ultimate | null; ultimateName: string; ultimateCharge: number; ultimateMax: number; ultimateLevel: number;
  dashMax: number; dashCooldown: number; dashDamage: number; dashClone: boolean; dashShield: number;
  slots: Record<Exclude<BoonSlot, "passive">, SlotBoon | null>; passives: SlotBoon[];
  attackGod: GodId | null; dashGod: GodId | null; technique1God: GodId | null; technique2God: GodId | null; ultimateGod: GodId | null;
  orbitals: number; orbitalDamage: number; orbitalRadius: number; novaInterval: number; chainChance: number; executeChance: number;
  poisonDamage: number; bloodPrice: number; onHitHeal: number; dashTrail: boolean; projectileSize: number; knockback: number;
  burnChance: number; burnPercent: number; poisonMaxStacks: number; poisonStackDamage: number; bloodThreshold: number; bloodBurstDamage: number;
  radiantDropChance: number; ascensionChance: number; trapInterval: number; trapDamage: number; summonCount: number; summonDamage: number; summonHp: number;
  invulnPulseInterval: number; invulnPulseDuration: number; barrier: number; barrierMax: number; effectDuration: number; elementalAmp: number;
  armorDamageRatio: number; pierceRamp: number; summonGod: GodId | null;
};
type UpgradeCard = { id: string; name: string; description: string; rarity: Rarity; classId: HeroClass | "general"; ultimate?: Ultimate; god?: GodId; slot?: BoonSlot; rank?: number; upgradeTarget?: Exclude<BoonSlot, "passive">; apply: (build: Build) => void };
type StageDefinition = { name: string; subtitle: string; duration: number; palette: [string, string, string]; enemies: EnemyKind[]; boss: string; glyph: string; bossHp: number; bossDamage: number };
type Boss = Point & Affliction & {
  hp: number;
  maxHp: number;
  radius: number;
  cooldown: number;
  pattern: number;
  rage: boolean;
  intermission: number;
  reborn: boolean;
  vulnerable: boolean;
  phaseStarted: boolean;
  intent: string;
  intentClock: number;
  combatPhase: 1 | 2;
  transitionClock: number;
  pathIndex: number;
  dashTelegraph: number;
  dashDuration: number;
  dashElapsed: number;
  dashFromX: number;
  dashFromY: number;
  dashToX: number;
  dashToY: number;
};
type Game = {
  phase: Phase; width: number; height: number; stage: number; elapsed: number; stageElapsed: number; phaseClock: number; build: Build;
  player: Point & { radius: number; invulnerable: number; dashCooldown: number; dashCharges: number; dashClock: number; dashTrailClock: number; dashX: number; dashY: number; moved: boolean; dashBurstPending: boolean; shadowAnchor: Point | null };
  boss: Boss; enemies: Enemy[]; projectiles: Projectile[]; fragments: Fragment[]; zones: Zone[]; hazards: Hazard[]; relics: Relic[]; floats: FloatText[]; summons: Summon[];
  keys: Set<string>; xp: number; xpNeeded: number; level: number; kills: number; spawnClock: number; attackClock: number; fireballClock: number;
  rageClock: number; slowFieldClock: number; novaClock: number; trapClock: number; summonClock: number; invulnPulseClock: number; attackNumber: number; paused: boolean; lastTime: number; nextId: number; memoryWave: number;
  parryQueue: ParryStrike[]; parrySpawnClock: number; parryStreak: number; parryFlash: number;
  echoHistory: Point[]; echoRecordClock: number; echoes: EchoTrail[];
  rule: "none" | "stop" | "move"; ruleTelegraph: number; ruleActive: number; ruleTick: number; ruleInverted: boolean; shadowCloneTime: number; moonEchoTime: number; sunGraceTime: number;
};
type Hud = { phase: Phase; stage: number; elapsed: number; hp: number; maxHp: number; barrier: number; barrierMax: number; xp: number; xpNeeded: number; level: number; kills: number; bossHp: number; bossMaxHp: number; bossRage: boolean; ultimate: number; ultimateMax: number; ultimateName: string; paused: boolean; dashCharges: number; dashMax: number; dashCooldown: number; dashBaseCooldown: number; bossVulnerable: boolean; relics: number; slots: Build["slots"]; passives: SlotBoon[] };
type MetaUpgradeId = "vitality" | "power" | "magnet" | "memory" | "fortune" | "recovery";
type MetaProgress = { marks: number; upgrades: Record<MetaUpgradeId, number> };
type ShopItem = { id: MetaUpgradeId; name: string; description: string; effect: string; maxRank: number; costs: number[]; icon: LucideIcon; apply: (build: Build, rank: number) => void };

export type BossRushHero = { name: string; portrait: string };

const STAGES: StageDefinition[] = [
  { name: "Cripta da Fome", subtitle: "Os mortos aprendem a seguir passos.", duration: 120, palette: ["#100d14", "#36223d", "#a477b4"], enemies: ["crawler", "runner", "shooter"], boss: "Ossário Coroado", glyph: "O", bossHp: 3600, bossDamage: 13 },
  { name: "Forja Afogada", subtitle: "Ferro quente ainda respira sob a água.", duration: 165, palette: ["#100d0b", "#41241f", "#db754c"], enemies: ["crawler", "runner", "brute", "shooter", "bomb"], boss: "Colosso de Escória", glyph: "F", bossHp: 6200, bossDamage: 16 },
  { name: "Bosque sem Aurora", subtitle: "Toda sombra aqui sabe correr.", duration: 205, palette: ["#08100e", "#173b34", "#52b99e"], enemies: ["runner", "shooter", "dasher", "splitter", "orbiter"], boss: "Cervo do Eclipse", glyph: "V", bossHp: 9000, bossDamage: 19 },
  { name: "Arquivo Partido", subtitle: "As páginas recusam a ordem em que morreram.", duration: 255, palette: ["#0c0d15", "#272d52", "#7689e7"], enemies: ["brute", "shooter", "dasher", "orbiter", "splitter", "bomb"], boss: "Bibliotecária do Vazio", glyph: "A", bossHp: 12500, bossDamage: 22 },
  { name: "Trono do Intervalo", subtitle: "O fim espera entre um segundo e o próximo.", duration: 300, palette: ["#100d0d", "#4a2934", "#df9a63"], enemies: ["runner", "brute", "shooter", "dasher", "orbiter", "splitter", "bomb"], boss: "Rei que Não Aconteceu", glyph: "R", bossHp: 17000, bossDamage: 25 },
];

const GODS: Record<GodId, { name: string; title: string; color: string; icon: LucideIcon; identity: string }> = {
  flame: { name: "Vharos", title: "Deus da Brasa Primeva", color: "#ff6b3d", icon: Flame, identity: "explosões, queimadura e dano pesado" },
  tide: { name: "Nymara", title: "Deusa da Maré Profunda", color: "#3ec7e6", icon: Waves, identity: "controle, cura e impacto fluido" },
  gale: { name: "Aeris", title: "Deus dos Ventos Livres", color: "#8de4c8", icon: Wind, identity: "cadência, mobilidade e múltiplos golpes" },
  frost: { name: "Ilyr", title: "Deusa do Inverno Imóvel", color: "#86d6ff", icon: Snowflake, identity: "lentidão, zonas e segurança" },
  shadow: { name: "Noctis", title: "Deus da Escuridão Faminta", color: "#a376f2", icon: Eclipse, identity: "críticos, execução e risco" },
  radiance: { name: "Aurel", title: "Deus da Luz Primeva", color: "#fff2a8", icon: Sparkles, identity: "teleporte, cadência e órbitas radiantes" },
  venom: { name: "Vespara", title: "Deusa do Veneno Paciente", color: "#75cf42", icon: Biohazard, identity: "dano persistente e enfraquecimento" },
  storm: { name: "Keraun", title: "Deus do Coração da Tempestade", color: "#4ea3ff", icon: Bolt, identity: "correntes, velocidade e descargas" },
  blood: { name: "Sangria", title: "Deusa do Pacto Rubro", color: "#ed4058", icon: HeartPulse, identity: "roubo de vida e sacrifício" },
  stone: { name: "Gorun", title: "Deus da Terra Imóvel", color: "#c79558", icon: Mountain, identity: "vida, armadura e força convertida" },
  moon: { name: "Lunara", title: "Deusa das Luas Gêmeas", color: "#b89dff", icon: MoonStar, identity: "órbitas, ecos e área" },
  sun: { name: "Solarius", title: "Deus do Meio-Dia Eterno", color: "#ffb52e", icon: Sun, identity: "marcas solares, explosões e renascimento" },
  wild: { name: "Bellum", title: "Forja Viva da Guerra", color: "#e7b978", icon: Hammer, identity: "aprimorar e transformar bênçãos existentes" },
};
const RARITY_LABEL: Record<Rarity, string> = { common: "COMUM", uncommon: "INCOMUM", rare: "RARO", legendary: "LENDÁRIO", mythic: "MÍSTICO", curse: "MALDIÇÃO" };
const RARITY_RANK: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 3, legendary: 4, mythic: 5, curse: 5 };
const RARITY_POWER: Record<Rarity, number> = { common: 1, uncommon: 1.3, rare: 1.68, legendary: 2.15, mythic: 2.85, curse: 2.3 };
const boonDefaults = () => ({
  slots: { attack: null, dash: null, technique1: null, technique2: null, ultimate: null }, passives: [] as SlotBoon[],
  attackGod: null, dashGod: null, technique1God: null, technique2God: null, ultimateGod: null,
  orbitals: 0, orbitalDamage: .56, orbitalRadius: 84, novaInterval: 0, chainChance: 0, executeChance: 0,
  poisonDamage: 0, bloodPrice: 0, onHitHeal: 0, dashTrail: false, projectileSize: 1, knockback: 0,
  burnChance: 0, burnPercent: 0, poisonMaxStacks: 0, poisonStackDamage: 0, bloodThreshold: 0, bloodBurstDamage: 0,
  radiantDropChance: 0, ascensionChance: 0, trapInterval: 0, trapDamage: 0, summonCount: 0, summonDamage: 0, summonHp: 0,
  invulnPulseInterval: 0, invulnPulseDuration: 0,
  barrier: 0, barrierMax: 0, effectDuration: 1, elementalAmp: 0, armorDamageRatio: 0, pierceRamp: 0, summonGod: null,
});

const BASES: Record<HeroClass, Build> = {
  warrior: { classId: "warrior", name: "Guerreiro", attackName: "Corte de Ferro", trait: "Vida e armadura superiores. Domina o espaço próximo com golpes mais pesados e atravessa grupos. Começa com uma onda de impacto a cada 7 s.", accent: "#e2a95e", maxHp: 200, hp: 200, moveSpeed: 142, damage: 36, attackRange: 150, projectileSpeed: 470, attackInterval: .62, projectileCount: 1, spread: 0, pierce: 3, armor: 4, critChance: .08, critDamage: 1.7, magnet: 90, xpGain: 1, luck: 0, regen: .22, area: 1, fireballInterval: 0, rageInterval: 7, slowFieldInterval: 0, multishotEvery: 0, ultimate: null, ultimateName: "Nenhuma ultimate", ultimateCharge: 0, ultimateMax: 100, ultimateLevel: 0, dashMax: 1, dashCooldown: 5, dashDamage: 0, dashClone: false, dashShield: .55, ...boonDefaults() },
  archer: { classId: "archer", name: "Arqueiro", attackName: "Flecha Certeira", trait: "Alcance e movimento superiores. A cada quatro ataques, dispara uma rajada de três flechas — sempre três, sem soma escondida.", accent: "#78c997", maxHp: 148, hp: 148, moveSpeed: 202, damage: 18, attackRange: 850, projectileSpeed: 700, attackInterval: .47, projectileCount: 1, spread: 0, pierce: 0, armor: 1, critChance: .18, critDamage: 2, magnet: 104, xpGain: 1, luck: .01, regen: .1, area: 1, fireballInterval: 0, rageInterval: 0, slowFieldInterval: 0, multishotEvery: 4, ultimate: null, ultimateName: "Nenhuma ultimate", ultimateCharge: 0, ultimateMax: 100, ultimateLevel: 0, dashMax: 1, dashCooldown: 5, dashDamage: 0, dashClone: false, dashShield: .55, ...boonDefaults() },
  mage: { classId: "mage", name: "Mago", attackName: "Seta Arcana", trait: "Pouca vida, grande dano e controle do campo. Começa lançando um orbe explosivo a cada 6 s.", accent: "#9f8cf0", maxHp: 112, hp: 112, moveSpeed: 171, damage: 43, attackRange: 560, projectileSpeed: 480, attackInterval: .8, projectileCount: 1, spread: 0, pierce: 1, armor: 0, critChance: .1, critDamage: 1.8, magnet: 96, xpGain: 1, luck: .02, regen: .08, area: 1.12, fireballInterval: 6, rageInterval: 0, slowFieldInterval: 0, multishotEvery: 0, ultimate: null, ultimateName: "Nenhuma ultimate", ultimateCharge: 0, ultimateMax: 100, ultimateLevel: 0, dashMax: 1, dashCooldown: 5, dashDamage: 0, dashClone: false, dashShield: .55, ...boonDefaults() },
};

const SHOP_ITEMS: ShopItem[] = [
  { id: "vitality", name: "Coração Gravado", description: "Comece cada tentativa com mais vida máxima.", effect: "+3% de vida por nível", maxRank: 5, costs: [4, 7, 11, 16, 22], icon: Heart, apply: (b, rank) => { b.maxHp = Math.round(b.maxHp * (1 + rank * .03)); } },
  { id: "power", name: "Fio da Lâmina", description: "Aumenta discretamente todo o dano inicial.", effect: "+2,5% de dano por nível", maxRank: 5, costs: [5, 8, 12, 17, 23], icon: Swords, apply: (b, rank) => { b.damage *= 1 + rank * .025; } },
  { id: "magnet", name: "Ímã de Ecos", description: "Puxa fragmentos de experiência de mais longe.", effect: "+14 de coleta por nível", maxRank: 5, costs: [3, 6, 9, 13, 18], icon: Orbit, apply: (b, rank) => { b.magnet += rank * 14; } },
  { id: "memory", name: "Memória Fluida", description: "Transforma fragmentos recolhidos em um pouco mais de XP.", effect: "+2,5% de XP por nível", maxRank: 5, costs: [5, 8, 12, 17, 23], icon: Sparkles, apply: (b, rank) => { b.xpGain *= 1 + rank * .025; } },
  { id: "fortune", name: "Fio da Fortuna", description: "Inclina levemente as ofertas para raridades superiores.", effect: "+0,6% de sorte por nível", maxRank: 5, costs: [6, 10, 15, 21, 28], icon: Crown, apply: (b, rank) => { b.luck += rank * .006; } },
  { id: "recovery", name: "Bálsamo Persistente", description: "Recupera uma pequena quantidade de vida durante o combate.", effect: "+0,05 PV/s por nível", maxRank: 5, costs: [4, 7, 11, 16, 22], icon: HeartPulse, apply: (b, rank) => { b.regen += rank * .05; } },
];
const EMPTY_META_UPGRADES: Record<MetaUpgradeId, number> = { vitality: 0, power: 0, magnet: 0, memory: 0, fortune: 0, recovery: 0 };
const DEFAULT_META: MetaProgress = { marks: 0, upgrades: { ...EMPTY_META_UPGRADES } };
const META_STORAGE_KEY = "arcana-intervalo-meta-v1";
function loadMetaProgress(): MetaProgress {
  if (typeof window === "undefined") return { marks: 0, upgrades: { ...EMPTY_META_UPGRADES } };
  try {
    const raw = JSON.parse(window.localStorage.getItem(META_STORAGE_KEY) ?? "{}");
    const upgrades = { ...EMPTY_META_UPGRADES };
    for (const item of SHOP_ITEMS) upgrades[item.id] = clamp(Math.floor(Number(raw?.upgrades?.[item.id]) || 0), 0, item.maxRank);
    return { marks: Math.max(0, Math.floor(Number(raw?.marks) || 0)), upgrades };
  } catch { return { marks: 0, upgrades: { ...EMPTY_META_UPGRADES } }; }
}
function saveMetaProgress(meta: MetaProgress) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta)); } catch { /* O jogo continua mesmo se o navegador bloquear armazenamento. */ }
}
function applyMetaProgress(build: Build, meta: MetaProgress) {
  for (const item of SHOP_ITEMS) item.apply(build, meta.upgrades[item.id] ?? 0);
  build.maxHp = Math.round(build.maxHp); build.hp = build.maxHp; build.damage = Math.round(build.damage * 100) / 100;
  return build;
}

const normal = (card: Omit<UpgradeCard, "rarity">): UpgradeCard => ({ ...card, rarity: "common" });
const rare = (card: Omit<UpgradeCard, "rarity">): UpgradeCard => ({ ...card, rarity: "rare" });
const legendary = (card: Omit<UpgradeCard, "rarity">): UpgradeCard => ({ ...card, rarity: "legendary" });
const ult = (card: UpgradeCard) => card;
const CARDS: UpgradeCard[] = [
  normal({ id: "vital", name: "Núcleo Vital", description: "+16% de vida máxima e recupere o mesmo valor.", classId: "general", apply: b => { const gain = Math.ceil(b.maxHp * .16); b.maxHp += gain; b.hp += gain; } }),
  normal({ id: "step", name: "Passo Ligeiro", description: "+11% de movimento.", classId: "general", apply: b => { b.moveSpeed *= 1.11; } }),
  normal({ id: "magnet", name: "Chamado dos Fragmentos", description: "+60 de alcance de coleta.", classId: "general", apply: b => { b.magnet += 60; } }),
  normal({ id: "heal", name: "Reserva Carmesim", description: "Recupere 38% da vida máxima agora.", classId: "general", apply: b => { b.hp = Math.min(b.maxHp, b.hp + b.maxHp * .38); } }),
  normal({ id: "dash-flow", name: "Fluxo de Esquiva", description: "Reduz em 18% a recarga da esquiva.", classId: "general", apply: b => { b.dashCooldown = Math.max(1.8, b.dashCooldown * .82); } }),
  normal({ id: "dash-impact", name: "Passagem Violenta", description: "A esquiva causa 140% do seu dano aos inimigos atravessados.", classId: "general", apply: b => { b.dashDamage += 1.4; } }),
  rare({ id: "xp", name: "Mente Faminta", description: "+24% de experiência recebida.", classId: "general", apply: b => { b.xpGain *= 1.24; } }),
  rare({ id: "luck", name: "Fio da Fortuna", description: "+5% nas chances superiores de cartas.", classId: "general", apply: b => { b.luck += .05; } }),
  rare({ id: "regen", name: "Sangue Persistente", description: "+1,3 PV por segundo.", classId: "general", apply: b => { b.regen += 1.3; } }),
  rare({ id: "dash-double", name: "Passo Duplo", description: "+1 carga de esquiva.", classId: "general", apply: b => { b.dashMax += 1; } }),
  rare({ id: "dash-clone", name: "Imagem Residual", description: "A esquiva deixa um eco que explode e distrai perseguidores.", classId: "general", apply: b => { b.dashClone = true; b.dashDamage += .7; } }),
  legendary({ id: "end", name: "Recusar o Fim", description: "+38% de vida, cura total e +2 de armadura.", classId: "general", apply: b => { b.maxHp = Math.ceil(b.maxHp * 1.38); b.hp = b.maxHp; b.armor += 2; } }),
  legendary({ id: "perfect-dash", name: "Passo Fora do Tempo", description: "Esquiva recarrega em 1,6 s, ganha uma carga e causa dano.", classId: "general", apply: b => { b.dashCooldown = 1.6; b.dashMax += 1; b.dashDamage += 1.2; } }),

  normal({ id: "war-steel", name: "Aço Temperado", description: "+2 de armadura e +9% de dano.", classId: "warrior", apply: b => { b.armor += 2; b.damage *= 1.09; } }),
  normal({ id: "war-arc", name: "Arco da Lâmina", description: "+25% de alcance e área dos golpes.", classId: "warrior", apply: b => { b.attackRange *= 1.25; b.area *= 1.22; } }),
  normal({ id: "war-rage", name: "Fúria Cadenciada", description: "A cada 5 s, uma onda de impacto explode ao seu redor.", classId: "warrior", apply: b => { b.rageInterval = b.rageInterval ? Math.max(2.4, b.rageInterval * .82) : 5; } }),
  normal({ id: "war-speed", name: "Golpe Repetido", description: "+17% de velocidade de ataque.", classId: "warrior", apply: b => { b.attackInterval *= .83; } }),
  rare({ id: "war-counter", name: "Geometria de Guerra", description: "+30% de dano e +3 de perfuração.", classId: "warrior", apply: b => { b.damage *= 1.3; b.pierce += 3; } }),
  rare({ id: "war-bastion", name: "Bastião Móvel", description: "+34% de vida e +3 de armadura, −7% de movimento.", classId: "warrior", apply: b => { const gain = b.maxHp * .34; b.maxHp += gain; b.hp += gain; b.armor += 3; b.moveSpeed *= .93; } }),
  rare({ id: "war-blood", name: "Lâmina Sanguínea", description: "+22% de dano e +0,8 de regeneração.", classId: "warrior", apply: b => { b.damage *= 1.22; b.regen += .8; } }),
  legendary({ id: "war-quake", name: "Lâmina de Terremoto", description: "Golpes ficam 80% maiores, atravessam +5 e causam +25% de dano.", classId: "warrior", apply: b => { b.area *= 1.8; b.pierce += 5; b.damage *= 1.25; } }),
  ult(normal({ id: "uw1", name: "ULT · Grito de Guerra", description: "Invulnerabilidade e ondas de choque por vários segundos.", classId: "warrior", ultimate: "war-cry", apply: b => { b.ultimate = "war-cry"; b.ultimateName = "Grito de Guerra"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),
  ult(rare({ id: "uw2", name: "ULT · Último Guardião", description: "Cura 45% e cria uma muralha destrutiva.", classId: "warrior", ultimate: "guardian", apply: b => { b.ultimate = "guardian"; b.ultimateName = "Último Guardião"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),
  ult(legendary({ id: "uw3", name: "ULT · Quebra-Mundo", description: "Três terremotos atravessam todo o campo.", classId: "warrior", ultimate: "earthbreaker", apply: b => { b.ultimate = "earthbreaker"; b.ultimateName = "Quebra-Mundo"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),

  normal({ id: "ar-draw", name: "Corda Tensa", description: "+17% de cadência e +12% de velocidade de flecha.", classId: "archer", apply: b => { b.attackInterval *= .83; b.projectileSpeed *= 1.12; } }),
  normal({ id: "ar-split", name: "Flecha Bipartida", description: "+1 flecha com dispersão, −7% de dano.", classId: "archer", apply: b => { b.projectileCount += 1; b.spread = Math.max(.08, b.spread); b.damage *= .93; } }),
  normal({ id: "ar-hunt", name: "Instinto do Caçador", description: "+14% crítico e +10% movimento.", classId: "archer", apply: b => { b.critChance += .14; b.moveSpeed *= 1.1; } }),
  normal({ id: "ar-volley", name: "Ritmo de Rajada", description: "A rajada de três flechas acontece um ataque antes. Ela define o total mínimo da rajada; não soma três flechas escondidas.", classId: "archer", apply: b => { b.multishotEvery = Math.max(2, b.multishotEvery - 1); } }),
  rare({ id: "ar-ghost", name: "Ponta Fantasma", description: "+3 perfuração e +20% de dano.", classId: "archer", apply: b => { b.pierce += 3; b.damage *= 1.2; } }),
  rare({ id: "ar-focus", name: "Olho Imóvel", description: "+28% crítico e críticos causam 230%.", classId: "archer", apply: b => { b.critChance += .28; b.critDamage = Math.max(2.3, b.critDamage); } }),
  legendary({ id: "ar-stars", name: "Constelação de Setas", description: "+4 flechas, +25% de cadência e +2 perfuração.", classId: "archer", apply: b => { b.projectileCount += 4; b.spread = Math.max(.1, b.spread); b.attackInterval *= .75; b.pierce += 2; } }),
  ult(normal({ id: "ua1", name: "ULT · Chuva de Flechas", description: "Cobre o campo com disparos guiados.", classId: "archer", ultimate: "arrow-storm", apply: b => { b.ultimate = "arrow-storm"; b.ultimateName = "Chuva de Flechas"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),
  ult(rare({ id: "ua2", name: "ULT · Caçada do Vazio", description: "Uma flecha poderosa busca cada inimigo.", classId: "archer", ultimate: "void-rain", apply: b => { b.ultimate = "void-rain"; b.ultimateName = "Caçada do Vazio"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),
  ult(legendary({ id: "ua3", name: "ULT · Caçador Fantasma", description: "Três ecos repetem seus disparos por 7 segundos.", classId: "archer", ultimate: "phantom-hunt", apply: b => { b.ultimate = "phantom-hunt"; b.ultimateName = "Caçador Fantasma"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),

  normal({ id: "ma-fire", name: "Bola de Fogo", description: "A cada 5 s, lança uma explosão em área.", classId: "mage", apply: b => { b.fireballInterval = b.fireballInterval ? Math.max(2.5, b.fireballInterval * .82) : 5; } }),
  normal({ id: "ma-slow", name: "Poço de Lentidão", description: "Cria uma área que desacelera ameaças e projéteis.", classId: "mage", apply: b => { b.slowFieldInterval = b.slowFieldInterval ? Math.max(4, b.slowFieldInterval * .82) : 8; } }),
  normal({ id: "ma-focus", name: "Foco Prismático", description: "+20% de dano e +20% de área.", classId: "mage", apply: b => { b.damage *= 1.2; b.area *= 1.2; } }),
  normal({ id: "ma-speed", name: "Conjuração Abreviada", description: "+16% de velocidade de ataque.", classId: "mage", apply: b => { b.attackInterval *= .84; } }),
  rare({ id: "ma-chain", name: "Geometria Encadeada", description: "+2 projéteis e +2 perfuração.", classId: "mage", apply: b => { b.projectileCount += 2; b.spread = Math.max(.12, b.spread); b.pierce += 2; } }),
  rare({ id: "ma-collapse", name: "Colapso Arcano", description: "+48% de dano, −18% de vida máxima.", classId: "mage", apply: b => { b.damage *= 1.48; b.maxHp *= .82; b.hp = Math.min(b.hp, b.maxHp); } }),
  rare({ id: "ma-field", name: "Campo Persistente", description: "Áreas ficam 45% maiores e +1 regeneração.", classId: "mage", apply: b => { b.area *= 1.45; b.regen += 1; } }),
  legendary({ id: "ma-star", name: "Estrela Engarrafada", description: "Explosões +75%, +4 perfuração e +24% de dano.", classId: "mage", apply: b => { b.area *= 1.75; b.pierce += 4; b.damage *= 1.24; } }),
  ult(normal({ id: "um1", name: "ULT · Cataclismo Arcano", description: "Cinco círculos explodem pelo campo.", classId: "mage", ultimate: "arcane-cataclysm", apply: b => { b.ultimate = "arcane-cataclysm"; b.ultimateName = "Cataclismo Arcano"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),
  ult(rare({ id: "um2", name: "ULT · Instante Imóvel", description: "Congela ameaças e causa dano contínuo.", classId: "mage", ultimate: "time-stop", apply: b => { b.ultimate = "time-stop"; b.ultimateName = "Instante Imóvel"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),
  ult(legendary({ id: "um3", name: "ULT · Singularidade", description: "Puxa tudo ao centro antes de uma explosão colossal.", classId: "mage", ultimate: "singularity", apply: b => { b.ultimate = "singularity"; b.ultimateName = "Singularidade"; b.ultimateCharge = 0; b.ultimateLevel += 1; } })),
];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const cloneBuild = (id: HeroClass) => ({ ...BASES[id], slots: { ...BASES[id].slots }, passives: [...BASES[id].passives] });
const id = (g: Game) => g.nextId++;
function makeBoss(stage: number, hp: number, x: number, y: number, vulnerable = true): Boss {
  return { x, y, hp, maxHp: hp, radius: 48 + stage * 3, cooldown: 1.2, pattern: 0, rage: false, intermission: 0, reborn: false, vulnerable, phaseStarted: false, intent: "", intentClock: 0, combatPhase: 1, transitionClock: 0, pathIndex: 0, dashTelegraph: 0, dashDuration: 0, dashElapsed: 0, dashFromX: x, dashFromY: y, dashToX: x, dashToY: y, burnTime: 0, burnDps: 0, poisonTime: 0, poisonStacks: 0, bloodStacks: 0, frostTime: 0, frostStacks: 0, fearTime: 0, stunTime: 0, solarTime: 0, solarStacks: 0, statusTick: 0 };
}

const SLOT_LABEL: Record<BoonSlot, string> = { attack: "ATAQUE", dash: "ESQUIVA", technique1: "TÉCNICA I", technique2: "TÉCNICA II", ultimate: "ULTIMATE", passive: "PASSIVA" };
const BOON_NAMES: Record<GodId, Record<BoonSlot, string>> = {
  flame: { attack: "Projétil da Pira", dash: "Forma Incandescente", technique1: "Bola do Sol Morto", technique2: "Círculo de Cinzas", ultimate: "Coroa da Caldeira", passive: "Carvão no Sangue" },
  tide: { attack: "Lâmina de Maré", dash: "Passo da Ressaca", technique1: "Poço Abissal", technique2: "Lua das Águas", ultimate: "Dilúvio sem Margens", passive: "Fôlego do Náufrago" },
  gale: { attack: "Corte do Zéfiro", dash: "Passo sem Peso", technique1: "Rajada Soberana", technique2: "Olho do Vendaval", ultimate: "Céu em Queda", passive: "Pulmões da Tempestade" },
  frost: { attack: "Estilhaço de Ilyr", dash: "Ponte de Geada", technique1: "Inverno Local", technique2: "Órbita de Granizo", ultimate: "Segundo Congelado", passive: "Pele de Permafrost" },
  shadow: { attack: "Agulha do Vazio", dash: "Ausência Breve", technique1: "Fenda Predatória", technique2: "Ecos sem Dono", ultimate: "Noite sem Testemunhas", passive: "Fome no Limiar" },
  radiance: { attack: "Agulha de Luz", dash: "Passagem Instantânea", technique1: "Halo Prismático", technique2: "Órbita dos Santos", ultimate: "Velocidade da Luz", passive: "Cadência Radiante" },
  venom: { attack: "Presa de Vespara", dash: "Passo Nocivo", technique1: "Jardim Cáustico", technique2: "Esporos Famintos", ultimate: "Coroa da Serpente", passive: "Sangue Antídoto" },
  storm: { attack: "Seta de Keraun", dash: "Salto Voltaico", technique1: "Relâmpago Bifurcado", technique2: "Nuvem de Guerra", ultimate: "Coração da Tormenta", passive: "Nervos de Cobre" },
  blood: { attack: "Lança Hemática", dash: "Passo da Artéria", technique1: "Maré Rubra", technique2: "Pacto Pulsante", ultimate: "Banquete da Mãe Rubra", passive: "Dívida de Carne" },
  stone: { attack: "Dente de Montanha", dash: "Investida Monolítica", technique1: "Falha Tectônica", technique2: "Satélites de Basalto", ultimate: "Corpo do Mundo", passive: "Ossos de Granito" },
  moon: { attack: "Crescente Lunar", dash: "Órbita Fugidia", technique1: "Eclipse Próximo", technique2: "Luas Gêmeas", ultimate: "Noite de Duas Luas", passive: "Maré Astral" },
  sun: { attack: "Marca do Zênite", dash: "Passo do Meio-Dia", technique1: "Coluna Solar", technique2: "Coroa do Zênite", ultimate: "Segundo Sol", passive: "Fotossíntese Arcana" },
  wild: { attack: "Têmpera do Ataque", dash: "Têmpera da Esquiva", technique1: "Têmpera da Técnica", technique2: "Têmpera da Órbita", ultimate: "Obra-Prima", passive: "Lição do Ferreiro" },
};
const ULTIMATE_BY_GOD: Record<GodId, Ultimate> = { flame: "arcane-cataclysm", tide: "guardian", gale: "arrow-storm", frost: "time-stop", shadow: "singularity", radiance: "guardian", venom: "void-rain", storm: "arrow-storm", blood: "war-cry", stone: "earthbreaker", moon: "singularity", sun: "arcane-cataclysm", wild: "phantom-hunt" };

function applyGodBoon(god: GodId, slot: BoonSlot, b: Build, p: number) {
  if (god === "wild") return;
  if (slot === "attack") {
    b.attackGod = god; b.damage *= 1 + .045 * p; b.projectileSize *= 1 + .035 * p;
    if (god === "flame") { b.area *= 1 + .13 * p; b.damage *= 1 + .08 * p; b.burnChance += .22 + .07 * p; b.burnPercent += .075 + .025 * p; }
    else if (god === "tide") { b.pierce += Math.ceil(p); b.knockback += .24 * p; b.elementalAmp += .045 * p; }
    else if (god === "gale") { b.moveSpeed *= 1 + .08 * p; b.projectileSpeed *= 1 + .05 * p; b.pierceRamp += .16 * p; if (p >= 2) b.projectileCount++; if (p >= 2.7) { b.projectileCount += 2; b.spread = Math.max(.24, b.spread); } }
    else if (god === "frost") { b.slowFieldInterval = b.slowFieldInterval || Math.max(5, 10 - p); }
    else if (god === "shadow") { b.critChance += .045 * p; b.executeChance += .035 * p; }
    else if (god === "radiance") { b.pierce += Math.ceil(p * .8); b.attackInterval *= 1 - Math.min(.3, .07 * p); }
    else if (god === "venom") { b.poisonDamage += .1 * p; b.poisonMaxStacks = Math.max(b.poisonMaxStacks, 4 + Math.ceil(p * 2)); b.poisonStackDamage += .018 * p; }
    else if (god === "storm") { b.chainChance += .1 * p; b.projectileSpeed *= 1 + .08 * p; b.attackInterval *= 1 - Math.min(.32, .08 * p); b.critChance += .035 * p; }
    else if (god === "blood") { b.critDamage += .18 * p; b.bloodThreshold = Math.max(4, 9 - Math.floor(p)); b.bloodBurstDamage += .55 * p; }
    else if (god === "stone") { b.armorDamageRatio += .65 * p; b.projectileSize *= 1 + .12 * p; b.moveSpeed *= 1 - Math.min(.1, .018 * p); }
    else if (god === "moon") { b.area *= 1 + .08 * p; b.magnet += 42 * p; b.pierce += Math.floor(p / 2); }
    else if (god === "sun") { b.area *= 1 + .09 * p; b.damage *= 1 + .07 * p; }
  } else if (slot === "dash") {
    b.dashGod = god; b.dashCooldown = Math.max(1.45, b.dashCooldown * (1 - .055 * p)); b.dashDamage += .35 * p; b.dashTrail = true;
    if (god === "gale") { b.moveSpeed *= 1 + .09 * p; b.dashMax = Math.max(2, b.dashMax); }
    if (god === "storm") b.attackInterval *= 1 - Math.min(.2, .045 * p);
    if (god === "shadow") { b.dashClone = true; b.dashCooldown = 0; b.dashMax = 1; }
    if (god === "tide" || god === "radiance") b.dashShield = Math.min(.9, b.dashShield + .05 * p);
    if (god === "tide") b.dashDamage += .5 * p;
    if (god === "radiance") b.dashCooldown = Math.max(.9, b.dashCooldown * .72);
    if (god === "stone") { b.armor += Math.ceil(p / 2); b.dashDamage += .35 * p; }
    if (god === "blood") { b.onHitHeal += .012 * p; b.bloodPrice += .01 * p; b.critChance += .03 * p; }
  } else if (slot === "technique1") {
    b.technique1God = god;
    if (god === "flame" || god === "storm" || god === "venom") b.fireballInterval = Math.max(2.1, b.fireballInterval ? b.fireballInterval * (1 - .06 * p) : 7.2 - .55 * p);
    else if (god === "frost" || god === "tide") b.slowFieldInterval = Math.max(3.2, b.slowFieldInterval ? b.slowFieldInterval * (1 - .06 * p) : 8.5 - .5 * p);
    else if (["gale", "shadow", "radiance", "blood", "moon", "sun"].includes(god)) { b.novaInterval = Math.max(2.8, b.novaInterval ? b.novaInterval * (1 - .055 * p) : 8 - .55 * p); b.area *= 1 + .04 * p; }
    if (god === "stone") { b.trapInterval = Math.max(2.8, 7.5 - .6 * p); b.trapDamage += .8 * p; }
    if (god === "shadow") { b.summonCount = Math.max(b.summonCount, 1 + Math.floor(p / 1.4)); b.summonDamage += .3 * p; b.summonHp += 42 * p; b.summonGod = "shadow"; }
    if (god === "blood") { b.onHitHeal += .02 * p; b.bloodThreshold = Math.max(4, 9 - Math.floor(p)); b.bloodBurstDamage += .35 * p; }
    if (god === "radiance") b.attackInterval *= 1 - Math.min(.22, .04 * p);
    if (god === "shadow") b.ascensionChance += .00008 * p;
    if (god === "tide") { b.invulnPulseInterval = Math.max(5.5, 10.5 - .65 * p); b.invulnPulseDuration = Math.max(b.invulnPulseDuration, .45 + .16 * p); }
  } else if (slot === "technique2") {
    b.technique2God = god;
    b.orbitals += Math.max(1, Math.floor(1 + p / 2)); b.orbitalDamage += .07 * p;
    b.orbitalRadius += 8 + 5 * p;
    b.projectileSize *= 1 + .025 * p;
    if (god === "storm") { b.chainChance += .06 * p; b.attackInterval *= 1 - Math.min(.18, .04 * p); }
    if (god === "venom") { b.poisonDamage += .06 * p; b.poisonMaxStacks = Math.max(b.poisonMaxStacks, 4 + Math.ceil(p * 2)); b.poisonStackDamage += .012 * p; }
    if (god === "flame") { b.burnChance += .18 + .05 * p; b.burnPercent += .04 + .018 * p; }
    if (god === "blood") { b.bloodThreshold = Math.max(4, 9 - Math.floor(p)); b.bloodBurstDamage += .4 * p; b.critChance += .025 * p; }
    if (god === "moon") b.magnet += 48 * p;
    if (god === "shadow") { b.summonCount = Math.max(b.summonCount, 1 + Math.floor(p / 1.5)); b.summonDamage += .24 * p; b.summonHp += 36 * p; b.summonGod = "shadow"; }
    if (god === "radiance") b.attackInterval *= 1 - Math.min(.16, .03 * p);
    if (god === "shadow") b.ascensionChance += .00004 * p;
    if (god === "tide") b.regen += .08 * p;
    if (god === "gale") b.moveSpeed *= 1 + .025 * p;
    if (god === "stone") b.orbitalDamage += .06 * p;
    if (god === "sun") b.orbitalDamage += .08 * p;
  } else if (slot === "ultimate") {
    b.ultimateGod = god; b.ultimate = ULTIMATE_BY_GOD[god]; b.ultimateName = BOON_NAMES[god].ultimate; b.ultimateCharge = 0; b.ultimateLevel = Math.max(1, b.ultimateLevel + 1);
  } else {
    if (god === "flame") { b.damage *= 1 + .055 * p; b.burnChance += .08 * p; b.projectileSize *= 1 + .05 * p; b.effectDuration *= 1 + .07 * p; }
    else if (god === "tide") { b.xpGain *= 1 + .08 * p; b.barrierMax += b.maxHp * (.18 + .07 * p); b.barrier = b.barrierMax; b.elementalAmp += .04 * p; }
    else if (god === "gale") b.moveSpeed *= 1 + .08 * p;
    else if (god === "frost") b.armor += Math.ceil(p / 2);
    else if (god === "shadow") { b.critChance += .04 * p; b.critDamage += .06 * p; }
    else if (god === "radiance") b.attackInterval *= 1 - Math.min(.3, .065 * p);
    else if (god === "venom") { b.poisonMaxStacks += Math.ceil(p); b.poisonStackDamage += .01 * p; }
    else if (god === "storm") b.attackInterval *= 1 - Math.min(.28, .065 * p);
    else if (god === "blood") { b.critDamage += .16 * p; b.maxHp *= 1 - Math.min(.12, .018 * p); b.hp = Math.min(b.hp, b.maxHp); }
    else if (god === "stone") { const gain = b.maxHp * (.05 * p); b.maxHp += gain; b.hp += gain; b.armor += Math.ceil(p); b.moveSpeed *= 1 - Math.min(.08, .012 * p); }
    else if (god === "moon") { b.area *= 1 + .065 * p; b.magnet += 55 * p; }
    else if (god === "sun") { b.regen += .18 * p; b.radiantDropChance += .02 * p; }
  }
  if (b.classId === "warrior") { if (slot === "attack") b.damage *= 1 + .025 * p; if (slot === "technique2") b.armor += Math.floor(p / 2); }
  else if (b.classId === "archer") { if (slot === "attack") b.projectileSpeed *= 1 + .035 * p; if (slot === "dash") b.dashCooldown *= 1 - Math.min(.12, .025 * p); }
  else { if (slot === "attack" || slot === "technique1") b.area *= 1 + .025 * p; if (slot === "technique2") b.orbitalDamage += .035 * p; }
}

function boonDescription(god: GodId, slot: BoonSlot, rarity: Rarity) {
  const p = RARITY_POWER[rarity], pct = (value: number) => Math.round(value * p), classBonus = " O efeito recebe ainda um pequeno bônus próprio da sua classe.";
  if (slot === "attack") {
    const effects: Record<GodId, string> = {
      flame: `Ataques causam +${pct(13)}% de dano e podem incendiar. A queimadura consome ${pct(10)}% da vida máxima do alvo em 3,5 s; novos acertos renovam o fogo.`,
      tide: `Ataques causam +${pct(5)}% de dano, atravessam +${Math.ceil(p)} alvo(s) e empurram inimigos.`,
      gale: `Ataques causam +${pct(5)}% de dano, viajam +${pct(5)}% mais rápido e aumentam seu movimento em ${pct(8)}%; a partir de Incomum, dispara +1 projétil.`,
      frost: `Ataques causam +${pct(5)}% de dano, aplicam 28% de lentidão e passam a criar periodicamente uma zona congelante.`,
      shadow: `Ataques causam +${pct(5)}% de dano, ganham +${pct(4.5)}% de crítico e +${pct(3.5)}% de chance de executar com uma explosão sombria.`,
      radiance: `Ataques causam +${pct(5)}% de dano e sua cadência aumenta em aproximadamente ${pct(7)}%.`,
      venom: `Cada acerto aplica 1 acúmulo de veneno, até ${4 + Math.ceil(p * 2)}. Mais acúmulos causam progressivamente mais dano por segundo.`,
      storm: `Ataques ficam ${pct(8)}% mais rápidos, atacam cerca de ${pct(8)}% mais vezes e têm +${pct(10)}% de chance de saltar para outro inimigo.`,
      blood: `Ataques ganham +${pct(6)}% de crítico. A cada ${Math.max(4, 9 - Math.floor(p))} marcas, o alvo sofre uma explosão de Hemorragia.`,
      stone: `Ataques ganham dano adicional igual a ${pct(65)}% da sua Armadura. É um golpe pesado de alvo único.`,
      moon: `Ataques causam +${pct(5)}% de dano, ficam +${pct(8)}% maiores e recebem perfuração nas raridades superiores.`,
      sun: `Ataques aplicam Marca Solar. No terceiro acúmulo, o alvo explode em luz e causa dano aos inimigos próximos.`,
      wild: `Guerra não substitui ataques diretamente: ela aprimora uma bênção já equipada em um ou dois graus.`,
    }; return effects[god] + classBonus;
  }
  if (slot === "dash") {
    const extras: Record<GodId, string> = { flame: "vira uma corrida ígnea 50% mais veloz e deixa fogo pelo caminho", tide: "viaja mais longe e cria no fim uma onda que empurra e atordoa inimigos comuns", gale: "concede uma segunda carga e atravessa grupos", frost: "acumula Gelo em quem atravessa", shadow: "marca uma âncora; o segundo toque retorna instantaneamente ao ponto sem recarga", radiance: "teleporta instantaneamente na direção escolhida", venom: "deixa uma poça venenosa", storm: "descarrega raios nos inimigos atravessados", blood: "rouba vida", stone: "concede armadura e impacto", moon: "deixa um eco que repete sua próxima ação", sun: "deixa um clarão que marca inimigos", wild: "aprimora a esquiva já equipada" };
    return `A esquiva recarrega ${pct(5.5)}% mais rápido, causa +${(0.35 * p).toFixed(1)}× de dano-base ao atravessar inimigos e ${extras[god]}.` + (god === "blood" ? " Parte do poder cobra vida ao atacar." : "");
  }
  if (slot === "technique1") {
    const effects: Record<GodId, string> = {
      flame: `A cada ${(7.2 - .55 * p).toFixed(1)} s, lança um meteoro de 180% do dano, grande explosão e queimadura garantida.`,
      tide: `A cada ${(8.5 - .5 * p).toFixed(1)} s, ergue uma maré por 5 s que freia ameaças; periodicamente você fica intangível por ${(0.45 + .16 * p).toFixed(1)} s.`,
      gale: `A cada ${(8 - .55 * p).toFixed(1)} s, uma rajada circular de 135% do dano abre espaço ao redor do personagem.`,
      frost: `A cada ${(8.5 - .5 * p).toFixed(1)} s, cria um inverno local por 5 s que reduz inimigos e projéteis em 50%.`,
      shadow: `A cada ${(8 - .55 * p).toFixed(1)} s, uma fenda causa 135% do dano; cada morte tem uma chance de 0,0${Math.max(1, Math.round(.8 * p))}% de conceder um nível inteiro.`,
      radiance: `A cada ${(8 - .55 * p).toFixed(1)} s, um halo causa 135% do dano; fragmentos valem mais e alguns inimigos derrubam 3× XP.`,
      venom: `A cada ${(7.2 - .55 * p).toFixed(1)} s, semeia um jardim cáustico que aplica 2 acúmulos e continua envenenando quem permanece nele.`,
      storm: `A cada ${(7.2 - .55 * p).toFixed(1)} s, dispara três relâmpagos bifurcados, rápidos e capazes de saltar entre alvos.`,
      blood: `A cada ${(8 - .55 * p).toFixed(1)} s, uma maré rubra marca todos ao redor; ao atingir ${Math.max(4, 9 - Math.floor(p))} marcas, eles explodem.`,
      stone: `A cada ${(7.5 - .6 * p).toFixed(1)} s, arma uma runa tectônica no chão. Ela espera um inimigo e então explode em grande área.`,
      moon: `A cada ${(8 - .55 * p).toFixed(1)} s, um eclipse causa 135% do dano em grande área e aproxima fragmentos distantes.`,
      sun: `A cada ${(8 - .55 * p).toFixed(1)} s, uma coluna solar marca e incinera uma área; inimigos com três marcas explodem.`,
      wild: `Guerra aprimora uma técnica já equipada; não cria uma técnica elemental própria.`,
    }; return effects[god];
  }
  if (slot === "technique2") {
    const count = god === "wild" ? Math.max(5, Math.floor(p / 2)) : Math.max(1, Math.floor(1 + p / 2));
    const radiusGain = Math.round(8 + 5 * p);
    const identity: Record<GodId, string> = { flame: "incendeiam ao tocar", tide: "regeneram uma pequena fração de vida", gale: "giram mais velozmente", frost: "acumulam Gelo", shadow: "rasgam alvos enfraquecidos", radiance: "disparam pequenos raios de luz", venom: "acumulam veneno", storm: "podem saltar eletricidade", blood: "acumulam marcas de Hemorragia", stone: "causam impacto pesado", moon: "criam ecos orbitais", sun: "acumulam Marca Solar", wild: "aprimoram a órbita já equipada" };
    return god === "wild"
      ? `Mantém no mínimo 5 foices grandes girando ao seu redor. Elas ficam ${radiusGain} unidades mais distantes, causam dano contínuo e cada nova bênção aumenta alcance e força.`
      : count === 1
        ? `Invoca 1 manifestação orbital permanente. Ela fica ${radiusGain} unidades mais distante, causa dano desde a raridade Comum e ${identity[god]}.`
        : `Invoca ${count} manifestações orbitais permanentes. Elas ficam ${radiusGain} unidades mais distantes, causam dano contínuo e ${identity[god]}.`;
  }
  if (slot === "ultimate") {
    const effects: Record<GodId, string> = {
      flame: "faz 18 meteoros incendiarem o campo inteiro, cada impacto queimando e causando dano em área",
      tide: "cura toda a vida, concede 6 s de invulnerabilidade e cobre o mapa com uma maré destrutiva",
      gale: "dispara uma tempestade de 55 lâminas velozes e perfurantes contra os alvos do campo",
      frost: "congela o tempo por 8 s, reduzindo ameaças em 94% e causando dano contínuo",
      shadow: "abre uma singularidade por 6 s que quase paralisa e devora todo o campo",
      radiance: "julga todos os inimigos, causa enorme dano ao chefe, cura 50% da vida e concede invulnerabilidade",
      venom: "aplica o máximo de veneno em todos os alvos e mantém um jardim cáustico global por 8 s",
      storm: "descarrega 72 relâmpagos guiados, extremamente rápidos e perfurantes",
      blood: "atinge o alvo mais resistente com até 24% de sua vida máxima e explode o dano ao redor",
      stone: "arma doze runas tectônicas pelo mapa e concede 4 s de invulnerabilidade",
      moon: "dispara 42 luas perfurantes em todas as direções e concede 4 s de invulnerabilidade",
      sun: "invoca um segundo sol que aplica marcas, detona o campo e deixa você renascer uma vez durante sua duração",
      wild: "aprimora a ultimate atual em até dois graus e concede uma propriedade superior",
    };
    return `Substitui sua ultimate atual por ${BOON_NAMES[god].ultimate}. Ela carrega ao causar dano e ativa automaticamente em 100%: ${effects[god]}.`;
  }
  const effects: Record<GodId, string> = {
    flame: `Aumenta dano, tamanho de projétil, queima e duração de todos os efeitos temporários.`, tide: `Aumenta XP em ${pct(8)}%, amplia efeitos elementais e cria ${pct(25)}% da vida máxima como Barreira persistente até ser destruída.`, gale: `Aumenta o movimento em ${pct(8)}%.`, frost: `Concede +${Math.ceil(p / 2)} de armadura e fortalece acúmulos de Gelo.`, shadow: `Concede +${pct(4)}% de crítico e aumenta o dano crítico.`, radiance: `Aumenta a velocidade de ataque em aproximadamente ${pct(6.5)}%.`, venom: `Aumenta o limite e o dano de cada acúmulo de veneno.`, storm: `Aumenta velocidade de ataque, crítico e ricochetes.`, blood: `Aumenta dano crítico e crítico, mas reduz a vida máxima em ${pct(1.8)}%.`, stone: `Aumenta vida máxima e concede +${Math.ceil(p)} de armadura, mas reduz levemente o movimento.`, moon: `Aumenta área, alcance de coleta e força dos ecos em ${pct(6.5)}%.`, sun: `Concede regeneração e aumenta a chance de fragmentos solares valiosos.`, wild: `Aprimora permanentemente uma bênção já equipada.`,
  }; return `${effects[god]} É uma passiva permanente e não ocupa um dos cinco espaços ativos.`;
}

function materializeBoon(god: GodId, slot: BoonSlot, rarity: Rarity): UpgradeCard {
  const rank = RARITY_RANK[rarity], p = RARITY_POWER[rarity];
  return { id: `${god}-${slot}-${rarity}-${Math.random().toString(36).slice(2, 7)}`, name: BOON_NAMES[god][slot], description: boonDescription(god, slot, rarity), rarity, classId: "general", god, slot, rank, ultimate: slot === "ultimate" ? ULTIMATE_BY_GOD[god] : undefined, apply: b => applyGodBoon(god, slot, b, p) };
}

function forgeChoices(g: Game, rarity: Rarity): UpgradeCard[] {
  const rankGain = rarity === "mythic" ? 2 : 1, slots = (["attack", "dash", "technique1", "technique2", "ultimate"] as const).filter(slot => g.build.slots[slot] && g.build.slots[slot]!.rank < 5);
  return slots.slice(0, 3).map(slot => {
    const current = g.build.slots[slot]!, nextRank = Math.min(5, current.rank + rankGain), targetPower = [0, 1, 1.3, 1.68, 2.15, 2.85][nextRank];
    return { id: `war-${slot}-${Math.random()}`, name: `Têmpera: ${current.name}`, description: `Aprimora ${SLOT_LABEL[slot]} de ${RARITY_LABEL[current.rarity]} para o equivalente ao grau ${nextRank}${rankGain === 2 ? " (+2 graus)" : " (+1 grau)"}, reforçando seus números e sua propriedade elemental sem trocar a bênção.`, rarity, classId: "general", god: "wild" as GodId, slot, rank: nextRank, upgradeTarget: slot, apply: b => { const boon = b.slots[slot]; if (!boon) return; applyGodBoon(boon.god, slot, b, Math.max(.6, targetPower - RARITY_POWER[boon.rarity])); boon.rank = nextRank; boon.rarity = nextRank === 5 ? "mythic" : nextRank === 4 ? "legendary" : nextRank === 3 ? "rare" : nextRank === 2 ? "uncommon" : "common"; } };
  });
}

const CURSES: UpgradeCard[] = [
  { id: "curse-glass", name: "Coração de Vidro", description: "+65% de dano, mas perde 30% da vida máxima. O preço é permanente.", rarity: "curse", classId: "general", slot: "passive", rank: 5, apply: b => { b.damage *= 1.65; b.maxHp *= .7; b.hp = Math.min(b.hp, b.maxHp); } },
  { id: "curse-anchor", name: "Âncora na Carne", description: "+6 de armadura e +32% de dano, mas −22% de movimento.", rarity: "curse", classId: "general", slot: "passive", rank: 5, apply: b => { b.armor += 6; b.damage *= 1.32; b.moveSpeed *= .78; } },
  { id: "curse-hunger", name: "Mundo Faminto", description: "+55% de fragmentos, mas sua regeneração é anulada.", rarity: "curse", classId: "general", slot: "passive", rank: 5, apply: b => { b.xpGain *= 1.55; b.regen = 0; } },
  { id: "curse-red", name: "Promessa Escarlate", description: "Rouba vida a cada acerto, mas todo disparo custa uma fração de PV.", rarity: "curse", classId: "general", slot: "passive", rank: 5, apply: b => { b.onHitHeal += .085; b.bloodPrice += .006; } },
  { id: "curse-speed", name: "Nunca Pare", description: "+38% de movimento e −25% na recarga da esquiva, mas −3 de armadura.", rarity: "curse", classId: "general", slot: "passive", rank: 5, apply: b => { b.moveSpeed *= 1.38; b.dashCooldown *= .75; b.armor -= 3; } },
];

function rarity(g: Game): Rarity {
  const roll = Math.random(), stage = g.stage, luck = g.build.luck;
  const curseChance = g.level >= 3 ? .026 : 0;
  const mythicChance = .0025 + stage * .0015 + luck * .045;
  const legendaryChance = .018 + stage * .006 + luck * .16;
  const rareChance = .085 + stage * .012 + luck * .42;
  const uncommonChance = .26 + stage * .012 + luck * .35;
  if (roll < curseChance) return "curse";
  if (roll < curseChance + mythicChance) return "mythic";
  if (roll < curseChance + mythicChance + legendaryChance) return "legendary";
  if (roll < curseChance + mythicChance + legendaryChance + rareChance) return "rare";
  if (roll < curseChance + mythicChance + legendaryChance + rareChance + uncommonChance) return "uncommon";
  return "common";
}
function weightedPick<T>(items: T[], weight: (item: T) => number): T {
  const weighted = items.map(item => ({ item, weight: Math.max(.001, weight(item)) })); const total = weighted.reduce((sum, item) => sum + item.weight, 0); let roll = Math.random() * total;
  for (const entry of weighted) { roll -= entry.weight; if (roll <= 0) return entry.item; } return weighted[weighted.length - 1].item;
}
function choices(g: Game) {
  if (g.level >= 3 && Math.random() < .065) return [...CURSES].sort(() => Math.random() - .5).slice(0, 3);
  const gods = Object.keys(GODS) as GodId[];
  const god = weightedPick(gods, candidate => {
    if (candidate === "wild") return Object.values(g.build.slots).filter(boon => boon && boon.rank < 5).length >= 3 && g.level >= 4 ? .26 : .001;
    const aligned = Object.values(g.build.slots).filter(Boolean).some(boon => boon?.god === candidate);
    return aligned ? 1.35 : 1;
  });
  if (god === "wild") { let forgeRarity = rarity(g); if (forgeRarity === "curse") forgeRarity = "rare"; return forgeChoices(g, forgeRarity); }
  const result: UpgradeCard[] = [], slots: BoonSlot[] = ["attack", "dash", "technique1", "technique2", "ultimate", "passive"];
  while (result.length < 3) {
    let offeredRarity = rarity(g); if (offeredRarity === "curse") offeredRarity = "rare";
    const available = slots.filter(slot => !result.some(card => card.slot === slot));
    const slot = weightedPick(available, candidate => {
      if (candidate === "passive") return 1.15;
      const current = g.build.slots[candidate]; const rank = RARITY_RANK[offeredRarity];
      if (!current) return 1.4;
      if (current.god === god) return 1.8;
      return rank > current.rank ? 2.5 : .18;
    });
    const current = slot === "passive" ? null : g.build.slots[slot];
    if (current && current.god !== god && RARITY_RANK[offeredRarity] <= current.rank && Math.random() < .7) {
      offeredRarity = current.rank >= 4 ? "mythic" : current.rank === 3 ? "legendary" : current.rank === 2 ? "rare" : "uncommon";
    }
    result.push(materializeBoon(god, slot, offeredRarity));
  }
  return result;
}
function createGame(classId: HeroClass, meta: MetaProgress = DEFAULT_META): Game {
  const build = applyMetaProgress(cloneBuild(classId), meta);
  return { phase: "ready", width: 1120, height: 650, stage: 0, elapsed: 0, stageElapsed: 0, phaseClock: 0, build,
    player: { x: 560, y: 390, radius: 17, invulnerable: 0, dashCooldown: 0, dashCharges: build.dashMax, dashClock: 0, dashTrailClock: 0, dashX: 0, dashY: 0, moved: false, dashBurstPending: false, shadowAnchor: null },
    boss: makeBoss(0, 1, 560, 150),
    enemies: [], projectiles: [], fragments: [], zones: [], hazards: [], relics: [], floats: [], summons: [], keys: new Set(), xp: 0, xpNeeded: 22, level: 1, kills: 0,
    spawnClock: 1.4, attackClock: .3, fireballClock: .8, rageClock: .8, slowFieldClock: 0, novaClock: 0, trapClock: 0, summonClock: 0, invulnPulseClock: 0, attackNumber: 0, paused: false, lastTime: 0, nextId: 1, memoryWave: 0,
    parryQueue: [], parrySpawnClock: 0, parryStreak: 0, parryFlash: 0,
    echoHistory: [], echoRecordClock: 0, echoes: [], rule: "none", ruleTelegraph: 0, ruleActive: 0, ruleTick: 0, ruleInverted: false, shadowCloneTime: 0, moonEchoTime: 0, sunGraceTime: 0 };
}
function snap(g: Game): Hud { return { phase: g.phase, stage: g.stage, elapsed: g.stageElapsed, hp: g.build.hp, maxHp: g.build.maxHp, barrier: g.build.barrier, barrierMax: g.build.barrierMax, xp: g.xp, xpNeeded: g.xpNeeded, level: g.level, kills: g.kills, bossHp: g.boss.hp, bossMaxHp: g.boss.maxHp, bossRage: g.boss.rage, ultimate: g.build.ultimateCharge, ultimateMax: g.build.ultimateMax, ultimateName: g.build.ultimateName, paused: g.paused, dashCharges: g.player.dashCharges, dashMax: g.build.dashMax, dashCooldown: g.player.dashCooldown, dashBaseCooldown: g.build.dashCooldown, bossVulnerable: g.boss.vulnerable, relics: g.relics.length, slots: { ...g.build.slots }, passives: [...g.build.passives] } }
function projectile(g: Game, from: Point, angle: number, speed: number, damage: number, hostile: boolean, extra: Partial<Projectile> = {}) { g.projectiles.push({ id: id(g), x: from.x, y: from.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 4, damage, hostile, life: 5, pierce: 0, area: 0, slow: 0, color: hostile ? "#f17689" : g.build.accent, split: 0, hitIds: [], ...extra }); }
function floatText(g: Game, x: number, y: number, text: string, color: string) { g.floats.push({ id: id(g), x, y, text, color, life: .85 }); }
function target(g: Game) { let best: Enemy | Relic | Boss | null = null; let gap = g.build.attackRange; for (const r of g.relics) { const d = distance(g.player, r); if (d < gap) { best = r; gap = d; } } for (const e of g.enemies) { const d = distance(g.player, e); if (d < gap) { best = e; gap = d; } } if (!best && g.phase === "boss" && g.boss.vulnerable && distance(g.player, g.boss) < gap) best = g.boss; return best; }

function ignite(target: Affliction & { hp: number; maxHp: number }, build: Build, strong = false) {
  if (!build.burnChance || (!strong && Math.random() > Math.min(.92, build.burnChance))) return;
  target.burnTime = Math.max(target.burnTime, (strong ? 5 : 3.5) * build.effectDuration);
  target.burnDps = Math.max(target.burnDps, target.maxHp * Math.min(.22, build.burnPercent) / target.burnTime);
}
function poison(target: Affliction, build: Build, bonus = 1) {
  if (!build.poisonMaxStacks) return;
  target.poisonStacks = Math.min(build.poisonMaxStacks, target.poisonStacks + bonus);
  target.poisonTime = 5;
}
function chill(target: Affliction, bonus = 1, boss = false) { target.frostStacks = Math.min(boss ? 5 : 10, target.frostStacks + bonus); target.frostTime = 4.5; }
function solarMark(g: Game, target: Affliction & Point & { hp: number; maxHp: number }, bonus = 1) { target.solarStacks += bonus; target.solarTime = 5; if (target.solarStacks < 3) return; target.solarStacks = 0; const burst = g.build.damage * 2.1 * (1 + g.build.elementalAmp); target.hp -= burst; g.zones.push({ id: id(g), x: target.x, y: target.y, radius: 96 * g.build.area, life: .55, slow: 0, damage: burst * .42, tick: 0, color: GODS.sun.color, hostile: false, god: "sun" }); floatText(g, target.x, target.y - 30, "ZÊNITE", GODS.sun.color); }
function bleed(g: Game, target: (Affliction & Point & { hp: number; maxHp: number }), build: Build, bonus = 1) {
  if (!build.bloodThreshold) return;
  target.bloodStacks += bonus;
  if (target.bloodStacks < build.bloodThreshold) return;
  target.bloodStacks = 0; const burst = build.damage * Math.max(1.2, build.bloodBurstDamage);
  target.hp -= burst; g.zones.push({ id: id(g), x: target.x, y: target.y, radius: 72 + build.bloodBurstDamage * 8, life: .55, slow: 0, damage: burst * .45, tick: 0, color: GODS.blood.color, hostile: false, god: "blood" }); floatText(g, target.x, target.y - 28, "HEMORRAGIA", GODS.blood.color);
}
function tickAffliction(g: Game, target: Affliction & Point & { hp: number; maxHp: number }, dt: number) {
  target.statusTick -= dt; target.burnTime = Math.max(0, target.burnTime - dt); target.poisonTime = Math.max(0, target.poisonTime - dt); target.frostTime = Math.max(0, target.frostTime - dt); target.fearTime = Math.max(0, target.fearTime - dt); target.stunTime = Math.max(0, target.stunTime - dt); target.solarTime = Math.max(0, target.solarTime - dt);
  if (target.poisonTime <= 0) target.poisonStacks = 0;
  if (target.frostTime <= 0) target.frostStacks = 0; if (target.solarTime <= 0) target.solarStacks = 0;
  if (target.statusTick > 0) return; target.statusTick = .35;
  if (target.burnTime > 0) target.hp -= target.burnDps * .35;
  if (target.poisonStacks > 0) target.hp -= g.build.damage * Math.max(.015, g.build.poisonStackDamage) * target.poisonStacks;
}
function grantLevel(g: Game, source: Point) {
  if (!g.build.ascensionChance || Math.random() > g.build.ascensionChance) return false;
  g.xp = g.xpNeeded; floatText(g, source.x, source.y - 35, "ASCENSÃO", GODS.shadow.color); return true;
}

function fireHero(g: Game, echoScale = 1) {
  const aim = target(g); if (!aim) return; const base = Math.atan2(aim.y - g.player.y, aim.x - g.player.x); g.attackNumber++;
  const volley = g.build.classId === "archer" && !!g.build.multishotEvery && g.attackNumber % g.build.multishotEvery === 0;
  let count = volley ? Math.max(3, g.build.projectileCount) : g.build.projectileCount;
  if (g.build.ultimate === "phantom-hunt" && g.build.ultimateCharge > 70) count += 2;
  const god = g.build.attackGod, color = god ? GODS[god].color : g.build.accent;
  for (let i = 0; i < count; i++) { const spread = volley ? Math.max(.12, g.build.spread) : g.build.spread; const angle = base + (count === 1 ? 0 : (i - (count - 1) / 2) * spread), behindScale = 1 + Math.max(0, i - (count - 1) / 2) * g.build.pierceRamp; const critical = Math.random() < g.build.critChance; projectile(g, g.player, angle, g.build.projectileSpeed, Math.round((g.build.damage + (god === "stone" ? g.build.armor * g.build.armorDamageRatio : 0)) * (critical ? g.build.critDamage : 1) * behindScale * echoScale), false, { radius: (g.build.classId === "warrior" ? 8 * g.build.area : 4.5) * g.build.projectileSize, pierce: g.build.pierce, area: god === "flame" ? 24 * g.build.area : 0, slow: god === "frost" ? .28 : 0, color, god: god ?? undefined, special: "attack", shape: god === "stone" || god === "frost" ? "shard" : god === "flame" || god === "radiance" || god === "sun" ? "ember" : "orb", life: g.build.classId === "warrior" ? .4 : 3 }); }
  if (echoScale === 1 && g.shadowCloneTime > 0) fireHero(g, .7); if (echoScale === 1 && g.moonEchoTime > 0) fireHero(g, .45);
  if (g.build.bloodPrice) g.build.hp = Math.max(1, g.build.hp - g.build.maxHp * g.build.bloodPrice);
}
function castTechnique(g: Game) {
  const victim = target(g), god = g.build.technique1God ?? (g.build.classId === "mage" ? "flame" : null);
  if (!victim || !god) return;
  const angle = Math.atan2(victim.y - g.player.y, victim.x - g.player.x), color = GODS[god].color;
  if (god === "flame") projectile(g, g.player, angle, g.build.projectileSpeed * .76, g.build.damage * 1.8, false, { radius: 12 * g.build.projectileSize, area: 105 * g.build.area, color, shape: "ember", god, special: "technique" });
  else if (god === "storm") for (let i = -1; i <= 1; i++) projectile(g, g.player, angle + i * .09, g.build.projectileSpeed * 1.28, g.build.damage * 1.05, false, { radius: 5, pierce: 1, life: 2, color, shape: "shard", god, special: "technique" });
  else if (god === "venom") g.zones.push({ id: id(g), x: victim.x, y: victim.y, radius: 112 * g.build.area, life: 4.2, slow: .24, damage: g.build.damage * .34, tick: 0, color, hostile: false, god: "venom" });
}
function touchOrbital(g: Game, target: Enemy | Boss, damage: number, god: GodId | null, dt: number) {
  const multiplier = god === "stone" ? 1.35 : god === "gale" ? .9 : 1;
  target.hp -= damage * multiplier;
  if (god === "flame" && Math.random() < dt * 1.8) ignite(target, g.build);
  if (god === "venom" && Math.random() < dt * 2.2) poison(target, g.build);
  if (god === "blood" && Math.random() < dt * 1.6) bleed(g, target, g.build);
  if (god === "frost" && Math.random() < dt * 1.5) chill(target, 1, target === g.boss);
  if (god === "sun" && Math.random() < dt * 1.4) solarMark(g, target);
  if (god === "tide") g.build.hp = Math.min(g.build.maxHp, g.build.hp + damage * .0025);
  if (god === "shadow" && target.hp / target.maxHp < .14 && Math.random() < dt * 1.2) target.hp -= damage * 3;
}
function heroDamage(g: Game, amount: number) { if (g.player.invulnerable > 0 || g.phase === "danger" || g.phase === "boss-grace") return; let damage = Math.max(1, Math.round(amount - g.build.armor)); if (g.build.barrier > 0) { const absorbed = Math.min(g.build.barrier, damage); g.build.barrier -= absorbed; damage -= absorbed; floatText(g, g.player.x, g.player.y - 27, `BARREIRA −${Math.round(absorbed)}`, GODS.tide.color); } if (damage > 0) { g.build.hp = Math.max(0, g.build.hp - damage); floatText(g, g.player.x, g.player.y - 27, `−${damage}`, "#f27b8c"); } g.player.invulnerable = .62; if (g.build.hp <= 0) { if (g.sunGraceTime > 0) { g.sunGraceTime = 0; g.build.hp = g.build.maxHp * .55; g.player.invulnerable = 3; floatText(g, g.player.x, g.player.y - 44, "RENASCER SOLAR", GODS.sun.color); } else g.phase = "defeat"; } }
function charge(g: Game, damage: number) {
  if (!g.build.ultimate) return; g.build.ultimateCharge = Math.min(g.build.ultimateMax, g.build.ultimateCharge + Math.max(.25, damage * .026)); if (g.build.ultimateCharge < g.build.ultimateMax) return;
  g.build.ultimateCharge = 0; const p = 1 + g.build.ultimateLevel * .15; const whole = Math.max(g.width, g.height);
  const god = g.build.ultimateGod;
  if (god) {
    if (god === "flame") { for (let i = 0; i < 18; i++) g.zones.push({ id: id(g), x: 45 + Math.random() * (g.width - 90), y: 45 + Math.random() * (g.height - 90), radius: 90 + Math.random() * 55, life: 3.4, slow: 0, damage: g.build.damage * 2.2 * p, tick: .25 + i * .045, color: GODS.flame.color, hostile: false, kind: "meteor", god: "flame" }); }
    else if (god === "tide") { g.build.hp = g.build.maxHp; g.player.invulnerable = 6; g.zones.push({ id: id(g), x: g.player.x, y: g.player.y, radius: whole, life: 6, slow: .72, damage: g.build.damage * .75 * p, tick: 0, color: GODS.tide.color, hostile: false, god: "tide" }); }
    else if (god === "gale") { g.player.invulnerable = 2.2; const aims: Point[] = g.phase === "boss" ? Array.from({ length: 55 }, () => g.boss) : g.enemies.slice(0, 70); aims.forEach((aim, i) => projectile(g, g.player, Math.atan2(aim.y - g.player.y, aim.x - g.player.x) + (i % 5 - 2) * .04, 1050, g.build.damage * 1.65 * p, false, { pierce: 4, life: 2.2, color: GODS.gale.color, shape: "shard", god: "gale", special: "technique" })); }
    else if (god === "frost") { g.player.invulnerable = 3; g.zones.push({ id: id(g), x: g.width / 2, y: g.height / 2, radius: whole, life: 8, slow: .94, damage: g.build.damage * .68 * p, tick: 0, color: GODS.frost.color, hostile: false, god: "frost" }); }
    else if (god === "shadow") { g.shadowCloneTime = 10 * g.build.effectDuration; g.player.invulnerable = 2.5; g.zones.push({ id: id(g), x: g.width / 2, y: g.height / 2, radius: whole * .72, life: 4, slow: .65, damage: g.build.damage * .7 * p, tick: 0, color: GODS.shadow.color, hostile: false, god: "shadow", fear: 1.8 }); }
    else if (god === "radiance") { g.player.invulnerable = 5; const aims: Point[] = g.phase === "boss" ? Array.from({ length: 50 }, () => g.boss) : Array.from({ length: 50 }, (_, i) => g.enemies[i % Math.max(1, g.enemies.length)] ?? g.boss); aims.forEach((aim, i) => projectile(g, g.player, Math.atan2(aim.y - g.player.y, aim.x - g.player.x) + Math.sin(i) * .05, 1550, g.build.damage * 1.15 * p, false, { pierce: 4, life: 1.4, color: GODS.radiance.color, shape: "ember", god: "radiance", special: "technique" })); }
    else if (god === "venom") { for (const e of g.enemies) { e.poisonStacks = Math.max(8, g.build.poisonMaxStacks); e.poisonTime = 12; } g.boss.poisonStacks = Math.max(8, g.build.poisonMaxStacks); g.boss.poisonTime = 12; g.zones.push({ id: id(g), x: g.width / 2, y: g.height / 2, radius: whole, life: 8, slow: .45, damage: g.build.damage * .5 * p, tick: 0, color: GODS.venom.color, hostile: false, god: "venom" }); }
    else if (god === "storm") { const aims: Point[] = g.phase === "boss" ? Array.from({ length: 72 }, () => g.boss) : Array.from({ length: 72 }, (_, i) => g.enemies[i % Math.max(1, g.enemies.length)] ?? g.boss); aims.forEach((aim, i) => projectile(g, g.player, Math.atan2(aim.y - g.player.y, aim.x - g.player.x) + Math.sin(i) * .1, 1200, g.build.damage * 1.35 * p, false, { pierce: 2, life: 2, color: GODS.storm.color, shape: "shard", god: "storm", special: "technique" })); }
    else if (god === "blood") { const victim = g.phase === "boss" ? g.boss : g.enemies.sort((a, b) => b.hp - a.hp)[0]; if (victim) { const burst = Math.min(victim.maxHp * .24, g.build.damage * 32 * p); victim.hp -= burst; g.zones.push({ id: id(g), x: victim.x, y: victim.y, radius: 220, life: 1.1, slow: 0, damage: burst * .35, tick: 0, color: GODS.blood.color, hostile: false, god: "blood" }); g.build.hp = Math.min(g.build.maxHp, g.build.hp + burst * .1); } }
    else if (god === "stone") { g.player.invulnerable = 8 * g.build.effectDuration; g.build.barrier = Math.max(g.build.barrier, g.build.maxHp * .5); g.build.barrierMax = Math.max(g.build.barrierMax, g.build.barrier); }
    else if (god === "moon") { g.moonEchoTime = 12 * g.build.effectDuration; g.player.invulnerable = 3; for (let i = 0; i < 32; i++) projectile(g, g.player, i * Math.PI * 2 / 32, 520 + (i % 3) * 100, g.build.damage * 1.6 * p, false, { pierce: 5, area: 28, life: 3.5, color: GODS.moon.color, shape: "orb", god: "moon", special: "technique" }); }
    else if (god === "sun") { g.sunGraceTime = 12 * g.build.effectDuration; g.player.invulnerable = 4; for (const e of g.enemies) { solarMark(g, e, 3); e.hp -= g.build.damage * 3.5 * p; } if (g.phase === "boss") { solarMark(g, g.boss, 3); g.boss.hp -= g.build.damage * 10 * p; } g.build.hp = Math.min(g.build.maxHp, g.build.hp + g.build.maxHp * .45); g.zones.push({ id: id(g), x: g.width / 2, y: g.height / 2, radius: whole, life: 4, slow: 0, damage: g.build.damage * .65 * p, tick: 0, color: GODS.sun.color, hostile: false, god: "sun" }); }
    floatText(g, g.player.x, g.player.y - 48, g.build.ultimateName.toUpperCase(), GODS[god].color); return;
  }
  if (g.build.ultimate === "war-cry") { g.player.invulnerable = 3; g.zones.push({ id: id(g), x: g.player.x, y: g.player.y, radius: 255, life: 3.2, slow: .55, damage: g.build.damage * .75 * p, tick: 0, color: "#f0ad55", hostile: false }); }
  else if (g.build.ultimate === "guardian") { g.build.hp = Math.min(g.build.maxHp, g.build.hp + g.build.maxHp * .45); g.player.invulnerable = 3.4; g.zones.push({ id: id(g), x: g.player.x, y: g.player.y, radius: 210, life: 4, slow: .3, damage: g.build.damage * .65 * p, tick: 0, color: "#f3dc99", hostile: false }); }
  else if (g.build.ultimate === "earthbreaker") for (let i = 0; i < 3; i++) g.zones.push({ id: id(g), x: g.width * (.25 + i * .25), y: g.player.y, radius: 190, life: 2.5, slow: .4, damage: g.build.damage * 1.2 * p, tick: i * .12, color: "#e5a85e", hostile: false });
  else if (["arrow-storm", "void-rain", "phantom-hunt"].includes(g.build.ultimate)) { const aims: Point[] = g.phase === "boss" ? Array.from({ length: 32 }, () => g.boss) : g.enemies.slice(0, 55); aims.forEach((a, i) => projectile(g, g.player, Math.atan2(a.y - g.player.y, a.x - g.player.x) + (i % 3 - 1) * .025, 820, g.build.damage * (g.build.ultimate === "void-rain" ? 2.3 : 1.45) * p, false, { pierce: 3, life: 3 })); }
  else if (g.build.ultimate === "arcane-cataclysm") for (let i = 0; i < 6; i++) g.zones.push({ id: id(g), x: g.width * (.15 + (i % 3) * .35), y: g.height * (.27 + Math.floor(i / 3) * .48), radius: 155, life: 2.8, slow: .5, damage: g.build.damage * .9 * p, tick: i * .08, color: "#b39af7", hostile: false });
  else if (g.build.ultimate === "time-stop") g.zones.push({ id: id(g), x: g.width / 2, y: g.height / 2, radius: whole, life: 6, slow: .88, damage: g.build.damage * .38 * p, tick: 0, color: "#8bc9f3", hostile: false });
  else if (g.build.ultimate === "singularity") g.zones.push({ id: id(g), x: g.width / 2, y: g.height / 2, radius: whole * .58, life: 4.5, slow: .82, damage: g.build.damage * .8 * p, tick: 0, color: "#c48cff", hostile: false });
  floatText(g, g.player.x, g.player.y - 48, g.build.ultimateName.toUpperCase(), g.build.accent);
}

function spawn(g: Game, forced?: EnemyKind, at?: Point) {
  const stage = STAGES[g.stage]; const progress = g.stageElapsed / stage.duration; let kind = forced;
  if (!kind) { const unlocked = Math.max(1, Math.ceil(stage.enemies.length * (.3 + progress * .7))); kind = stage.enemies[Math.floor(Math.random() * unlocked)]; }
  const side = Math.floor(Math.random() * 4); let x = at?.x ?? Math.random() * g.width; let y = at?.y ?? Math.random() * g.height; const pad = 34;
  if (!at) { if (side === 0) y = -pad; else if (side === 1) x = g.width + pad; else if (side === 2) y = g.height + pad; else x = -pad; }
  const base: Record<EnemyKind, [number, number, number, number]> = { crawler: [72, 58, 12, 13], runner: [58, 112, 9, 11], brute: [210, 43, 21, 25], shooter: [108, 60, 13, 15], dasher: [126, 64, 12, 21], orbiter: [138, 68, 13, 17], splitter: [166, 54, 16, 18], bomb: [112, 75, 14, 26] };
  const stats = base[kind]; const scale = 1 + g.stage * .38 + Math.pow(progress, 1.35) * .42; const hp = Math.round(stats[0] * scale);
  g.enemies.push({ id: id(g), kind, x, y, hp, maxHp: hp, speed: stats[1] * (1 + g.stage * .055 + progress * .12), radius: stats[2], contact: Math.round(stats[3] * (1 + g.stage * .1 + progress * .12)), cooldown: .8 + Math.random(), state: 0, dx: 0, dy: 0, strafe: Math.random() > .5 ? 1 : -1, burnTime: 0, burnDps: 0, poisonTime: 0, poisonStacks: 0, bloodStacks: 0, frostTime: 0, frostStacks: 0, fearTime: 0, stunTime: 0, solarTime: 0, solarStacks: 0, statusTick: 0 });
}

function announce(g: Game, intent: string, seconds = 1.35) {
  g.boss.intent = intent;
  g.boss.intentClock = seconds;
}
function ring(g: Game, count: number, speed: number, damage: number, rotation = 0, split = 0, gapSize = 0) {
  const gap = Math.floor(Math.random() * count);
  for (let i = 0; i < count; i++) {
    const circularDistance = Math.min((i - gap + count) % count, (gap - i + count) % count);
    if (gapSize && circularDistance < gapSize) continue;
    projectile(g, g.boss, rotation + i * Math.PI * 2 / count, speed, damage, true, { radius: 5, life: 8, split });
  }
}
function fan(g: Game, count: number, speed: number, damage: number, spread = .1) {
  const base = Math.atan2(g.player.y - g.boss.y, g.player.x - g.boss.x);
  for (let i = 0; i < count; i++) projectile(g, g.boss, base + (i - (count - 1) / 2) * spread, speed, damage, true, { radius: 5.5, life: 7 });
}
function laser(g: Game, angle: number, telegraph: number, active: number, damage: number, color = "#f37983", origin: Point = g.boss, width = 15, omega = 0) {
  const len = Math.hypot(g.width, g.height) * 1.3;
  g.hazards.push({
    id: id(g), kind: "laser", x: origin.x - Math.cos(angle) * len, y: origin.y - Math.sin(angle) * len,
    x2: origin.x + Math.cos(angle) * len, y2: origin.y + Math.sin(angle) * len, width, telegraph,
    telegraphMax: telegraph, active, activeMax: active, damage, color, omega, centerX: origin.x, centerY: origin.y,
  });
}
function circleHazard(g: Game, point: Point, radius: number, telegraph: number, active: number, damage: number, color: string) {
  g.hazards.push({
    id: id(g), kind: "circle", x: point.x, y: point.y, x2: point.x, y2: point.y, width: 0, radius,
    telegraph, telegraphMax: telegraph, active, activeMax: active, damage, color,
  });
}
function laneLasers(g: Game, vertical: boolean, lanes: number, safeWidth: number, telegraph: number, active: number, damage: number, color: string) {
  const safeStart = Math.floor(Math.random() * Math.max(1, lanes - safeWidth + 1));
  for (let i = 0; i < lanes; i++) {
    if (i >= safeStart && i < safeStart + safeWidth) continue;
    const x = (i + .5) * g.width / lanes, y = (i + .5) * g.height / lanes;
    const origin = vertical ? { x, y: g.height / 2 } : { x: g.width / 2, y };
    laser(g, vertical ? Math.PI / 2 : 0, telegraph, active, damage, color, origin, Math.max(11, Math.min(g.width / lanes, g.height / lanes) * .18));
  }
}
function cageLanes(g: Game, bounds: { left: number; top: number; width: number; height: number }, vertical: boolean, lanes: number) {
  const safeWidth = 2;
  const safeStart = Math.floor(Math.random() * (lanes - safeWidth + 1));
  for (let i = 0; i < lanes; i++) {
    if (i >= safeStart && i < safeStart + safeWidth) continue;
    const cross = vertical
      ? bounds.left + (i + .5) * bounds.width / lanes
      : bounds.top + (i + .5) * bounds.height / lanes;
    const telegraph = 1.05, active = .56;
    g.hazards.push({
      id: id(g), kind: "laser",
      x: vertical ? cross : bounds.left, y: vertical ? bounds.top : cross,
      x2: vertical ? cross : bounds.left + bounds.width, y2: vertical ? bounds.top + bounds.height : cross,
      width: 11, telegraph, telegraphMax: telegraph, active, activeMax: active,
      damage: STAGES[0].bossDamage + 4, color: "#ef97af",
    });
  }
}
function memoryHazards(g: Game) {
  const cols = 3, rows = 2;
  const safeColumn = Math.floor(Math.random() * cols);
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    g.hazards.push({
      id: id(g), kind: "memory", x: col * g.width / cols, y: row * g.height / rows,
      x2: (col + 1) * g.width / cols, y2: (row + 1) * g.height / rows, width: 0,
      telegraph: 2.15, telegraphMax: 2.15, active: .82, activeMax: .82,
      damage: STAGES[g.stage].bossDamage + 8, color: "#b58cff", safe: col === safeColumn,
    });
  }
}

function edgeRain(g: Game, count: number, vertical: boolean, speed: number, damage: number, color: string, stagger = false) {
  for (let i = 0; i < count; i++) {
    const across = (i + .5) / count;
    const reverse = stagger && i % 2 === 1;
    const from: Point = vertical
      ? { x: across * g.width, y: reverse ? g.height + 12 : -12 }
      : { x: reverse ? g.width + 12 : -12, y: across * g.height };
    const angle = vertical ? (reverse ? -Math.PI / 2 : Math.PI / 2) : (reverse ? Math.PI : 0);
    projectile(g, from, angle, speed, damage, true, { radius: 5, life: 8, color, shape: "shard" });
  }
}
function checkerCircles(g: Game, columns: number, rows: number, parity: number, radius: number, damage: number, color: string) {
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    if ((row + column) % 2 !== parity) continue;
    circleHazard(g, { x: (column + .5) * g.width / columns, y: (row + .5) * g.height / rows }, radius, 1.35, .52, damage, color);
  }
}

const BOSS_MOVE_NAMES = [
  ["PASSO DA COROA", "PORTÕES DE OSSO", "PROCISSÃO QUEBRADA", "SINO E SILÊNCIO", "COVAS EM ORDEM", "JURAMENTO DO MORTO", "MARCHA SEM ROSTO", "VIGÍLIA CARMESIM", "ÚLTIMO CORREDOR", "PROVA DO OSSÁRIO"],
  ["DIAGONAL DA FORJA", "RICHOCHETE INCANDESCENTE", "TRILHO PARTIDO", "QUATRO CANTOS", "PRENSA EM ZIGUE-ZAGUE", "MARCA DE IMPACTO", "DUPLO REBOTE", "ESCÓRIA ERRANTE", "OITO PANCADAS", "COLISÃO DO ALTO-FORNO"],
  ["NINHO CADENTE", "FILHOS DA SOMBRA", "ABATE PREMATURO", "CORREDOR DE ESPOROS", "MATILHA GEMINADA", "SANGUE DO BOSQUE", "CERCO DAS LARVAS", "COLHEITA ERRADA", "ECLIPSE DA MATILHA", "FUNERAL EXPLOSIVO"],
  ["ROTA DOS SELOS", "PONTEIRO DO NORTE", "CRUZ DE LEITURA", "MARGENS ROTATIVAS", "ORDEM INVERSA", "PÁGINAS DE PRESSÃO", "QUADRANTES", "ENCADERNAÇÃO", "RITMO PARTIDO", "PALAVRA FINAL"],
  ["ECO DO PRIMEIRO PASSO", "LEI AZUL", "LEI VERMELHA", "HISTÓRICO CONDENADO", "FUTURO FALSO", "REGRA INVERTIDA", "SEGUNDO AUSENTE", "TRONO RETRÓGRADO", "MEMÓRIA DO FIM", "O QUE VOCÊ REPETIU"],
] as const;

const FORGE_PATHS = [
  [[.1, .14], [.88, .84], [.88, .16], [.12, .82]],
  [[.12, .5], [.5, .12], [.88, .5], [.5, .88]],
  [[.15, .15], [.85, .15], [.15, .85], [.85, .85]],
  [[.08, .3], [.92, .7], [.28, .92], [.72, .08]],
] as const;

function orderedWall(g: Game, side: Direction, gap: number, speed: number, damage: number, color: string) {
  const vertical = side === "up" || side === "down", cells = vertical ? 18 : 11;
  for (let i = 0; i < cells; i++) {
    if (Math.abs(i - gap) <= 1) continue;
    const from = vertical ? { x: (i + .5) * g.width / cells, y: side === "up" ? -10 : g.height + 10 } : { x: side === "left" ? -10 : g.width + 10, y: (i + .5) * g.height / cells };
    const angle = side === "up" ? Math.PI / 2 : side === "down" ? -Math.PI / 2 : side === "left" ? 0 : Math.PI;
    projectile(g, from, angle, speed * (.82 + (i % 3) * .11), damage, true, { radius: 5, life: 8, color, shape: "shard" });
  }
}
function setForgeDash(g: Game, index: number, rage: boolean) {
  const path = FORGE_PATHS[(Math.floor(index / 4) + (rage ? 1 : 0)) % FORGE_PATHS.length];
  const next = path[index % path.length];
  g.boss.dashFromX = g.boss.x; g.boss.dashFromY = g.boss.y;
  g.boss.dashToX = next[0] * g.width; g.boss.dashToY = next[1] * g.height;
  g.boss.dashTelegraph = rage ? .7 : 1.02; g.boss.dashDuration = rage ? .28 : .36; g.boss.dashElapsed = 0;
}
function spawnExplosivePack(g: Game, count: number, radius: number) {
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count + g.boss.pattern * .17;
    spawn(g, "bomb", { x: clamp(g.boss.x + Math.cos(a) * radius, 35, g.width - 35), y: clamp(g.boss.y + Math.sin(a) * radius, 35, g.height - 35) });
  }
}
function startRule(g: Game, rule: "stop" | "move", inverted = false) {
  g.rule = rule; g.ruleInverted = inverted; g.ruleTelegraph = 1.5; g.ruleActive = 1.05; g.ruleTick = 0;
}
function bossAttack(g: Game) {
  const s = STAGES[g.stage], rage = g.boss.combatPhase === 2, n = g.boss.pattern++, mode = n % 10;
  announce(g, BOSS_MOVE_NAMES[g.stage][mode], mode === 9 ? 1.9 : 1.25);

  if (g.stage === 0) {
    const gap = (n * 5 + 3) % 16;
    if (mode === 0) { orderedWall(g, "up", gap, rage ? 245 : 205, s.bossDamage, "#edafc8"); orderedWall(g, "down", (gap + 7) % 16, 155, s.bossDamage - 2, "#b987a9"); }
    else if (mode === 1) { laneLasers(g, n % 2 === 0, rage ? 11 : 9, 2, 1.1, .72, s.bossDamage + 5, "#e87c9d"); }
    else if (mode === 2) { orderedWall(g, "left", (n * 2) % 9, 225, s.bossDamage, "#d59ab9"); orderedWall(g, "right", (n * 2 + 5) % 9, 165, s.bossDamage - 2, "#ad779b"); }
    else if (mode === 3) { fan(g, rage ? 15 : 11, rage ? 275 : 230, s.bossDamage, .085); }
    else if (mode === 4) checkerCircles(g, rage ? 8 : 7, 5, n % 2, 40, s.bossDamage + 5, "#bf6284");
    else if (mode === 5) { ring(g, rage ? 38 : 30, rage ? 225 : 185, s.bossDamage, n * .22, 0, rage ? 4 : 3); }
    else if (mode === 6) { orderedWall(g, "up", gap, 230, s.bossDamage, "#f1bad0"); orderedWall(g, "left", (gap + 3) % 9, 178, s.bossDamage - 2, "#a97c9b"); }
    else if (mode === 7) { laneLasers(g, n % 2 === 0, 8, 2, 1.3, .7, s.bossDamage + 5, "#de7597"); orderedWall(g, n % 2 ? "left" : "up", n % 2 ? 4 : 9, 170, s.bossDamage - 2, "#b481a2"); }
    else if (mode === 8) { orderedWall(g, "right", (n + 2) % 9, 250, s.bossDamage, "#e9aac3"); orderedWall(g, "down", (n + 9) % 16, 190, s.bossDamage, "#c285a6"); }
    else { orderedWall(g, "up", 4, 265, s.bossDamage + 2, "#f4c3d7"); orderedWall(g, "down", 11, 210, s.bossDamage, "#c9799a"); laneLasers(g, false, 8, 2, 1.22, .72, s.bossDamage + 6, "#df6b91"); }
    return rage ? 1.4 : 1.78;
  }

  if (g.stage === 1) {
    setForgeDash(g, g.boss.pathIndex++, rage);
    if (mode === 1 || mode === 6) edgeRain(g, rage ? 16 : 12, mode === 6, rage ? 220 : 185, s.bossDamage - 2, "#f39a66", true);
    if (mode === 2 || mode === 7) { const count = rage ? 7 : 5; for (let i = 0; i < count; i++) circleHazard(g, { x: (i + .5) * g.width / count, y: g.height * (i % 2 ? .72 : .34) }, 48, 1.1, .55, s.bossDamage + 5, "#e66843"); }
    if (mode === 4 || mode === 8) orderedWall(g, mode === 4 ? "left" : "right", (n * 3) % 9, rage ? 245 : 205, s.bossDamage, "#ffb06d");
    if (mode === 9) { orderedWall(g, "up", 5, 250, s.bossDamage, "#ffb06d"); orderedWall(g, "right", 4, 210, s.bossDamage, "#da6541"); }
    return rage ? .92 : 1.18;
  }

  if (g.stage === 2) {
    if (mode === 0 || mode === 4) spawnExplosivePack(g, rage ? 8 : 6, mode === 0 ? 125 : 205);
    else if (mode === 1) { spawnExplosivePack(g, rage ? 10 : 7, 155); orderedWall(g, "up", 7, 185, s.bossDamage - 3, "#6bc9a9"); }
    else if (mode === 2) { const pts = [{ x: g.width * .28, y: g.height * .3 }, { x: g.width * .72, y: g.height * .3 }, { x: g.width * .5, y: g.height * .72 }]; pts.forEach(p => circleHazard(g, p, 90, 1.5, .75, s.bossDamage + 6, "#4eaf91")); spawnExplosivePack(g, 5, 95); }
    else if (mode === 3) { orderedWall(g, "left", 3, 185, s.bossDamage - 2, "#80d4b7"); spawnExplosivePack(g, rage ? 7 : 5, 170); }
    else if (mode === 5) { spawnExplosivePack(g, rage ? 12 : 9, 230); fan(g, 9, 210, s.bossDamage - 3, .13); }
    else if (mode === 6) { spawnExplosivePack(g, 6, 110); orderedWall(g, "right", 6, 225, s.bossDamage, "#70c7aa"); }
    else if (mode === 7) { spawnExplosivePack(g, rage ? 14 : 10, 185); }
    else if (mode === 8) { spawnExplosivePack(g, 8, 135); circleHazard(g, g.player, 105, 1.35, .7, s.bossDamage + 6, "#55b697"); }
    else { spawnExplosivePack(g, rage ? 16 : 12, 220); orderedWall(g, "up", 4, 210, s.bossDamage - 2, "#8adfc0"); orderedWall(g, "down", 13, 170, s.bossDamage - 3, "#4ba88b"); }
    return rage ? 1.5 : 1.92;
  }

  if (g.stage === 3) {
    const direction = (["up", "right", "down", "left"] as Direction[])[n % 4];
    if (mode === 0) { for (let i = 0; i < 4; i++) laser(g, i * Math.PI / 2 + n * .08, 1.15, 2.1, s.bossDamage + 4, "#8297f2", g.boss, 14, .2); }
    else if (mode === 1 || mode === 4) { for (let i = 0; i < 4; i++) laser(g, i * Math.PI / 2, 1.0, 1.8, s.bossDamage + 5, "#738bea", g.boss, 13, mode === 4 ? -.28 : .28); }
    else if (mode === 2) { laneLasers(g, true, 10, 2, 1.2, .7, s.bossDamage + 5, "#8fa2ff"); }
    else if (mode === 3 || mode === 5) { orderedWall(g, direction, (n * 2) % (direction === "up" || direction === "down" ? 16 : 9), 205, s.bossDamage - 2, "#a9b5ff"); }
    else if (mode === 6) checkerCircles(g, 6, 4, n % 2, 46, s.bossDamage + 6, "#7884df");
    else if (mode === 7) { for (let i = 0; i < 4; i++) laser(g, i * Math.PI / 2 + .3, .9, 2.4, s.bossDamage + 5, "#8498ff", g.boss, 13, i % 2 ? -.32 : .32); }
    else if (mode === 8 && rage) { g.parryQueue = []; g.parrySpawnClock = .25; g.parryStreak = 0; }
    else if (mode === 8) { checkerCircles(g, 6, 4, n % 2, 44, s.bossDamage + 5, "#7e8ce7"); }
    else if (rage) { g.parryQueue = []; g.parrySpawnClock = .15; g.parryStreak = 0; for (let i = 0; i < 4; i++) laser(g, i * Math.PI / 2, 1.3, 2.6, s.bossDamage + 5, "#6e7bd7", g.boss, 12, .22); }
    else { for (let i = 0; i < 4; i++) laser(g, i * Math.PI / 2 + .18, 1.25, 2.1, s.bossDamage + 4, "#8498ff", g.boss, 13, .2); }
    return rage ? 1.45 : 1.82;
  }

  if (mode === 0 || mode === 3 || mode === 8) {
    const points = g.echoHistory.slice(-85).map(p => ({ ...p }));
    if (points.length > 8) g.echoes.push({ id: id(g), points, telegraph: rage ? .85 : 1.25, active: 2.7, cursor: 0, tick: 0, color: "#f1a274" });
  } else if (mode === 1) startRule(g, "stop", rage);
  else if (mode === 2) startRule(g, "move", rage);
  else if (mode === 4) { memoryHazards(g); g.ruleInverted = rage; }
  else if (mode === 5) { startRule(g, n % 2 ? "stop" : "move", true); orderedWall(g, "up", (n + 5) % 16, 210, s.bossDamage - 2, "#efb18e"); }
  else if (mode === 6) { const points = g.echoHistory.slice(-60).reverse().map(p => ({ ...p })); if (points.length > 8) g.echoes.push({ id: id(g), points, telegraph: .95, active: 2.4, cursor: 0, tick: 0, color: "#d98968" }); }
  else if (mode === 7) { startRule(g, "move", true); checkerCircles(g, 7, 5, n % 2, 39, s.bossDamage + 6, "#d27d61"); }
  else { const points = g.echoHistory.slice(-120).map(p => ({ ...p })); if (points.length > 8) g.echoes.push({ id: id(g), points, telegraph: .7, active: 3.1, cursor: 0, tick: 0, color: "#f5c0a0" }); startRule(g, "stop", true); }
  return rage ? 1.25 : 1.62;
}

function drawBoss(ctx: CanvasRenderingContext2D, g: Game) {
  const b = g.boss, s = STAGES[g.stage]; ctx.save(); ctx.translate(b.x, b.y); ctx.shadowBlur = b.rage ? 48 : 30; ctx.shadowColor = s.palette[2]; ctx.strokeStyle = b.vulnerable ? s.palette[2] : "#d8e4ff"; ctx.fillStyle = "#100c13"; ctx.lineWidth = 2.4; const t = g.elapsed;
  if (g.stage === 0) { for (let r = 0; r < 3; r++) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI * 2 / 10 + (r % 2 ? -t : t) * .1; const rr = b.radius + r * 13 + (i % 2 ? 7 : -5); if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, 0, b.radius - 9, 0, Math.PI * 2); ctx.fill(); }
  else if (g.stage === 1) { ctx.rotate(t * .12); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); ctx.fillRect(b.radius - 8, -7, 35, 14); ctx.strokeRect(b.radius - 8, -7, 35, 14); } ctx.rotate(-t * .5); ctx.beginPath(); ctx.rect(-31, -31, 62, 62); ctx.fill(); ctx.stroke(); }
  else if (g.stage === 2) { ctx.rotate(Math.sin(t) * .08); ctx.beginPath(); ctx.moveTo(0, -b.radius - 30); ctx.lineTo(22, -16); ctx.lineTo(b.radius + 38, 0); ctx.lineTo(22, 16); ctx.lineTo(0, b.radius + 30); ctx.lineTo(-22, 16); ctx.lineTo(-b.radius - 38, 0); ctx.lineTo(-22, -16); ctx.closePath(); ctx.fill(); ctx.stroke(); for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(i * 18, -35); ctx.quadraticCurveTo(i * 55, -78, i * 72, -42); ctx.stroke(); } }
  else if (g.stage === 3) { ctx.rotate(t * .18); for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, -b.radius - 28); ctx.lineTo(0, -b.radius - 48); ctx.lineTo(-10, -b.radius - 28); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.rotate(-t * .55); ctx.beginPath(); ctx.rect(-34, -34, 68, 68); ctx.fill(); ctx.stroke(); }
  else { for (let r = 0; r < 4; r++) { ctx.rotate((r % 2 ? -1 : 1) * t * .04); ctx.beginPath(); const count = 7 + r * 2; for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count; const rr = b.radius + r * 12 + (i % 3 ? 3 : 14); if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, 0, b.radius - 6, 0, Math.PI * 2); ctx.fill(); }
  ctx.shadowBlur = 0; ctx.fillStyle = "#f5edf3"; ctx.font = "700 25px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s.glyph, 0, 1); ctx.restore();
}
function drawBossAtmosphere(ctx: CanvasRenderingContext2D, g: Game) {
  if (!['danger', 'boss-grace', 'boss'].includes(g.phase)) return;
  const s = STAGES[g.stage], count = 18 + g.stage * 5;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 7.193 + g.stage * 13.7;
    const drift = g.elapsed * (.18 + g.stage * .035);
    const x = ((Math.sin(seed * 1.7) * .5 + .5) * g.width + drift * (18 + i % 5) * (i % 2 ? 1 : -1) + g.width * 3) % g.width;
    const y = ((Math.cos(seed * .91) * .5 + .5) * g.height - drift * (24 + i % 7) + g.height * 3) % g.height;
    const pulse = .25 + (Math.sin(g.elapsed * 2.1 + seed) * .5 + .5) * .35;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = i % 3 ? s.palette[2] : '#f4e5d5';
    ctx.fillStyle = s.palette[2];
    ctx.lineWidth = 1;
    if (g.stage === 1) {
      ctx.beginPath(); ctx.moveTo(x, y + 10); ctx.lineTo(x + Math.sin(seed) * 4, y - 8); ctx.stroke();
    } else if (g.stage === 2) {
      ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); ctx.stroke();
    } else if (g.stage === 3) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(seed + g.elapsed) * .4); ctx.strokeRect(-5, -3, 10, 6); ctx.restore();
    } else if (g.stage === 4) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(g.elapsed * .2 + seed); ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(4, 0); ctx.lineTo(0, 7); ctx.lineTo(-4, 0); ctx.closePath(); ctx.stroke(); ctx.restore();
    } else {
      ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke();
    }
  }
  ctx.restore();
}
function lineDistance(p: Point, a: Point, b: Point) { const l2 = Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2); if (!l2) return distance(p, a); const t = clamp(((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2, 0, 1); return distance(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }); }
function draw(ctx: CanvasRenderingContext2D, g: Game, portrait: HTMLImageElement | null) {
  const s = STAGES[g.stage]; ctx.clearRect(0, 0, g.width, g.height); const bg = ctx.createRadialGradient(g.width * .5, g.height * .45, 20, g.width * .5, g.height * .5, g.width * .72); bg.addColorStop(0, s.palette[1]); bg.addColorStop(.6, s.palette[0]); bg.addColorStop(1, "#050507"); ctx.fillStyle = bg; ctx.fillRect(0, 0, g.width, g.height); ctx.strokeStyle = `${s.palette[2]}20`; for (let x = 25; x < g.width; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, g.height); ctx.stroke(); } for (let y = 25; y < g.height; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(g.width, y); ctx.stroke(); }
  drawBossAtmosphere(ctx, g);
  if (g.stage === 1 && g.boss.dashTelegraph > 0) {
    const pulse = .45 + Math.sin(g.elapsed * 18) * .18; ctx.save(); ctx.strokeStyle = `rgba(255,166,103,${pulse})`; ctx.lineWidth = 12; ctx.setLineDash([20, 12]); ctx.beginPath(); ctx.moveTo(g.boss.dashFromX, g.boss.dashFromY); ctx.lineTo(g.boss.dashToX, g.boss.dashToY); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#ffad70"; ctx.beginPath(); ctx.arc(g.boss.dashToX, g.boss.dashToY, 13, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  for (const echo of g.echoes) {
    if (echo.points.length < 2) continue; ctx.save(); ctx.strokeStyle = echo.color; ctx.lineWidth = echo.telegraph > 0 ? 2 : 13; ctx.globalAlpha = echo.telegraph > 0 ? .42 : .78; ctx.setLineDash(echo.telegraph > 0 ? [9, 8] : []); ctx.beginPath(); const end = echo.telegraph > 0 ? echo.points.length : Math.max(2, echo.cursor + 1); for (let i = 0; i < end; i++) { const point = echo.points[i]; if (i) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y); } ctx.stroke(); ctx.restore();
  }
  if (g.stage === 0 && g.boss.intermission > 0) {
    const boxW = Math.min(760, g.width * .72), boxH = Math.min(450, g.height * .7), left = (g.width - boxW) / 2, top = (g.height - boxH) / 2;
    const pulse = .6 + Math.sin(g.elapsed * 5) * .22;
    ctx.fillStyle = "#0302056b"; ctx.fillRect(0, 0, g.width, g.height);
    ctx.fillStyle = "#120c17"; ctx.fillRect(left, top, boxW, boxH);
    ctx.shadowBlur = 18 + pulse * 12; ctx.shadowColor = "#ce789a"; ctx.strokeStyle = `rgba(242,184,205,${pulse})`; ctx.lineWidth = 2.5; ctx.strokeRect(left, top, boxW, boxH); ctx.shadowBlur = 0;
    ctx.fillStyle = "#eadbe2"; ctx.font = "800 12px system-ui"; ctx.textAlign = "center"; ctx.fillText("CÂMARA DO OSSÁRIO · LEIA AS FAIXAS", g.width / 2, top - 14);
  }
  for (const h of g.hazards) {
    const telegraphProgress = h.telegraphMax ? clamp(1 - h.telegraph / h.telegraphMax, 0, 1) : 0;
    const activeProgress = h.activeMax ? clamp(h.active / h.activeMax, 0, 1) : 0;
    if (h.kind === "memory") {
      ctx.fillStyle = h.safe ? `rgba(103,218,164,${.1 + telegraphProgress * .18})` : h.telegraph > 0 ? `rgba(181,140,255,${.1 + telegraphProgress * .22})` : `rgba(181,140,255,${.58 + activeProgress * .24})`;
      ctx.fillRect(h.x + 4, h.y + 4, h.x2 - h.x - 8, h.y2 - h.y - 8);
      ctx.strokeStyle = h.safe ? "rgba(122,232,181,.72)" : "rgba(207,180,255,.45)"; ctx.lineWidth = 1.5; ctx.strokeRect(h.x + 7, h.y + 7, h.x2 - h.x - 14, h.y2 - h.y - 14);
    } else if (h.kind === "circle") {
      const radius = h.radius ?? 40;
      ctx.beginPath(); ctx.arc(h.x, h.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = h.telegraph > 0 ? `${h.color}18` : `${h.color}aa`; ctx.fill();
      ctx.strokeStyle = h.telegraph > 0 ? `${h.color}cc` : "#fff4"; ctx.lineWidth = h.telegraph > 0 ? 2 + telegraphProgress * 3 : 5;
      if (h.telegraph > 0) ctx.setLineDash([8, 7]); ctx.stroke(); ctx.setLineDash([]);
      if (h.telegraph > 0) { ctx.beginPath(); ctx.arc(h.x, h.y, radius * telegraphProgress, 0, Math.PI * 2); ctx.strokeStyle = `${h.color}88`; ctx.lineWidth = 2; ctx.stroke(); }
    } else {
      const alpha = h.telegraph > 0 ? .25 + telegraphProgress * .62 : .9;
      if (h.telegraph > 0) {
        ctx.strokeStyle = `rgba(255,235,242,${alpha})`; ctx.lineWidth = 2 + telegraphProgress * 2; ctx.setLineDash([14, 10]);
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x2, h.y2); ctx.stroke(); ctx.setLineDash([]);
        const mx = (h.x + h.x2) / 2, my = (h.y + h.y2) / 2; ctx.beginPath(); ctx.arc(mx, my, 5 + telegraphProgress * 8, 0, Math.PI * 2); ctx.strokeStyle = h.color; ctx.stroke();
      } else {
        const flicker = .82 + Math.sin(g.elapsed * 38 + h.id) * .18;
        ctx.save(); ctx.shadowBlur = 22; ctx.shadowColor = h.color; ctx.strokeStyle = `${h.color}72`; ctx.lineWidth = h.width * 2.4 * flicker; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x2, h.y2); ctx.stroke();
        ctx.strokeStyle = h.color; ctx.lineWidth = h.width * (1 + activeProgress * .22); ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x2, h.y2); ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,248,250,.92)"; ctx.lineWidth = Math.max(2, h.width * .18); ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x2, h.y2); ctx.stroke(); ctx.restore();
      }
    }
  }
  for (const z of g.zones) {
    const pulse = .84 + Math.sin(g.elapsed * 8 + z.id) * .08; ctx.save(); ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * pulse, 0, Math.PI * 2);
    const gradient = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, z.radius); gradient.addColorStop(0, `${z.color}26`); gradient.addColorStop(.65, `${z.color}10`); gradient.addColorStop(1, `${z.color}02`); ctx.fillStyle = gradient; ctx.fill();
    ctx.strokeStyle = `${z.color}bb`; ctx.lineWidth = 1.5 + Math.sin(g.elapsed * 6 + z.id) * .6; ctx.setLineDash(z.kind === "trap" ? [4, 5] : [10, 7]); ctx.lineDashOffset = -g.elapsed * (z.kind === "meteor" ? 44 : 24); ctx.stroke(); ctx.setLineDash([]);
    if (z.kind === "trap") { ctx.translate(z.x, z.y); ctx.rotate(g.elapsed * .35 + z.id); for (let ring = 0; ring < 3; ring++) { ctx.beginPath(); const size = 13 + ring * 12; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; if (i) ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size); else ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size); } ctx.closePath(); ctx.strokeStyle = `${z.color}${ring === 0 ? "ee" : "88"}`; ctx.stroke(); } }
    else if (z.kind === "meteor") { const fall = ((z.life * 1.7 + z.id) % 1) * 120; ctx.strokeStyle = `${z.color}dd`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(z.x + 46, z.y - 90 + fall); ctx.lineTo(z.x + 10, z.y - 20 + fall); ctx.stroke(); ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * (.22 + (.8 - z.life % .8)), 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(z.x, z.y, z.radius * clamp(1 - z.life % 1, .18, .94), 0, Math.PI * 2); ctx.strokeStyle = `${z.color}50`; ctx.stroke(); }
    ctx.restore();
  }
  for (const r of g.relics) { ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(g.elapsed * .3); ctx.fillStyle = "#18233b"; ctx.strokeStyle = "#9cb8ff"; ctx.lineWidth = 2; ctx.fillRect(-18, -18, 36, 36); ctx.strokeRect(-18, -18, 36, 36); ctx.restore(); ctx.fillStyle = "#0a0b12"; ctx.fillRect(r.x - 20, r.y - 28, 40, 4); ctx.fillStyle = "#9cb8ff"; ctx.fillRect(r.x - 20, r.y - 28, 40 * r.hp / r.maxHp, 4); }
  for (const summon of g.summons) { ctx.save(); ctx.translate(summon.x, summon.y); ctx.rotate(-g.elapsed * 1.4 + summon.orbit); ctx.shadowBlur = 18; ctx.shadowColor = summon.color; ctx.fillStyle = `${summon.color}bb`; ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.4; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, radius = i % 2 ? 8 : 13; if (i) ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius); else ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); ctx.fillStyle = "#08070a"; ctx.fillRect(summon.x - 14, summon.y + 17, 28, 3); ctx.fillStyle = summon.color; ctx.fillRect(summon.x - 14, summon.y + 17, 28 * summon.hp / summon.maxHp, 3); }
  for (const f of g.fragments) { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(g.elapsed + f.pulse); ctx.shadowBlur = 16; ctx.shadowColor = "#d9b7ff"; ctx.fillStyle = "#d9b7ff"; ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
  for (const p of g.projectiles) {
    const velocity = Math.max(1, Math.hypot(p.vx, p.vy)), trail = Math.min(34, velocity * .045);
    ctx.save(); ctx.globalAlpha = p.hostile ? .38 : .55; ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1.5, p.radius * .8); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / velocity * trail, p.y - p.vy / velocity * trail); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.atan2(p.vy, p.vx)); ctx.fillStyle = p.color; ctx.strokeStyle = "rgba(255,255,255,.72)"; ctx.lineWidth = 1; ctx.shadowBlur = p.hostile ? 14 : 11; ctx.shadowColor = p.color;
    ctx.beginPath();
    if (p.shape === "shard") { ctx.moveTo(p.radius * 1.7, 0); ctx.lineTo(-p.radius, p.radius * .72); ctx.lineTo(-p.radius * .55, 0); ctx.lineTo(-p.radius, -p.radius * .72); ctx.closePath(); }
    else if (p.shape === "ember") { ctx.moveTo(p.radius * 1.4, 0); ctx.quadraticCurveTo(0, p.radius, -p.radius, 0); ctx.quadraticCurveTo(0, -p.radius, p.radius * 1.4, 0); }
    else ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill(); if (p.hostile && p.radius >= 4) ctx.stroke(); ctx.restore();
  }
  const colors: Record<EnemyKind, [string, string]> = { crawler: ["#2d2834", "#9b83a8"], runner: ["#3d2847", "#ce83de"], brute: ["#5a2f38", "#ef7a73"], shooter: ["#1f3944", "#70c6d8"], dasher: ["#4a3522", "#f0b85d"], orbiter: ["#29385b", "#8aa7ff"], splitter: ["#3a2543", "#df8ed8"], bomb: ["#541f1d", "#ff9b62"] };
  for (const e of g.enemies) { const c = colors[e.kind]; ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(g.elapsed * e.strafe * (e.kind === "runner" ? 1.8 : .45)); ctx.fillStyle = c[0]; ctx.strokeStyle = c[1]; ctx.lineWidth = e.kind === "brute" ? 3 : 1.5; ctx.beginPath(); const points = e.kind === "shooter" ? 4 : e.kind === "dasher" ? 3 : e.kind === "orbiter" ? 8 : 6; for (let i = 0; i < points; i++) { const a = i * Math.PI * 2 / points, rr = e.radius * (i % 2 ? .7 : 1); if (i) ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); if (e.burnTime > 0) { ctx.strokeStyle = GODS.flame.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, e.radius + 4 + Math.sin(g.elapsed * 12 + e.id) * 2, 0, Math.PI * 2); ctx.stroke(); } const statuses = [[e.poisonStacks, GODS.venom.color, "P"], [e.bloodStacks, GODS.blood.color, "H"], [e.frostStacks, GODS.frost.color, "G"], [e.solarStacks, GODS.sun.color, "S"]] as const; statuses.filter(([value]) => value > 0).forEach(([value, color, label], index) => { ctx.fillStyle = color; ctx.font = "800 8px system-ui"; ctx.textAlign = "center"; ctx.fillText(`${label}${value}`, (index - 1.5) * 13, -e.radius - 7); }); ctx.restore(); if (e.hp < e.maxHp) { const barW = Math.max(22, e.radius * 2.15), barY = e.y + e.radius + 8; ctx.fillStyle = "#09070cdd"; ctx.fillRect(e.x - barW / 2, barY, barW, 3); ctx.fillStyle = c[1]; ctx.fillRect(e.x - barW / 2, barY, barW * clamp(e.hp / e.maxHp, 0, 1), 3); } }
  if (["danger", "boss-grace", "boss"].includes(g.phase) && !(g.stage === 0 && g.boss.intermission > 0)) drawBoss(ctx, g);
  if (g.parryQueue.length) {
    const cx = g.width / 2, cy = g.height / 2, labels: Record<Direction, [string, number, number]> = { up: ["W", cx, cy - 112], right: ["D", cx + 112, cy], down: ["S", cx, cy + 112], left: ["A", cx - 112, cy] };
    for (const strike of g.parryQueue.filter(q => !q.resolved && q.eta < 2.2)) { const [label, x, y] = labels[strike.direction], urgency = clamp(1 - Math.abs(strike.eta) / 2.2, 0, 1); ctx.save(); ctx.globalAlpha = .25 + urgency * .75; ctx.strokeStyle = strike.eta < .34 ? "#ffffff" : "#94a9ff"; ctx.fillStyle = "rgba(42,48,88,.72)"; ctx.lineWidth = 2 + urgency * 3; ctx.beginPath(); ctx.arc(x, y, 18 + urgency * 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "800 15px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label, x, y); ctx.restore(); }
    ctx.save(); ctx.fillStyle = "rgba(8,9,17,.8)"; ctx.fillRect(cx - 120, cy - 23, 240, 46); ctx.strokeStyle = g.parryFlash > 0 ? "#fff" : "#7689e7"; ctx.strokeRect(cx - 120, cy - 23, 240, 46); ctx.fillStyle = "#e9edff"; ctx.font = "800 11px system-ui"; ctx.textAlign = "center"; ctx.fillText(`PARRY DIRECIONAL · SEQUÊNCIA ${g.parryStreak}`, cx, cy + 4); ctx.restore();
  }
  if (g.rule !== "none") {
    const telegraph = g.ruleTelegraph > 0, instruction = g.rule === "stop" ? "PARE" : "MOVIMENTE-SE", shown = g.ruleInverted ? (g.rule === "stop" ? "MOVIMENTE-SE" : "PARE") : instruction; ctx.save(); ctx.fillStyle = g.rule === "stop" ? "rgba(59,116,194,.86)" : "rgba(190,56,66,.86)"; ctx.fillRect(g.width / 2 - 118, g.height - 70, 236, 42); ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.strokeRect(g.width / 2 - 118, g.height - 70, 236, 42); ctx.fillStyle = "#fff"; ctx.font = "900 16px system-ui"; ctx.textAlign = "center"; ctx.fillText(`${shown}${telegraph ? " · PREPARE" : " · AGORA"}`, g.width / 2, g.height - 43); ctx.restore();
  }
  if (g.phase === "boss" && g.boss.intentClock > 0) {
    const alpha = clamp(g.boss.intentClock / .35, 0, 1);
    ctx.globalAlpha = alpha; ctx.fillStyle = "rgba(7,5,9,.76)"; ctx.fillRect(g.width / 2 - 145, 20, 290, 31);
    ctx.strokeStyle = `${s.palette[2]}99`; ctx.strokeRect(g.width / 2 - 145, 20, 290, 31);
    ctx.fillStyle = "#f8edf3"; ctx.font = "800 11px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(g.boss.intent, g.width / 2, 36); ctx.globalAlpha = 1;
  }
  if (g.build.orbitals > 0) { const orbitalGod = g.build.technique2God, color = orbitalGod ? GODS[orbitalGod].color : g.build.accent, size = 1 + Math.min(.75, Math.max(0, g.build.orbitalRadius - 84) / 150); for (let i = 0; i < g.build.orbitals; i++) { const angle = g.elapsed * (1.25 + i % 2 * .13) + i * Math.PI * 2 / g.build.orbitals, orbit = g.build.orbitalRadius + Math.sin(g.elapsed * 2 + i) * 9, ox = g.player.x + Math.cos(angle) * orbit, oy = g.player.y + Math.sin(angle) * orbit; ctx.save(); ctx.translate(ox, oy); ctx.rotate(angle + Math.PI / 2); ctx.scale(size, size); ctx.shadowBlur = 20; ctx.shadowColor = color; ctx.fillStyle = color; ctx.strokeStyle = "rgba(255,255,255,.78)"; ctx.lineWidth = 1.4; ctx.beginPath(); if (orbitalGod === "wild") { ctx.moveTo(-18, -3); ctx.quadraticCurveTo(3, -18, 21, 0); ctx.quadraticCurveTo(2, -8, -13, 9); ctx.quadraticCurveTo(-5, 3, -18, -3); } else { ctx.arc(0, 0, 9 + Math.sin(g.elapsed * 5 + i) * 1.8, 0, Math.PI * 2); } ctx.fill(); ctx.stroke(); ctx.restore(); } }
  if (g.player.shadowAnchor) { ctx.save(); ctx.strokeStyle = GODS.shadow.color; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(g.player.shadowAnchor.x, g.player.shadowAnchor.y, 20 + Math.sin(g.elapsed * 7) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(g.player.shadowAnchor.x, g.player.shadowAnchor.y); ctx.lineTo(g.player.x, g.player.y); ctx.stroke(); ctx.restore(); }
  const p = g.player; ctx.save(); ctx.translate(p.x, p.y); const auraGods = [g.build.attackGod, g.build.dashGod, g.build.technique1God, g.build.technique2God].filter(Boolean) as GodId[]; auraGods.forEach((god, i) => { ctx.beginPath(); ctx.arc(0, 0, p.radius + 7 + i * 3, g.elapsed * (.8 + i * .08) + i, g.elapsed * (.8 + i * .08) + i + 1.35); ctx.strokeStyle = `${GODS[god].color}aa`; ctx.lineWidth = 1.5; ctx.stroke(); }); if (g.build.barrier > 0) { ctx.beginPath(); ctx.arc(0, 0, p.radius + 11, 0, Math.PI * 2); ctx.strokeStyle = `${GODS.tide.color}cc`; ctx.lineWidth = 3; ctx.stroke(); } ctx.globalAlpha = p.invulnerable > 0 && Math.floor(p.invulnerable * 14) % 2 ? .38 : 1; ctx.shadowBlur = 24; ctx.shadowColor = g.build.attackGod ? GODS[g.build.attackGod].color : g.build.accent; ctx.fillStyle = "#111017"; ctx.strokeStyle = g.build.attackGod ? GODS[g.build.attackGod].color : g.build.accent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0; if (portrait?.complete && portrait.naturalWidth) { ctx.save(); ctx.beginPath(); ctx.arc(0, 0, p.radius - 2, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(portrait, -p.radius, -p.radius, p.radius * 2, p.radius * 2); ctx.restore(); } else { ctx.fillStyle = g.build.accent; ctx.font = "700 13px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(g.build.classId[0].toUpperCase(), 0, 1); } ctx.restore();
  for (const f of g.floats) { ctx.globalAlpha = clamp(f.life / .5, 0, 1); ctx.fillStyle = f.color; ctx.font = "700 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(f.text, f.x, f.y - (1 - f.life) * 30); } ctx.globalAlpha = 1;
}

export function BossRush({ hero }: { hero: BossRushHero }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null); const gameRef = useRef<Game | null>(null);
  const [selectedClass, setSelectedClass] = useState<HeroClass | null>(null); const [runId, setRunId] = useState(0); const [cards, setCards] = useState<UpgradeCard[]>([]); const [picked, setPicked] = useState<Array<{ id: string; name: string; rarity: Rarity }>>([]);
  const [hud, setHud] = useState<Hud>({ phase: "select", stage: 0, elapsed: 0, hp: 0, maxHp: 1, barrier: 0, barrierMax: 0, xp: 0, xpNeeded: 1, level: 1, kills: 0, bossHp: 0, bossMaxHp: 1, bossRage: false, ultimate: 0, ultimateMax: 100, ultimateName: "Nenhuma ultimate", paused: false, dashCharges: 1, dashMax: 1, dashCooldown: 0, dashBaseCooldown: 5, bossVulnerable: true, relics: 0, slots: { attack: null, dash: null, technique1: null, technique2: null, ultimate: null }, passives: [] });
  const [meta, setMeta] = useState<MetaProgress>(() => ({ marks: 0, upgrades: { ...EMPTY_META_UPGRADES } }));
  const metaRef = useRef(meta); const rewardRef = useRef(""); const rewardLockedRef = useRef(false); const shopAutoPausedRef = useRef(false);
  const [shopOpen, setShopOpen] = useState(false); const [metaMessage, setMetaMessage] = useState("");
  const preview = selectedClass ? BASES[selectedClass] : null;

  useEffect(() => { const loaded = loadMetaProgress(); metaRef.current = loaded; setMeta(loaded); }, []);
  useEffect(() => {
    if (rewardLockedRef.current || !["stage-clear", "victory", "defeat"].includes(hud.phase)) return;
    const key = `${runId}:${hud.phase}:${hud.stage}`; if (rewardRef.current === key) return; rewardRef.current = key;
    const reward = hud.phase === "stage-clear" ? 4 + hud.stage * 2 : hud.phase === "victory" ? 18 + hud.stage * 2 + Math.floor(hud.kills / 35) : Math.max(1, 1 + hud.stage + Math.floor(hud.level / 4));
    const next = { ...metaRef.current, marks: metaRef.current.marks + reward, upgrades: { ...metaRef.current.upgrades } }; metaRef.current = next; setMeta(next); saveMetaProgress(next);
    setMetaMessage(`+${reward} Marcas de Arcana guardadas para as próximas tentativas.`);
  }, [hud.phase, hud.stage, hud.kills, hud.level, runId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const jumpToBoss = (event: KeyboardEvent) => {
      const digit = event.code.match(/^Digit([1-5])$/)?.[1];
      if (!event.shiftKey || !digit) return;
      const g = gameRef.current;
      if (!g) return;
      const stage = Number(digit) - 1, definition = STAGES[stage];
      g.stage = stage; g.phase = "boss"; g.phaseClock = 0; g.stageElapsed = definition.duration;
      g.enemies = []; g.projectiles = []; g.hazards = []; g.zones = []; g.fragments = []; g.relics = [];
      g.boss = makeBoss(stage, definition.bossHp, g.width / 2, g.height * .22, stage !== 3); g.boss.cooldown = .5; g.boss.phaseStarted = true;
      g.player.x = g.width / 2; g.player.y = g.height * .72; g.build.hp = g.build.maxHp; g.player.invulnerable = 1;
    };
    window.addEventListener("keydown", jumpToBoss);
    return () => window.removeEventListener("keydown", jumpToBoss);
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !canvasRef.current) return; const canvas = canvasRef.current, ctx = canvas.getContext("2d"); if (!ctx) return; const portrait = hero.portrait ? new Image() : null; if (portrait) portrait.src = hero.portrait; const g = createGame(selectedClass, metaRef.current); rewardLockedRef.current = false; gameRef.current = g; setHud(snap(g)); setCards([]); setPicked([]);
    const resize = () => { const box = canvas.getBoundingClientRect(), ratio = Math.min(2, window.devicePixelRatio || 1); g.width = Math.max(640, Math.round(box.width)); g.height = Math.max(510, Math.round(box.height)); canvas.width = g.width * ratio; canvas.height = g.height * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); g.player.x = clamp(g.player.x, 28, g.width - 28); g.player.y = clamp(g.player.y, 28, g.height - 28); }; resize(); const observer = new ResizeObserver(resize); observer.observe(canvas);
    const dash = () => { if (g.player.dashClock > 0 || !["horde", "boss"].includes(g.phase)) return; if (g.build.dashGod === "shadow") { if (!g.player.shadowAnchor) { g.player.shadowAnchor = { x: g.player.x, y: g.player.y }; floatText(g, g.player.x, g.player.y - 30, "ÂNCORA", GODS.shadow.color); } else { const from = { x: g.player.x, y: g.player.y }; g.player.x = g.player.shadowAnchor.x; g.player.y = g.player.shadowAnchor.y; g.player.shadowAnchor = null; g.zones.push({ id: id(g), ...from, radius: 84, life: .5, slow: .4, damage: g.build.damage * 1.2, tick: 0, color: GODS.shadow.color, hostile: false, god: "shadow", fear: 1.1 }); g.player.invulnerable = .32; } return; } if (g.player.dashCharges <= 0) return; let dx = 0, dy = 0; if (g.keys.has("a") || g.keys.has("arrowleft")) dx--; if (g.keys.has("d") || g.keys.has("arrowright")) dx++; if (g.keys.has("w") || g.keys.has("arrowup")) dy--; if (g.keys.has("s") || g.keys.has("arrowdown")) dy++; if (!dx && !dy) dy = -1; const len = Math.hypot(dx, dy); g.player.dashX = dx / len; g.player.dashY = dy / len; g.player.dashClock = g.build.dashGod === "tide" ? .29 : g.build.dashGod === "radiance" ? .04 : g.build.dashGod === "flame" ? .34 : .18; g.player.dashTrailClock = 0; g.player.dashBurstPending = g.build.dashGod === "tide"; g.player.dashCharges--; if (g.player.dashCharges < g.build.dashMax && g.player.dashCooldown <= 0) g.player.dashCooldown = g.build.dashCooldown; g.player.invulnerable = Math.max(g.player.invulnerable, .32); };
    const parry = (direction: Direction) => {
      if (g.stage !== 3 || g.phase !== "boss" || !g.parryQueue.length) return false;
      const strike = g.parryQueue.find(q => !q.resolved);
      if (!strike || strike.eta > .34 || strike.eta < -.15 || strike.direction !== direction) { heroDamage(g, STAGES[3].bossDamage); g.parryStreak = 0; return true; }
      strike.resolved = true; g.parryStreak++; g.parryFlash = .24; floatText(g, g.player.x, g.player.y - 42, `PARRY ${g.parryStreak}`, "#b7c6ff");
      if (g.parryStreak % 6 === 0) { g.boss.hp -= g.build.damage * 4.5; charge(g, g.build.damage * 4.5); }
      return true;
    };
    const down = (e: KeyboardEvent) => { const key = e.key.toLowerCase(); if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) e.preventDefault(); const alreadyPressed = g.keys.has(key); const direction: Direction | null = key === "w" || key === "arrowup" ? "up" : key === "d" || key === "arrowright" ? "right" : key === "s" || key === "arrowdown" ? "down" : key === "a" || key === "arrowleft" ? "left" : null; if (direction && !alreadyPressed && parry(direction)) return; g.keys.add(key); if (key === " " && !alreadyPressed && !e.repeat) dash(); }; const up = (e: KeyboardEvent) => g.keys.delete(e.key.toLowerCase()); const releaseAll = () => g.keys.clear(); window.addEventListener("keydown", down, { passive: false }); window.addEventListener("keyup", up); window.addEventListener("blur", releaseAll);
    const beginBoss = () => { const s = STAGES[g.stage]; g.enemies = []; g.fragments = []; g.projectiles = []; g.zones = []; g.hazards = []; g.relics = []; g.parryQueue = []; g.echoes = []; g.echoHistory = []; const hp = s.bossHp * (1 + g.level * .025); g.boss = makeBoss(g.stage, hp, g.width / 2, g.height * .22, g.stage !== 3); g.boss.cooldown = 1.3; if (g.stage === 3) { const sealHp = 900 + g.level * 48; g.relics = [{ id: id(g), x: 68, y: 68, hp: sealHp, maxHp: sealHp }, { id: id(g), x: g.width - 68, y: 68, hp: sealHp, maxHp: sealHp }, { id: id(g), x: 68, y: g.height - 68, hp: sealHp, maxHp: sealHp }, { id: id(g), x: g.width - 68, y: g.height - 68, hp: sealHp, maxHp: sealHp }]; } g.phase = "danger"; g.phaseClock = 0; };
    const killBoss = () => { g.projectiles = []; g.hazards = []; g.echoes = []; g.parryQueue = []; g.build.hp = g.build.maxHp; g.phase = g.stage === 4 ? "victory" : "stage-clear"; };
    const updateEnemies = (dt: number) => { for (const e of g.enemies) { tickAffliction(g, e, dt); const summonTarget = g.summons.filter(s => s.hp > 0).sort((a, b) => distance(e, a) - distance(e, b))[0], hunted: Point = summonTarget && distance(e, summonTarget) < 190 ? summonTarget : g.player, baseAngle = Math.atan2(hunted.y - e.y, hunted.x - e.x), angle = e.fearTime > 0 ? baseAngle + Math.PI : baseAngle, gap = distance(e, hunted); let slow = e.stunTime > 0 ? 0 : Math.max(.18, 1 - e.frostStacks * .075); for (const z of g.zones) if (z.slow && distance(z, e) < z.radius) slow *= 1 - z.slow;
      if (e.kind === "shooter") { const a = gap > 320 ? 1 : gap < 190 ? -.75 : 0; e.x += (Math.cos(angle) * a + Math.cos(angle + Math.PI / 2) * e.strafe * .58) * e.speed * slow * dt; e.y += (Math.sin(angle) * a + Math.sin(angle + Math.PI / 2) * e.strafe * .58) * e.speed * slow * dt; e.cooldown -= dt; if (e.cooldown <= 0) { const n = g.stage >= 3 ? 5 : 3; for (let i = 0; i < n; i++) projectile(g, e, angle + (i - (n - 1) / 2) * .12, 175 + g.stage * 22, e.contact - 2, true, { radius: 5, life: 5 }); e.cooldown = 1.7 - g.stage * .08 + Math.random() * .3; } }
      else if (e.kind === "dasher") { e.cooldown -= dt; if (e.state > 0) { e.x += e.dx * 345 * dt; e.y += e.dy * 345 * dt; e.state -= dt; } else { e.x += Math.cos(angle) * e.speed * slow * dt; e.y += Math.sin(angle) * e.speed * slow * dt; if (e.cooldown <= 0 && gap < 360) { e.dx = Math.cos(angle); e.dy = Math.sin(angle); e.state = .4; e.cooldown = 2; } } }
      else if (e.kind === "orbiter") { const a = gap > 235 ? 1 : gap < 160 ? -.45 : 0; e.x += (Math.cos(angle) * a + Math.cos(angle + Math.PI / 2) * e.strafe) * e.speed * slow * dt; e.y += (Math.sin(angle) * a + Math.sin(angle + Math.PI / 2) * e.strafe) * e.speed * slow * dt; }
      else { e.x += Math.cos(angle) * e.speed * slow * dt; e.y += Math.sin(angle) * e.speed * slow * dt; }
      e.x = clamp(e.x, -36, g.width + 36); e.y = clamp(e.y, -36, g.height + 36);
      if (summonTarget && hunted === summonTarget && gap < e.radius + summonTarget.radius) { summonTarget.hp -= e.contact * dt * 4; e.hp -= summonTarget.damage * dt; }
      else if (gap < e.radius + g.player.radius) heroDamage(g, e.contact);
    } };
    const update = (dt: number) => {
      if (g.paused || ["ready", "level-up", "stage-clear", "victory", "defeat"].includes(g.phase)) return; g.elapsed += dt; g.phaseClock += dt; g.shadowCloneTime = Math.max(0, g.shadowCloneTime - dt); g.moonEchoTime = Math.max(0, g.moonEchoTime - dt); g.sunGraceTime = Math.max(0, g.sunGraceTime - dt); g.player.invulnerable = Math.max(0, g.player.invulnerable - dt); g.boss.intentClock = Math.max(0, g.boss.intentClock - dt); g.build.hp = Math.min(g.build.maxHp, g.build.hp + g.build.regen * dt); g.player.dashCooldown = Math.max(0, g.player.dashCooldown - dt);
      if (g.player.dashCharges < g.build.dashMax && g.player.dashCooldown <= 0) { g.player.dashCharges++; if (g.player.dashCharges < g.build.dashMax) g.player.dashCooldown = g.build.dashCooldown; else g.player.dashCooldown = 0; }
      let dx = 0, dy = 0; if (g.keys.has("a") || g.keys.has("arrowleft")) dx--; if (g.keys.has("d") || g.keys.has("arrowright")) dx++; if (g.keys.has("w") || g.keys.has("arrowup")) dy--; if (g.keys.has("s") || g.keys.has("arrowdown")) dy++; g.player.moved = !!(dx || dy);
      if (g.player.dashClock > 0) { const dashGod = g.build.dashGod, speed = dashGod === "tide" ? 820 : dashGod === "radiance" ? 5200 : dashGod === "flame" ? g.build.moveSpeed * 1.5 : 640, before = g.player.dashClock; g.player.x += g.player.dashX * speed * dt; g.player.y += g.player.dashY * speed * dt; g.player.dashClock -= dt; g.player.dashTrailClock -= dt; if (g.build.dashTrail && g.player.dashTrailClock <= 0 && dashGod !== "tide" && dashGod !== "radiance") { g.player.dashTrailClock = .05; g.zones.push({ id: id(g), x: g.player.x, y: g.player.y, radius: dashGod === "flame" ? 34 : 25 + g.build.dashDamage * 2, life: (dashGod === "flame" ? 2.4 : .42) * g.build.effectDuration, slow: dashGod === "frost" ? .45 : .08, damage: g.build.damage * (dashGod === "flame" ? .26 : .12 + g.build.dashDamage * .035), tick: 0, color: dashGod ? GODS[dashGod].color : g.build.accent, hostile: false, god: dashGod ?? undefined }); } for (const e of g.enemies) if (g.build.dashDamage && distance(e, g.player) < e.radius + 38) { e.hp -= g.build.damage * g.build.dashDamage * dt * 12; if (dashGod === "frost") chill(e, 1); if (dashGod === "storm") e.hp -= g.build.damage * .8; } if (before > 0 && g.player.dashClock <= 0 && g.player.dashBurstPending) { g.player.dashBurstPending = false; g.zones.push({ id: id(g), x: g.player.x, y: g.player.y, radius: 125 * g.build.area, life: .75, slow: .25, damage: g.build.damage * 1.4, tick: 0, color: GODS.tide.color, hostile: false, god: "tide", push: 115, stun: .75 }); } }
      else if (dx || dy) { const len = Math.hypot(dx, dy); g.player.x += dx / len * g.build.moveSpeed * dt; g.player.y += dy / len * g.build.moveSpeed * dt; }
      g.player.x = clamp(g.player.x, 24, g.width - 24); g.player.y = clamp(g.player.y, 24, g.height - 24);
      if (["horde", "boss"].includes(g.phase)) { g.attackClock -= dt; if (g.attackClock <= 0 && target(g)) { fireHero(g); g.attackClock = g.build.attackInterval; } if (g.build.fireballInterval) { g.fireballClock -= dt; if (g.fireballClock <= 0) { castTechnique(g); g.fireballClock = g.build.fireballInterval; } } if (g.build.rageInterval) { g.rageClock -= dt; if (g.rageClock <= 0) { g.zones.push({ id: id(g), x: g.player.x, y: g.player.y, radius: 140 * g.build.area, life: .72, slow: 0, damage: g.build.damage * 1.5, tick: 0, color: g.build.technique1God ? GODS[g.build.technique1God].color : "#e2a95e", hostile: false }); g.rageClock = g.build.rageInterval; } } if (g.build.slowFieldInterval) { g.slowFieldClock -= dt; if (g.slowFieldClock <= 0) { const fieldGod = g.build.technique1God ?? "frost"; g.zones.push({ id: id(g), x: g.player.x, y: g.player.y, radius: 120 * g.build.area, life: 5, slow: fieldGod === "frost" ? .62 : .42, damage: g.build.damage * (fieldGod === "frost" ? .13 : .18), tick: 0, color: GODS[fieldGod].color, hostile: false, god: fieldGod }); g.slowFieldClock = g.build.slowFieldInterval; } } if (g.build.novaInterval) { g.novaClock -= dt; if (g.novaClock <= 0) { const god = g.build.technique1God ?? "moon"; g.zones.push({ id: id(g), x: g.player.x, y: g.player.y, radius: 165 * g.build.area, life: .75, slow: god === "shadow" ? .35 : .12, damage: g.build.damage * 1.35, tick: 0, color: GODS[god].color, hostile: false, god }); if (god === "blood") for (const e of g.enemies) if (distance(e, g.player) < 170 * g.build.area) bleed(g, e, g.build, 2); g.novaClock = g.build.novaInterval; } } }
      if (g.build.trapInterval) { g.trapClock -= dt; if (g.trapClock <= 0) { const angle = Math.random() * Math.PI * 2, radius = 70 + Math.random() * 170; g.zones.push({ id: id(g), x: clamp(g.player.x + Math.cos(angle) * radius, 40, g.width - 40), y: clamp(g.player.y + Math.sin(angle) * radius, 40, g.height - 40), radius: 54 + g.build.trapDamage * 3, life: 12, slow: .35, damage: g.build.damage * Math.max(.7, g.build.trapDamage), tick: .25, color: GODS.stone.color, hostile: false, kind: "trap", armed: .8, god: "stone" }); g.trapClock = g.build.trapInterval; } }
      if (g.build.invulnPulseInterval) { g.invulnPulseClock -= dt; if (g.invulnPulseClock <= 0) { g.player.invulnerable = Math.max(g.player.invulnerable, g.build.invulnPulseDuration); floatText(g, g.player.x, g.player.y - 36, "INTANGÍVEL", GODS.tide.color); g.invulnPulseClock = g.build.invulnPulseInterval; } }
      while (g.summons.length < g.build.summonCount) { const index = g.summons.length, hp = Math.max(70, g.build.summonHp), summonGod = g.build.summonGod ?? "shadow"; g.summons.push({ id: id(g), x: g.player.x, y: g.player.y, hp, maxHp: hp, damage: g.build.damage * Math.max(.35, g.build.summonDamage), radius: 13, cooldown: .3 + index * .12, color: GODS[summonGod].color, god: summonGod, orbit: index * Math.PI * 2 / Math.max(1, g.build.summonCount) }); }
      for (const summon of g.summons) { const orbit = 105 + Math.sin(g.elapsed * .7 + summon.id) * 15, desired = { x: g.player.x + Math.cos(g.elapsed * .55 + summon.orbit) * orbit, y: g.player.y + Math.sin(g.elapsed * .55 + summon.orbit) * orbit }; summon.x += (desired.x - summon.x) * Math.min(1, dt * 4); summon.y += (desired.y - summon.y) * Math.min(1, dt * 4); summon.cooldown -= dt; if (summon.cooldown <= 0) { const victim = g.enemies.filter(e => e.hp > 0).sort((a, b) => distance(summon, a) - distance(summon, b))[0] ?? (g.phase === "boss" ? g.boss : null); if (victim && distance(summon, victim) < 390) projectile(g, summon, Math.atan2(victim.y - summon.y, victim.x - summon.x), 510, summon.damage, false, { radius: 5, pierce: 0, life: 1.2, color: summon.color, shape: "shard", god: summon.god, special: "summon" }); summon.cooldown = 1.15; } } g.summons = g.summons.filter(s => s.hp > 0);
      if (g.build.orbitals > 0) { const orbitalGod = g.build.technique2God, color = orbitalGod ? GODS[orbitalGod].color : g.build.accent, hitRadius = 18 + Math.min(14, Math.max(0, g.build.orbitalRadius - 84) * .09), orbitSpeed = orbitalGod === "gale" || orbitalGod === "storm" ? 1.75 : orbitalGod === "stone" ? .9 : 1.28; for (let i = 0; i < g.build.orbitals; i++) { const angle = g.elapsed * (orbitSpeed + i % 2 * .13) + i * Math.PI * 2 / g.build.orbitals, orbit = g.build.orbitalRadius + Math.sin(g.elapsed * 2 + i) * 9, point = { x: g.player.x + Math.cos(angle) * orbit, y: g.player.y + Math.sin(angle) * orbit }, damage = g.build.damage * g.build.orbitalDamage * dt * 4.15; for (const e of g.enemies) if (distance(point, e) < e.radius + hitRadius) touchOrbital(g, e, damage, orbitalGod, dt); if (g.phase === "boss" && g.boss.vulnerable && distance(point, g.boss) < g.boss.radius + hitRadius) { touchOrbital(g, g.boss, damage, orbitalGod, dt); charge(g, damage); } if (orbitalGod === "venom" && Math.random() < dt * .8) g.zones.push({ id: id(g), ...point, radius: 23, life: .5, slow: .12, damage: g.build.damage * .08, tick: .1, color, hostile: false, god: "venom" }); } }
      if (g.phase === "horde") { g.stageElapsed += dt; const s = STAGES[g.stage], pressure = clamp(g.stageElapsed / s.duration, 0, 1), curve = pressure * pressure * (3 - 2 * pressure); g.spawnClock -= dt; const baseCap = 5 + g.stage * 2, peakCap = 17 + g.stage * 5, limit = Math.round(baseCap + (peakCap - baseCap) * curve); if (g.spawnClock <= 0 && g.enemies.length < limit) { spawn(g); const opening = 1.7 - g.stage * .08, ending = .72 - g.stage * .035; g.spawnClock = Math.max(.48, opening + (ending - opening) * curve) * (.86 + Math.random() * .28); } updateEnemies(dt); if (g.stageElapsed >= s.duration) beginBoss(); }
      else if (g.phase === "danger" && g.phaseClock >= 2.2) { g.phase = "boss-grace"; g.phaseClock = 0; }
      else if (g.phase === "boss-grace" && g.phaseClock >= 2) { g.phase = "boss"; g.phaseClock = 0; }
      else if (g.phase === "boss") {
        updateEnemies(dt);
        tickAffliction(g, g.boss, dt);
        const half = g.boss.hp <= g.boss.maxHp * .5;
        if (half && g.boss.combatPhase === 1) {
          g.boss.combatPhase = 2; g.boss.rage = true; g.boss.transitionClock = 2.4; g.boss.pattern = 0; g.boss.cooldown = 2.5; g.projectiles = []; g.hazards = []; g.echoes = []; g.parryQueue = []; g.player.invulnerable = Math.max(g.player.invulnerable, 1.25);
          announce(g, g.stage === 0 ? "A CRIPTA SE FECHA" : g.stage === 1 ? "A FORJA MUDA O RITMO" : g.stage === 2 ? "TODA MORTE ALIMENTA O BOSQUE" : g.stage === 3 ? "OS SELOS EXIGEM RESPOSTA" : "O REI SE LEMBRA DE VOCÊ", 2.2);
          if (g.stage === 0) { const boxW = Math.min(760, g.width * .72), boxH = Math.min(450, g.height * .7); g.boss.intermission = 16; g.boss.vulnerable = false; g.player.x = clamp(g.player.x, (g.width - boxW) / 2 + 45, (g.width + boxW) / 2 - 45); g.player.y = clamp(g.player.y, (g.height - boxH) / 2 + 45, (g.height + boxH) / 2 - 45); }
          if (g.stage === 3) { g.boss.vulnerable = false; const sealHp = 700 + g.level * 38; g.relics = [{ id: id(g), x: 68, y: 68, hp: sealHp, maxHp: sealHp }, { id: id(g), x: g.width - 68, y: 68, hp: sealHp, maxHp: sealHp }, { id: id(g), x: 68, y: g.height - 68, hp: sealHp, maxHp: sealHp }, { id: id(g), x: g.width - 68, y: g.height - 68, hp: sealHp, maxHp: sealHp }]; }
        }
        g.boss.transitionClock = Math.max(0, g.boss.transitionClock - dt);
        if (g.stage === 0 && g.boss.intermission > 0) {
          g.boss.intermission -= dt; const elapsed = 16 - g.boss.intermission, boxW = Math.min(760, g.width * .72), boxH = Math.min(450, g.height * .7), left = (g.width - boxW) / 2, top = (g.height - boxH) / 2;
          g.player.x = clamp(g.player.x, left + 24, left + boxW - 24); g.player.y = clamp(g.player.y, top + 24, top + boxH - 24); g.boss.cooldown -= dt;
          if (g.boss.cooldown <= 0) { const step = g.boss.pattern++; if (elapsed < 5) cageLanes(g, { left, top, width: boxW, height: boxH }, step % 2 === 0, step % 2 === 0 ? 8 : 6); else if (elapsed < 10) { cageLanes(g, { left, top, width: boxW, height: boxH }, step % 2 === 0, 8); orderedWall(g, step % 2 ? "left" : "up", step % 2 ? 3 : 7, 205, STAGES[0].bossDamage, "#e5a7c0"); } else { cageLanes(g, { left, top, width: boxW, height: boxH }, step % 2 === 0, 9); orderedWall(g, step % 2 ? "right" : "down", step % 2 ? 5 : 10, 235, STAGES[0].bossDamage + 1, "#f2bdd2"); } g.boss.cooldown = elapsed < 5 ? 1.7 : elapsed < 10 ? 1.35 : 1.08; }
          if (g.boss.intermission <= 0) { g.boss.vulnerable = true; g.player.invulnerable = Math.max(g.player.invulnerable, .9); g.projectiles = []; g.hazards = []; g.boss.pattern = 0; g.boss.cooldown = 1.2; announce(g, "VOCÊ SOBREVIVEU À PROVA", 1.8); }
        } else if (g.boss.transitionClock <= 0) {
          if (g.stage === 1) {
            if (g.boss.dashTelegraph > 0) g.boss.dashTelegraph -= dt;
            else if (g.boss.dashDuration > 0) { g.boss.dashElapsed += dt; const t = clamp(g.boss.dashElapsed / g.boss.dashDuration, 0, 1), eased = t * t * (3 - 2 * t); g.boss.x = g.boss.dashFromX + (g.boss.dashToX - g.boss.dashFromX) * eased; g.boss.y = g.boss.dashFromY + (g.boss.dashToY - g.boss.dashFromY) * eased; if (distance(g.player, g.boss) < g.player.radius + g.boss.radius + 6) heroDamage(g, STAGES[1].bossDamage + 7); if (t >= 1) { g.boss.dashDuration = 0; ring(g, g.boss.combatPhase === 2 ? 22 : 16, 155, STAGES[1].bossDamage - 2, g.boss.pathIndex * .17, 0, 2); } }
          } else if (g.stage !== 2) { g.boss.x = g.width / 2 + Math.sin(g.phaseClock * (.35 + g.stage * .02)) * Math.min(145, g.width * .16); g.boss.y = g.height * .2 + Math.cos(g.phaseClock * .27) * 34; }
          g.boss.cooldown -= dt; if (g.boss.cooldown <= 0 && g.boss.dashTelegraph <= 0 && g.boss.dashDuration <= 0) g.boss.cooldown = bossAttack(g);
        }
      }
      g.parryFlash = Math.max(0, g.parryFlash - dt);
      if (g.phase === "boss" && g.stage === 3 && g.parrySpawnClock > 0) {
        g.parrySpawnClock -= dt;
        if (g.parrySpawnClock <= 0) {
          const sequence: Direction[] = g.boss.combatPhase === 2 ? ["up", "right", "down", "left", "up", "down", "right", "left", "right", "up", "left", "down"] : ["up", "up", "right", "down", "left", "right", "up", "down"];
          sequence.forEach((direction, i) => g.parryQueue.push({ id: id(g), direction, eta: .9 + i * (g.boss.combatPhase === 2 ? .44 : .56), speed: 1, resolved: false }));
        }
      }
      if (g.parryQueue.length) {
        for (const strike of g.parryQueue) { strike.eta -= dt; if (!strike.resolved && strike.eta < -.16) { strike.resolved = true; heroDamage(g, STAGES[3].bossDamage + 4); g.parryStreak = 0; } }
        g.parryQueue = g.parryQueue.filter(strike => strike.eta > -.55);
      }
      if (g.phase === "boss" && g.stage === 4) {
        g.echoRecordClock -= dt;
        if (g.echoRecordClock <= 0) { g.echoRecordClock = .045; g.echoHistory.push({ x: g.player.x, y: g.player.y }); if (g.echoHistory.length > 180) g.echoHistory.shift(); }
      }
      for (const echo of g.echoes) {
        if (echo.telegraph > 0) echo.telegraph -= dt;
        else { echo.active -= dt; echo.tick -= dt; if (echo.tick <= 0) { echo.tick = .045; echo.cursor = Math.min(echo.points.length - 1, echo.cursor + 1); const point = echo.points[echo.cursor]; if (point && distance(point, g.player) < g.player.radius + 18) heroDamage(g, STAGES[4].bossDamage + 4); } }
      }
      g.echoes = g.echoes.filter(echo => echo.telegraph > 0 || echo.active > 0);
      if (g.rule !== "none") {
        if (g.ruleTelegraph > 0) g.ruleTelegraph -= dt;
        else if (g.ruleActive > 0) { g.ruleActive -= dt; g.ruleTick -= dt; if (g.ruleTick <= 0) { g.ruleTick = .2; const shouldMove = g.rule === "move"; const fails = g.ruleInverted ? g.player.moved === shouldMove : g.player.moved !== shouldMove; if (fails) heroDamage(g, STAGES[g.stage].bossDamage + 5); } }
        else { g.rule = "none"; g.ruleInverted = false; }
      }
      for (const h of g.hazards) { if (h.vx) { h.x += h.vx * dt; h.x2 += h.vx * dt; } if (h.vy) { h.y += h.vy * dt; h.y2 += h.vy * dt; } if (h.omega && h.telegraph <= 0) { const cx = h.centerX ?? (h.x + h.x2) / 2, cy = h.centerY ?? (h.y + h.y2) / 2, turn = h.omega * dt, cosine = Math.cos(turn), sine = Math.sin(turn); const rotate = (x: number, y: number) => ({ x: cx + (x - cx) * cosine - (y - cy) * sine, y: cy + (x - cx) * sine + (y - cy) * cosine }); const a = rotate(h.x, h.y), b = rotate(h.x2, h.y2); h.x = a.x; h.y = a.y; h.x2 = b.x; h.y2 = b.y; } if (h.telegraph > 0) h.telegraph -= dt; else if (h.active > 0) { h.active -= dt; if (h.kind === "memory") { const inside = g.player.x >= h.x && g.player.x <= h.x2 && g.player.y >= h.y && g.player.y <= h.y2; if (inside && !h.safe) heroDamage(g, h.damage); } else if (h.kind === "circle") { if (distance(g.player, h) < (h.radius ?? 40) + g.player.radius) heroDamage(g, h.damage); } else { const hit = lineDistance(g.player, h, { x: h.x2, y: h.y2 }) < h.width + g.player.radius; if (hit) heroDamage(g, h.damage); } } } g.hazards = g.hazards.filter(h => h.telegraph > 0 || h.active > 0);
      for (const z of g.zones) { z.life -= dt; z.tick -= dt; if (z.armed && z.armed > 0) { z.armed -= dt; continue; } if (z.kind === "trap" && !z.triggered) { const enemyInside = g.enemies.some(e => distance(z, e) < z.radius + e.radius), bossInside = g.phase === "boss" && g.boss.vulnerable && distance(z, g.boss) < z.radius + g.boss.radius; if (!enemyInside && !bossInside) continue; z.triggered = true; z.life = Math.min(z.life, .75); z.radius *= 1.45; floatText(g, z.x, z.y - 22, "ARMADILHA", GODS.stone.color); } if (z.tick <= 0) { z.tick = z.kind === "trap" ? .22 : .36; if (!z.hostile) { if (g.phase === "boss" && g.boss.vulnerable && distance(z, g.boss) < z.radius + g.boss.radius) { g.boss.hp -= z.damage; charge(g, z.damage); if (z.god === "flame") ignite(g.boss, g.build, true); if (z.god === "frost") chill(g.boss, 1, true); if (z.god === "sun") solarMark(g, g.boss); } for (const e of g.enemies) if (distance(z, e) < z.radius + e.radius) { e.hp -= z.damage; if (z.god === "flame") ignite(e, g.build, true); if (z.god === "venom") poison(e, g.build, 2); if (z.god === "frost") chill(e, 1); if (z.god === "sun") solarMark(g, e); if (z.stun) e.stunTime = Math.max(e.stunTime, z.stun); if (z.fear) e.fearTime = Math.max(e.fearTime, z.fear); if (z.push) { const a = Math.atan2(e.y - z.y, e.x - z.x); e.x += Math.cos(a) * z.push; e.y += Math.sin(a) * z.push; } if (z.pull) { const a = Math.atan2(z.y - e.y, z.x - e.x); e.x += Math.cos(a) * z.pull; e.y += Math.sin(a) * z.pull; } } for (const r of g.relics) if (distance(z, r) < z.radius + 22) r.hp -= z.damage; } else if (distance(z, g.player) < z.radius + g.player.radius) heroDamage(g, z.damage); } } g.zones = g.zones.filter(z => z.life > 0);
      for (const f of g.fragments) { const gap = distance(f, g.player); if (gap < g.build.magnet) { const a = Math.atan2(g.player.y - f.y, g.player.x - f.x), pull = 115 + (g.build.magnet - gap) * 2.7; f.x += Math.cos(a) * pull * dt; f.y += Math.sin(a) * pull * dt; } } const collected = g.fragments.filter(f => distance(f, g.player) < g.player.radius + 8); if (collected.length) { const ids = new Set(collected.map(f => f.id)); g.fragments = g.fragments.filter(f => !ids.has(f.id)); const gain = Math.max(1, Math.round(collected.reduce((a, f) => a + f.value, 0) * g.build.xpGain)); g.xp += gain; floatText(g, g.player.x, g.player.y - 28, `+${gain} XP`, "#d8b7ff"); }
      if (g.xp >= g.xpNeeded && g.phase === "horde") { g.xp -= g.xpNeeded; g.level++; g.xpNeeded = Math.round(25 + g.level * 7.5 + Math.pow(g.level, 1.3) * 1.7); g.phase = "level-up"; setCards(choices(g)); }
      for (const p of [...g.projectiles]) { let speed = 1; if (p.hostile) for (const z of g.zones) if (z.slow && distance(z, p) < z.radius) speed *= 1 - z.slow; if (p.turn) { const turn = p.turn * dt, cosine = Math.cos(turn), sine = Math.sin(turn), vx = p.vx * cosine - p.vy * sine, vy = p.vx * sine + p.vy * cosine; p.vx = vx; p.vy = vy; } if (p.accel) { const multiplier = 1 + p.accel * dt; p.vx *= multiplier; p.vy *= multiplier; } p.x += p.vx * dt * speed; p.y += p.vy * dt * speed; p.life -= dt; if (p.hostile) { if (p.life <= 0 && p.split) { const split = p.split; p.split = 0; for (let i = 0; i < 8; i++) projectile(g, p, i * Math.PI / 4, 170 + split * 15, p.damage * .55, true, { radius: 3.5, life: 4 }); } if (distance(p, g.player) < p.radius + g.player.radius) { p.life = 0; heroDamage(g, p.damage); if (p.split) { p.split = 0; for (let i = 0; i < 8; i++) projectile(g, p, i * Math.PI / 4, 170, p.damage * .55, true, { radius: 3.5, life: 4 }); } } continue; }
        let hit = false, afflicted: (Enemy | Boss) | null = null; if (g.phase === "boss" && g.boss.vulnerable && !p.hitIds.includes(-1) && distance(p, g.boss) < p.radius + g.boss.radius) { g.boss.hp -= p.damage; p.hitIds.push(-1); charge(g, p.damage); floatText(g, g.boss.x, g.boss.y - 38, `−${Math.round(p.damage)}`, g.build.attackGod ? GODS[g.build.attackGod].color : g.build.accent); hit = true; afflicted = g.boss; if (g.boss.hp <= 0) killBoss(); }
        for (const r of g.relics) if (r.hp > 0 && !p.hitIds.includes(r.id) && distance(p, r) < p.radius + 24) { r.hp -= p.damage; p.hitIds.push(r.id); hit = true; break; }
        if (!hit) for (const e of g.enemies) if (e.hp > 0 && !p.hitIds.includes(e.id) && distance(p, e) < p.radius + e.radius) { e.hp -= p.damage; p.hitIds.push(e.id); charge(g, p.damage); hit = true; afflicted = e; break; }
        if (hit) {
          if (afflicted && p.god === "flame" && (p.special === "technique" || Math.random() < g.build.burnChance)) ignite(afflicted, g.build, p.special === "technique");
          if (afflicted && p.god === "venom") poison(afflicted, g.build, p.special === "technique" ? 2 : 1);
          if (afflicted && p.god === "blood") bleed(g, afflicted, g.build, 1);
          if (afflicted && p.god === "frost") chill(afflicted, 1, afflicted === g.boss);
          if (afflicted && p.god === "sun") solarMark(g, afflicted, p.special === "technique" ? 2 : 1);
          if (afflicted && p.god === "tide" && afflicted !== g.boss) { const a = Math.atan2(afflicted.y - p.y, afflicted.x - p.x); afflicted.x += Math.cos(a) * (28 + g.build.knockback * 70); afflicted.y += Math.sin(a) * (28 + g.build.knockback * 70); }
          if (g.build.onHitHeal) g.build.hp = Math.min(g.build.maxHp, g.build.hp + Math.min(2.4, p.damage * g.build.onHitHeal));
          if (g.build.executeChance && Math.random() < g.build.executeChance) g.zones.push({ id: id(g), x: p.x, y: p.y, radius: 34, life: .32, slow: 0, damage: p.damage * .42, tick: 0, color: GODS.shadow.color, hostile: false });
          if (g.build.poisonDamage) g.zones.push({ id: id(g), x: p.x, y: p.y, radius: 32 + 8 * g.build.poisonDamage, life: 1.8, slow: .12, damage: p.damage * g.build.poisonDamage * .22, tick: .2, color: GODS.venom.color, hostile: false });
          if (g.build.chainChance && Math.random() < g.build.chainChance) { const chained = g.enemies.filter(e => e.hp > 0 && !p.hitIds.includes(e.id) && distance(e, p) < 230).sort((a, b) => distance(a, p) - distance(b, p))[0]; if (chained) projectile(g, p, Math.atan2(chained.y - p.y, chained.x - p.x), 920, p.damage * .56, false, { radius: 3.5, pierce: 0, life: .35, color: GODS.storm.color, shape: "shard" }); }
          if (p.area) g.zones.push({ id: id(g), x: p.x, y: p.y, radius: p.area, life: .45, slow: p.slow, damage: p.damage * .55, tick: 0, color: p.color, hostile: false, god: p.god }); if (p.pierce > 0) p.pierce--; else p.life = 0;
        }
      }
      const dead = g.enemies.filter(e => e.hp <= 0); for (const e of dead) { if (e.kind === "bomb") { const radius = g.stage === 2 && g.phase === "boss" ? 98 : 75; g.zones.push({ id: id(g), x: e.x, y: e.y, radius, life: g.stage === 2 ? 1.05 : .65, slow: 0, damage: e.contact, tick: .15, color: g.stage === 2 ? "#5fc39f" : "#ff754d", hostile: true }); if (g.stage === 2 && g.phase === "boss" && distance(e, g.boss) < radius + g.boss.radius) g.boss.hp -= g.build.damage * 2.4; } if (e.poisonStacks > 0) { const spread = g.enemies.filter(other => other.hp > 0 && other.id !== e.id).sort((a, b) => distance(e, a) - distance(e, b))[0]; if (spread && distance(e, spread) < 260) poison(spread, g.build, Math.max(1, Math.floor(e.poisonStacks * .65))); } const baseValue = e.kind === "brute" ? 7 : ["shooter", "dasher", "splitter", "bomb"].includes(e.kind) ? 5 : 3, earlyBoost = g.stage === 0 ? (g.level <= 2 ? 1.9 : g.level <= 4 ? 1.55 : 1.2) : 1, blessed = Math.random() < g.build.radiantDropChance ? 3 : 1, value = Math.round(baseValue * earlyBoost * blessed); if (!grantLevel(g, e)) g.fragments.push({ id: id(g), x: e.x, y: e.y, value, pulse: Math.random() * Math.PI * 2 }); if (blessed > 1) floatText(g, e.x, e.y - 30, "FRAGMENTO SOLAR", GODS.sun.color); g.kills++; if (e.kind === "splitter") for (let i = 0; i < 2; i++) spawn(g, "runner", { x: e.x + (i ? 14 : -14), y: e.y }); } g.enemies = g.enemies.filter(e => e.hp > 0); g.relics = g.relics.filter(r => r.hp > 0); if (g.stage === 3 && g.phase === "boss" && !g.relics.length) { g.boss.vulnerable = true; if (!g.boss.phaseStarted) { g.boss.phaseStarted = true; announce(g, "A ARMADURA SE PARTE", 1.8); g.player.invulnerable = Math.max(g.player.invulnerable, .8); } }
      if (g.phase === "boss" && g.boss.hp <= 0) killBoss();
      g.projectiles = g.projectiles.filter(p => p.life > 0 && p.x > -120 && p.x < g.width + 120 && p.y > -120 && p.y < g.height + 120);
      if (g.projectiles.length > 900) {
        const friendly = g.projectiles.filter(p => !p.hostile).slice(-220);
        const hostile = g.projectiles.filter(p => p.hostile).slice(-680);
        g.projectiles = [...friendly, ...hostile];
      }
      for (const f of g.floats) f.life -= dt; g.floats = g.floats.filter(f => f.life > 0);
    };
    let frame = 0, hudClock = 0; const loop = (time: number) => { const dt = g.lastTime ? Math.min(.033, (time - g.lastTime) / 1000) : 0; g.lastTime = time; update(dt); draw(ctx, g, portrait); hudClock += dt; if (hudClock > .08) { hudClock = 0; setHud(snap(g)); } frame = requestAnimationFrame(loop); }; frame = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", releaseAll); if (gameRef.current === g) gameRef.current = null; };
  }, [selectedClass, runId, hero.portrait]);

  const openShop = () => { const g = gameRef.current; shopAutoPausedRef.current = !!(g && !g.paused && ["horde", "boss"].includes(g.phase)); if (shopAutoPausedRef.current && g) { g.paused = true; setHud(snap(g)); } setShopOpen(true); };
  const closeShop = () => { const g = gameRef.current; if (shopAutoPausedRef.current && g && g.paused) { g.paused = false; g.lastTime = 0; setHud(snap(g)); } shopAutoPausedRef.current = false; setShopOpen(false); };
  const buyUpgrade = (item: ShopItem) => {
    const current = metaRef.current, rank = current.upgrades[item.id]; if (rank >= item.maxRank) return; const cost = item.costs[rank]; if (current.marks < cost) return;
    const next = { marks: current.marks - cost, upgrades: { ...current.upgrades, [item.id]: rank + 1 } }; metaRef.current = next; setMeta(next); saveMetaProgress(next); setMetaMessage(`${item.name} alcançou o nível ${rank + 1}. O bônus entra na próxima tentativa.`);
  };
  const start = () => { const g = gameRef.current; if (!g) return; setMetaMessage(""); g.phase = "horde"; g.lastTime = 0; setHud(snap(g)); };
  const pause = () => { const g = gameRef.current; if (!g || !["horde", "boss"].includes(g.phase)) return; g.paused = !g.paused; g.lastTime = 0; setHud(snap(g)); };
  const choose = (card: UpgradeCard) => { const g = gameRef.current; if (!g) return; const before = { fire: g.build.fireballInterval, rage: g.build.rageInterval, slow: g.build.slowFieldInterval, nova: g.build.novaInterval }; card.apply(g.build); if (card.god && card.slot) { const boon = { god: card.god, rarity: card.rarity, rank: card.rank ?? RARITY_RANK[card.rarity], name: card.name }; if (card.slot === "passive") g.build.passives.push(boon); else g.build.slots[card.slot] = boon; } g.player.dashCharges = Math.min(g.build.dashMax, g.player.dashCharges + Math.max(0, g.build.dashMax - hud.dashMax)); if (!before.fire && g.build.fireballInterval) g.fireballClock = .5; if (!before.rage && g.build.rageInterval) g.rageClock = .5; if (!before.slow && g.build.slowFieldInterval) g.slowFieldClock = .5; if (!before.nova && g.build.novaInterval) g.novaClock = .5; setPicked(p => [...p, { id: `${card.id}-${p.length}`, name: card.name.replace("ULT · ", ""), rarity: card.rarity }]); setCards([]); g.phase = "horde"; g.lastTime = 0; setHud(snap(g)); };
  const nextStage = () => { const g = gameRef.current; if (!g) return; g.stage++; g.stageElapsed = 0; g.phaseClock = 0; g.build.hp = g.build.maxHp; g.player.x = g.width / 2; g.player.y = g.height * .6; g.player.dashCharges = g.build.dashMax; g.player.shadowAnchor = null; g.enemies = []; g.projectiles = []; g.fragments = []; g.zones = []; g.hazards = []; g.relics = []; g.phase = "horde"; g.lastTime = 0; setHud(snap(g)); };
  const restart = () => { rewardLockedRef.current = true; setMetaMessage(""); setRunId(r => r + 1); }; const leave = () => { setSelectedClass(null); setCards([]); setPicked([]); setMetaMessage(""); setHud(h => ({ ...h, phase: "select" })); };
  const stage = STAGES[Math.min(hud.stage, 4)], remaining = Math.max(0, stage.duration - hud.elapsed), time = `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${Math.floor(remaining % 60).toString().padStart(2, "0")}`;
  const encounterGod = cards[0]?.god ? GODS[cards[0].god] : null;
  const GodIcon = encounterGod?.icon;
  const icon = (c: HeroClass) => c === "warrior" ? <Swords /> : c === "archer" ? <Navigation /> : <WandSparkles />; const latest = useMemo(() => picked.slice(-14), [picked]);
  return <div className="survivor-game">
    <header className="survivor-head"><div><span className="eyebrow">Arcana · sobrevivência</span><h1>Fragmentos do Intervalo</h1><p>Cinco mundos, cinco chefes e uma construção diferente a cada tentativa.</p></div><div className="survivor-head-actions"><button className="ghost-button meta-shop-trigger" onClick={openShop}><ShoppingBag size={16} />Loja <b><Coins size={13} />{meta.marks}</b></button>{selectedClass && <><button className="ghost-button" onClick={pause}>{hud.paused ? <Play size={16} /> : <Pause size={16} />}{hud.paused ? "Continuar" : "Pausar"}</button><button className="ghost-button" onClick={leave}><RotateCcw size={16} />Trocar classe</button></>}</div></header>
    {shopOpen && <div className="meta-shop-backdrop" role="dialog" aria-modal="true" aria-labelledby="meta-shop-title" onMouseDown={e => { if (e.target === e.currentTarget) closeShop(); }}><section className="meta-shop-panel"><header><div><span className="eyebrow">PROGRESSÃO ENTRE TENTATIVAS</span><h2 id="meta-shop-title">Arquivo de Marcas</h2><p>Melhorias pequenas e permanentes. Elas sobrevivem à derrota e entram apenas na próxima tentativa.</p></div><button className="meta-shop-close" onClick={closeShop} aria-label="Fechar loja"><X /></button></header><div className="meta-wallet"><i><Coins /></i><span>Seu saldo<strong>{meta.marks} Marcas de Arcana</strong></span><small>Derrote chefes e avance para conquistar mais. Nada aqui compra uma vitória pronta.</small></div><div className="meta-shop-grid">{SHOP_ITEMS.map(item => { const rank = meta.upgrades[item.id], complete = rank >= item.maxRank, cost = complete ? 0 : item.costs[rank], canBuy = !complete && meta.marks >= cost, ItemIcon = item.icon; return <article key={item.id}><div className="meta-shop-item-head"><i><ItemIcon /></i><span><small>NÍVEL {rank}/{item.maxRank}</small><strong>{item.name}</strong></span></div><p>{item.description}</p><em>{item.effect}</em><div className="meta-ranks" aria-label={`${rank} de ${item.maxRank} níveis adquiridos`}>{Array.from({ length: item.maxRank }, (_, i) => <i className={i < rank ? "filled" : ""} key={i} />)}</div><button disabled={!canBuy} onClick={() => buyUpgrade(item)}>{complete ? "Aprimoramento máximo" : <><span>Comprar nível {rank + 1}</span><b><Coins size={14} />{cost}</b></>}</button></article>; })}</div><footer><Shield size={17} /><span>Salvo somente neste navegador e neste dispositivo.</span>{metaMessage && <strong>{metaMessage}</strong>}</footer></section></div>}
    {!selectedClass ? <section className="class-gate"><div className="class-gate-copy"><span className="eyebrow">Escolha antes de entrar</span><h2>Sua ficha traz o rosto. Você escolhe o combate.</h2><p>O retrato do personagem acompanha o token, mas a classe deste modo é própria: Guerreiro, Arqueiro ou Mago.</p></div><div className="survivor-classes">{(Object.keys(BASES) as HeroClass[]).map(c => { const b = BASES[c]; return <button key={c} className={c} onClick={() => setSelectedClass(c)}><i>{icon(c)}</i><span>{c === "warrior" ? "Resistência" : c === "archer" ? "Mobilidade" : "Poder"}</span><h3>{b.name}</h3><p>{b.trait}</p><dl><div><dt>Vida</dt><dd>{c === "warrior" ? "Alta" : c === "archer" ? "Média" : "Baixa"}</dd></div><div><dt>Movimento</dt><dd>{c === "warrior" ? "Baixo" : c === "archer" ? "Alto" : "Médio"}</dd></div><div><dt>Alcance</dt><dd>{c === "warrior" ? "Curto" : c === "archer" ? "Longo" : "Médio"}</dd></div><div><dt>Dano</dt><dd>{c === "warrior" ? "Médio" : c === "archer" ? "Baixo" : "Alto"}</dd></div></dl><strong>Escolher {b.name}</strong></button>; })}</div></section> : <>
      <section className="survivor-hud"><div className="hero-status"><i style={{ color: preview?.accent }}>{hero.portrait ? <img src={hero.portrait} alt="" /> : icon(selectedClass)}</i><span><small>{hero.name || preview?.name} · {preview?.name} nível {hud.level}</small><strong>{preview?.attackName}</strong><em><b style={{ width: `${hud.hp / hud.maxHp * 100}%` }} /></em></span><b>{Math.ceil(hud.hp)}/{Math.ceil(hud.maxHp)}</b></div><div><Heart size={17} /><span>Sobrevida<strong>{Math.ceil(hud.hp)} PV{hud.barrier > 0 ? ` + ${Math.ceil(hud.barrier)} barreira` : ""}</strong></span></div><div><Timer size={17} /><span>{hud.phase === "boss" ? "Chefe ativo" : "Até o perigo"}<strong>{hud.phase === "boss" ? stage.boss : time}</strong></span></div><div><Crosshair size={17} /><span>Eliminações<strong>{hud.kills}</strong></span></div><div><Crown size={17} /><span>Fase<strong>{hud.stage + 1}/5</strong></span></div></section>
      <section className="survivor-stage"><canvas ref={canvasRef} tabIndex={0} aria-label="Arena. Use WASD ou setas e Espaço para esquivar." />
        {hud.phase === "ready" && <div className="game-overlay ready"><i style={{ color: preview?.accent }}>{icon(selectedClass)}</i><small>{preview?.name}</small><h2>{stage.name}</h2><p>{stage.subtitle} Use <kbd>WASD</kbd> ou setas para andar e <kbd>ESPAÇO</kbd> para esquivar.</p><button onClick={start}><Play size={17} />Começar fase 1</button></div>}
        {hud.phase === "danger" && <div className="danger-overlay"><small>O TEMPO ACABOU</small><strong>PERIGO</strong><span>As criaturas devolvem seus corpos ao campo.</span></div>}
        {hud.phase === "boss-grace" && <div className="boss-reveal"><small>{hud.stage === 4 && hud.bossRage ? "SEGUNDA VIDA" : `CHEFE DA FASE ${hud.stage + 1}`}</small><h2>{stage.boss}</h2><span>{hud.stage === 4 && hud.bossRage ? "O Rei se recusa a permanecer morto." : "Dois segundos. Leia o campo."}</span></div>}
        {hud.paused && <div className="pause-overlay"><Pause /><strong>Jogo pausado</strong><span>O tempo e todas as ameaças estão parados.</span></div>}
        {hud.phase === "stage-clear" && <div className="game-overlay result"><Crown /><small>FASE {hud.stage + 1} CONCLUÍDA</small><h2>{stage.boss} caiu.</h2><p>Vida restaurada. Cartas e ultimate seguem com você.</p>{metaMessage && <strong className="meta-run-reward"><Coins size={15} />{metaMessage}</strong>}<div className="game-overlay-actions"><button onClick={nextStage}><ArrowUp size={17} />Entrar em {STAGES[hud.stage + 1].name}</button><button className="secondary" onClick={openShop}><ShoppingBag size={17} />Abrir loja</button></div></div>}
        {hud.phase === "victory" && <div className="game-overlay result"><Crown /><small>OS CINCO INTERVALOS FORAM ROMPIDOS</small><h2>Você sobreviveu.</h2><p>{hud.kills} criaturas e {picked.length} cartas.</p>{metaMessage && <strong className="meta-run-reward"><Coins size={15} />{metaMessage}</strong>}<div className="game-overlay-actions"><button onClick={restart}><RotateCcw size={17} />Nova tentativa</button><button className="secondary" onClick={openShop}><ShoppingBag size={17} />Abrir loja</button></div></div>}
        {hud.phase === "defeat" && <div className="game-overlay result defeat"><Heart /><small>A EXPEDIÇÃO TERMINOU</small><h2>O intervalo fechou.</h2><p>Fase {hud.stage + 1}, nível {hud.level}.</p>{metaMessage && <strong className="meta-run-reward"><Coins size={15} />{metaMessage}</strong>}<div className="game-overlay-actions"><button onClick={restart}><RotateCcw size={17} />Tentar novamente</button><button className="secondary" onClick={openShop}><ShoppingBag size={17} />Abrir loja</button></div></div>}
        {cards.length > 0 && <div className={`card-modal ${encounterGod ? "god-encounter" : cards[0]?.rarity === "curse" ? "curse-encounter" : ""}`} style={encounterGod ? { "--boon-color": encounterGod.color } as CSSProperties : undefined}><div className="card-modal-copy">{GodIcon && <i className="god-seal"><GodIcon size={34} strokeWidth={1.6} /></i>}<span className="eyebrow">NÍVEL {hud.level} · ESCOLHA 1 DE 3</span><h2>{encounterGod ? `${encounterGod.name} oferece uma bênção.` : cards[0]?.rarity === "curse" ? "Algo sem nome oferece um preço." : "O mundo parou para você mudar."}</h2><p>{encounterGod ? `${encounterGod.title}. Seu domínio é ${encounterGod.identity}. Trocar o elemento de um espaço no mesmo nível é raro; bênçãos superiores atravessam essa resistência.` : cards[0]?.rarity === "curse" ? "Maldições são poderosas e permanentes. Leia o que elas retiram antes de aceitar." : "Cartas ancestrais da sua classe ainda podem surgir. Uma nova ultimate substitui a anterior."}</p></div><div className="upgrade-cards">{cards.map(c => { const deity = c.god ? GODS[c.god] : null, DeityIcon = deity?.icon; const current = c.slot && c.slot !== "passive" ? hud.slots[c.slot] : null; const replacing = !!(current && c.god && current.god !== c.god); return <button className={`${c.rarity} ${c.ultimate ? "ultimate" : ""}`} style={deity ? { "--card-color": deity.color } as CSSProperties : undefined} key={c.id} onClick={() => choose(c)}><span>{RARITY_LABEL[c.rarity]}{c.slot ? ` · ${SLOT_LABEL[c.slot]}` : ""}</span><i className="card-glyph">{DeityIcon ? <DeityIcon size={25} strokeWidth={1.7} /> : c.ultimate ? <Zap size={24} /> : <Sparkles size={24} />}</i><strong>{c.name.replace("ULT · ", "")}</strong><p>{c.description}</p>{replacing && <em>SUBSTITUI {current?.name.toUpperCase()}</em>}<small>{deity ? `${deity.name} · ${deity.title}` : c.classId === "general" ? "Todas as classes" : BASES[c.classId].name}</small></button>; })}</div></div>}
        <div className="touch-pad"><button onPointerDown={() => gameRef.current?.keys.add("arrowup")} onPointerUp={() => gameRef.current?.keys.delete("arrowup")}>▲</button><button onPointerDown={() => gameRef.current?.keys.add("arrowleft")} onPointerUp={() => gameRef.current?.keys.delete("arrowleft")}>◀</button><button onPointerDown={() => gameRef.current?.keys.add("arrowdown")} onPointerUp={() => gameRef.current?.keys.delete("arrowdown")}>▼</button><button onPointerDown={() => gameRef.current?.keys.add("arrowright")} onPointerUp={() => gameRef.current?.keys.delete("arrowright")}>▶</button></div>
      </section>
      <section className="survivor-bars"><div><span><Sparkles size={14} />Fragmentos · nível {hud.level}</span><strong>{hud.xp}/{hud.xpNeeded} XP</strong><em><i style={{ width: `${Math.min(100, hud.xp / hud.xpNeeded * 100)}%` }} /></em></div><div className={hud.ultimateName === "Nenhuma ultimate" ? "locked" : ""}><span><Zap size={14} />{hud.ultimateName}</span><strong>{hud.ultimateName === "Nenhuma ultimate" ? "Encontre uma carta ULT" : `${Math.floor(hud.ultimate)}%`}</strong><em><i style={{ width: `${hud.ultimate / hud.ultimateMax * 100}%` }} /></em></div><div className="dash-bar"><span><Navigation size={14} />Esquiva · ESPAÇO</span><strong>{hud.dashCharges}/{hud.dashMax} cargas</strong><em><i style={{ width: `${hud.dashCharges >= hud.dashMax ? 100 : (1 - hud.dashCooldown / hud.dashBaseCooldown) * 100}%` }} /></em></div>{hud.phase === "boss" && <div className="boss-bar"><span><Crown size={14} />{stage.boss}{hud.bossRage ? " · FÚRIA" : ""}</span><strong>{!hud.bossVulnerable ? `IMUNE · ${hud.relics} selos` : `${Math.max(0, Math.ceil(hud.bossHp))}/${Math.ceil(hud.bossMaxHp)}`}</strong><em><i style={{ width: `${hud.bossHp / hud.bossMaxHp * 100}%` }} /></em></div>}</section>
      <section className="boon-loadout"><div><span className="eyebrow">Bênçãos equipadas</span><p>Cada espaço aceita uma entidade. Uma oferta superior pode substituir outra.</p></div><ol>{(["attack", "dash", "technique1", "technique2", "ultimate"] as const).map(slot => { const boon = hud.slots[slot], SlotIcon = boon ? GODS[boon.god].icon : Orbit; return <li className={boon ? boon.rarity : "empty"} style={boon ? { "--slot-color": GODS[boon.god].color } as CSSProperties : undefined} key={slot}><small>{SLOT_LABEL[slot]}</small>{boon ? <><i><SlotIcon size={17} strokeWidth={1.8} /></i><strong>{boon.name}</strong><span>{GODS[boon.god].name} · {RARITY_LABEL[boon.rarity]}</span></> : <><i><SlotIcon size={16} /></i><strong>Espaço vazio</strong><span>Aguardando uma entidade</span></>}</li>; })}</ol>{hud.passives.length > 0 && <div className="boon-passives"><small>PASSIVAS</small>{hud.passives.slice(-6).map((boon, i) => <span key={`${boon.name}-${i}`} style={{ borderColor: GODS[boon.god].color }}>{boon.name}</span>)}</div>}</section>
      <footer className="survivor-footer"><div><span className="eyebrow">Caminho</span><ol>{STAGES.map((s, i) => <li className={i === hud.stage ? "active" : i < hud.stage ? "done" : ""} key={s.name}><b>{String(i + 1).padStart(2, "0")}</b><span>{s.name}<small>{Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, "0")} · {s.boss}</small></span></li>)}</ol></div><div><span className="eyebrow">Construção atual</span><div className="picked-cards">{latest.length ? latest.map(c => <span className={c.rarity} key={c.id}>{c.name}</span>) : <p>Recolha fragmentos para sua primeira carta.</p>}</div></div></footer>
    </>}
  </div>;
}
