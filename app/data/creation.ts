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
};

export const openBackgroundEquipment: Record<string, EquipmentOption> = {
  acolyte: option("package", "Pacote do Acólito", [{ name: "Suprimentos de calígrafo" }, { name: "Livro de orações" }, { name: "Símbolo sagrado" }, { name: "Pergaminho", quantity: 10 }, { name: "Robe" }], 8),
  criminal: option("package", "Pacote do Criminoso", [{ name: "Adaga", quantity: 2 }, { name: "Ferramentas de ladrão" }, { name: "Pé de cabra" }, { name: "Bolsa", quantity: 2 }, { name: "Roupas de viajante" }], 16),
  sage: option("package", "Pacote do Sábio", [{ name: "Cajado" }, { name: "Suprimentos de calígrafo" }, { name: "Livro de história" }, { name: "Pergaminho", quantity: 8 }, { name: "Robe" }], 8),
  soldier: option("package", "Pacote do Soldado", [{ name: "Lança" }, { name: "Arco curto" }, { name: "Flecha", quantity: 20 }, { name: "Conjunto de jogos" }, { name: "Kit de curandeiro" }, { name: "Aljava" }, { name: "Roupas de viajante" }], 14),
};

export const backgroundFallbackPackage = (name: string, tool: string): EquipmentOption => option(
  "package",
  `Pacote de ${name}`,
  [{ name: tool, detail: "Ferramenta concedida pelo antecedente." }, { name: `Pertences de ${name}`, detail: "Registre aqui os itens específicos escolhidos com a mesa." }],
  0,
);
