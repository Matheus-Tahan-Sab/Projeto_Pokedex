import { dex } from "./catalog.js";

export function hpRatio(condition = "") {
  if (condition.includes("fnt") || condition === "0") return 0;
  const match = condition.match(/^(\d+)(?:\/(\d+))?/);
  return match ? Number(match[1]) / Number(match[2] || 100) : 1;
}
export function effectiveness(type, foeTypes = []) {
  if (!dex.getImmunity(type, foeTypes)) return 0;
  return 2 ** dex.getEffectiveness(type, foeTypes);
}
function matchup(pokemon, foe) {
  const own = dex.species.get(pokemon.details.split(",")[0]);
  const enemy = dex.species.get(foe?.species || "");
  const offense = Math.max(
    ...own.types.map((type) => effectiveness(type, foe?.types || enemy.types)),
    1,
  );
  const risk = Math.max(
    ...(foe?.types || enemy.types || []).map((type) =>
      effectiveness(type, own.types),
    ),
    1,
  );
  return offense / risk + hpRatio(pokemon.condition) * 0.4;
}
// Inputs are the bot's private choice request and PUBLIC opponent information only.
// It never reads the Battle object, the player's selected action, moves or private stats.
export function chooseBotAction(
  request,
  foe,
  difficulty,
  random = Math.random,
) {
  if (request.wait) return null;
  if (request.teamPreview)
    return "team " + request.side.pokemon.map((_, i) => i + 1).join("");
  const team = request.side.pokemon;
  const switches = team
    .map((p, i) => ({ p, index: i + 1 }))
    .filter(({ p }) => !p.active && hpRatio(p.condition) > 0);
  const active = team.find((p) => p.active);
  const options = request.active?.[0];
  const moves = (options?.moves || [])
    .map((m, i) => ({ ...m, index: i + 1 }))
    .filter((m) => !m.disabled && m.pp !== 0);
  if (request.forceSwitch?.[0]) {
    const best =
      difficulty === "easy"
        ? switches[Math.floor(random() * switches.length)]
        : switches.sort((a, b) => matchup(b.p, foe) - matchup(a.p, foe))[0];
    return best ? `switch ${best.index}` : "default";
  }
  if (difficulty === "easy") {
    const actions = [
      ...moves.map((m) => `move ${m.index}`),
      ...(!options?.trapped ? switches.map((s) => `switch ${s.index}`) : []),
    ];
    return actions[Math.floor(random() * actions.length)] || "default";
  }
  const ownSpecies = dex.species.get(active?.details.split(",")[0]);
  const foeTypes = foe?.types || dex.species.get(foe?.species || "").types;
  function moveScore(option) {
    const move = dex.moves.get(option.id);
    if (move.category === "Status") {
      if (difficulty !== "hard") return 2;
      if (move.heal) return hpRatio(active.condition) < 0.5 ? 160 : -1;
      if (move.status)
        return !foe?.status && effectiveness(move.type, foeTypes) ? 42 : -1;
      if (move.boosts && hpRatio(active.condition) > 0.65) return 28;
      return 6;
    }
    const stat =
      move.category === "Physical" ? active.stats?.atk : active.stats?.spa;
    const foeSpecies = dex.species.get(foe?.species || "");
    const defense =
      move.category === "Physical"
        ? foeSpecies.baseStats.def
        : foeSpecies.baseStats.spd;
    let score =
      (move.basePower || 55) *
      (move.accuracy === true ? 1 : move.accuracy / 100) *
      effectiveness(move.type, foeTypes) *
      (ownSpecies.types.includes(move.type) ? 1.5 : 1) *
      ((stat || 100) / (defense || 100));
    if (
      difficulty === "hard" &&
      move.priority > 0 &&
      hpRatio(foe?.condition) < 0.25
    )
      score *= 1.8;
    return score;
  }
  const ranked = moves
    .map((m) => ({ ...m, score: moveScore(m) }))
    .sort((a, b) => b.score - a.score);
  if (
    difficulty === "hard" &&
    !options?.trapped &&
    switches.length &&
    active &&
    hpRatio(active.condition) > 0.25
  ) {
    const best = switches.sort(
      (a, b) => matchup(b.p, foe) - matchup(a.p, foe),
    )[0];
    if (
      (ranked[0]?.score || 0) < 30 &&
      matchup(best.p, foe) > matchup(active, foe) + 1.2
    )
      return `switch ${best.index}`;
  }
  return ranked[0] ? `move ${ranked[0].index}` : "default";
}
