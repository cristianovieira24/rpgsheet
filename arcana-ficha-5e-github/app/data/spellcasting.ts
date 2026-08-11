export type SpellcastingRow = {
  level: number;
  cantrips: number | null;
  prepared: number | null;
  slots: number[];
  pactSlots: number;
  pactLevel: number;
  note: string;
};

export type SpellcastingProfile = {
  id: string;
  label: string;
  edition: "2024" | "2014" | "custom";
  source: string;
  kind: "full" | "half" | "third" | "pact" | "none";
  preparedLabel: string;
  description: string;
  rows: SpellcastingRow[];
};

const zeroSlots = () => Array(9).fill(0) as number[];
const slots = (...values: number[]) => [...values, ...Array(Math.max(0, 9 - values.length)).fill(0)].slice(0, 9);

// Progressão compartilhada por Bardos, Clérigos, Druidas, Feiticeiros e Magos.
const fullSlots = [
  slots(2), slots(3), slots(4, 2), slots(4, 3), slots(4, 3, 2),
  slots(4, 3, 3), slots(4, 3, 3, 1), slots(4, 3, 3, 2), slots(4, 3, 3, 3, 1), slots(4, 3, 3, 3, 2),
  slots(4, 3, 3, 3, 2, 1), slots(4, 3, 3, 3, 2, 1), slots(4, 3, 3, 3, 2, 1, 1), slots(4, 3, 3, 3, 2, 1, 1),
  slots(4, 3, 3, 3, 2, 1, 1, 1), slots(4, 3, 3, 3, 2, 1, 1, 1), slots(4, 3, 3, 3, 2, 1, 1, 1, 1),
  slots(4, 3, 3, 3, 3, 1, 1, 1, 1), slots(4, 3, 3, 3, 3, 2, 1, 1, 1), slots(4, 3, 3, 3, 3, 2, 2, 1, 1),
];

const half2014Slots = [
  zeroSlots(), slots(2), slots(3), slots(3), slots(4, 2), slots(4, 2), slots(4, 3), slots(4, 3), slots(4, 3, 2), slots(4, 3, 2),
  slots(4, 3, 3), slots(4, 3, 3), slots(4, 3, 3, 1), slots(4, 3, 3, 1), slots(4, 3, 3, 2), slots(4, 3, 3, 2),
  slots(4, 3, 3, 3, 1), slots(4, 3, 3, 3, 1), slots(4, 3, 3, 3, 2), slots(4, 3, 3, 3, 2),
];

const half2024Slots = [
  slots(2), slots(2), slots(3), slots(3), slots(4, 2), slots(4, 2), slots(4, 3), slots(4, 3), slots(4, 3, 2), slots(4, 3, 2),
  slots(4, 3, 3), slots(4, 3, 3), slots(4, 3, 3, 1), slots(4, 3, 3, 1), slots(4, 3, 3, 2), slots(4, 3, 3, 2),
  slots(4, 3, 3, 3, 1), slots(4, 3, 3, 3, 1), slots(4, 3, 3, 3, 2), slots(4, 3, 3, 3, 2),
];

const thirdSlots = [
  zeroSlots(), zeroSlots(), slots(2), slots(3), slots(3), slots(3), slots(4, 2), slots(4, 2), slots(4, 2), slots(4, 3),
  slots(4, 3), slots(4, 3), slots(4, 3, 2), slots(4, 3, 2), slots(4, 3, 2), slots(4, 3, 3), slots(4, 3, 3),
  slots(4, 3, 3), slots(4, 3, 3, 1), slots(4, 3, 3, 1),
];

const standardPrepared2024 = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
const wizardPrepared2024 = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25];
const sorcererPrepared2024 = [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22];
const halfPrepared2024 = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15];
const bardKnown2014 = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22];
const sorcererKnown2014 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15];
const rangerKnown2014 = [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11];
const warlockKnown2014 = [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15];
const thirdCasterSpells = [null, null, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13] as Array<number | null>;

const cantripTrack = (start: number) => Array.from({ length: 20 }, (_, index) => start + (index >= 3 ? 1 : 0) + (index >= 9 ? 1 : 0));
const thirdCantripTrack = (start: number) => Array.from({ length: 20 }, (_, index) => index < 2 ? null : start + (index >= 9 ? 1 : 0));
const noCantrips = Array(20).fill(null) as Array<number | null>;

