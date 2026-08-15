export type StartingItem = {
  name: string;
  quantity?: number;
  detail?: string;
  weight?: number;
};

export type EquipmentOption = {
  id: string;
  label: string;
  summary: string;
  items: StartingItem[];
  gp: number;
  roll?: { count: number; die: number; multiplier: number };
};

export type ClassEquipment = {
  source: string;
  options: EquipmentOption[];
};

const option = (id: string, label: string, items: StartingItem[], gp = 0): EquipmentOption => ({
  id,
  label,
  items,
  gp,
  summary: [
    items.map((item) => `${item.quantity && item.quantity > 1 ? `${item.quantity}× ` : ""}${item.name}`).join(", "),
    gp ? `${gp} PO` : "",
  ].filter(Boolean).join(" · "),
});

export const classStartingEquipment: Record<string, ClassEquipment> = {
  barbarian: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Machado grande" }, { name: "Machado de mão", quantity: 4 }, { name: "Pacote de explorador" }], 15),
    option("gold", "75 PO", [], 75),
  ] },
  bard: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Armadura de couro" }, { name: "Adaga", quantity: 2 }, { name: "Instrumento musical" }, { name: "Pacote de artista" }], 19),
    option("gold", "90 PO", [], 90),
  ] },
  cleric: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Camisão de malha" }, { name: "Escudo" }, { name: "Maça" }, { name: "Símbolo sagrado" }, { name: "Pacote de sacerdote" }], 7),
    option("gold", "110 PO", [], 110),
  ] },
  druid: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Armadura de couro" }, { name: "Escudo" }, { name: "Foice" }, { name: "Foco druídico (cajado)" }, { name: "Pacote de explorador" }, { name: "Kit de herbalismo" }], 9),
    option("gold", "50 PO", [], 50),
  ] },
  fighter: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A — pesado", [{ name: "Cota de malha" }, { name: "Espadão" }, { name: "Mangual" }, { name: "Azagaia", quantity: 8 }, { name: "Pacote de explorador de masmorras" }], 4),
    option("b", "Pacote B — ágil", [{ name: "Armadura de couro batido" }, { name: "Cimitarra" }, { name: "Espada curta" }, { name: "Arco longo" }, { name: "Flecha", quantity: 20 }, { name: "Aljava" }, { name: "Pacote de explorador de masmorras" }], 11),
    option("gold", "155 PO", [], 155),
  ] },
  monk: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Lança" }, { name: "Adaga", quantity: 5 }, { name: "Ferramentas de artesão ou instrumento musical" }, { name: "Pacote de explorador" }], 11),
    option("gold", "50 PO", [], 50),
  ] },
  paladin: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Cota de malha" }, { name: "Escudo" }, { name: "Espada longa" }, { name: "Azagaia", quantity: 6 }, { name: "Símbolo sagrado" }, { name: "Pacote de sacerdote" }], 9),
    option("gold", "150 PO", [], 150),
  ] },
  ranger: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Armadura de couro batido" }, { name: "Cimitarra" }, { name: "Espada curta" }, { name: "Arco longo" }, { name: "Flecha", quantity: 20 }, { name: "Aljava" }, { name: "Foco druídico" }, { name: "Pacote de explorador" }], 7),
    option("gold", "150 PO", [], 150),
  ] },
  rogue: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Armadura de couro" }, { name: "Adaga", quantity: 2 }, { name: "Espada curta" }, { name: "Arco curto" }, { name: "Flecha", quantity: 20 }, { name: "Aljava" }, { name: "Ferramentas de ladrão" }, { name: "Pacote de assaltante" }], 8),
    option("gold", "100 PO", [], 100),
  ] },
  sorcerer: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Lança" }, { name: "Adaga", quantity: 2 }, { name: "Foco arcano (cristal)" }, { name: "Pacote de explorador de masmorras" }], 28),
    option("gold", "50 PO", [], 50),
  ] },
  warlock: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Armadura de couro" }, { name: "Foice" }, { name: "Adaga", quantity: 2 }, { name: "Foco arcano (orbe)" }, { name: "Livro de saber oculto" }, { name: "Pacote de estudioso" }], 15),
    option("gold", "100 PO", [], 100),
  ] },
  wizard: { source: "SRD 5.2.1", options: [
    option("a", "Pacote A", [{ name: "Adaga", quantity: 2 }, { name: "Foco arcano (cajado)" }, { name: "Robe" }, { name: "Grimório" }, { name: "Pacote de estudioso" }], 5),
    option("gold", "55 PO", [], 55),
  ] },
  custom: { source: "Classe personalizada", options: [
    option("gold", "125 PO", [], 125),
  ] },
};

