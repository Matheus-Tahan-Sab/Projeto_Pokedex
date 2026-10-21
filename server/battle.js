import { randomUUID } from "node:crypto";
import { setImmediate as nextTick } from "node:timers/promises";
import {
  BattleStream,
  Teams,
  FORMAT,
  dex,
  trainerTeam,
  validateCustomTeam,
} from "./catalog.js";
import { chooseBotAction, hpRatio } from "./bot.js";

const difficulties = ["easy", "medium", "hard"];
export class BattleSession {
  constructor(
    { trainerId, team, opponentId, difficulty = "medium" },
    { seed, random } = {},
  ) {
    if (!difficulties.includes(difficulty))
      throw new Error("Dificuldade inválida.");
    const own = trainerId
      ? trainerTeam(trainerId)
      : { name: "Seu time", team: validateCustomTeam(team) };
    const opponent = trainerTeam(opponentId);
    this.id = randomUUID();
    this.difficulty = difficulty;
    this.random = random;
    this.names = { p1: `${own.name} (você)`, p2: `${opponent.name} (bot)` };
    this.turn = 0;
    this.version = 0;
    this.logs = [];
    this.publicActive = {};
    this.request = null;
    this.finished = false;
    this.opponentPreview = opponent.team.map((set) => ({
      species: set.species,
    }));
    this.lastAccess = Date.now();
    this.busy = false;
    this.error = null;
    this.stream = new BattleStream();
    this.reader = this.read().catch((error) => {
      this.failure = error;
    });
    this.stream.write(
      `>start ${JSON.stringify({ formatid: FORMAT, ...(seed ? { seed } : {}) })}\n>player p1 ${JSON.stringify({ name: this.names.p1, team: Teams.pack(own.team) })}\n>player p2 ${JSON.stringify({ name: this.names.p2, team: Teams.pack(opponent.team) })}`,
    );
  }
  async read() {
    for await (const chunk of this.stream) {
      const [type, ...payload] = chunk.split("\n");
      if (type === "update") this.update(payload);
      if (type === "sideupdate") {
        const side = payload.shift();
        for (const line of payload) {
          if (line.startsWith("|request|")) {
            const request = JSON.parse(line.slice(9));
            if (side === "p1") {
              this.request = request;
              this.version++;
            } else if (!request.wait) {
              const action = chooseBotAction(
                request,
                this.publicActive.p1,
                this.difficulty,
                this.random,
              );
              if (action) this.stream.write(`>p2 ${action}`);
            }
          }
          if (line.startsWith("|error|")) {
            if (side === "p1") {
              this.error = line.slice(7);
              this.version++;
            } else {
              this.stream.write(">p2 default");
            }
          }
        }
      }
      if (type === "end") {
        this.finished = true;
        this.result = JSON.parse(payload.join("\n"));
        this.version++;
      }
    }
  }
  update(lines) {
    // split carries SECRET and PUBLIC lines. Use only PUBLIC data for the bot and opponent UI.
    const publicLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("|split|")) {
        i++;
        continue;
      }
      publicLines.push(lines[i]);
    }
    for (const line of publicLines) {
      const [, command, ...args] = line.split("|");
      const side = args[0]?.slice(0, 2);
      const label = (value) => value?.replace(/^p[12][a-z]?: /, "") || "";
      if (command === "turn") {
        this.turn = Number(args[0]);
        this.logs.push(`— Turno ${this.turn} —`);
        if (this.turn >= 300) this.stream.write(">forcetie");
      }
      if (command === "switch" || command === "drag" || command === "replace") {
        const species = args[1].split(",")[0];
        this.publicActive[side] = {
          ident: args[0],
          species,
          condition: args[2],
          types: dex.species.get(species).types,
          status: args[2].split(" ")[1] || "",
        };
        this.logs.push(`${this.names[side]} enviou ${species}.`);
      }
      if (
        command === "-damage" ||
        command === "-heal" ||
        command === "-sethp"
      ) {
        if (this.publicActive[side]?.ident === args[0]) {
          this.publicActive[side].condition = args[1];
          this.publicActive[side].status = args[1].split(" ")[1] || "";
        }
        this.logs.push(
          `${label(args[0])}: ${command === "-heal" ? "recuperou HP" : "HP atualizado"} (${args[1]}).`,
        );
      }
      if (command === "move")
        this.logs.push(`${label(args[0])} usou ${args[1]}!`);
      if (command === "faint") {
        if (this.publicActive[side])
          this.publicActive[side].condition = "0 fnt";
        this.logs.push(`${label(args[0])} desmaiou.`);
      }
      if (command === "-status") {
        if (this.publicActive[side]) this.publicActive[side].status = args[1];
        this.logs.push(`${label(args[0])} recebeu o status ${args[1]}.`);
      }
      if (command === "-curestatus") {
        if (this.publicActive[side]) this.publicActive[side].status = "";
        this.logs.push(`${label(args[0])} se recuperou do status.`);
      }
      if (command === "-boost" || command === "-unboost")
        this.logs.push(
          `${label(args[0])}: ${args[1]} ${command === "-boost" ? "aumentou" : "diminuiu"} ${args[2]} estágio(s).`,
        );
      if (command === "-immune") this.logs.push(`${label(args[0])} é imune!`);
      if (command === "-supereffective") this.logs.push("É super efetivo!");
      if (command === "-resisted") this.logs.push("Não é muito efetivo...");
      if (command === "-crit") this.logs.push("Acerto crítico!");
      if (command === "-miss") this.logs.push("O golpe errou!");
      if (command === "-fail") this.logs.push("A ação falhou.");
      if (command === "cant")
        this.logs.push(`${label(args[0])} não conseguiu agir (${args[1]}).`);
      if (command === "-weather") this.logs.push(`Clima: ${args[0]}.`);
      if (command === "-sidestart" || command === "-sideend")
        this.logs.push(
          `${label(args[0])}: ${args[1]} ${command === "-sidestart" ? "ativado" : "encerrado"}.`,
        );
      if (command === "-start" || command === "-end" || command === "-activate")
        this.logs.push(`${label(args[0])}: ${args[1]}.`);
      if (command === "-item" || command === "-enditem")
        this.logs.push(`${label(args[0])}: item ${args[1]}.`);
      if (command === "win") {
        this.winner = args[0];
        this.logs.push(`${args[0]} venceu a batalha!`);
      }
      if (command === "tie") this.logs.push("A batalha terminou em empate.");
    }
    this.logs = this.logs.slice(-350);
  }
  async ready(previous = -1) {
    const deadline = Date.now() + 8000;
    do {
      await nextTick();
      if (this.failure) throw this.failure;
      if (
        this.finished ||
        this.error ||
        (this.version > previous && this.request && !this.request.wait)
      ) {
        // Let queued bot choices and public updates settle before returning to the UI.
        await nextTick();
        return this.snapshot();
      }
    } while (Date.now() < deadline);
    throw new Error(
      "O simulador demorou a responder. Encerre esta batalha e tente novamente.",
    );
  }
  snapshot() {
    this.lastAccess = Date.now();
    const request = this.request;
    const pokemon = request?.side?.pokemon || [];
    const active = request?.active?.[0];
    return {
      id: this.id,
      version: this.version,
      turn: this.turn,
      names: this.names,
      difficulty: this.difficulty,
      finished: this.finished,
      winner: this.winner || this.result?.winner || null,
      logs: [...this.logs],
      team: pokemon.map((p, i) => ({
        slot: i + 1,
        name: p.ident.replace(/^p1: /, ""),
        species: p.details.split(",")[0],
        condition:
          this.finished && p.active && this.publicActive.p1
            ? this.publicActive.p1.condition
            : p.condition,
        hp: hpRatio(
          this.finished && p.active && this.publicActive.p1
            ? this.publicActive.p1.condition
            : p.condition,
        ),
        active: p.active,
        item: p.item,
        ability: p.ability || p.baseAbility,
      })),
      opponent: this.publicActive.p2 || null,
      opponentPreview: this.opponentPreview,
      preview: !this.finished && !!request?.teamPreview,
      forceSwitch: !this.finished && !!request?.forceSwitch?.[0],
      trapped: !!active?.trapped,
      moves: (active?.moves || []).map((m, i) => ({
        slot: i + 1,
        name: m.move,
        type: dex.moves.get(m.id).type,
        category: dex.moves.get(m.id).category,
        pp: m.pp,
        maxpp: m.maxpp,
        disabled: !!m.disabled || m.pp === 0,
      })),
    };
  }
  async choose({ version, kind, slot }) {
    if (this.busy) throw new Error("Uma ação já está sendo processada.");
    if (this.finished) throw new Error("Esta batalha já terminou.");
    if (version !== this.version)
      throw new Error(
        "A batalha foi atualizada. Recarregue o estado antes de agir.",
      );
    if (!Number.isInteger(slot)) throw new Error("Escolha inválida.");
    const state = this.snapshot();
    let choice;
    if (
      state.preview &&
      kind === "lead" &&
      state.team.some((p) => p.slot === slot)
    )
      choice = `team ${[slot, ...state.team.map((p) => p.slot).filter((s) => s !== slot)].join("")}`;
    else if (
      !state.preview &&
      kind === "switch" &&
      state.team.some((p) => p.slot === slot && !p.active && p.hp > 0) &&
      (!state.trapped || state.forceSwitch)
    )
      choice = `switch ${slot}`;
    else if (
      !state.preview &&
      !state.forceSwitch &&
      kind === "move" &&
      state.moves.some((m) => m.slot === slot && !m.disabled)
    )
      choice = `move ${slot}`;
    else throw new Error("Esta ação não está disponível agora.");
    this.busy = true;
    this.error = null;
    try {
      await this.stream.write(`>p1 ${choice}`);
      const next = await this.ready(version);
      if (this.error) throw new Error(this.error);
      return next;
    } finally {
      this.busy = false;
    }
  }
  async forfeit() {
    if (this.busy) throw new Error("Aguarde a ação atual terminar.");
    if (!this.finished) {
      await this.stream.write(">forcelose p1");
      await this.ready(this.version);
    }
    return this.snapshot();
  }
  destroy() {
    this.stream.writeEnd();
  }
}
