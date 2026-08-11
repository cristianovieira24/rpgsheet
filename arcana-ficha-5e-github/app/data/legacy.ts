import type { AbilityKey } from "./rules";
import type { AccessKind, FeatureDefinition, LineageDefinition, SubclassDefinition } from "./progression";

export type Ruleset = "2024" | "2014";

export type LegacySpeciesDefinition = {
  id: string;
  name: string;
  size: string;
  speed: number;
  source: string;
  summary: string;
  traits: string[];
  abilityBonuses: Partial<Record<AbilityKey, number>>;
  flexibleAbilities?: "plus-two-plus-one" | "two-plus-one";
  access: AccessKind;
};

export type LegacyBackgroundDefinition = {
  id: string;
  name: string;
  edition: "2014";
  abilities: readonly AbilityKey[];
  feat: string;
  skills: readonly string[];
  tool: string;
  summary: string;
  feature: string;
  featureDetail: string;
  source: string;
};

const PHB14 = "Livro do Jogador 2014";
const openSpecies = (
  id: string,
  name: string,
  summary: string,
  traits: string[],
  abilityBonuses: Partial<Record<AbilityKey, number>>,
  size = "Médio",
  speed = 9,
): LegacySpeciesDefinition => ({ id, name, summary, traits, abilityBonuses, size, speed, source: PHB14, access: "official" });

export const legacySpecies: LegacySpeciesDefinition[] = [
  openSpecies("dragonborn", "Draconato", "Herança dracônica clássica, definida por um ancestral, um sopro e uma resistência elemental.", ["Ancestralidade Dracônica", "Sopro de Dragão", "Resistência a Dano"], { str: 2, cha: 1 }),
  openSpecies("dwarf", "Anão", "Povo resistente e treinado para sobreviver a venenos, escuridão e pedra.", ["Visão no Escuro", "Resiliência Anã", "Treinamento Anão em Combate", "Conhecimento de Pedra", "Sub-raça obrigatória"], { con: 2 }, "Médio", 7.5),
  openSpecies("elf", "Elfo", "Sentidos aguçados, transe, ancestralidade feérica e uma sub-raça que completa seus atributos.", ["Visão no Escuro", "Sentidos Aguçados", "Ancestralidade Feérica", "Transe", "Sub-raça obrigatória"], { dex: 2 }),
  openSpecies("gnome", "Gnomo", "Pequeno, inventivo e mentalmente resistente à magia.", ["Visão no Escuro", "Astúcia Gnômica", "Sub-raça obrigatória"], { int: 2 }, "Pequeno", 7.5),
  openSpecies("half-elf", "Meio-elfo", "Versatilidade humana unida à herança feérica, com duas melhorias de atributo escolhidas pelo jogador.", ["Visão no Escuro", "Ancestralidade Feérica", "Versatilidade em Perícias", "Dois atributos à escolha"], { cha: 2 }),
  openSpecies("half-orc", "Meio-orc", "Força, intimidação e uma capacidade feroz de continuar de pé.", ["Visão no Escuro", "Ameaçador", "Resistência Implacável", "Ataques Selvagens"], { str: 2, con: 1 }),
  openSpecies("halfling", "Halfling", "Pequeno, corajoso e extraordinariamente sortudo.", ["Sortudo", "Bravura", "Agilidade Halfling", "Sub-raça obrigatória"], { dex: 2 }, "Pequeno", 7.5),
  openSpecies("human", "Humano", "A versão clássica permite o Humano padrão ou a regra opcional do Humano Variante.", ["Idioma Adicional", "Versatilidade", "Variante opcional"], {}),
  openSpecies("tiefling", "Tiefling", "Herança infernal com resistência ao fogo e magia inata.", ["Visão no Escuro", "Resistência Infernal", "Legado Infernal"], { cha: 2, int: 1 }),
];

