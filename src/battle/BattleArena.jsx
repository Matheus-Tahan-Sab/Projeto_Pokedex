import { useEffect, useRef, useState } from "react";
import PokemonImage from "../components/PokemonImage.jsx";
import { TYPE_COLORS, typeLabel } from "../utils/pokemon.js";

const STATUS_LABELS = {
  brn: "Queimado",
  par: "Paralisado",
  psn: "Envenenado",
  tox: "Intoxicado",
  slp: "Dormindo",
  frz: "Congelado",
  fnt: "Desmaiado",
};
const displayName = (name) => name.replace(/\s*\((?:você|bot)\)/g, "");
const entryFor = (catalog, species) =>
  catalog.pokemon.find((p) => p.name === species);

function BattleSprite({ entry, back = false }) {
  const [failed, setFailed] = useState(false);
  if (!entry) return <span className="pokeball" />;
  if (failed) return <PokemonImage pokemon={entry} />;
  return (
    <img
      className="battle-sprite"
      width="192"
      height="192"
      alt={entry.name}
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${back ? "back/" : ""}${entry.id}.png`}
      onError={() => setFailed(true)}
    />
  );
}

function HealthBar({ value, name }) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  return (
    <div
      className="health-track"
      role="meter"
      aria-label={`HP de ${name}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      style={{
        "--hp-color":
          percent > 50 ? "#36a86d" : percent > 25 ? "#c88b13" : "#d34e50",
      }}
    >
      <span style={{ width: `${percent}%` }} />
    </div>
  );
}

function Fighter({ pokemon, catalog, opponent = false }) {
  if (!pokemon) return null;
  const entry = entryFor(catalog, pokemon.species);
  const parts = pokemon.condition?.split(" ") || [];
  const hpParts = (parts[0] || "0").split("/").map(Number);
  const hp = opponent ? hpParts[0] / (hpParts[1] || 100) : pokemon.hp;
  const status = parts.includes("fnt") ? "fnt" : parts[1];
  return (
    <div
      className={`fighter ${opponent ? "opponent" : "player"} ${hp <= 0 ? "is-fainted" : ""}`}
    >
      <div className="fighter-hud">
        <div className="fighter-name">
          <h3>{pokemon.species}</h3>
          <span> Nv. 50</span>
        </div>
        <HealthBar value={hp} name={pokemon.species} />
        <div className="fighter-condition">
          <span>
            {opponent ? `${Math.round(hp * 100)}%` : `${parts[0]} HP`}
          </span>
          {status && (
            <strong className={`status-badge status-${status}`}>
              {STATUS_LABELS[status] || status}
            </strong>
          )}
        </div>
      </div>
      <div className="fighter-art" key={pokemon.species}>
        <BattleSprite entry={entry} back={!opponent} />
      </div>
    </div>
  );
}

