import assert from "node:assert/strict";
import test from "node:test";
import { legacyBackgrounds, legacyClassProgressions, legacyLineages, legacySpecies } from "../app/data/legacy.ts";
import { classProgressions, speciesSkillProfiles, subclasses } from "../app/data/progression.ts";
import { classes, skills } from "../app/data/rules.ts";
import feats from "../app/data/feats.generated.json" with { type: "json" };
import { spellcastingProfiles } from "../app/data/spellcasting.ts";
import {
  combinedCasterLevel,
  classSkillChoiceCount,
  fitClassLevelsToBudget,
  multiclassRequirementFailures,
  redistributeClassLevel,
  totalClassLevels,
} from "../app/data/multiclass.ts";

const abilityKeys = new Set(["str", "dex", "con", "int", "wis", "cha"]);
const skillNames = new Set(skills.map((entry) => entry.name));

test("catálogo clássico mantém as nove raças e os treze antecedentes-base", () => {
  assert.equal(legacySpecies.length, 9);
  assert.equal(legacyBackgrounds.length, 13);
  assert.deepEqual(new Set(legacyBackgrounds.map((entry) => entry.name)), new Set([
    "Acólito", "Artesão de Guilda", "Artista", "Charlatão", "Criminoso", "Eremita", "Forasteiro",
    "Herói do Povo", "Marinheiro", "Nobre", "Órfão", "Sábio", "Soldado",
  ]));
});

test("bônus e perícias clássicos usam chaves reconhecidas", () => {
  for (const entry of [...legacySpecies, ...legacyLineages]) {
    for (const [key, value] of Object.entries(entry.abilityBonuses ?? {})) {
      assert.ok(abilityKeys.has(key), `${entry.name}: atributo inválido ${key}`);
      assert.ok(Number.isInteger(value) && value >= 0, `${entry.name}: bônus inválido`);
    }
  }
  for (const background of legacyBackgrounds) {
    for (const skill of background.skills) assert.ok(skillNames.has(skill), `${background.name}: perícia desconhecida ${skill}`);
  }
});

test("todas as raças clássicas que exigem sub-raça possuem opções", () => {
  for (const speciesId of ["dragonborn", "dwarf", "elf", "gnome", "halfling", "human", "half-elf"]) {
    assert.ok(legacyLineages.some((entry) => entry.speciesId === speciesId), `${speciesId} ficou sem herança clássica`);
  }
});

test("idiomas clássicos registram opções fixas e escolhas adicionais", () => {
  for (const entry of legacySpecies) {
    assert.ok(entry.fixedLanguages?.includes("Comum"), `${entry.name}: Comum ausente`);
    assert.ok(Number.isInteger(entry.languageChoices ?? 0), `${entry.name}: escolhas de idioma inválidas`);
  }
  assert.deepEqual(legacySpecies.find((entry) => entry.id === "tiefling")?.fixedLanguages, ["Comum", "Infernal"]);
  assert.equal(legacySpecies.find((entry) => entry.id === "human")?.languageChoices, 1);
});

test("catálogo de talentos separa edições e inclui suplementos", () => {
  assert.ok(feats.length >= 250, "catálogo de talentos ficou incompleto");
  assert.ok(feats.some((entry) => entry.ruleset === "2014" && entry.source === "XGE"));
  assert.ok(feats.some((entry) => entry.ruleset === "2014" && entry.source === "TCE"));
  assert.ok(feats.some((entry) => entry.ruleset === "2024" && entry.source !== "XPHB"));
  assert.ok(feats.every((entry) => entry.name && entry.summary && entry.source));
});

test("classes e subclasses apontam para classes válidas e ids únicos", () => {
  const classIds = new Set(classes.map((entry) => entry.id));
  const subclassIds = new Set();
  for (const subclass of subclasses.filter((entry) => entry.classId !== "artificer")) {
    assert.ok(classIds.has(subclass.classId), `${subclass.name}: classe desconhecida`);
    const key = `${subclass.classId}:${subclass.id}`;
    assert.ok(!subclassIds.has(key), `subclasse duplicada ${key}`);
    subclassIds.add(key);
  }
});

test("todas as classes iniciais concedem escolhas de perícia válidas", () => {
  for (const entry of classes) {
    assert.ok(entry.skillChoices > 0, `${entry.name}: nenhuma escolha de perícia`);
    for (const skill of entry.skillOptions) {
      assert.ok(skillNames.has(skill), `${entry.name}: perícia desconhecida ${skill}`);
    }
  }
  assert.equal(classes.find((entry) => entry.id === "bard")?.skillChoices, 3);
  assert.equal(classes.find((entry) => entry.id === "rogue")?.skillChoices, 4);
  assert.equal(classSkillChoiceCount("wizard", false, 2), 0);
  assert.equal(classSkillChoiceCount("bard", false, 3), 1);
  assert.equal(classSkillChoiceCount("ranger", false, 3), 1);
  assert.equal(classSkillChoiceCount("rogue", false, 4), 1);
});