function rowsFrom(
  slotTable: number[][],
  cantrips: Array<number | null>,
  prepared: Array<number | null>,
  note: string | ((level: number) => string) = "",
): SpellcastingRow[] {
  return Array.from({ length: 20 }, (_, index) => ({
    level: index + 1,
    cantrips: cantrips[index] ?? null,
    prepared: prepared[index] ?? null,
    slots: [...(slotTable[index] ?? zeroSlots())],
    pactSlots: 0,
    pactLevel: 0,
    note: typeof note === "function" ? note(index + 1) : note,
  }));
}

function fullProfile(
  id: string,
  label: string,
  edition: "2024" | "2014",
  cantrips: Array<number | null>,
  prepared: Array<number | null>,
  preparedLabel: string,
  description: string,
): SpellcastingProfile {
  return { id, label, edition, source: edition === "2024" ? "Livro do Jogador 2024" : "Livro do Jogador 2014", kind: "full", preparedLabel, description, rows: rowsFrom(fullSlots, cantrips, prepared) };
}

const pactRows = (edition: "2024" | "2014"): SpellcastingRow[] => {
  const slotCount = [1,2,2,2,2,2,2,2,2,2,3,3,3,3,3,4,4,4,4,4];
  const slotLevel = [1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5];
  const prepared2024 = [2,3,4,5,6,7,8,9,10,10,11,11,12,12,13,13,14,14,15,15];
  return Array.from({ length: 20 }, (_, index) => ({
    level: index + 1,
    cantrips: cantripTrack(2)[index],
    prepared: edition === "2024" ? prepared2024[index] : warlockKnown2014[index],
    slots: zeroSlots(),
    pactSlots: slotCount[index],
    pactLevel: slotLevel[index],
    note: index + 1 >= 17 ? "Arcano Místico: 6º, 7º, 8º e 9º círculos."
      : index + 1 >= 15 ? "Arcano Místico: 6º, 7º e 8º círculos."
      : index + 1 >= 13 ? "Arcano Místico: 6º e 7º círculos."
      : index + 1 >= 11 ? "Arcano Místico: uma magia de 6º círculo sem espaço de pacto."
      : "Espaços de Pacto retornam após Descanso Curto ou Longo.",
  }));
};

