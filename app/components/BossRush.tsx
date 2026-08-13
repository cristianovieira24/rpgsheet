"use client";

import {
  Crown,
  Gem,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type BossRushCharacter = {
  key: string;
  name: string;
  classId: string;
  className: string;
  level: number;
  abilities: Record<AbilityKey, number>;
  currentHp: number;
  maximumHp: number;
  armorClass: number;
  portrait: string;
};

type RunPhase =
  | "idle"
  | "horde"
  | "shop"
  | "boss-intro"
  | "boss-delay"
  | "boss"
  | "victory"
  | "defeat";
type Rarity = "normal" | "rare" | "legendary";
type Point = { x: number; y: number };
type Enemy = Point & { id: number; hp: number; maxHp: number; speed: number; radius: number; kind: number; shotClock: number; strafe: number };
type Shot = Point & { vx: number; vy: number; radius: number; damage: number; pierce: number; hostile: boolean; life: number };
type Fragment = Point & { id: number; pulse: number; value: number };
type FloatText = Point & { id: number; text: string; color: string; life: number };

type ClassProfile = {
  name: string;
  attack: string;
  accent: string;
  damage: number;
  cadence: number;
  projectiles: number;
  spread: number;
  pierce: number;
  crit: number;
  sustain: number;
  trait: string;
};

type Build = {
  name: string;
  classId: string;
  className: string;
  level: number;
  portrait: string;
  maxHp: number;
  hp: number;
  armorClass: number;
  moveSpeed: number;
  damage: number;
  shotInterval: number;
  projectileSpeed: number;
  projectileCount: number;
  spread: number;
  pierce: number;
  critChance: number;
  sustain: number;
  magnet: number;
  accent: string;
  attackName: string;
  trait: string;
};

type RewardCard = {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  apply: (build: Build) => void;
};

type ShopCard = RewardCard & { price: number };

type Game = {
  phase: RunPhase;
  width: number;
  height: number;
  player: Point & { radius: number; invulnerable: number };
  boss: Point & { radius: number; hp: number; maxHp: number };
  build: Build;
  enemies: Enemy[];
  shots: Shot[];
  fragments: Fragment[];
  floats: FloatText[];
  keys: Set<string>;
  killed: number;
  spawned: number;
  collected: number;
  points: number;
  cardsTaken: RewardCard[];
  shopRerolls: number;
  elapsed: number;
  phaseClock: number;
  spawnClock: number;
  playerShotClock: number;
  bossShotClock: number;
  bossPattern: number;
  enemyId: number;
  fragmentId: number;
  floatId: number;
  paused: boolean;
  lastTime: number;
  hordeClearedAt: number;
  intensity: number;
};

const CLASS_PROFILES: Record<string, ClassProfile> = {
  barbarian: { name: "Bárbaro", attack: "Impacto de Fúria", accent: "#e87358", damage: 1.42, cadence: 1.28, projectiles: 1, spread: 0, pierce: 1, crit: .08, sustain: 1, trait: "Golpes pesados atravessam um alvo e recuperam vigor em abates." },
  bard: { name: "Bardo", attack: "Acorde Cortante", accent: "#df71ba", damage: .72, cadence: .9, projectiles: 3, spread: .2, pierce: 0, crit: .1, sustain: 1, trait: "Cada acorde lança três notas e sustenta a própria vitalidade." },
  cleric: { name: "Clérigo", attack: "Luz Consagrada", accent: "#f0d47b", damage: 1.05, cadence: 1.02, projectiles: 1, spread: 0, pierce: 1, crit: .08, sustain: 2, trait: "A luz perfura inimigos e converte abates em cura." },
  druid: { name: "Druida", attack: "Espinho Errante", accent: "#77c88a", damage: .92, cadence: .9, projectiles: 2, spread: .12, pierce: 1, crit: .08, sustain: 1, trait: "Espinhos gêmeos atravessam criaturas e recolhem fragmentos de longe." },
  fighter: { name: "Guerreiro", attack: "Disparo Marcial", accent: "#d7b46a", damage: 1, cadence: .68, projectiles: 1, spread: 0, pierce: 0, crit: .15, sustain: 0, trait: "A técnica marcial oferece a cadência mais constante da Arena." },
  monk: { name: "Monge", attack: "Pulso de Ki", accent: "#8edbd5", damage: .7, cadence: .55, projectiles: 2, spread: .08, pierce: 0, crit: .16, sustain: 0, trait: "Pulsos duplos e movimento superior recompensam posicionamento." },
  paladin: { name: "Paladino", attack: "Golpe Radiante", accent: "#f3c85f", damage: 1.28, cadence: 1.18, projectiles: 1, spread: 0, pierce: 2, crit: .12, sustain: 2, trait: "Um golpe radiante atravessa fileiras e restaura vida em combate." },
  ranger: { name: "Patrulheiro", attack: "Flechas Gêmeas", accent: "#8fbe69", damage: .86, cadence: .78, projectiles: 2, spread: .1, pierce: 0, crit: .18, sustain: 0, trait: "Duas flechas perseguem o alvo mais próximo com precisão." },
  rogue: { name: "Ladino", attack: "Lâmina Furtiva", accent: "#ad8ad5", damage: .92, cadence: .76, projectiles: 1, spread: 0, pierce: 1, crit: .38, sustain: 0, trait: "Críticos muito mais frequentes simulam ataques furtivos." },
  sorcerer: { name: "Feiticeiro", attack: "Centelha Inata", accent: "#d876ef", damage: .9, cadence: .78, projectiles: 2, spread: .14, pierce: 0, crit: .16, sustain: 0, trait: "Magia inata divide o disparo em duas centelhas rápidas." },
  warlock: { name: "Bruxo", attack: "Rajada Mística", accent: "#a787e8", damage: 1.16, cadence: .95, projectiles: 1, spread: 0, pierce: 2, crit: .14, sustain: 1, trait: "A rajada atravessa vários corpos e drena energia em abates." },
  wizard: { name: "Mago", attack: "Seta Arcana", accent: "#7eb7f2", damage: 1.34, cadence: 1.12, projectiles: 1, spread: 0, pierce: 2, crit: .12, sustain: 0, trait: "A seta arcana é lenta, poderosa e atravessa múltiplos inimigos." },
};

const FALLBACK_PROFILE = CLASS_PROFILES.fighter;
const HORDE_TOTAL = 100;
const INTRO_SECONDS = 2.8;
const BOSS_GRACE_SECONDS = 1.65;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const modifier = (score: number) => Math.floor((score - 10) / 2);

/** Mantém a conversão da ficha isolada do motor do jogo. */
export function characterToBuild(character: BossRushCharacter): Build {
  const profile = CLASS_PROFILES[character.classId] ?? FALLBACK_PROFILE;
  const primaryScore = Math.max(
    character.abilities.str,
    character.abilities.dex,
    character.abilities.int,
    character.abilities.wis,
    character.abilities.cha,
  );
  const primaryModifier = Math.max(0, modifier(primaryScore));
  const dexterityModifier = Math.max(0, modifier(character.abilities.dex));
  return {
    name: character.name || "Aventureiro",
    classId: character.classId,
    className: character.className || profile.name,
    level: character.level,
    portrait: character.portrait,
    maxHp: Math.max(1, character.maximumHp),
    hp: clamp(character.currentHp || character.maximumHp, 1, character.maximumHp),
    armorClass: character.armorClass,
    moveSpeed: 128 + dexterityModifier * 3,
    damage: Math.max(4, Math.round((5 + character.level * 1.45 + primaryModifier * 1.7) * profile.damage)),
    shotInterval: clamp((.7 - character.level * .008) * profile.cadence, .3, 1.15),
    projectileSpeed: 390,
    projectileCount: profile.projectiles,
    spread: profile.spread,
    pierce: profile.pierce,
    critChance: profile.crit,
    sustain: profile.sustain,
    magnet: character.classId === "druid" ? 112 : 82,
    accent: profile.accent,
    attackName: profile.attack,
    trait: profile.trait,
  };
}

const REWARDS: Array<Omit<RewardCard, "rarity"> & { rarity: Rarity }> = [
  { id: "keen-edge", name: "Fio Afiado", rarity: "normal", description: "+15% de dano.", apply: (b) => { b.damage = Math.round(b.damage * 1.15); } },
  { id: "quick-hands", name: "Mãos Ligeiras", rarity: "normal", description: "+12% de velocidade de ataque.", apply: (b) => { b.shotInterval *= .88; } },
  { id: "pilgrim-step", name: "Passo do Peregrino", rarity: "normal", description: "+10% de movimento.", apply: (b) => { b.moveSpeed *= 1.1; } },
  { id: "iron-thread", name: "Fio de Ferro", rarity: "normal", description: "+1 de CA durante esta incursão.", apply: (b) => { b.armorClass += 1; } },
  { id: "fragment-call", name: "Chamado dos Fragmentos", rarity: "normal", description: "+45 de alcance de coleta.", apply: (b) => { b.magnet += 45; } },
  { id: "red-vial", name: "Frasco Carmesim", rarity: "normal", description: "Recupere 20% dos PV máximos.", apply: (b) => { b.hp = Math.min(b.maxHp, b.hp + Math.ceil(b.maxHp * .2)); } },
  { id: "twin-rune", name: "Runa Gêmea", rarity: "rare", description: "+1 projétil por ataque, com pequena dispersão.", apply: (b) => { b.projectileCount += 1; b.spread = Math.max(b.spread, .1); } },
  { id: "glass-cannon", name: "Coração de Vidro", rarity: "rare", description: "+35% de dano, mas −1 de CA.", apply: (b) => { b.damage = Math.round(b.damage * 1.35); b.armorClass -= 1; } },
  { id: "hungry-sigil", name: "Sigilo Faminto", rarity: "rare", description: "Cure 2 PV a cada 10 criaturas derrotadas.", apply: (b) => { b.sustain += 2; } },
  { id: "deep-pierce", name: "Geometria Perfurante", rarity: "rare", description: "Seus disparos atravessam +2 inimigos.", apply: (b) => { b.pierce += 2; } },
  { id: "perfect-focus", name: "Foco Impossível", rarity: "rare", description: "+18% de crítico e +10% de velocidade do projétil.", apply: (b) => { b.critChance += .18; b.projectileSpeed *= 1.1; } },
  { id: "many-worlds", name: "Eco de Muitos Mundos", rarity: "legendary", description: "+2 projéteis, +1 perfuração e +20% de dano.", apply: (b) => { b.projectileCount += 2; b.pierce += 1; b.damage = Math.round(b.damage * 1.2); b.spread = Math.max(b.spread, .14); } },
  { id: "undying-page", name: "A Página que Recusa o Fim", rarity: "legendary", description: "+35% de PV máximos e cura completa.", apply: (b) => { b.maxHp = Math.ceil(b.maxHp * 1.35); b.hp = b.maxHp; } },
  { id: "owl-eye", name: "Olho da Coruja Dourada", rarity: "legendary", description: "Todo terceiro ataque é crítico e dispara em leque.", apply: (b) => { b.critChance = Math.max(b.critChance, .34); b.projectileCount += 2; b.spread = Math.max(b.spread, .18); } },
];

function rollRarity(collected: number, pickIndex: number): Rarity {
  const progress = clamp(collected / (HORDE_TOTAL * 2.25), 0, 1);
  const legendary = .025 + progress * .045 + pickIndex * .01;
  const rare = .17 + progress * .14 + pickIndex * .02;
  const roll = Math.random();
  if (roll < legendary) return "legendary";
  if (roll < legendary + rare) return "rare";
  return "normal";
}

function createChoices(game: Game): ShopCard[] {
  const chosen = new Set(game.cardsTaken.map((card) => card.id));
  const options: ShopCard[] = [];
  let guard = 0;
  while (options.length < 3 && guard < 80) {
    guard += 1;
    const rarity = rollRarity(game.collected, game.cardsTaken.length);
    let pool = REWARDS.filter((card) => card.rarity === rarity && !chosen.has(card.id) && !options.some((option) => option.id === card.id));
    if (!pool.length) pool = REWARDS.filter((card) => !chosen.has(card.id) && !options.some((option) => option.id === card.id));
    if (!pool.length) pool = REWARDS.filter((card) => !options.some((option) => option.id === card.id));
    const card = pool[Math.floor(Math.random() * pool.length)];
    if (card) {
      const basePrice = card.rarity === "legendary" ? 122 : card.rarity === "rare" ? 66 : 30;
      const variance = card.rarity === "legendary" ? 17 : card.rarity === "rare" ? 11 : 7;
      options.push({ ...card, price: basePrice + Math.floor(Math.random() * variance) });
    }
  }
  return options;
}

function addFloat(game: Game, x: number, y: number, text: string, color: string) {
  game.floats.push({ id: game.floatId++, x, y, text, color, life: .8 });
}

function closestTarget(game: Game) {
  if (game.phase === "boss" || game.phase === "boss-delay") return game.boss;
  let best: Enemy | null = null;
  let bestDistance = Infinity;
  for (const enemy of game.enemies) {
    const current = distance(game.player, enemy);
    if (current < bestDistance) { best = enemy; bestDistance = current; }
  }
  return best;
}

function firePlayer(game: Game) {
  const target = closestTarget(game);
  if (!target) return;
  const baseAngle = Math.atan2(target.y - game.player.y, target.x - game.player.x);
  const count = game.build.projectileCount;
  for (let index = 0; index < count; index += 1) {
    const offset = count === 1 ? 0 : (index - (count - 1) / 2) * game.build.spread;
    const angle = baseAngle + offset;
    const critical = Math.random() < game.build.critChance;
    game.shots.push({
      x: game.player.x,
      y: game.player.y,
      vx: Math.cos(angle) * game.build.projectileSpeed,
      vy: Math.sin(angle) * game.build.projectileSpeed,
      radius: critical ? 5.5 : 4,
      damage: Math.round(game.build.damage * (critical ? 1.8 : 1)),
      pierce: game.build.pierce,
      hostile: false,
      life: 2.4,
    });
  }
}

function spawnEnemy(game: Game) {
  const side = Math.floor(Math.random() * 4);
  const padding = 28;
  let x = Math.random() * game.width;
  let y = Math.random() * game.height;
  if (side === 0) y = -padding;
  if (side === 1) x = game.width + padding;
  if (side === 2) y = game.height + padding;
  if (side === 3) x = -padding;
  const progress = game.spawned / HORDE_TOTAL;
  const roll = Math.random();
  const kind = roll < .13 + progress * .16 ? 3 : roll < .28 + progress * .22 ? 2 : roll < .58 ? 1 : 0;
  const hpBase = 16 + game.build.level * 2.15 + progress * 17;
  const hpMultiplier = kind === 2 ? 2.35 : kind === 3 ? 1.35 : kind === 1 ? .78 : 1;
  const maxHp = Math.round(hpBase * hpMultiplier);
  const radius = kind === 2 ? 18 : kind === 3 ? 13 : kind === 1 ? 9 : 12;
  const speed = kind === 2 ? 35 : kind === 3 ? 48 : kind === 1 ? 84 : 55;
  game.enemies.push({ id: game.enemyId++, x, y, hp: maxHp, maxHp, radius, speed: speed + Math.random() * 13, kind, shotClock: .9 + Math.random() * 1.2, strafe: Math.random() > .5 ? 1 : -1 });
  game.spawned += 1;
}

function fireBossPattern(game: Game) {
  const intensity = game.intensity;
  const speed = 112 + intensity * 15;
  const pattern = game.bossPattern % 3;
  if (pattern === 0) {
    const count = 22 + intensity * 4;
    const rotation = game.elapsed * .32;
    for (let index = 0; index < count; index += 1) {
      const angle = rotation + (Math.PI * 2 * index) / count;
      game.shots.push({ x: game.boss.x, y: game.boss.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: 5.2, damage: 8 + intensity, pierce: 0, hostile: true, life: 8 });
    }
  } else if (pattern === 1) {
    const base = Math.atan2(game.player.y - game.boss.y, game.player.x - game.boss.x);
    const count = 11 + intensity * 2;
    for (let index = 0; index < count; index += 1) {
      const angle = base + (index - (count - 1) / 2) * .09;
      game.shots.push({ x: game.boss.x, y: game.boss.y, vx: Math.cos(angle) * speed * 1.08, vy: Math.sin(angle) * speed * 1.08, radius: 5.5, damage: 9 + intensity, pierce: 0, hostile: true, life: 8 });
    }
  } else {
    const count = 16 + intensity * 3;
    const rotation = game.phaseClock * .85;
    for (let index = 0; index < count; index += 1) {
      const arm = index % 2 ? Math.PI : 0;
      const angle = rotation + arm + Math.floor(index / 2) * .21;
      const variedSpeed = speed * (.72 + (index % 4) * .09);
      game.shots.push({ x: game.boss.x, y: game.boss.y, vx: Math.cos(angle) * variedSpeed, vy: Math.sin(angle) * variedSpeed, radius: 4.8, damage: 8 + intensity, pierce: 0, hostile: true, life: 9 });
    }
  }
  game.bossPattern += 1;
}

function drawGame(ctx: CanvasRenderingContext2D, game: Game, portrait: HTMLImageElement | null) {
  const { width, height } = game;
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createRadialGradient(width * .5, height * .44, 20, width * .5, height * .5, width * .72);
  gradient.addColorStop(0, "rgba(88, 49, 105, .34)");
  gradient.addColorStop(.54, "rgba(24, 20, 29, .94)");
  gradient.addColorStop(1, "#0c0a0f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(212, 168, 102, .075)";
  ctx.lineWidth = 1;
  for (let x = 28; x < width; x += 52) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 24; y < height; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  ctx.strokeStyle = "rgba(218, 180, 112, .15)";
  ctx.strokeRect(18, 18, width - 36, height - 36);

  for (const fragment of game.fragments) {
    const pulse = 1 + Math.sin(game.elapsed * 4 + fragment.pulse) * .22;
    ctx.save();
    ctx.translate(fragment.x, fragment.y);
    ctx.rotate(Math.PI / 4 + game.elapsed * .5);
    ctx.shadowBlur = 18;
    ctx.shadowColor = "#d8a9f4";
    ctx.fillStyle = "#d8a9f4";
    ctx.fillRect(-4 * pulse, -4 * pulse, 8 * pulse, 8 * pulse);
    ctx.restore();
  }

  for (const shot of game.shots) {
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
    ctx.shadowBlur = 14;
    ctx.shadowColor = shot.hostile ? "#ea647b" : game.build.accent;
    ctx.fillStyle = shot.hostile ? "#f28a9b" : game.build.accent;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  for (const enemy of game.enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(game.elapsed * (enemy.kind % 2 ? -.5 : .5));
    ctx.fillStyle = enemy.kind === 3 ? "#263b4f" : enemy.kind === 2 ? "#6d394b" : enemy.kind === 1 ? "#4e385b" : "#302b37";
    ctx.strokeStyle = enemy.kind === 3 ? "#7ec5e8" : enemy.kind === 2 ? "#df7588" : "#aa8ac0";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const px = Math.cos(angle) * enemy.radius;
      const py = Math.sin(angle) * enemy.radius;
      index ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(enemy.x - 13, enemy.y - enemy.radius - 8, 26, 3);
    ctx.fillStyle = "#c9798b"; ctx.fillRect(enemy.x - 13, enemy.y - enemy.radius - 8, 26 * (enemy.hp / enemy.maxHp), 3);
  }

  if (["boss-intro", "boss-delay", "boss"].includes(game.phase)) {
    const boss = game.boss;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(game.elapsed * .1);
    ctx.shadowBlur = 42;
    ctx.shadowColor = "rgba(187, 102, 139, .72)";
    ctx.strokeStyle = "#d89ab4";
    ctx.lineWidth = 2;
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.beginPath();
      const points = 8 + ring * 2;
      const radius = boss.radius + ring * 13;
      for (let index = 0; index < points; index += 1) {
        const angle = (Math.PI * 2 * index) / points;
        const varied = radius + (index % 2 ? -7 : 5);
        const px = Math.cos(angle) * varied;
        const py = Math.sin(angle) * varied;
        index ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    }
    ctx.rotate(-game.elapsed * .2);
    ctx.fillStyle = "#171018";
    ctx.beginPath(); ctx.arc(0, 0, boss.radius - 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ead5df";
    ctx.font = "700 27px Georgia";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("O", 0, 1);
    ctx.restore();
  }

  const player = game.player;
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.globalAlpha = player.invulnerable > 0 && Math.floor(player.invulnerable * 12) % 2 ? .35 : 1;
  ctx.shadowBlur = 24; ctx.shadowColor = game.build.accent;
  ctx.fillStyle = "#17131b"; ctx.strokeStyle = game.build.accent; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  if (portrait?.complete && portrait.naturalWidth) {
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, player.radius - 3, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(portrait, -player.radius, -player.radius, player.radius * 2, player.radius * 2); ctx.restore();
  } else {
    ctx.fillStyle = game.build.accent; ctx.font = "700 17px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(game.build.name[0]?.toUpperCase() ?? "A", 0, 1);
  }
  ctx.restore();

  for (const item of game.floats) {
    ctx.globalAlpha = clamp(item.life / .8, 0, 1);
    ctx.fillStyle = item.color; ctx.font = "700 13px Georgia"; ctx.textAlign = "center";
    ctx.fillText(item.text, item.x, item.y - (1 - item.life / .8) * 28);
  }
  ctx.globalAlpha = 1;
}

export function BossRush({ characters }: { characters: BossRushCharacter[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [characterKey, setCharacterKey] = useState(characters[0]?.key ?? "current");
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [paused, setPaused] = useState(false);
  const [cards, setCards] = useState<ShopCard[]>([]);
  const [hud, setHud] = useState({ hp: 0, maxHp: 1, armorClass: 10, killed: 0, spawned: 0, fragments: 0, points: 0, bossHp: 0, bossMaxHp: 1, elapsed: 0, intensity: 0, shopRerolls: 0, cardsTaken: [] as RewardCard[] });
  const selectedCharacter = useMemo(() => characters.find((entry) => entry.key === characterKey) ?? characters[0], [characterKey, characters]);
  const previewBuild = useMemo(() => selectedCharacter ? characterToBuild(selectedCharacter) : null, [selectedCharacter]);

  const transition = (game: Game, next: RunPhase) => {
    game.phase = next;
    game.phaseClock = 0;
    if (next === "boss") game.bossShotClock = 1.15;
    setPhase(next);
  };

  const snapshotHud = (game: Game) => ({ hp: Math.ceil(game.build.hp), maxHp: game.build.maxHp, armorClass: game.build.armorClass, killed: game.killed, spawned: game.spawned, fragments: game.collected, points: game.points, bossHp: Math.ceil(game.boss.hp), bossMaxHp: game.boss.maxHp, elapsed: game.elapsed, intensity: game.intensity, shopRerolls: game.shopRerolls, cardsTaken: [...game.cardsTaken] });

  const startRun = () => {
    if (!selectedCharacter) return;
    setCards([]);
    setPaused(false);
    setPhase("horde");
    setRunId((value) => value + 1);
  };

  const buyCard = (card: ShopCard) => {
    const game = gameRef.current;
    if (!game || game.phase !== "shop" || game.points < card.price) return;
    game.points -= card.price;
    card.apply(game.build);
    game.cardsTaken.push(card);
    setCards((current) => current.filter((offer) => offer.id !== card.id));
    setHud(snapshotHud(game));
  };

  const rerollShop = () => {
    const game = gameRef.current;
    if (!game || game.phase !== "shop") return;
    const cost = 12 + game.shopRerolls * 8;
    if (game.points < cost) return;
    game.points -= cost;
    game.shopRerolls += 1;
    setCards(createChoices(game));
    setHud(snapshotHud(game));
  };

  const faceBoss = () => {
    const game = gameRef.current;
    if (!game || game.phase !== "shop") return;
    setCards([]);
    transition(game, "boss-intro");
  };

  const setTouchKey = (key: string, active: boolean) => {
    const game = gameRef.current;
    if (!game) return;
    if (active) game.keys.add(key); else game.keys.delete(key);
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("bossRushTest") !== "1") return;
    let primed = false;
    const handle = window.setInterval(() => {
      const game = gameRef.current;
      if (!game || game.phase !== "horde") return;
      if (!primed) {
        game.spawned = HORDE_TOTAL;
        game.killed = HORDE_TOTAL - game.enemies.length;
        primed = true;
      }
      for (const enemy of game.enemies) enemy.hp = 0;
      if (!game.enemies.length) {
        game.fragments = [];
        game.collected = 225;
        game.points = 225;
        game.hordeClearedAt = 1.55;
        window.clearInterval(handle);
      }
    }, 120);
    return () => window.clearInterval(handle);
  }, [runId]);

  useEffect(() => {
    if (!runId || !selectedCharacter || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;
    const build = characterToBuild(selectedCharacter);
    const game: Game = {
      phase: "horde", width: 900, height: 560,
      player: { x: 450, y: 450, radius: 17, invulnerable: 0 },
      boss: { x: 450, y: 180, radius: 38, hp: 1750 + build.level * 120, maxHp: 1750 + build.level * 120 },
      build, enemies: [], shots: [], fragments: [], floats: [], keys: new Set(),
      killed: 0, spawned: 0, collected: 0, points: 0, cardsTaken: [], shopRerolls: 0,
      elapsed: 0, phaseClock: 0, spawnClock: 0, playerShotClock: 0, bossShotClock: 0,
      bossPattern: 0, enemyId: 1, fragmentId: 1, floatId: 1, paused: false, lastTime: performance.now(), hordeClearedAt: 0, intensity: 0,
    };
    gameRef.current = game;
    setPhase("horde");
    const portrait = build.portrait ? new Image() : null;
    if (portrait) portrait.src = build.portrait;
    let frame = 0;
    let hudClock = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      game.width = Math.max(320, rect.width);
      game.height = Math.max(390, rect.height);
      canvas.width = Math.round(game.width * ratio);
      canvas.height = Math.round(game.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      game.player.x = clamp(game.player.x, 28, game.width - 28);
      game.player.y = clamp(game.player.y, 28, game.height - 28);
      game.boss.x = game.width / 2;
      game.boss.y = Math.max(110, game.height * .28);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const keydown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D", "p", "P"].includes(event.key)) event.preventDefault();
      if (event.key.toLowerCase() === "p") { game.paused = !game.paused; setPaused(game.paused); }
      game.keys.add(event.key.toLowerCase());
    };
    const keyup = (event: KeyboardEvent) => game.keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", keydown, { passive: false });
    window.addEventListener("keyup", keyup);

    const damagePlayer = (amount: number) => {
      if (game.player.invulnerable > 0) return;
      const mitigation = Math.max(0, Math.floor((game.build.armorClass - 10) / 3));
      const damage = Math.max(1, Math.round(amount - mitigation));
      game.build.hp = Math.max(0, game.build.hp - damage);
      game.player.invulnerable = .5;
      addFloat(game, game.player.x, game.player.y - 18, `−${damage}`, "#f18a9c");
      if (game.build.hp <= 0) transition(game, "defeat");
    };

    const update = (delta: number) => {
      if (["idle", "shop", "victory", "defeat"].includes(game.phase)) return;
      game.elapsed += delta;
      game.phaseClock += delta;
      if (game.phase === "boss-intro" && game.phaseClock >= INTRO_SECONDS) transition(game, "boss-delay");
      if (game.phase === "boss-delay" && game.phaseClock >= BOSS_GRACE_SECONDS) transition(game, "boss");
      if (game.paused) return;
      game.player.invulnerable = Math.max(0, game.player.invulnerable - delta);
      // Durante a apresentação tudo congela. No breve respiro seguinte o herói
      // já pode se mover e atacar, mas o chefe ainda não dispara.
      const combatUnlocked = game.phase === "horde" || game.phase === "boss-delay" || game.phase === "boss";

      if (combatUnlocked) {
        let dx = 0; let dy = 0;
        if (game.keys.has("a") || game.keys.has("arrowleft")) dx -= 1;
        if (game.keys.has("d") || game.keys.has("arrowright")) dx += 1;
        if (game.keys.has("w") || game.keys.has("arrowup")) dy -= 1;
        if (game.keys.has("s") || game.keys.has("arrowdown")) dy += 1;
        if (dx || dy) {
          const length = Math.hypot(dx, dy);
          const controlledSpeed = game.build.moveSpeed * .82;
          game.player.x += (dx / length) * controlledSpeed * delta;
          game.player.y += (dy / length) * controlledSpeed * delta;
        }
        game.player.x = clamp(game.player.x, 24, game.width - 24);
        game.player.y = clamp(game.player.y, 24, game.height - 24);
        game.playerShotClock -= delta;
        if (game.playerShotClock <= 0 && closestTarget(game)) {
          firePlayer(game);
          game.playerShotClock = game.build.shotInterval;
        }
      }

      if (game.phase === "horde") {
        game.spawnClock -= delta;
        const hordePressure = game.spawned / HORDE_TOTAL;
        const onFieldLimit = 14 + Math.floor(hordePressure * 12);
        if (game.spawned < HORDE_TOTAL && game.spawnClock <= 0 && game.enemies.length < onFieldLimit) {
          const batch = game.spawned > 78 ? 4 : game.spawned > 42 ? 3 : 2;
          for (let count = 0; count < batch && game.spawned < HORDE_TOTAL; count += 1) spawnEnemy(game);
          game.spawnClock = Math.max(.14, .44 - game.spawned * .0028);
        }
        for (const enemy of game.enemies) {
          const angle = Math.atan2(game.player.y - enemy.y, game.player.x - enemy.x);
          const gap = distance(enemy, game.player);
          if (enemy.kind === 3) {
            const advance = gap > 275 ? 1 : gap < 155 ? -.82 : 0;
            enemy.x += (Math.cos(angle) * advance + Math.cos(angle + Math.PI / 2) * enemy.strafe * .58) * enemy.speed * delta;
            enemy.y += (Math.sin(angle) * advance + Math.sin(angle + Math.PI / 2) * enemy.strafe * .58) * enemy.speed * delta;
            enemy.shotClock -= delta;
            if (enemy.shotClock <= 0) {
              const count = game.spawned > 70 ? 5 : 3;
              const projectileSpeed = 145 + hordePressure * 42;
              for (let index = 0; index < count; index += 1) {
                const shotAngle = angle + (index - (count - 1) / 2) * .13;
                game.shots.push({ x: enemy.x, y: enemy.y, vx: Math.cos(shotAngle) * projectileSpeed, vy: Math.sin(shotAngle) * projectileSpeed, radius: 4.8, damage: 9 + Math.floor(hordePressure * 5), pierce: 0, hostile: true, life: 5 });
              }
              enemy.shotClock = Math.max(.72, 1.65 - hordePressure * .55) + Math.random() * .35;
            }
          } else {
            enemy.x += Math.cos(angle) * enemy.speed * delta;
            enemy.y += Math.sin(angle) * enemy.speed * delta;
          }
          if (gap < enemy.radius + game.player.radius) damagePlayer(enemy.kind === 2 ? 20 : enemy.kind === 1 ? 12 : enemy.kind === 3 ? 14 : 15);
        }
        if (game.killed >= HORDE_TOTAL && !game.enemies.length) {
          game.hordeClearedAt += delta;
          game.build.magnet = Math.max(game.build.magnet, 2000);
          if (game.hordeClearedAt > 1.6 && !game.fragments.length) {
            transition(game, "shop");
            setHud(snapshotHud(game));
            setCards(createChoices(game));
          }
        }
      }

      if (game.phase === "boss") {
        game.intensity = Math.min(9, Math.floor(game.phaseClock / 8));
        game.boss.x = game.width / 2 + Math.sin(game.phaseClock * .52) * Math.min(145, game.width * .17);
        game.boss.y = Math.max(105, game.height * .25) + Math.cos(game.phaseClock * .37) * 36;
        game.bossShotClock -= delta;
        const interval = Math.max(.58, 1.82 - game.intensity * .14);
        if (game.bossShotClock <= 0) { fireBossPattern(game); game.bossShotClock = interval; }
      }

      for (const fragment of game.fragments) {
        const gap = distance(fragment, game.player);
        if (gap < game.build.magnet) {
          const angle = Math.atan2(game.player.y - fragment.y, game.player.x - fragment.x);
          const pull = 90 + (game.build.magnet - gap) * 2.4;
          fragment.x += Math.cos(angle) * pull * delta;
          fragment.y += Math.sin(angle) * pull * delta;
        }
      }
      const collectedNow = game.fragments.filter((fragment) => distance(fragment, game.player) < game.player.radius + 8);
      if (collectedNow.length) {
        const ids = new Set(collectedNow.map((fragment) => fragment.id));
        game.fragments = game.fragments.filter((fragment) => !ids.has(fragment.id));
        const gained = collectedNow.reduce((total, fragment) => total + fragment.value, 0);
        game.collected += gained;
        game.points += gained;
        addFloat(game, game.player.x, game.player.y - 26, `+${gained} pts`, "#d8a9f4");
      }

      for (const shot of game.shots) {
        shot.x += shot.vx * delta; shot.y += shot.vy * delta; shot.life -= delta;
        if (shot.hostile) {
          if (distance(shot, game.player) < shot.radius + game.player.radius) { shot.life = 0; damagePlayer(shot.damage); }
          continue;
        }
        if (game.phase === "boss" && distance(shot, game.boss) < shot.radius + game.boss.radius) {
          game.boss.hp = Math.max(0, game.boss.hp - shot.damage);
          addFloat(game, game.boss.x, game.boss.y - 35, `−${shot.damage}`, game.build.accent);
          shot.life = shot.pierce > 0 ? shot.life : 0; shot.pierce -= 1;
          if (game.boss.hp <= 0) { game.shots = []; transition(game, "victory"); }
        }
        if (game.phase === "horde") {
          for (const enemy of game.enemies) {
            if (enemy.hp > 0 && distance(shot, enemy) < shot.radius + enemy.radius) {
              enemy.hp -= shot.damage;
              addFloat(game, enemy.x, enemy.y - 12, `−${shot.damage}`, game.build.accent);
              if (shot.pierce > 0) shot.pierce -= 1; else shot.life = 0;
              break;
            }
          }
        }
      }
      const defeated = game.enemies.filter((enemy) => enemy.hp <= 0);
      if (defeated.length) {
        for (const enemy of defeated) {
          const value = enemy.kind === 2 ? 4 : enemy.kind === 3 ? 3 : 2;
          game.fragments.push({ id: game.fragmentId++, x: enemy.x, y: enemy.y, pulse: Math.random() * Math.PI * 2, value });
          game.killed += 1;
          if (game.build.sustain && game.killed % 10 === 0) {
            const heal = game.build.sustain;
            game.build.hp = Math.min(game.build.maxHp, game.build.hp + heal);
            addFloat(game, game.player.x, game.player.y, `+${heal}`, "#83d5a4");
          }
        }
        game.enemies = game.enemies.filter((enemy) => enemy.hp > 0);
      }
      game.shots = game.shots.filter((shot) => shot.life > 0 && shot.x > -80 && shot.x < game.width + 80 && shot.y > -80 && shot.y < game.height + 80);
      for (const item of game.floats) item.life -= delta;
      game.floats = game.floats.filter((item) => item.life > 0);
    };

    const loop = (time: number) => {
      const delta = Math.min(.033, (time - game.lastTime) / 1000);
      game.lastTime = time;
      update(delta);
      drawGame(context, game, portrait);
      hudClock += delta;
      if (hudClock > .09) {
        hudClock = 0;
        setHud(snapshotHud(game));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup);
      if (gameRef.current === game) gameRef.current = null;
    };
  // A ficha é lida no início da incursão. Atualizações cosméticas do pai não
  // devem reiniciar silenciosamente o motor durante uma partida.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, characterKey]);

  if (!selectedCharacter || !previewBuild) return null;
  const phaseLabel: Record<RunPhase, string> = {
    idle: "Aguardando incursão", horde: "Horda da Cripta", shop: "Mercado dos Fragmentos", "boss-intro": "Uma presença desperta", "boss-delay": "Prepare-se", boss: "Confronto final", victory: "Chefe derrotado", defeat: "Incursão encerrada",
  };
  const timer = `${Math.floor(hud.elapsed / 60).toString().padStart(2, "0")}:${Math.floor(hud.elapsed % 60).toString().padStart(2, "0")}`;
  const running = !["idle", "victory", "defeat"].includes(phase);
  const rerollCost = 12 + hud.shopRerolls * 8;

  return (
    <div className="boss-rush">
      <header className="boss-rush-head">
        <div>
          <span className="eyebrow"><Crown size={14} /> Arcana · Boss Rush</span>
          <h1>A Cripta da Fome</h1>
          <p>Uma fase única e impiedosa: sobreviva à horda, compre sua build e enfrente o Ossário Coroado.</p>
        </div>
        <div className="boss-rush-actions">
          <label>Herói<select value={characterKey} disabled={running} onChange={(event) => setCharacterKey(event.target.value)}>{characters.map((entry) => <option value={entry.key} key={entry.key}>{entry.key === "current" ? "Ficha aberta" : "Mestre"} · {entry.name || "Sem nome"}</option>)}</select></label>
          {running && phase !== "shop" && <button className="ghost-button" onClick={() => { const game = gameRef.current; if (game) { game.paused = !game.paused; setPaused(game.paused); } }}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? "Continuar" : "Pausar"}</button>}
          <button className="primary-button" onClick={startRun}>{phase === "idle" ? <Play size={16} /> : <RotateCcw size={16} />}{phase === "idle" ? "Iniciar incursão" : "Recomeçar"}</button>
        </div>
      </header>

      <div className="boss-rush-hud">
        <div className="br-hero-card"><div className="br-portrait">{selectedCharacter.portrait ? <img src={selectedCharacter.portrait} alt="" /> : <span>{selectedCharacter.name?.[0] || "A"}</span>}</div><div><small>{selectedCharacter.className} · nível {selectedCharacter.level}</small><strong>{selectedCharacter.name || "Aventureiro"}</strong><div className="br-hp"><i style={{ width: `${clamp((hud.hp || previewBuild.hp) / (hud.maxHp || previewBuild.maxHp) * 100, 0, 100)}%` }} /></div><span>{phase === "idle" ? previewBuild.hp : hud.hp}/{phase === "idle" ? previewBuild.maxHp : hud.maxHp} PV</span></div></div>
        <div className="br-hud-stat"><Shield size={17} /><span>CA<strong>{phase === "idle" ? previewBuild.armorClass : hud.armorClass}</strong></span></div>
        <div className="br-hud-stat"><Swords size={17} /><span>Ataque<strong>{previewBuild.attackName}</strong></span></div>
        <div className="br-hud-stat"><Gem size={17} /><span>Pontos<strong>{phase === "idle" ? 0 : hud.points}</strong></span></div>
        <div className="br-hud-stat"><Timer size={17} /><span>Tempo<strong>{timer}</strong></span></div>
      </div>

      <div className="boss-rush-stage">
        <canvas ref={canvasRef} tabIndex={0} aria-label="Arena jogável. Use WASD ou as setas para mover o personagem." />
        {phase === "idle" && <div className="br-overlay intro"><span className="br-rune">I</span><small>FASE ÚNICA · CRIPTA DA FOME</small><h2>Cem criaturas esperam no escuro.</h2><p>Esta incursão foi feita para ser brutal. O ataque mira automaticamente; mova-se com <kbd>WASD</kbd> ou as setas, recolha fragmentos e gaste seus pontos antes do chefe.</p><div className="br-class-trait"><Sparkles size={17} /><span><strong>{previewBuild.className} · {previewBuild.attackName}</strong>{previewBuild.trait}</span></div><button className="primary-button" onClick={startRun}><Play size={17} /> Começar</button></div>}
        {phase === "boss-intro" && <div className="br-boss-title"><small>GUARDIÃO DA CRIPTA</small><h2>Ossário Coroado</h2><span>Mil ossos se ajoelham para formar um único rei.</span></div>}
        {phase === "boss-delay" && <div className="br-boss-title compact"><small>PREPARE-SE</small><h2>O primeiro padrão está se formando.</h2></div>}
        {phase === "victory" && <div className="br-overlay result"><Crown size={34} /><small>INCURSÃO CONCLUÍDA</small><h2>Ossário Coroado derrotado.</h2><p>Você venceu a fase única com {hud.hp} PV, coletou {hud.fragments} pontos e guardou {hud.points} sem gastar.</p><button className="primary-button" onClick={startRun}><RotateCcw size={16} /> Jogar novamente</button></div>}
        {phase === "defeat" && <div className="br-overlay result defeat"><Heart size={34} /><small>A CRIPTA COBROU SEU PREÇO</small><h2>A ficha sobrevive. A incursão, não.</h2><p>Os dados reais do personagem não foram alterados.</p><button className="primary-button" onClick={startRun}><RotateCcw size={16} /> Tentar novamente</button></div>}
        <div className="br-touch" aria-label="Controles de movimento"><button onPointerDown={() => setTouchKey("w", true)} onPointerUp={() => setTouchKey("w", false)} onPointerLeave={() => setTouchKey("w", false)}>↑</button><button onPointerDown={() => setTouchKey("a", true)} onPointerUp={() => setTouchKey("a", false)} onPointerLeave={() => setTouchKey("a", false)}>←</button><button onPointerDown={() => setTouchKey("s", true)} onPointerUp={() => setTouchKey("s", false)} onPointerLeave={() => setTouchKey("s", false)}>↓</button><button onPointerDown={() => setTouchKey("d", true)} onPointerUp={() => setTouchKey("d", false)} onPointerLeave={() => setTouchKey("d", false)}>→</button></div>
      </div>

      <div className="br-progress-strip">
        <div><span>{phaseLabel[phase]}</span><strong>{phase === "horde" ? `${hud.killed}/${HORDE_TOTAL} criaturas` : phase === "boss" ? `Intensidade ${hud.intensity + 1}` : phaseLabel[phase]}</strong></div>
        <div className="br-stage-progress"><i style={{ width: `${phase === "horde" ? hud.killed : phase === "boss" ? (1 - hud.bossHp / hud.bossMaxHp) * 100 : phase === "victory" ? 100 : 0}%` }} /></div>
        {phase === "boss" && <div className="br-boss-hp"><span>Ossário Coroado</span><strong>{hud.bossHp}/{hud.bossMaxHp}</strong></div>}
      </div>

      {phase === "shop" && <section className="br-card-draft br-shop"><div className="br-draft-title"><div><span className="eyebrow"><Gem size={14} /> Mercado dos Fragmentos</span><h2>Sobreviver não lhe deu nada. Deu-lhe poder de compra.</h2><p>Você tem <strong>{hud.points} pontos</strong>. Compre quantas alterações puder, atualize as ofertas ou enfrente o chefe agora. O saldo vale apenas nesta incursão.</p></div><div className="br-shop-actions"><button className="ghost-button" disabled={hud.points < rerollCost} onClick={rerollShop}><RotateCcw size={15} /> Atualizar · {rerollCost} pts</button><button className="primary-button" onClick={faceBoss}><Swords size={15} /> Enfrentar o chefe</button></div></div><div className="br-cards">{cards.map((card) => <button disabled={hud.points < card.price} className={`br-reward-card ${card.rarity}`} key={card.id} onClick={() => buyCard(card)}><span>{card.rarity === "normal" ? "NORMAL" : card.rarity === "rare" ? "RARO" : "LENDÁRIO"}</span><Sparkles size={22} /><strong>{card.name}</strong><p>{card.description}</p><small>{hud.points < card.price ? `Faltam ${card.price - hud.points} pts` : `Comprar · ${card.price} pts`}</small></button>)}</div></section>}

      <div className="br-run-footer">
        <div><span className="eyebrow">Rota da fase única</span><ol><li className={phase !== "idle" ? "done" : "active"}><b>01</b><span>Horda extrema<small>100 criaturas</small></span></li><li className={["shop", "boss-intro", "boss-delay", "boss", "victory"].includes(phase) ? "done" : ""}><b>02</b><span>Mercado<small>Gaste seus pontos</small></span></li><li className={["boss-intro", "boss-delay", "boss", "victory"].includes(phase) ? "active" : ""}><b>03</b><span>Chefe extremo<small>Ossário Coroado</small></span></li></ol></div>
        <div className="br-picked"><span className="eyebrow">Build desta incursão</span>{hud.cardsTaken.length ? <div>{hud.cardsTaken.map((card, index) => <span className={card.rarity} key={`${card.id}-${index}`}>{card.name}</span>)}</div> : <p>Nenhuma carta escolhida ainda.</p>}</div>
      </div>
    </div>
  );
}
