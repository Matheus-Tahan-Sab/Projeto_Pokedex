import test from "node:test";
import assert from "node:assert/strict";
import data from "../src/data/pokedex-data.json" with { type: "json" };
import {
  selectPokemon,
  totalStats,
  STAT_LABELS,
} from "../src/utils/pokemon.js";

test("pesquisa aceita nome parcial, espaços e ID com zeros/# sem confundir IDs parciais", () => {
  assert.deepEqual(
    selectPokemon(data.pokemon, { query: " BULBA " }).map((p) => p.id),
    [1],
  );
  assert.deepEqual(
    selectPokemon(data.pokemon, { query: "#025" }).map((p) => p.id),
    [25],
  );
  assert.deepEqual(
    selectPokemon(data.pokemon, { query: "25" }).map((p) => p.id),
    [25],
  );
  assert.equal(selectPokemon(data.pokemon, { query: "inexistente" }).length, 0);
});
test("combina busca, tipo e favoritos e inclui tipo secundário", () => {
  assert.deepEqual(
    selectPokemon(data.pokemon, {
      query: "char",
      type: "Flying",
      favorites: [6, 25],
    }).map((p) => p.id),
    [6],
  );
  assert.equal(selectPokemon(data.pokemon, { favorites: [] }).length, 0);
  assert.deepEqual(
    selectPokemon(data.pokemon, { type: "unknown" }).map((p) => p.id),
    [151],
  );
});
test("ordena sem modificar o catálogo e soma todos os atributos", () => {
  const before = data.pokemon.map((p) => p.id);
  assert.equal(selectPokemon(data.pokemon, { sort: "hp" })[0].name, "Chansey");
  assert.equal(selectPokemon(data.pokemon, { sort: "name" })[0].name, "Abra");
  assert.equal(
    selectPokemon(data.pokemon, { sort: "total" })[0].name,
    "Mewtwo",
  );
  assert.equal(totalStats(data.pokemon[0]), 318);
  assert.deepEqual(
    data.pokemon.map((p) => p.id),
    before,
  );
});
test("todos os registros têm atributos, IDs únicos e vínculos de equipe resolvíveis", () => {
  assert.equal(data.pokemon.length, 151);
  const ids = new Set(data.pokemon.map((p) => p.id));
  assert.equal(ids.size, data.pokemon.length);
  for (const p of data.pokemon)
    for (const key of Object.keys(STAT_LABELS))
      assert.equal(typeof p.stats[key], "number");
  for (const trainer of data.trainers)
    for (const id of trainer.pokemonIds) assert.ok(ids.has(id));
  assert.equal(
    data.trainers
      .find((t) => t.name === "Koga")
      .pokemonIds.filter((id) => id === 48).length,
    3,
  );
});
