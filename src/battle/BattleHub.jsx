import { useEffect, useState } from "react";
import {
  battleApi,
  readSavedTeam,
  savedBattleId,
  rememberBattle,
} from "./api.js";
import TeamBuilder from "./TeamBuilder.jsx";
import BattleArena from "./BattleArena.jsx";
import "./battle.css";

function restoreTeam(catalog) {
  return readSavedTeam().map((set) => {
    const entry = catalog.pokemon.find((p) => p.name === set?.species);
    if (!entry) return null;
    return {
      ...structuredClone(entry.preset),
      ability: entry.abilities.includes(set.ability)
        ? set.ability
        : entry.preset.ability,
      item: catalog.items.includes(set.item) ? set.item : entry.preset.item,
      moves: Array.isArray(set.moves)
        ? [
            ...new Set(set.moves.filter((id) => entry.moveIds.includes(id))),
          ].slice(0, 4)
        : [...entry.preset.moves],
    };
  });
}
export default function BattleHub() {
  const [catalog, setCatalog] = useState(null);
  const [team, setTeam] = useState(Array(6).fill(null));
  const [mode, setMode] = useState("trainer");
  const [trainerId, setTrainerId] = useState(1);
  const [opponentId, setOpponentId] = useState(2);
  const [difficulty, setDifficulty] = useState("medium");
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setBusy(true);
      setError("");
      try {
        const result = await battleApi("catalog", {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setTeam(restoreTeam(result));
        setCatalog(result);
        const id = savedBattleId();
        if (id) {
          try {
            const battle = await battleApi(`battles/${id}`, {
              signal: controller.signal,
            });
            if (!controller.signal.aborted) setState(battle);
          } catch (error) {
            if (controller.signal.aborted) return;
            if (error.status === 404) rememberBattle(null);
            setError(error.message);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    if (!catalog) return;
    try {
      localStorage.setItem("pokedex:team:v1", JSON.stringify(team));
      setStorageError("");
    } catch {
      setStorageError(
        "Não foi possível salvar o time neste navegador. Ele continua disponível enquanto esta tela estiver aberta.",
      );
    }
  }, [team, catalog]);
  async function start() {
    setBusy(true);
    setError("");
    try {
      const payload = {
        opponentId,
        difficulty,
        ...(mode === "trainer"
          ? { trainerId }
          : {
              team: team.map((set) =>
                set ? { ...set, moves: set.moves.filter(Boolean) } : null,
              ),
            }),
      };
      const battle = await battleApi("battles", {
        method: "POST",
        body: payload,
      });
      rememberBattle(battle.id);
      setState(battle);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function refresh() {
    if (!state) return;
    setBusy(true);
    setError("");
    try {
      setState(await battleApi(`battles/${state.id}`));
    } catch (error) {
      setError(error.message);
      if (error.status === 404) {
        rememberBattle(null);
        setState(null);
      }
    } finally {
      setBusy(false);
    }
  }
  async function action(kind, slot) {
    setBusy(true);
    setError("");
    try {
      setState(
        await battleApi(`battles/${state.id}/choice`, {
          method: "POST",
          body: { kind, slot, version: state.version },
        }),
      );
    } catch (error) {
      setError(error.message);
      // A lost HTTP response may already have advanced the turn. Refresh, never resend the action.
      try {
        setState(await battleApi(`battles/${state.id}`));
      } catch {
        /* Explicit refresh remains available. */
      }
    } finally {
      setBusy(false);
    }
  }
  async function forfeit() {
    setBusy(true);
    setError("");
    try {
      setState(
        await battleApi(`battles/${state.id}/forfeit`, {
          method: "POST",
          body: {},
        }),
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    setBusy(true);
    setError("");
    try {
      await battleApi(`battles/${state.id}`, { method: "DELETE" });
      rememberBattle(null);
      setState(null);
    } catch (error) {
      if (error.status === 404) {
        rememberBattle(null);
        setState(null);
      } else setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  if (!catalog)
    return (
      <div className="battle-loading" role="status">
        {error ? (
          <>
            <p>{error}</p>
            <button className="primary" onClick={() => setReload((n) => n + 1)}>
              Tentar novamente
            </button>
          </>
        ) : (
          "Preparando o simulador local…"
        )}
      </div>
    );
  if (state)
    return (
      <BattleArena
        state={state}
        catalog={catalog}
        busy={busy}
        error={error}
        onAction={action}
        onRefresh={refresh}
        onForfeit={forfeit}
        onReset={reset}
      />
    );
  const trainer = catalog.trainers.find((t) => t.id === trainerId);
  return (
    <div className="battle-setup">
      <div className="battle-intro">
        <span className="eyebrow">POKÉMON SHOWDOWN · NATIONAL DEX</span>
        <h3>Sua equipe. Sua estratégia.</h3>
        <p>
          Batalhas individuais por turnos, aqui na Pokédex. Escolha uma equipe e
          enfrente um treinador de Kanto.
        </p>
      </div>
      <div className="battle-mode" role="group" aria-label="Origem da equipe">
        <button
          aria-pressed={mode === "trainer"}
          onClick={() => setMode("trainer")}
        >
          Jogar como treinador
        </button>
        <button
          aria-pressed={mode === "custom"}
          onClick={() => setMode("custom")}
        >
          Montar meu time
        </button>
      </div>
      {mode === "trainer" ? (
        <div className="trainer-selection">
          <label>
            Seu treinador
            <select
              value={trainerId}
              onChange={(event) => setTrainerId(Number(event.target.value))}
            >
              {catalog.trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.pokemonIds.length} Pokémon
                </option>
              ))}
            </select>
          </label>
          <p>
            Equipe:{" "}
            {trainer.pokemonIds
              .map((id) => catalog.pokemon.find((p) => p.id === id)?.name)
              .join(" · ")}
          </p>
          <p className="battle-note">
            As equipes prontas preservam os integrantes do JSON, inclusive
            repetições. Alguns treinadores têm menos de seis Pokémon. Golpes,
            itens e habilidades são configurações iniciais validadas pelo
            Showdown.
          </p>
        </div>
      ) : (
        <TeamBuilder catalog={catalog} team={team} onChange={setTeam} />
      )}
      <div className="opponent-settings">
        <label>
          Treinador adversário
          <select
            value={opponentId}
            onChange={(event) => setOpponentId(Number(event.target.value))}
          >
            {catalog.trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.pokemonIds.length} Pokémon
              </option>
            ))}
          </select>
        </label>
        <label>
          Dificuldade do bot
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option value="easy">Fácil — decisões aleatórias</option>
            <option value="medium">Médio — avalia ataques</option>
            <option value="hard">Difícil — ataques e trocas</option>
          </select>
        </label>
      </div>
      <p className="battle-note">
        Todos jogam no nível 50. A dificuldade muda as decisões do bot, sem
        aumentar os atributos. Nesta versão não há Mega Evolução, golpes Z,
        Dynamax ou Terastalização.
      </p>
      {storageError && (
        <p className="battle-note" role="status">
          {storageError}
        </p>
      )}
      {error && (
        <div className="battle-error" role="alert">
          {error}
        </div>
      )}
      <button
        className="primary start-battle"
        disabled={
          busy ||
          (mode === "custom" &&
            team.some((set) => !set || !set.moves.some(Boolean)))
        }
        onClick={start}
      >
        {busy ? "Preparando batalha…" : "Iniciar batalha →"}
      </button>
    </div>
  );
}