// PHB 2014: unlike the revised packages, these are sequential choices.  We
// materialize every valid combination so the builder can apply the result in
// one click without losing the original A/B decisions.  The gold alternative
// replaces both the class and background packages under the classic rule.
const legacyOption = (
  id: string,
  label: string,
  choices: string[],
  fixed: StartingItem[] = [],
): EquipmentOption =>
  option(
    id,
    label,
    [
      ...choices.map((name) => ({ name })),
      ...fixed,
    ],
  );

const combinations = (
  prefix: string,
  groups: Array<Array<{ label: string; item: string }>>,
  fixed: StartingItem[] = [],
): EquipmentOption[] => {
  const walk = (
    index: number,
    labels: string[],
    items: string[],
  ): EquipmentOption[] => {
    if (index >= groups.length)
      return [legacyOption(`${prefix}-${labels.join("-")}`, labels.join(" + "), items, fixed)];
    return groups[index].flatMap((choice) =>
      walk(index + 1, [...labels, choice.label], [...items, choice.item]),
    );
  };
  return walk(0, [], []);
};

const wealth = (
  formula: string,
  count: number,
  die: number,
  multiplier: number,
): EquipmentOption => ({
  id: "wealth",
  label: `Riqueza inicial · ${formula}`,
  summary: `Role ${formula} e compre manualmente todo o equipamento. Esta opção substitui os pacotes da classe e do antecedente de 2014.`,
  items: [],
  gp: 0,
  roll: { count, die, multiplier },
});