function TeamRail({ name, team, catalog, opponent = false }) {
  return (
    <div className={`team-rail ${opponent ? "opponent-rail" : "player-rail"}`}>
      <span className="trainer-token" aria-hidden="true">
        {name.slice(0, 1)}
      </span>
      <div>
        <strong>{name}</strong>
        <span>{opponent ? "ADVERSÁRIO" : "SUA EQUIPE"}</span>
      </div>
      <div className="rail-roster" aria-label={`Equipe de ${name}`}>
        {team.map((p, index) => {
          const entry = entryFor(catalog, p.species);
          return (
            <span
              key={index}
              className={`roster-slot ${p.hp === 0 ? "fainted" : ""} ${p.active ? "active" : ""}`}
              title={`${p.species}${p.hp === 0 ? " · Desmaiado" : ""}`}
            >
              {entry ? (
                <PokemonImage pokemon={entry} />
              ) : (
                <span className="pokeball" />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function TeamChoices({ state, catalog, busy, onAction, preview = false }) {
  return (
    <div className="battle-team">
      {state.team.map((p) => (
        <button
          key={p.slot}
          className={`team-choice ${p.active && !preview ? "is-active" : ""} ${!preview && p.hp <= 0 ? "is-fainted" : ""}`}
          disabled={
            busy ||
            (!preview &&
              (p.active || p.hp <= 0 || (state.trapped && !state.forceSwitch)))
          }
          onClick={() => onAction(preview ? "lead" : "switch", p.slot)}
        >
          <PokemonImage pokemon={entryFor(catalog, p.species)} />
          <strong>{p.species}</strong>
          <span>
            {preview
              ? "Escolher inicial"
              : p.hp <= 0
                ? "Desmaiado"
                : p.active
                  ? "Em campo"
                  : `${Math.round(p.hp * 100)}% HP`}
          </span>
          {!preview && <HealthBar value={p.hp} name={p.species} />}
        </button>
      ))}
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
  const followLog = useRef(true);
  const actionHeading = useRef(null);
  const [confirmForfeit, setConfirmForfeit] = useState(false);
  const active = state.team.find((p) => p.active);
  useEffect(() => {
    if (logList.current && followLog.current)
      logList.current.scrollTop = logList.current.scrollHeight;
  }, [state.logs.length, state.turn]);
  useEffect(() => {
    if (!busy) actionHeading.current?.focus({ preventScroll: true });
  }, [busy, state.preview, state.forceSwitch, state.finished]);
  const prompt = state.finished
    ? "Batalha encerrada"
    : state.preview
      ? "Quem entra primeiro?"
      : busy
        ? "Resolvendo a ação…"
        : state.forceSwitch
          ? "Escolha um substituto"
          : `O que ${active?.species || "seu Pokémon"} vai fazer?`;
  return (
    <section
      className="battle-arena showdown-arena"
      aria-labelledby="arena-title"
      aria-busy={busy}
    >
      <div className="arena-heading">
        <div>
          <span className="eyebrow">NATIONAL DEX · INDIVIDUAL · NÍVEL 50</span>
          <h3 id="arena-title">
            {displayName(state.names.p1)} <span>vs.</span> {displayName(state.names.p2)}
          </h3>
        </div>
        <div className="arena-tags">
          <span>
            Bot{" "}
            {
              { easy: "fácil", medium: "médio", hard: "difícil" }[
                state.difficulty
              ]
            }
          </span>
          <strong>
            {state.preview ? "Prévia das equipes" : `Turno ${state.turn}`}
          </strong>
        </div>
      </div>
      {error && (
        <div className="battle-error" role="alert">
          {error}
          <button className="secondary" disabled={busy} onClick={onRefresh}>
            Atualizar batalha
          </button>
        </div>
      )}
      <div className="battle-workspace">
        <div className="battle-main">
          <div
            className={`battle-stage ${state.preview ? "stage-preview" : ""}`}
          >
            <TeamRail
              name={displayName(state.names.p2)}
              team={state.opponentPreview}
              catalog={catalog}
              opponent
            />
            <div className="battle-field" aria-label="Campo de batalha">
              <div className="field-horizon" aria-hidden="true" />
              <span
                className="field-platform platform-opponent"
                aria-hidden="true"
              />
              <span
                className="field-platform platform-player"
                aria-hidden="true"
              />
              <span className="field-turn">
                {state.preview ? "PREPARAÇÃO" : `TURNO ${state.turn}`}
              </span>
              {state.preview ? (
                <div className="field-preview-message">
                  <span className="pokeball" />
                  <strong>A batalha começa com sua escolha.</strong>
                  <span>
                    Conheça as equipes e escolha seu primeiro Pokémon abaixo.
                  </span>
                </div>
              ) : (
                <>
                  <Fighter pokemon={active} catalog={catalog} />
                  <Fighter
                    pokemon={state.opponent}
                    catalog={catalog}
                    opponent
                  />
                </>
              )}
            </div>
            <TeamRail
              name={displayName(state.names.p1)}
              team={state.team}
              catalog={catalog}
            />
          </div>
          <div className="battle-controls">
            <div
              className="battle-instruction"
              role="status"
              ref={actionHeading}
              tabIndex={-1}
            >
              <span
                className={`action-light ${busy ? "busy" : ""}`}
                aria-hidden="true"
              />
              {prompt}
            </div>
            {state.finished ? (
              <div className="battle-result" role="status">
                <span className="eyebrow">RESULTADO FINAL</span>
                <h3>
                  {state.winner
                    ? state.winner === state.names.p1
                      ? "Você venceu!"
                      : `${displayName(state.names.p2)} venceu!`
                    : "Empate!"}
                </h3>
                <p>Partida encerrada em {state.turn} turnos.</p>
                <button className="primary" disabled={busy} onClick={onReset}>
                  Preparar outra batalha
                </button>
              </div>
            ) : state.preview ? (
              <div className="battle-preview">
                <p className="battle-note">
                  Escolha seu Pokémon inicial. Você poderá trocar durante a
                  batalha.
                </p>
                <TeamChoices
                  state={state}
                  catalog={catalog}
                  busy={busy}
                  onAction={onAction}
                  preview
                />
              </div>
            ) : (
              <>
                {!state.forceSwitch && (
                  <div className="move-section">
                    <h4>
                      ATACAR <span>Escolha um golpe</span>
                    </h4>
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
                          <span className="move-meta">
                            <span className="move-type">
                              {typeLabel(move.type)}
                            </span>
                            <span>
                              {
                                {
                                  Physical: "Físico",
                                  Special: "Especial",
                                  Status: "Status",
                                }[move.category]
                              }
                            </span>
                            <span className="move-pp">
                              PP <b>{move.pp}</b>/{move.maxpp}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="switch-section">
                  <h4>
                    {state.forceSwitch ? "ENVIAR POKÉMON" : "TROCAR"}
                    <span>
                      {state.forceSwitch
                        ? "Seu Pokémon saiu de campo"
                        : "Selecione um integrante da equipe"}
                    </span>
                  </h4>
                  <TeamChoices
                    state={state}
                    catalog={catalog}
                    busy={busy}
                    onAction={onAction}
                  />
                  {state.trapped && !state.forceSwitch && (
                    <p className="battle-note">
                      Seu Pokémon está preso e não pode trocar agora.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <aside className="battle-history" aria-labelledby="history-title">
          <div className="history-heading">
            <span className="eyebrow">AO VIVO</span>
            <h4 id="history-title">Registro da batalha</h4>
            <span>{state.logs.length} eventos</span>
          </div>
          <ol
            className="battle-events"
            ref={logList}
            tabIndex={0}
            aria-label="Histórico de turnos"
            onScroll={(event) => {
              const list = event.currentTarget;
              followLog.current =
                list.scrollHeight - list.scrollTop - list.clientHeight < 40;
            }}
          >
            {state.logs.map((line, index) => (
              <li
                key={`${index}-${line}`}
                className={
                  line.startsWith("— Turno")
                    ? "log-turn"
                    : /venceu|empate/.test(line)
                      ? "log-result"
                      : ""
                }
              >
                {displayName(line)}
              </li>
            ))}
            {state.logs.length === 0 && (
              <li>Aguardando a escolha dos Pokémon iniciais.</li>
            )}
          </ol>
          <div className="history-footnote">
            {busy
              ? "Processando turno…"
              : state.finished
                ? "Partida concluída"
                : "Aguardando sua escolha"}
          </div>
        </aside>
      </div>
      {!state.finished && (
        <div className="battle-footer">
          <span className="battle-note">
            Batalha local · Escolha seus comandos no seu ritmo.
          </span>
          <div className="battle-footer-actions">
            <button className="secondary" disabled={busy} onClick={onRefresh}>
              Atualizar estado
            </button>
            {confirmForfeit ? (
              <div className="forfeit-confirm">
                <span>Encerrar a partida?</span>
                <button
                  className="danger-button"
                  disabled={busy}
                  onClick={() => {
                    setConfirmForfeit(false);
                    onForfeit();
                  }}
                >
                  Sim, desistir
                </button>
                <button
                  className="secondary"
                  onClick={() => setConfirmForfeit(false)}
                >
                  Continuar jogando
                </button>
              </div>
            ) : (
              <button
                className="danger-button"
                disabled={busy}
                onClick={() => setConfirmForfeit(true)}
              >
                Desistir
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