export const spellcastingProfiles: SpellcastingProfile[] = [
  fullProfile("bard-2024", "Bardo 2024", "2024", cantripTrack(2), standardPrepared2024, "Preparadas", "Conjurador completo. A lista preparada cresce pela tabela da classe."),
  fullProfile("cleric-2024", "Clérigo 2024", "2024", cantripTrack(3), standardPrepared2024, "Preparadas", "Conjurador completo. Magias de domínio sempre preparadas não contam neste limite."),
  fullProfile("druid-2024", "Druida 2024", "2024", cantripTrack(2), standardPrepared2024, "Preparadas", "Conjurador completo. Magias sempre preparadas por outras características são adicionais."),
  fullProfile("sorcerer-2024", "Feiticeiro 2024", "2024", cantripTrack(4), sorcererPrepared2024, "Preparadas", "Conjurador completo. A lista começa menor e alcança o ritmo dos demais no nível 3."),
  fullProfile("wizard-2024", "Mago 2024", "2024", cantripTrack(3), wizardPrepared2024, "Preparadas", "Conjurador completo. O grimório começa com seis magias de 1º círculo e recebe duas por nível de Mago após o primeiro."),
  fullProfile("bard-2014", "Bardo 2014", "2014", cantripTrack(2), bardKnown2014, "Conhecidas", "Conjurador completo clássico. Segredos Mágicos já estão incluídos no total indicado pela tabela da classe."),
  fullProfile("cleric-2014", "Clérigo 2014", "2014", cantripTrack(3), noCantrips, "Preparadas por fórmula", "Prepare nível de Clérigo + modificador de Sabedoria, mínimo de uma. Magias de domínio são adicionais."),
  fullProfile("druid-2014", "Druida 2014", "2014", cantripTrack(2), noCantrips, "Preparadas por fórmula", "Prepare nível de Druida + modificador de Sabedoria, mínimo de uma. Magias de círculo são adicionais."),
  fullProfile("sorcerer-2014", "Feiticeiro 2014", "2014", cantripTrack(4), sorcererKnown2014, "Conhecidas", "Conjurador completo clássico com quantidade fixa de magias conhecidas."),
  fullProfile("wizard-2014", "Mago 2014", "2014", cantripTrack(3), noCantrips, "Preparadas por fórmula", "Prepare nível de Mago + modificador de Inteligência. O grimório começa com seis magias e recebe duas por nível."),
  {
    id: "half-2024", label: "Paladino ou Patrulheiro 2024", edition: "2024", source: "Livro do Jogador 2024", kind: "half", preparedLabel: "Preparadas",
    description: "Meio conjurador revisado: recebe Conjuração e dois espaços de 1º círculo já no nível 1.", rows: rowsFrom(half2024Slots, noCantrips, halfPrepared2024),
  },
  {
    id: "paladin-2014", label: "Paladino 2014", edition: "2014", source: "Livro do Jogador 2014", kind: "half", preparedLabel: "Preparadas por fórmula",
    description: "Meio conjurador clássico. A Conjuração começa no nível 2; prepare metade do nível de Paladino, arredondada para baixo, + Carisma.", rows: rowsFrom(half2014Slots, noCantrips, noCantrips),
  },
  {
    id: "ranger-2014", label: "Patrulheiro 2014", edition: "2014", source: "Livro do Jogador 2014", kind: "half", preparedLabel: "Conhecidas",
    description: "Meio conjurador clássico com quantidade fixa de magias conhecidas e Conjuração a partir do nível 2.", rows: rowsFrom(half2014Slots, noCantrips, rangerKnown2014),
  },
  {
    id: "eldritch-knight-2024", label: "Cavaleiro Arcano 2024", edition: "2024", source: "Livro do Jogador 2024", kind: "third", preparedLabel: "Preparadas",
    description: "Progressão de um terço a partir do nível 3. Prepara magias da lista de Mago; a quantidade cresce na tabela da subclasse.", rows: rowsFrom(thirdSlots, thirdCantripTrack(2), thirdCasterSpells),
  },
  {
    id: "arcane-trickster-2024", label: "Trapaceiro Arcano 2024", edition: "2024", source: "Livro do Jogador 2024", kind: "third", preparedLabel: "Preparadas",
    description: "Progressão de um terço a partir do nível 3. Mão Mágica integra o repertório da subclasse, além dos demais truques indicados.", rows: rowsFrom(thirdSlots, thirdCantripTrack(3), thirdCasterSpells),
  },
  {
    id: "eldritch-knight-2014", label: "Cavaleiro Arcano 2014", edition: "2014", source: "Livro do Jogador 2014", kind: "third", preparedLabel: "Conhecidas",
    description: "Progressão clássica de um terço a partir do nível 3, com magias conhecidas e restrições de escola próprias da subclasse.", rows: rowsFrom(thirdSlots, thirdCantripTrack(2), thirdCasterSpells),
  },
  {
    id: "arcane-trickster-2014", label: "Trapaceiro Arcano 2014", edition: "2014", source: "Livro do Jogador 2014", kind: "third", preparedLabel: "Conhecidas",
    description: "Progressão clássica de um terço a partir do nível 3. Mão Mágica é adicional aos dois truques iniciais escolhidos.", rows: rowsFrom(thirdSlots, thirdCantripTrack(3), thirdCasterSpells),
  },
  {
    id: "warlock-2024", label: "Bruxo 2024", edition: "2024", source: "Livro do Jogador 2024", kind: "pact", preparedLabel: "Preparadas",
    description: "Magia de Pacto: poucos espaços, todos do mesmo círculo, recuperados em Descanso Curto ou Longo. Arcanos Místicos são separados.", rows: pactRows("2024"),
  },
  {
    id: "warlock-2014", label: "Bruxo 2014", edition: "2014", source: "Livro do Jogador 2014", kind: "pact", preparedLabel: "Conhecidas",
    description: "Magia de Pacto clássica, com Arcanos Místicos separados nos níveis 11, 13, 15 e 17.", rows: pactRows("2014"),
  },
  {
    id: "none", label: "Sem progressão automática", edition: "custom", source: "Regra da mesa", kind: "none", preparedLabel: "Magias", description: "Use este perfil para personagens sem Conjuração ou para começar uma tabela inteiramente manual.", rows: rowsFrom(Array(20).fill(zeroSlots()), noCantrips, noCantrips),
  },
];

export function automaticSpellcastingProfileId(classId: string, subclassId: string, edition: "2024" | "2014") {
  if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(classId)) return `${classId}-${edition}`;
  if (classId === "warlock") return `warlock-${edition}`;
  if (["paladin", "ranger"].includes(classId)) return edition === "2024" ? "half-2024" : `${classId}-2014`;
  if (["eldritch-knight", "eldritch-knight-2014"].includes(subclassId)) return `eldritch-knight-${edition}`;
  if (["arcane-trickster", "arcane-trickster-2014"].includes(subclassId)) return `arcane-trickster-${edition}`;
  return "none";
}

export function cloneSpellcastingRows(rows: SpellcastingRow[]) {
  return rows.map((row) => ({ ...row, slots: [...row.slots] }));
}