export const legacyClassStartingEquipment: Record<string, ClassEquipment> = {
  barbarian: { source: "Livro do Jogador 2014", options: [
    ...combinations("barbarian", [[{ label: "Machado grande", item: "Machado grande" }, { label: "Arma marcial", item: "Arma marcial à escolha" }], [{ label: "2 machados de mão", item: "Machado de mão (2)" }, { label: "Arma simples", item: "Arma simples à escolha" }]], [{ name: "Azagaia", quantity: 4 }, { name: "Pacote de explorador" }]),
    wealth("2d4 × 10 PO", 2, 4, 10),
  ] },
  bard: { source: "Livro do Jogador 2014", options: [
    ...combinations("bard", [[{ label: "Rapieira", item: "Rapieira" }, { label: "Espada longa", item: "Espada longa" }, { label: "Arma simples", item: "Arma simples à escolha" }], [{ label: "Pacote de diplomata", item: "Pacote de diplomata" }, { label: "Pacote de artista", item: "Pacote de artista" }], [{ label: "Alaúde", item: "Alaúde" }, { label: "Instrumento", item: "Instrumento musical à escolha" }]], [{ name: "Armadura de couro" }, { name: "Adaga" }]),
    wealth("5d4 × 10 PO", 5, 4, 10),
  ] },
  cleric: { source: "Livro do Jogador 2014", options: [
    ...combinations("cleric", [[{ label: "Maça", item: "Maça" }, { label: "Martelo de guerra", item: "Martelo de guerra (se proficiente)" }], [{ label: "Brunea", item: "Brunea" }, { label: "Armadura de couro", item: "Armadura de couro" }, { label: "Cota de malha", item: "Cota de malha (se proficiente)" }], [{ label: "Besta leve", item: "Besta leve e 20 virotes" }, { label: "Arma simples", item: "Arma simples à escolha" }], [{ label: "Pacote de sacerdote", item: "Pacote de sacerdote" }, { label: "Pacote de explorador", item: "Pacote de explorador" }]], [{ name: "Escudo" }, { name: "Símbolo sagrado" }]),
    wealth("5d4 × 10 PO", 5, 4, 10),
  ] },
  druid: { source: "Livro do Jogador 2014", options: [
    ...combinations("druid", [[{ label: "Escudo de madeira", item: "Escudo de madeira" }, { label: "Arma simples", item: "Arma simples à escolha" }], [{ label: "Cimitarra", item: "Cimitarra" }, { label: "Arma corpo a corpo", item: "Arma simples corpo a corpo à escolha" }]], [{ name: "Armadura de couro" }, { name: "Pacote de explorador" }, { name: "Foco druídico" }]),
    wealth("2d4 × 10 PO", 2, 4, 10),
  ] },
  fighter: { source: "Livro do Jogador 2014", options: [
    ...combinations("fighter", [[{ label: "Cota de malha", item: "Cota de malha" }, { label: "Couro + arco", item: "Armadura de couro, arco longo e 20 flechas" }], [{ label: "Arma e escudo", item: "Arma marcial e escudo" }, { label: "Duas armas", item: "Duas armas marciais" }], [{ label: "Besta leve", item: "Besta leve e 20 virotes" }, { label: "2 machados de mão", item: "Machado de mão (2)" }], [{ label: "Pacote de masmorra", item: "Pacote de explorador de masmorras" }, { label: "Pacote de explorador", item: "Pacote de explorador" }]]),
    wealth("5d4 × 10 PO", 5, 4, 10),
  ] },
  monk: { source: "Livro do Jogador 2014", options: [
    ...combinations("monk", [[{ label: "Espada curta", item: "Espada curta" }, { label: "Arma simples", item: "Arma simples à escolha" }], [{ label: "Pacote de masmorra", item: "Pacote de explorador de masmorras" }, { label: "Pacote de explorador", item: "Pacote de explorador" }]], [{ name: "Dardo", quantity: 10 }]),
    wealth("5d4 PO", 5, 4, 1),
  ] },
  paladin: { source: "Livro do Jogador 2014", options: [
    ...combinations("paladin", [[{ label: "Arma e escudo", item: "Arma marcial e escudo" }, { label: "Duas armas", item: "Duas armas marciais" }], [{ label: "5 azagaias", item: "Azagaia (5)" }, { label: "Arma simples", item: "Arma simples corpo a corpo à escolha" }], [{ label: "Pacote de sacerdote", item: "Pacote de sacerdote" }, { label: "Pacote de explorador", item: "Pacote de explorador" }]], [{ name: "Cota de malha" }, { name: "Símbolo sagrado" }]),
    wealth("5d4 × 10 PO", 5, 4, 10),
  ] },
  ranger: { source: "Livro do Jogador 2014", options: [
    ...combinations("ranger", [[{ label: "Brunea", item: "Brunea" }, { label: "Armadura de couro", item: "Armadura de couro" }], [{ label: "2 espadas curtas", item: "Espada curta (2)" }, { label: "Duas armas simples", item: "Duas armas simples corpo a corpo" }], [{ label: "Pacote de masmorra", item: "Pacote de explorador de masmorras" }, { label: "Pacote de explorador", item: "Pacote de explorador" }]], [{ name: "Arco longo" }, { name: "Flecha", quantity: 20 }]),
    wealth("5d4 × 10 PO", 5, 4, 10),
  ] },
  rogue: { source: "Livro do Jogador 2014", options: [
    ...combinations("rogue", [[{ label: "Rapieira", item: "Rapieira" }, { label: "Espada curta", item: "Espada curta" }], [{ label: "Arco curto", item: "Arco curto e 20 flechas" }, { label: "Espada curta extra", item: "Espada curta" }], [{ label: "Pacote de assaltante", item: "Pacote de assaltante" }, { label: "Pacote de masmorra", item: "Pacote de explorador de masmorras" }, { label: "Pacote de explorador", item: "Pacote de explorador" }]], [{ name: "Armadura de couro" }, { name: "Adaga", quantity: 2 }, { name: "Ferramentas de ladrão" }]),
    wealth("4d4 × 10 PO", 4, 4, 10),
  ] },
  sorcerer: { source: "Livro do Jogador 2014", options: [
    ...combinations("sorcerer", [[{ label: "Besta leve", item: "Besta leve e 20 virotes" }, { label: "Arma simples", item: "Arma simples à escolha" }], [{ label: "Bolsa de componentes", item: "Bolsa de componentes" }, { label: "Foco arcano", item: "Foco arcano" }], [{ label: "Pacote de masmorra", item: "Pacote de explorador de masmorras" }, { label: "Pacote de explorador", item: "Pacote de explorador" }]], [{ name: "Adaga", quantity: 2 }]),
    wealth("3d4 × 10 PO", 3, 4, 10),
  ] },
  warlock: { source: "Livro do Jogador 2014", options: [
    ...combinations("warlock", [[{ label: "Besta leve", item: "Besta leve e 20 virotes" }, { label: "Arma simples", item: "Arma simples à escolha" }], [{ label: "Bolsa de componentes", item: "Bolsa de componentes" }, { label: "Foco arcano", item: "Foco arcano" }], [{ label: "Pacote de estudioso", item: "Pacote de estudioso" }, { label: "Pacote de masmorra", item: "Pacote de explorador de masmorras" }], [{ label: "Arma simples", item: "Arma simples à escolha" }]], [{ name: "Armadura de couro" }, { name: "Adaga", quantity: 2 }]),
    wealth("4d4 × 10 PO", 4, 4, 10),
  ] },
  wizard: { source: "Livro do Jogador 2014", options: [
    ...combinations("wizard", [[{ label: "Bordão", item: "Bordão" }, { label: "Adaga", item: "Adaga" }], [{ label: "Bolsa de componentes", item: "Bolsa de componentes" }, { label: "Foco arcano", item: "Foco arcano" }], [{ label: "Pacote de estudioso", item: "Pacote de estudioso" }, { label: "Pacote de explorador", item: "Pacote de explorador" }]], [{ name: "Grimório" }]),
    wealth("4d4 × 10 PO", 4, 4, 10),
  ] },
  custom: { source: "Classe personalizada", options: [
    wealth("5d4 × 10 PO", 5, 4, 10),
  ] },
};