const legacyLineage = (
  speciesId: string,
  id: string,
  name: string,
  summary: string,
  abilityBonuses: Partial<Record<AbilityKey, number>> = {},
  flexibleAbilities?: "plus-two-plus-one" | "two-plus-one",
): LineageDefinition & { abilityBonuses: Partial<Record<AbilityKey, number>>; flexibleAbilities?: "plus-two-plus-one" | "two-plus-one" } => ({
  speciesId, id, name, summary, abilityBonuses, flexibleAbilities, source: PHB14, access: "official",
});

export const legacyLineages = [
  ...[
    ["black", "Dragão Negro · Ácido"], ["blue", "Dragão Azul · Eletricidade"], ["brass", "Dragão de Latão · Fogo"],
    ["bronze", "Dragão de Bronze · Eletricidade"], ["copper", "Dragão de Cobre · Ácido"], ["gold", "Dragão Dourado · Fogo"],
    ["green", "Dragão Verde · Veneno"], ["red", "Dragão Vermelho · Fogo"], ["silver", "Dragão Prateado · Frio"], ["white", "Dragão Branco · Frio"],
  ].map(([id, name]) => legacyLineage("dragonborn", id, name, "Define o tipo de dano, a forma do sopro clássico e a resistência correspondente.")),
  legacyLineage("dwarf", "hill-dwarf", "Anão da Colina", "+1 em Sabedoria, 1 PV adicional por nível e a resistência básica dos anões.", { wis: 1 }),
  legacyLineage("dwarf", "mountain-dwarf", "Anão da Montanha", "+2 em Força e treinamento com armaduras leves e médias.", { str: 2 }),
  legacyLineage("elf", "high-elf-2014", "Alto Elfo", "+1 em Inteligência, um truque de Mago e treinamento élfico com armas.", { int: 1 }),
  legacyLineage("elf", "wood-elf-2014", "Elfo da Floresta", "+1 em Sabedoria, deslocamento maior e capacidade de ocultar-se na natureza.", { wis: 1 }),
  legacyLineage("elf", "drow-2014", "Drow", "+1 em Carisma, visão no escuro superior e magia drow, com sensibilidade à luz solar.", { cha: 1 }),
  legacyLineage("gnome", "forest-gnome-2014", "Gnomo da Floresta", "+1 em Destreza, Ilusão Menor e comunicação simples com pequenos animais.", { dex: 1 }),
  legacyLineage("gnome", "rock-gnome-2014", "Gnomo das Rochas", "+1 em Constituição, conhecimento de artífice e pequenos dispositivos mecânicos.", { con: 1 }),
  legacyLineage("halfling", "lightfoot-2014", "Pés-Leves", "+1 em Carisma e capacidade de esconder-se atrás de criaturas maiores.", { cha: 1 }),
  legacyLineage("halfling", "stout-2014", "Robusto", "+1 em Constituição e resiliência contra veneno.", { con: 1 }),
  legacyLineage("human", "standard-human", "Humano Padrão", "+1 em todos os seis atributos.", { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }),
  legacyLineage("human", "variant-human", "Humano Variante", "+1 em dois atributos diferentes, uma perícia e um talento. Regra opcional que exige aprovação do mestre.", {}, "two-plus-one"),
  legacyLineage("half-elf", "half-elf-flexible", "Herança Versátil", "+1 em dois atributos diferentes que não sejam Carisma.", {}, "two-plus-one"),
] as const;

const background = (
  id: string,
  name: string,
  skills: string[],
  tool: string,
  summary: string,
  feature: string,
  featureDetail: string,
): LegacyBackgroundDefinition => ({ id, name, skills, tool, summary, feature, featureDetail, source: PHB14, edition: "2014", abilities: [], feat: "—" });

