import { useEffect, useRef } from "react";
import PokemonImage from "../components/PokemonImage.jsx";
import { TYPE_COLORS, typeLabel } from "../utils/pokemon.js";

function Fighter({ pokemon, catalog, opponent = false, name }) {
  const entry = catalog.pokemon.find((p) => p.name === pokemon?.species);
  const hp = opponent
    ? pokemon?.condition?.includes("fnt")
      ? 0
      : Number(pokemon?.condition?.match(/^(\d+)/)?.[1] || 0) / 100
    : pokemon?.hp || 0;
  const status = pokemon?.status || pokemon?.condition?.split(" ")[1] || "";
  const statusLabel =
    {
      brn: "Queimado",
      par: "Paralisado",
      psn: "Envenenado",
      tox: "Intoxicado",
      slp: "Dormindo",
      frz: "Congelado",
      fnt: "Desmaiado",
    }[status] || status;
  return (
    <div className={`fighter ${opponent ? "opponent" : "player"}`}>
      <span className="eyebrow">{name} · NÍVEL 50</span>
      <h3>{pokemon?.species || "Escolha seu primeiro Pokémon"}</h3>
      <div className="fighter-art">
        {entry ? (
          <PokemonImage key={entry.id} pokemon={entry} />
        ) : (
          <span className="pokeball" />
        )}
      </div>
      {pokemon && (
        <>
          <meter
            min="0"
            max="100"
            value={Math.round(hp * 100)}
            low="25"
            high="50"
            optimum="100"
            aria-label={`HP de ${pokemon.species}`}
          />
          <p className="fighter-condition">
            {opponent
              ? `${Math.round(hp * 100)}% de HP`
              : `${pokemon.condition.split(" ")[0]} HP`}{" "}
            <span>{statusLabel}</span>
          </p>
        </>
      )}
    </div>
  );
}
export default function BattleArena({
  state,
  catalog,
  busy,
  error,
  onAction,
  onRefresh,
  onForfeit,
  onReset,
}) {
  const logList = useRef(null);
  useEffect(() => {
    if (logList.current)
      logList.current.scrollTop = logList.current.scrollHeight;
  }, [state.logs.length, state.turn]);
  const active = state.team.find((p) => p.active);
  return (
    <section className="battle-arena" aria-labelledby="arena-title">
      <div className="arena-heading">
        <div>
          <span className="eyebrow">
            BATALHA LOCAL ·{" "}
            {
              { easy: "FÁCIL", medium: "MÉDIO", hard: "DIFÍCIL" }[
                state.difficulty
              ]
            }
          </span>
          <h3 id="arena-title">
            {state.names.p1} <span>vs.</span> {state.names.p2}
          </h3>
        </div>
        <strong>{state.preview ? "Preparação" : `Turno ${state.turn}`}</strong>
      </div>
      {error && (
        <div className="battle-error" role="alert">
          {error}
          <button className="secondary" disabled={busy} onClick={onRefresh}>
            Atualizar batalha
          </button>
        </div>
      )}
      {state.finished ? (
        <div className="battle-result" role="status">
          <h3>
            {state.winner
              ? state.winner === state.names.p1
                ? "Você venceu!"
                : `${state.names.p2} venceu!`
              : "Empate!"}
          </h3>
          <p>
            {state.winner
              ? `Vencedor: ${state.winner}.`
              : "A partida terminou empatada."}{" "}
            Foram {state.turn} turnos.
          </p>
          <button className="primary" disabled={busy} onClick={onReset}>
            Preparar outra batalha
          </button>
        </div>
      ) : null}
      {state.preview ? (
        <div className="battle-preview">
          <h3>Quem entra primeiro?</h3>
          <p>
            Escolha o primeiro integrante. Você pode trocar durante a batalha.
          </p>
          <div className="battle-team">
            {state.team.map((p) => (
              <button
                className="team-choice"
                key={p.slot}
                disabled={busy}
                onClick={() => onAction("lead", p.slot)}
              >
                <PokemonImage
                  pokemon={catalog.pokemon.find((s) => s.name === p.species)}
                />
                <strong>{p.species}</strong>
                <span>Começar com este</span>
              </button>
            ))}
          </div>
          <p className="battle-note">
            Equipe adversária:{" "}
            {state.opponentPreview.map((p) => p.species).join(" · ")}
          </p>
        </div>
      ) : state.opponent ? (
        <>
          <div className="battle-field">
            <Fighter pokemon={active} catalog={catalog} name={state.names.p1} />
            <span className="versus" aria-hidden="true">
              VS
            </span>
            <Fighter
              pokemon={state.opponent}
              catalog={catalog}
              opponent
              name={state.names.p2}
            />
          </div>
          {!state.finished && (
            <>
              <div className="battle-instruction" role="status">
                {busy
                  ? "Resolvendo a ação…"
                  : state.forceSwitch
                    ? "Seu Pokémon saiu de campo. Escolha um substituto."
                    : `O que ${active?.species || "seu Pokémon"} vai fazer?`}
              </div>
              {!state.forceSwitch && (
                <div className="battle-moves">
                  {state.moves.map((move) => (
                    <button
                      key={move.slot}
                      style={{
                        "--move-color": TYPE_COLORS[move.type] || "#999",
                      }}
                      disabled={busy || move.disabled}
                      onClick={() => onAction("move", move.slot)}
                    >
                      <strong>{move.name}</strong>
                      <span>
                        {typeLabel(move.type)} ·{" "}
                        {
                          {
                            Physical: "Físico",
                            Special: "Especial",
                            Status: "Status",
                          }[move.category]
                        }{" "}
                        · PP {move.pp}/{move.maxpp}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <h4>
                {state.forceSwitch
                  ? "Escolha o próximo Pokémon"
                  : "Sua equipe · trocar Pokémon"}
              </h4>
              <div className="battle-team">
                {state.team.map((p) => (
                  <button
                    className={`team-choice ${p.active ? "is-active" : ""}`}
                    key={p.slot}
                    disabled={
                      busy ||
                      p.active ||
                      p.hp <= 0 ||
                      (state.trapped && !state.forceSwitch)
                    }
                    onClick={() => onAction("switch", p.slot)}
                  >
                    <PokemonImage
                      pokemon={catalog.pokemon.find(
                        (s) => s.name === p.species,
                      )}
                    />
                    <strong>{p.species}</strong>
                    <span>
                      {p.hp <= 0
                        ? "Desmaiado"
                        : p.active
                          ? "Em campo"
                          : `${Math.round(p.hp * 100)}% HP`}
                    </span>
                  </button>
                ))}
              </div>
              {state.trapped && (
                <p className="battle-note">
                  Seu Pokémon está preso e não pode trocar agora.
                </p>
              )}
            </>
          )}
        </>
      ) : null}
      <details className="battle-log" open>
        <summary>Registro da batalha ({state.logs.length} eventos)</summary>
        <ol ref={logList}>
          {state.logs.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ol>
      </details>
      {!state.finished && (
        <div className="battle-footer">
          <button className="secondary" disabled={busy} onClick={onRefresh}>
            Atualizar estado
          </button>
          <button className="danger-button" disabled={busy} onClick={onForfeit}>
            Desistir da batalha
          </button>
        </div>
      )}
    </section>
  );
}