export const openBackgroundEquipment: Record<string, EquipmentOption> = {
  acolyte: option("package", "Pacote do Acólito", [{ name: "Suprimentos de calígrafo" }, { name: "Livro de orações" }, { name: "Símbolo sagrado" }, { name: "Pergaminho", quantity: 10 }, { name: "Robe" }], 8),
  criminal: option("package", "Pacote do Criminoso", [{ name: "Adaga", quantity: 2 }, { name: "Ferramentas de ladrão" }, { name: "Pé de cabra" }, { name: "Bolsa", quantity: 2 }, { name: "Roupas de viajante" }], 16),
  sage: option("package", "Pacote do Sábio", [{ name: "Cajado" }, { name: "Suprimentos de calígrafo" }, { name: "Livro de história" }, { name: "Pergaminho", quantity: 8 }, { name: "Robe" }], 8),
  soldier: option("package", "Pacote do Soldado", [{ name: "Lança" }, { name: "Arco curto" }, { name: "Flecha", quantity: 20 }, { name: "Conjunto de jogos" }, { name: "Kit de curandeiro" }, { name: "Aljava" }, { name: "Roupas de viajante" }], 14),
};

export const legacyBackgroundEquipment: Record<string, EquipmentOption> = {
  acolyte: option("package", "Pacote do Acólito", [{ name: "Símbolo sagrado" }, { name: "Livro de orações" }, { name: "Vareta de incenso", quantity: 5 }, { name: "Vestimentas" }, { name: "Roupas comuns" }], 15),
  "guild-artisan": option("package", "Pacote do Artesão de Guilda", [{ name: "Ferramentas de artesão à escolha" }, { name: "Carta de apresentação da guilda" }, { name: "Roupas de viajante" }], 15),
  entertainer: option("package", "Pacote do Artista", [{ name: "Instrumento musical à escolha" }, { name: "Presente de admirador" }, { name: "Traje" }], 15),
  charlatan: option("package", "Pacote do Charlatão", [{ name: "Roupas finas" }, { name: "Kit de disfarce" }, { name: "Ferramenta do golpe à escolha" }], 15),
  criminal: option("package", "Pacote do Criminoso", [{ name: "Pé de cabra" }, { name: "Roupas comuns escuras com capuz" }], 15),
  hermit: option("package", "Pacote do Eremita", [{ name: "Estojo de pergaminho com anotações" }, { name: "Cobertor" }, { name: "Roupas comuns" }, { name: "Kit de herbalismo" }], 5),
  outlander: option("package", "Pacote do Forasteiro", [{ name: "Cajado" }, { name: "Armadilha de caça" }, { name: "Troféu de animal" }, { name: "Roupas de viajante" }], 10),
  "folk-hero": option("package", "Pacote do Herói do Povo", [{ name: "Ferramentas de artesão à escolha" }, { name: "Pá" }, { name: "Pote de ferro" }, { name: "Roupas comuns" }], 10),
  sailor: option("package", "Pacote do Marinheiro", [{ name: "Cavilha" }, { name: "Corda de seda (15 m)" }, { name: "Amuleto da sorte" }, { name: "Roupas comuns" }], 10),
  noble: option("package", "Pacote do Nobre", [{ name: "Roupas finas" }, { name: "Anel de sinete" }, { name: "Pergaminho de linhagem" }], 25),
  urchin: option("package", "Pacote do Órfão", [{ name: "Faca pequena" }, { name: "Mapa da cidade natal" }, { name: "Rato de estimação" }, { name: "Lembrança dos pais" }, { name: "Roupas comuns" }], 10),
  sage: option("package", "Pacote do Sábio", [{ name: "Tinteiro" }, { name: "Pena" }, { name: "Faca pequena" }, { name: "Carta de colega falecido" }, { name: "Roupas comuns" }], 10),
  soldier: option("package", "Pacote do Soldado", [{ name: "Insígnia de patente" }, { name: "Troféu de inimigo" }, { name: "Conjunto de jogos à escolha" }, { name: "Roupas comuns" }], 10),
};

export const backgroundFallbackPackage = (name: string, tool: string): EquipmentOption => option(
  "package",
  `Pacote de ${name}`,
  [{ name: tool, detail: "Ferramenta concedida pelo antecedente." }, { name: `Pertences de ${name}`, detail: "Registre aqui os itens específicos escolhidos com a mesa." }],
  0,
);