export const legacyBackgrounds: LegacyBackgroundDefinition[] = [
  background("acolyte", "Acólito", ["Intuição", "Religião"], "Dois idiomas", "Serviu a uma fé, templo ou ordem religiosa.", "Abrigo dos Fiéis", "Você e seus companheiros podem receber cura e cuidados modestos em templos ligados à sua fé. A característica também permite solicitar auxílio da organização religiosa, dentro dos limites definidos pelo mestre."),
  background("guild-artisan", "Artesão de Guilda", ["Intuição", "Persuasão"], "Ferramentas de artesão e um idioma", "Aprendeu um ofício e pertence a uma organização profissional.", "Membro de Guilda", "Sua guilda oferece contatos, hospedagem e apoio profissional; em troca, espera contribuições e lealdade. A posição também ajuda a conseguir audiências com pessoas ligadas ao ofício."),
  background("entertainer", "Artista", ["Acrobacia", "Atuação"], "Kit de disfarce e instrumento musical", "Viveu de apresentações, público e reputação.", "Pela Demanda Popular", "Normalmente encontra um lugar para se apresentar e recebe hospedagem e alimentação modestas enquanto entretém o público. Uma boa apresentação também pode torná-lo conhecido localmente."),
  background("charlatan", "Charlatão", ["Enganação", "Prestidigitação"], "Kit de disfarce e falsificação", "Sobreviveu vendendo versões convenientes da verdade.", "Identidade Falsa", "Possui uma segunda identidade completa, com documentos, disfarces e contatos coerentes. Também sabe falsificar documentos quando dispõe de um exemplar adequado para copiar."),
  background("criminal", "Criminoso", ["Enganação", "Furtividade"], "Conjunto de jogos e ferramentas de ladrão", "Tem experiência com crime, risco e redes clandestinas.", "Contato Criminal", "Mantém um contato confiável no submundo e sabe como enviar e receber mensagens por intermediários, mesmo a grandes distâncias."),
  background("hermit", "Eremita", ["Medicina", "Religião"], "Kit de herbalismo e um idioma", "Passou um longo período isolado em contemplação ou necessidade.", "Descoberta", "Seu isolamento revelou uma verdade, local, princípio ou segredo importante. O conteúdo exato é definido com o mestre e deve produzir ganchos para a campanha."),
  background("outlander", "Forasteiro", ["Atletismo", "Sobrevivência"], "Instrumento musical e um idioma", "Cresceu longe dos centros urbanos e conhece rotas selvagens.", "Andarilho", "Lembra mapas e geografia com facilidade e encontra alimento e água para um pequeno grupo quando o terreno oferece recursos disponíveis."),
  background("folk-hero", "Herói do Povo", ["Adestrar Animais", "Sobrevivência"], "Ferramentas de artesão e veículos terrestres", "Ganhou reconhecimento por enfrentar um perigo que ameaçava gente comum.", "Hospitalidade Rústica", "Pessoas comuns tendem a acolhê-lo, protegê-lo e oferecer abrigo modesto, desde que sua presença não coloque todos em risco evidente."),
  background("sailor", "Marinheiro", ["Atletismo", "Percepção"], "Ferramentas de navegador e veículos aquáticos", "Aprendeu disciplina, risco e trabalho coletivo no mar.", "Passagem de Navio", "Pode conseguir passagem gratuita para si e seus companheiros em embarcações amigas. A rota e o prazo dependem do capitão, e o grupo pode precisar ajudar durante a viagem."),
  background("noble", "Nobre", ["História", "Persuasão"], "Conjunto de jogos e um idioma", "Cresceu entre título, dever, privilégio e política.", "Posição de Privilégio", "É recebido na alta sociedade, consegue audiências com nobres locais e costuma ser tratado como alguém cuja posição merece consideração."),
  background("urchin", "Órfão", ["Furtividade", "Prestidigitação"], "Kit de disfarce e ferramentas de ladrão", "Aprendeu a sobreviver nas ruas e a ler o movimento das cidades.", "Segredos da Cidade", "Fora de combate, você e seus companheiros atravessam uma cidade com rapidez usando vielas, passagens e rotas que viajantes normalmente ignoram."),
  background("sage", "Sábio", ["Arcanismo", "História"], "Dois idiomas", "Dedicou anos a pesquisa, arquivos e perguntas difíceis.", "Pesquisador", "Quando não sabe uma informação, normalmente sabe onde ou com quem começar a procurá-la. A resposta ainda pode exigir viagem, favor, acesso ou investigação."),
  background("soldier", "Soldado", ["Atletismo", "Intimidação"], "Conjunto de jogos e veículos terrestres", "Foi moldado por treinamento, hierarquia e conflito.", "Patente Militar", "Soldados leais à mesma organização reconhecem sua patente e podem obedecer ordens compatíveis com a autoridade que ela representa. A posição também facilita acesso a acampamentos aliados."),
];

