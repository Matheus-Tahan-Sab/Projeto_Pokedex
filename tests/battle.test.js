import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { BattleSession } from "../server/battle.js";
import {
  getCatalog,
  trainerTeam,
  trainers,
  validator,
  validateCustomTeam,
  getSpecies,
} from "../server/catalog.js";
import { chooseBotAction, effectiveness } from "../server/bot.js";
import { createBattleApi } from "../server/api.js";

const seed = [1, 2, 3, 4];
test("all 151 presets and all trainer teams pass the actual Showdown validator", () => {
  const catalog = getCatalog();
  assert.equal(catalog.pokemon.length, 151);
  for (const p of catalog.pokemon)
    assert.equal(
      validator.validateTeam([structuredClone(p.preset)]),
      null,
      p.name,
    );
  for (const t of trainers)
    assert.equal(validator.validateTeam(trainerTeam(t.id).team), null, t.name);
  assert.equal(
    trainerTeam(6).team.filter((p) => p.species === "Venonat").length,
    3,
  );
});
test("custom teams require six legal sets and reject arbitrary moves, items and abilities", () => {
  const team = [25, 6, 9, 3, 65, 143].map((id) =>
    structuredClone(getSpecies(id).preset),
  );
  assert.equal(validateCustomTeam(team).length, 6);
  assert.throws(() => validateCustomTeam(team.slice(0, 5)), /6 Pokémon/);
  assert.throws(
    () =>
      validateCustomTeam(
        team.map((p, i) => (i ? p : { ...p, moves: ["spore"] })),
      ),
    /golpes/,
  );
  assert.throws(
    () =>
      validateCustomTeam(
        team.map((p, i) => (i ? p : { ...p, ability: "Wonder Guard" })),
      ),
    /Habilidade/,
  );
  assert.throws(
    () =>
      validateCustomTeam(
        team.map((p, i) => (i ? p : { ...p, item: "fakeitem" })),
      ),
    /Item/,
  );
});
test("real simulation: preview, selected lead, PP, public opponent HP and victory", async () => {
  const battle = new BattleSession(
    { trainerId: 1, opponentId: 2, difficulty: "medium" },
    { seed },
  );
  try {
    let state = await battle.ready();
    assert.equal(state.preview, true);
    const firstVersion = state.version;
    state = await battle.choose({
      version: state.version,
      kind: "lead",
      slot: 2,
    });
    assert.equal(state.turn, 1);
    assert.equal(state.team.find((p) => p.active).species, "Venusaur");
    assert.equal(state.opponent.species, "Geodude");
    assert.match(state.opponent.condition, /\/100/);
    assert.equal(state.opponent.moves, undefined);
    assert.equal(state.opponent.item, undefined);
    await assert.rejects(
      battle.choose({ version: firstVersion, kind: "move", slot: 1 }),
      /atualizada/,
    );
    await assert.rejects(
      battle.choose({ version: state.version, kind: "move", slot: 99 }),
      /disponível/,
    );
    const before = state.moves[0].pp;
    state = await battle.choose({
      version: state.version,
      kind: "move",
      slot: 1,
    });
    assert.ok(state.moves[0].pp < before);
    assert.ok(state.logs.some((line) => /desmaiou/.test(line)));
    state = await battle.choose({
      version: state.version,
      kind: "move",
      slot: 1,
    });
    assert.equal(state.finished, true);
    assert.equal(state.winner, "Ash (você)");
    assert.equal(state.opponent.condition, "0 fnt");
    await assert.rejects(
      battle.choose({ version: state.version, kind: "move", slot: 1 }),
      /terminou/,
    );
  } finally {
    battle.destroy();
  }
});
test("voluntary switches, forced replacement after faint, and forfeit all advance safely", async () => {
  const battle = new BattleSession(
    { trainerId: 1, opponentId: 2, difficulty: "hard" },
    { seed },
  );
  try {
    let state = await battle.ready();
    state = await battle.choose({
      version: state.version,
      kind: "lead",
      slot: 2,
    });
    state = await battle.choose({
      version: state.version,
      kind: "switch",
      slot: state.team.find((p) => p.species === "Pikachu").slot,
    });
    assert.equal(state.team.find((p) => p.active).species, "Pikachu");
    for (let n = 0; n < 10 && !state.forceSwitch && !state.finished; n++) {
      const move = state.moves.find((m) => !m.disabled);
      state = await battle.choose({
        version: state.version,
        kind: "move",
        slot: move.slot,
      });
    }
    assert.equal(state.forceSwitch, true);
    await assert.rejects(
      battle.choose({ version: state.version, kind: "move", slot: 1 }),
      /disponível/,
    );
    state = await battle.choose({
      version: state.version,
      kind: "switch",
      slot: state.team.find((p) => p.species === "Venusaur").slot,
    });
    assert.equal(state.forceSwitch, false);
    state = await battle.forfeit();
    assert.equal(state.finished, true);
    assert.equal(state.winner, "Brock (bot)");
  } finally {
    battle.destroy();
  }
});
test("all bot difficulties can complete real seeded games", async () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const battle = new BattleSession(
      { trainerId: 2, opponentId: 3, difficulty },
      { seed, random: () => 0.01 },
    );
    try {
      let state = await battle.ready();
      state = await battle.choose({
        version: state.version,
        kind: "lead",
        slot: 1,
      });
      for (let i = 0; i < 100 && !state.finished; i++) {
        const option = state.forceSwitch
          ? state.team.find((p) => !p.active && p.hp > 0)
          : state.moves.find((m) => !m.disabled);
        state = await battle.choose({
          version: state.version,
          kind: state.forceSwitch ? "switch" : "move",
          slot: option.slot,
        });
      }
      assert.equal(state.finished, true, difficulty);
    } finally {
      battle.destroy();
    }
  }
});
test("bot decisions use allowed choices and medium respects type immunity", () => {
  const request = {
    active: [
      {
        moves: [
          { id: "thunderbolt", pp: 10 },
          { id: "surf", pp: 10 },
        ],
      },
    ],
    side: {
      pokemon: [
        {
          active: true,
          details: "Pikachu, L50",
          condition: "100/100",
          stats: { spa: 100 },
        },
      ],
    },
  };
  const foe = {
    species: "Geodude",
    types: ["Rock", "Ground"],
    condition: "100/100",
  };
  assert.equal(effectiveness("Electric", foe.types), 0);
  assert.equal(chooseBotAction(request, foe, "medium"), "move 2");
  request.active[0].moves[1].disabled = true;
  assert.equal(chooseBotAction(request, foe, "hard"), "move 1");
});
test("HTTP lifecycle, stale actions, deletion, invalid input and cross-origin commands", async (t) => {
  const api = createBattleApi();
  const server = createServer((req, res) => {
    void api.middleware(req, res, () => {
      res.writeHead(404);
      res.end();
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    api.close();
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const send = async (path, body, method = "POST", extraHeaders = {}) =>
    fetch(base + path, {
      method,
      headers: { "Content-Type": "application/json", ...extraHeaders },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  assert.equal((await fetch(base + "/catalog")).status, 200);
  assert.equal(
    (await send("/battles", { trainerId: 1, opponentId: 99 })).status,
    400,
  );
  assert.equal(
    (
      await send("/battles", { trainerId: 1, opponentId: 2 }, "POST", {
        Origin: "https://example.com",
      })
    ).status,
    403,
  );
  const response = await send("/battles", { trainerId: 1, opponentId: 1 });
  assert.equal(response.status, 201);
  const first = await response.json();
  const id = first.id;
  assert.notEqual(first.names.p1, first.names.p2);
  assert.equal((await fetch(base + `/battles/${id}`)).status, 200);
  assert.equal(
    (
      await send(`/battles/${id}/choice`, {
        version: first.version,
        kind: "lead",
        slot: 1,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await send(`/battles/${id}/choice`, {
        version: first.version,
        kind: "move",
        slot: 1,
      })
    ).status,
    400,
  );
  const forfeited = await (await send(`/battles/${id}/forfeit`, {})).json();
  assert.equal(forfeited.finished, true);
  assert.equal((await send(`/battles/${id}`, null, "DELETE")).status, 200);
  assert.equal((await fetch(base + `/battles/${id}`)).status, 404);
});