test("perfis de perícia de espécie só usam perícias e quantidades reconhecidas", () => {
  for (const [key, profile] of Object.entries(speciesSkillProfiles)) {
    assert.ok(key.startsWith("2014:") || key.startsWith("2024:"), `${key}: edição ausente`);
    assert.ok(profile.trait && profile.note, `${key}: explicação incompleta`);
    assert.ok(!profile.choices || profile.choices <= 2, `${key}: escolhas acima da interface`);
    for (const skill of [...(profile.fixed ?? []), ...(profile.options ?? [])]) {
      assert.ok(skillNames.has(skill), `${key}: perícia desconhecida ${skill}`);
    }
  }
  assert.deepEqual(speciesSkillProfiles["2024:elf"].options, ["Intuição", "Percepção", "Sobrevivência"]);
  assert.equal(speciesSkillProfiles["2024:human"].choices, 1);
  assert.equal(speciesSkillProfiles["2014:half-elf"].choices, 2);
});

test("progressões de classe ficam entre os níveis 1 e 20", () => {
  for (const [edition, progressions] of [["2024", classProgressions], ["2014", legacyClassProgressions]]) {
    for (const classId of classes.map((entry) => entry.id).filter((id) => id !== "custom")) {
      const features = progressions[classId];
      assert.ok(features?.length, `${edition}: ${classId} sem progressão`);
      for (const feature of features) {
        assert.ok(feature.level >= 1 && feature.level <= 20, `${edition}: nível inválido em ${classId}`);
        assert.ok(feature.name && feature.summary && feature.source, `${edition}: habilidade incompleta em ${classId}`);
      }
    }
  }
});

test("progressões clássicas preservam todas as linhas de habilidade do Livro do Jogador 2014", () => {
  const expectedFeatureLevels = {
    barbarian: [1, 1, 2, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    bard: [1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 8, 9, 10, 10, 10, 12, 13, 14, 14, 15, 16, 17, 18, 19, 20],
    cleric: [1, 1, 2, 2, 4, 5, 6, 6, 8, 8, 8, 10, 11, 12, 14, 16, 17, 17, 18, 19, 20],
    druid: [1, 1, 2, 2, 4, 4, 6, 8, 8, 10, 12, 14, 16, 18, 18, 19, 20],
    fighter: [1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 17, 18, 19, 20],
    monk: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    paladin: [1, 1, 2, 2, 2, 3, 3, 4, 5, 6, 7, 8, 10, 11, 12, 14, 15, 16, 18, 19, 20],
    ranger: [1, 1, 2, 2, 3, 3, 4, 5, 6, 6, 7, 8, 8, 10, 10, 11, 12, 14, 14, 15, 16, 18, 19, 20],
    rogue: [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    sorcerer: [1, 1, 2, 3, 4, 6, 8, 10, 12, 14, 16, 17, 18, 19, 20],
    warlock: [1, 1, 2, 3, 4, 6, 8, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20],
    wizard: [1, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 19, 20],
  };

  for (const [classId, levels] of Object.entries(expectedFeatureLevels)) {
    assert.deepEqual(
      legacyClassProgressions[classId].map((feature) => feature.level),
      levels,
      `${classId}: linhas de habilidade 2014 divergentes`,
    );
  }

  const warlock = legacyClassProgressions.warlock;
  for (const [level, circle] of [[11, "6º"], [13, "7º"], [15, "8º"], [17, "9º"]]) {
    const arcanum = warlock.find((feature) => feature.level === level && feature.name.includes("Arcano Místico"));
    assert.ok(arcanum?.name.includes(circle), `bruxo: Arcano Místico de ${circle} ausente no nível ${level}`);
  }
  assert.equal(warlock.find((feature) => feature.level === 20)?.name, "Mestre Místico");
});

test("orçamento de multiclasse nunca ultrapassa o nível total", () => {
  const entries = [
    { id: "a", classId: "wizard", subclassId: "", ruleset: "2024", level: 4 },
    { id: "b", classId: "fighter", subclassId: "", ruleset: "2024", level: 4 },
  ];
  const fitted = fitClassLevelsToBudget(entries, 6);
  assert.equal(totalClassLevels(fitted), 6);
  const redistributed = redistributeClassLevel(fitted, 6, "a", 5);
  assert.equal(totalClassLevels(redistributed), 6);
  assert.ok(redistributed.every((entry) => entry.level >= 1));
});

test("requisitos e níveis de conjurador multiclasses são calculados", () => {
  const entries = [
    { id: "a", classId: "wizard", subclassId: "", ruleset: "2014", level: 3 },
    { id: "b", classId: "ranger", subclassId: "", ruleset: "2014", level: 4 },
  ];
  assert.equal(combinedCasterLevel(entries), 5);
  assert.equal(multiclassRequirementFailures(entries, { str: 10, dex: 13, con: 10, int: 13, wis: 13, cha: 10 }).length, 0);
  assert.ok(multiclassRequirementFailures(entries, { str: 10, dex: 12, con: 10, int: 12, wis: 12, cha: 10 }).length >= 2);
});

test("tabelas de conjuração possuem exatamente vinte níveis e nove círculos", () => {
  for (const profile of spellcastingProfiles) {
    assert.equal(profile.rows.length, 20, `${profile.id}: quantidade de níveis incorreta`);
    profile.rows.forEach((row, index) => {
      assert.equal(row.level, index + 1, `${profile.id}: linha fora de ordem`);
      assert.equal(row.slots.length, 9, `${profile.id}: quantidade de círculos incorreta`);
      assert.ok(row.slots.every((slot) => Number.isInteger(slot) && slot >= 0), `${profile.id}: espaço inválido`);
    });
  }
});