const legacySubclass = (classId: string, id: string, name: string, summary: string): SubclassDefinition => ({
  classId, id, name, summary, source: PHB14, access: "official",
});

export const legacyCoreSubclasses: SubclassDefinition[] = [
  legacySubclass("barbarian", "berserker-2014", "Caminho do Berserker", "Frenesi, intimidação e retaliação alimentados pela fúria."),
  legacySubclass("barbarian", "totem-warrior", "Caminho do Guerreiro Totêmico", "Espíritos animais alteram resistência, mobilidade e proteção."),
  legacySubclass("bard", "lore-2014", "Colégio do Conhecimento", "Mais perícias, interrupção e Segredos Mágicos antecipados."),
  legacySubclass("bard", "valor-2014", "Colégio da Bravura", "Treinamento marcial e inspiração aplicada a dano e defesa."),
  ...[["knowledge", "Conhecimento"], ["life-2014", "Vida"], ["light-2014", "Luz"], ["nature", "Natureza"], ["tempest-2014", "Tempestade"], ["trickery-2014", "Trapaça"], ["war-2014", "Guerra"]].map(([id, name]) => legacySubclass("cleric", id, `Domínio do ${name}`, `Domínio divino clássico de ${name.toLowerCase()}.`)),
  legacySubclass("druid", "land-2014", "Círculo da Terra", "Recuperação mágica e magias ligadas ao terreno."), legacySubclass("druid", "moon-2014", "Círculo da Lua", "Forma Selvagem voltada ao combate."),
  legacySubclass("fighter", "champion-2014", "Campeão", "Críticos ampliados e consistência atlética."), legacySubclass("fighter", "battle-master-2014", "Mestre de Batalha", "Dados de superioridade e manobras táticas."), legacySubclass("fighter", "eldritch-knight-2014", "Cavaleiro Arcano", "Magia de Mago aplicada ao combate marcial."),
  legacySubclass("monk", "open-hand-2014", "Caminho da Mão Aberta", "Controle corporal e golpes disciplinados."), legacySubclass("monk", "shadow-2014", "Caminho das Sombras", "Furtividade, escuridão e teleporte sombrio."), legacySubclass("monk", "elements-2014", "Caminho dos Quatro Elementos", "Disciplinas elementais alimentadas por ki."),
  legacySubclass("paladin", "devotion-2014", "Juramento de Devoção", "Honra, proteção e armas sagradas."), legacySubclass("paladin", "ancients-2014", "Juramento dos Anciões", "Esperança, natureza e resistência a magia."), legacySubclass("paladin", "vengeance-2014", "Juramento de Vingança", "Caça implacável contra um alvo prioritário."),
  legacySubclass("ranger", "hunter-2014", "Caçador", "Técnicas adaptáveis contra diferentes inimigos."), legacySubclass("ranger", "beast-master-2014", "Mestre das Feras", "Companheiro animal e combate coordenado."),
  legacySubclass("rogue", "thief-2014", "Ladrão", "Mobilidade, objetos e infiltração."), legacySubclass("rogue", "assassin-2014", "Assassino", "Disfarce, veneno e ataques de abertura."), legacySubclass("rogue", "arcane-trickster-2014", "Trapaceiro Arcano", "Ilusão e encantamento unidos à perícia do Ladino."),
  legacySubclass("sorcerer", "draconic-2014", "Linhagem Dracônica", "Resiliência e afinidade elemental."), legacySubclass("sorcerer", "wild-magic-2014", "Magia Selvagem", "Surtos imprevisíveis e manipulação de sorte."),
  legacySubclass("warlock", "archfey-2014", "Patrono Arquifada", "Encanto e terror feéricos."), legacySubclass("warlock", "fiend-2014", "Patrono Corruptor", "Vitalidade roubada e poder infernal."), legacySubclass("warlock", "great-old-one-2014", "Patrono Grande Antigo", "Telepatia e influência alienígena."),
  ...[["abjuration", "Abjuração"], ["conjuration", "Conjuração"], ["divination", "Adivinhação"], ["enchantment", "Encantamento"], ["evocation", "Evocação"], ["illusion", "Ilusão"], ["necromancy", "Necromancia"], ["transmutation", "Transmutação"]].map(([id, name]) => legacySubclass("wizard", `${id}-2014`, `Escola de ${name}`, `Tradição Arcana clássica especializada em ${name.toLowerCase()}.`)),
];

