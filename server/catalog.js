import showdown from "pokemon-showdown";
import data from "../src/data/pokedex-data.json" with { type: "json" };

export const FORMAT = "gen9nationaldexag@@@Adjust Level = 50";
export const { BattleStream, Teams, TeamValidator } = showdown;
export const dex = showdown.Dex.forFormat(FORMAT);
export const validator = new TeamValidator(FORMAT);
export const trainers = data.trainers;
const cache = new Map();
const items = [
  "",
  "Leftovers",
  "Life Orb",
  "Choice Band",
  "Choice Specs",
  "Choice Scarf",
  "Focus Sash",
  "Sitrus Berry",
  "Lum Berry",
  "Rocky Helmet",
  "Assault Vest",
  "Eviolite",
  "Light Ball",
  "Black Sludge",
  "Heavy-Duty Boots",
  "Expert Belt",
];
const utility = [
  "recover",
  "roost",
  "synthesis",
  "softboiled",
  "slackoff",
  "thunderwave",
  "willowisp",
  "toxic",
  "swordsdance",
  "calmmind",
  "dragondance",
  "stealthrock",
  "protect",
];
export function getSpecies(id) {
  if (cache.has(id)) return cache.get(id);
  const record = data.pokemon.find((p) => p.id === id);
  if (!record) throw new Error("Pokémon fora do catálogo de Kanto.");
  const species = dex.species.get(record.name);
  const moves = [...dex.species.getMovePool(species.id, true)]
    .map((id) => dex.moves.get(id))
    .filter(
      (m) =>
        m.exists &&
        !m.isZ &&
        !m.isMax &&
        (!m.isNonstandard || m.isNonstandard === "Past"),
    );
  const abilities = Object.values(species.abilities);
  const special = species.baseStats.spa >= species.baseStats.atk;
  const damaging = moves
    .filter(
      (m) =>
        m.category !== "Status" &&
        m.basePower > 0 &&
        m.basePower <= 110 &&
        !m.selfdestruct &&
        !m.flags.charge,
    )
    .sort((a, b) => scoreMove(b) - scoreMove(a));
  function scoreMove(m) {
    return (
      m.basePower *
      (m.accuracy === true ? 1 : m.accuracy / 100) *
      (species.types.includes(m.type) ? 1.5 : 1) *
      ((m.category === "Special") === special ? 1.25 : 1)
    );
  }
  const chosen = [];
  const usedTypes = new Set();
  for (const move of damaging)
    if (!usedTypes.has(move.type) && chosen.length < 3) {
      chosen.push(move.id);
      usedTypes.add(move.type);
    }
  const support = utility.find((id) => moves.some((m) => m.id === id));
  if (support && chosen.length < 4) chosen.push(support);
  for (const move of damaging)
    if (chosen.length < 4 && !chosen.includes(move.id)) chosen.push(move.id);
  if (!chosen.length) chosen.push(moves[0]?.id || "struggle");
  const preset = {
    species: species.name,
    name: species.name,
    level: 50,
    ability: abilities[0],
    item: species.id === "pikachu" ? "Light Ball" : "Leftovers",
    nature: "Serious",
    moves: chosen,
    evs: {
      hp: 252,
      atk: special ? 0 : 252,
      def: 0,
      spa: special ? 252 : 0,
      spd: 4,
      spe: 0,
    },
  };
  // Exclusive event moves can be individually available but incompatible together.
  // Keep a validated default for every Pokémon, rather than trusting the movepool alone.
  while (
    validator.validateTeam([structuredClone(preset)]) &&
    preset.moves.length > 1
  )
    preset.moves.pop();
  if (validator.validateTeam([structuredClone(preset)]))
    throw new Error(`Não foi possível preparar ${species.name}.`);
  const result = {
    id,
    name: species.name,
    types: species.types,
    abilities,
    moveIds: moves.map((m) => m.id),
    preset,
  };
  cache.set(id, result);
  return result;
}
let catalog;
export function getCatalog() {
  if (catalog) return catalog;
  const pokemon = data.pokemon.map((p) => getSpecies(p.id));
  const moveIds = new Set(pokemon.flatMap((p) => p.moveIds));
  const moves = Object.fromEntries(
    [...moveIds].map((id) => {
      const m = dex.moves.get(id);
      return [
        id,
        {
          id,
          name: m.name,
          type: m.type,
          category: m.category,
          power: m.basePower,
          accuracy: m.accuracy,
          pp: m.pp,
          description: m.shortDesc,
        },
      ];
    }),
  );
  catalog = { format: FORMAT, level: 50, pokemon, moves, items, trainers };
  return catalog;
}
export function trainerTeam(id) {
  const trainer = trainers.find((t) => t.id === id);
  if (!trainer) throw new Error("Treinador inválido.");
  return {
    name: trainer.name,
    team: trainer.pokemonIds.map((id) =>
      structuredClone(getSpecies(id).preset),
    ),
  };
}
export function validateCustomTeam(input) {
  if (!Array.isArray(input) || input.length !== 6)
    throw new Error("Seu time personalizado precisa ter exatamente 6 Pokémon.");
  return validateSets(input);
}
export function validateSets(input) {
  const team = input.map((set, slot) => {
    if (!set || typeof set !== "object")
      throw new Error(`Preencha o Pokémon da posição ${slot + 1}.`);
    const entry = data.pokemon.find(
      (p) => dex.species.get(p.name).name === set.species,
    );
    if (!entry) throw new Error(`Pokémon inválido na posição ${slot + 1}.`);
    const spec = getSpecies(entry.id);
    if (!spec.abilities.includes(set.ability))
      throw new Error(`Habilidade inválida para ${spec.name}.`);
    if (!items.includes(set.item ?? ""))
      throw new Error(`Item inválido para ${spec.name}.`);
    if (
      !Array.isArray(set.moves) ||
      set.moves.length < 1 ||
      set.moves.length > 4 ||
      new Set(set.moves).size !== set.moves.length ||
      set.moves.some((m) => !spec.moveIds.includes(m))
    )
      throw new Error(
        `Escolha de 1 a 4 golpes distintos e compatíveis para ${spec.name}.`,
      );
    return {
      ...structuredClone(spec.preset),
      ability: set.ability,
      item: set.item || "",
      moves: [...set.moves],
    };
  });
  const issues = validator.validateTeam(team);
  if (issues)
    throw new Error(`Time incompatível com as regras: ${issues.join(" ")}`);
  return team;
}