export const legacySubclassLevel: Record<string, number> = {
  cleric: 1, sorcerer: 1, warlock: 1, druid: 2, wizard: 2,
  barbarian: 3, bard: 3, fighter: 3, monk: 3, paladin: 3, ranger: 3, rogue: 3,
};

const f = (level: number, name: string, summary: string): FeatureDefinition => ({ level, name, summary, source: "SRD 5.1 · regras 2014", access: "open" });

export const legacyClassProgressions: Record<string, FeatureDefinition[]> = {
  barbarian: [f(1,"Fúria","Bônus de dano, vantagem em testes de Força e resistência física."),f(1,"Defesa sem Armadura","CA baseada em Destreza e Constituição."),f(2,"Ataque Descuidado","Ganhe vantagem ao custo de se expor."),f(2,"Sentido de Perigo","Vantagem contra perigos visíveis que exigem Destreza."),f(3,"Caminho Primitivo","Escolha sua subclasse."),f(5,"Ataque Extra","Ataque duas vezes."),f(5,"Movimento Rápido","Deslocamento maior sem armadura pesada."),f(9,"Crítico Brutal","Adicione dados aos críticos; cresce nos níveis 13 e 17."),f(11,"Fúria Implacável","Tente permanecer com 1 PV."),f(15,"Fúria Persistente","Sua fúria não termina cedo facilmente."),f(18,"Poder Indomável","Use seu valor de Força em resultados baixos."),f(20,"Campeão Primitivo","Força e Constituição aumentam em 4.")],
  bard: [f(1,"Inspiração de Bardo","Conceda um dado d6; cresce para d8 no 5, d10 no 10 e d12 no 15."),f(1,"Conjuração","Conjure usando Carisma."),f(2,"Pau para Toda Obra","Some metade da proficiência a testes ainda não treinados."),f(2,"Canção de Descanso","Ajude o grupo a recuperar PV em descansos curtos."),f(3,"Colégio de Bardo","Escolha sua subclasse."),f(3,"Especialização","Dobre a proficiência em duas perícias."),f(5,"Fonte de Inspiração","Recupere a Inspiração em descanso curto."),f(6,"Contra-encanto","Ajude aliados contra medo e encanto."),f(10,"Segredos Mágicos","Aprenda magias de outras classes."),f(20,"Inspiração Superior","Recupere um uso ao iniciar combate sem nenhum.")],
  cleric: [f(1,"Conjuração","Prepare magia divina usando Sabedoria."),f(1,"Domínio Divino","Escolha sua subclasse no nível 1."),f(2,"Canalizar Divindade","Manifeste Expulsar Mortos-vivos ou o poder do domínio."),f(5,"Destruir Mortos-vivos","Mortos-vivos fracos expulsos são destruídos."),f(10,"Intervenção Divina","Peça ajuda direta da divindade."),f(20,"Intervenção Divina Aprimorada","A intervenção passa a funcionar automaticamente.")],
  druid: [f(1,"Druídico","Conheça a linguagem secreta druídica."),f(1,"Conjuração","Prepare magia usando Sabedoria."),f(2,"Forma Selvagem","Transforme-se em feras conhecidas."),f(2,"Círculo Druídico","Escolha sua subclasse."),f(18,"Corpo Atemporal","Envelheça muito lentamente."),f(18,"Magias Bestiais","Conjure parte de suas magias transformado."),f(20,"Arquidruida","Use Forma Selvagem sem limite e conjure com mais liberdade.")],
  fighter: [f(1,"Estilo de Luta","Escolha uma especialidade marcial."),f(1,"Retomar o Fôlego","Recupere PV como ação bônus."),f(2,"Surto de Ação","Realize uma ação adicional."),f(3,"Arquétipo Marcial","Escolha sua subclasse."),f(5,"Ataque Extra","Ataque duas vezes; três no 11 e quatro no 20."),f(9,"Indomável","Refaça uma salvaguarda; ganha usos nos níveis 13 e 17.")],
  monk: [f(1,"Artes Marciais","Use Destreza e um dado marcial que cresce com o nível."),f(1,"Defesa sem Armadura","CA baseada em Destreza e Sabedoria."),f(2,"Ki","Gaste pontos em Rajada de Golpes, Defesa Paciente e Passo do Vento."),f(2,"Movimento sem Armadura","Deslocamento crescente sem armadura."),f(3,"Tradição Monástica","Escolha sua subclasse."),f(3,"Desviar Projéteis","Reduza ou devolva ataques à distância."),f(5,"Ataque Extra","Ataque duas vezes."),f(5,"Golpe Atordoante","Gaste ki para tentar atordoar."),f(7,"Evasão","Evite parte ou todo dano de efeitos de Destreza."),f(14,"Alma de Diamante","Proficiência em todas as salvaguardas."),f(20,"Eu Perfeito","Recupere ki ao iniciar combate sem nenhum.")],
  paladin: [f(1,"Sentido Divino","Detecte presenças sobrenaturais."),f(1,"Imposição das Mãos","Use uma reserva de cura."),f(2,"Estilo de Luta","Escolha uma especialidade marcial."),f(2,"Conjuração","Prepare magia usando Carisma."),f(2,"Golpe Divino","Converta espaços de magia em dano radiante."),f(3,"Juramento Sagrado","Escolha sua subclasse."),f(5,"Ataque Extra","Ataque duas vezes."),f(6,"Aura de Proteção","Some Carisma às salvaguardas próximas."),f(10,"Aura de Coragem","Proteja o grupo contra medo."),f(11,"Golpe Divino Aprimorado","Ataques causam dano radiante adicional."),f(14,"Toque Purificador","Encerre magias sobre criaturas tocadas.")],
  ranger: [f(1,"Inimigo Favorito","Conheça e rastreie tipos de inimigo escolhidos."),f(1,"Explorador Natural","Especialize-se em terrenos escolhidos."),f(2,"Estilo de Luta","Escolha uma especialidade marcial."),f(2,"Conjuração","Conheça magia de Patrulheiro usando Sabedoria."),f(3,"Arquétipo de Patrulheiro","Escolha sua subclasse."),f(3,"Consciência Primitiva","Detecte categorias de criatura na região."),f(5,"Ataque Extra","Ataque duas vezes."),f(8,"Passo da Terra","Ignore vegetação difícil e resista a plantas mágicas."),f(10,"Esconder-se à Vista","Prepare camuflagem natural."),f(14,"Desaparecer","Esconder-se como ação bônus."),f(18,"Sentidos Selvagens","Lute melhor contra criaturas invisíveis."),f(20,"Matador de Inimigos","Aplique Sabedoria contra inimigos favoritos.")],
  rogue: [f(1,"Especialização","Dobre proficiência em escolhas treinadas."),f(1,"Ataque Furtivo","Cause 1d6 extra; ganha +1d6 em todos os níveis ímpares."),f(1,"Gíria de Ladrão","Conheça códigos do submundo."),f(2,"Ação Ardilosa","Disparada, Desengajar ou Esconder como ação bônus."),f(3,"Arquétipo de Ladino","Escolha sua subclasse."),f(5,"Esquiva Sobrenatural","Reduza pela metade o dano de um ataque."),f(7,"Evasão","Evite parte ou todo dano de efeitos de Destreza."),f(11,"Talento Confiável","Resultados baixos em perícias treinadas contam como 10."),f(14,"Sentido Cego","Perceba criaturas escondidas próximas."),f(15,"Mente Escorregadia","Proficiência em salvaguardas de Sabedoria."),f(18,"Elusivo","Ataques não ganham vantagem contra você normalmente."),f(20,"Golpe de Sorte","Transforme um erro decisivo em sucesso.")],
  sorcerer: [f(1,"Conjuração","Conheça magia inata usando Carisma."),f(1,"Origem de Feitiçaria","Escolha sua subclasse no nível 1."),f(2,"Fonte de Magia","Receba Pontos de Feitiçaria."),f(3,"Metamagia","Modifique magias com opções escolhidas."),f(20,"Restauração Mística","Recupere Pontos de Feitiçaria em descansos curtos.")],
  warlock: [f(1,"Patrono Transcendental","Escolha sua subclasse no nível 1."),f(1,"Magia de Pacto","Conjure com poucos espaços que retornam em descanso curto."),f(2,"Invocações Místicas","Escolha alterações sobrenaturais permanentes."),f(3,"Dádiva do Pacto","Escolha Corrente, Lâmina ou Tomo."),f(11,"Arcana Mística","Receba uma magia de 6º círculo; novos arcanos chegam até o 9º."),f(20,"Mestre Místico","Recupere espaços de pacto rapidamente.")],
  wizard: [f(1,"Conjuração","Prepare magias do grimório usando Inteligência."),f(1,"Recuperação Arcana","Recupere parte dos espaços em descanso curto."),f(2,"Tradição Arcana","Escolha sua escola de magia."),f(18,"Domínio de Magia","Conjure magias escolhidas de 1º e 2º círculos à vontade."),f(20,"Magias Características","Conjure magias escolhidas de 3º círculo gratuitamente uma vez por descanso curto.")],
};

export const originFeatDetails: Record<string, string> = {
  "Alerta": "Some seu bônus de proficiência à Iniciativa e, após rolar, pode trocar sua Iniciativa com a de um aliado voluntário no mesmo combate.",
  "Artesão": "Receba proficiência com três tipos de ferramentas de artesão, compre itens mundanos com desconto e fabrique um item rápido ao terminar um Descanso Longo.",
  "Brigão de Taverna": "Aprimore golpes desarmados, permita rerrolar 1 no dano, empurre ao acertar e use objetos cotidianos como armas improvisadas com mais eficiência.",
  "Curandeiro": "Use um Kit de Curandeiro para permitir que uma criatura gaste Dado de Vida e rerrole 1 em dados de cura que você aplicar.",
  "Habilidoso": "Ganhe proficiência em quaisquer três perícias ou ferramentas à sua escolha.",
  "Iniciado em Magia (Clérigo)": "Aprenda dois truques e uma magia de 1º círculo da lista de Clérigo; escolha o atributo de conjuração e conjure a magia gratuitamente uma vez por Descanso Longo.",
  "Iniciado em Magia (Druida)": "Aprenda dois truques e uma magia de 1º círculo da lista de Druida; escolha o atributo de conjuração e conjure a magia gratuitamente uma vez por Descanso Longo.",
  "Iniciado em Magia (Mago)": "Aprenda dois truques e uma magia de 1º círculo da lista de Mago; escolha o atributo de conjuração e conjure a magia gratuitamente uma vez por Descanso Longo.",
  "Músico": "Ganhe proficiência com três instrumentos e conceda Inspiração Heroica a aliados ao concluir um Descanso Curto ou Longo.",
  "Resistente": "Seu máximo de PV aumenta em duas vezes seu nível quando recebe o talento e em mais 2 sempre que sobe de nível.",
  "Sortudo": "Receba Pontos de Sorte iguais ao bônus de proficiência para obter vantagem em um teste de d20 ou impor desvantagem a um ataque contra você.",
  "Atacante Selvagem": "Uma vez por turno, ao acertar com uma arma, role os dados de dano da arma duas vezes e use um dos resultados.",
};
