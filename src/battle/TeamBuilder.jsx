import { typeLabel } from "../utils/pokemon.js";
import PokemonImage from "../components/PokemonImage.jsx";

export default function TeamBuilder({ catalog, team, onChange }) {
  function update(slot, patch) {
    onChange(team.map((set, i) => (i === slot ? { ...set, ...patch } : set)));
  }
  const complete = team.filter(Boolean).length;
  return (
    <section className="team-builder" aria-labelledby="team-title">
      <div className="builder-heading">
        <div>
          <h3 id="team-title">
            Monte sua equipe <span>{complete}/6</span>
          </h3>
          <p>
            Escolha os seis integrantes, uma habilidade, um item opcional e de
            um a quatro golpes por Pokémon.
          </p>
        </div>
        <button
          className="secondary"
          onClick={() =>
            onChange(
              [25, 6, 9, 3, 65, 143].map((id) =>
                structuredClone(
                  catalog.pokemon.find((p) => p.id === id).preset,
                ),
              ),
            )
          }
        >
          Preencher equipe de exemplo
        </button>
      </div>
      <p className="battle-note">
        Nível 50 · Natureza neutra · Distribuição de atributos automática. Os
        golpes e habilidades seguem o Showdown; os dados originais da Pokédex
        permanecem preservados.
      </p>
      <div className="team-editor-grid">
        {team.map((set, slot) => {
          const species = catalog.pokemon.find((p) => p.name === set?.species);
          const availableMoves = species
            ? species.moveIds
                .map((id) => catalog.moves[id])
                .sort((a, b) => a.name.localeCompare(b.name))
            : [];
          return (
            <article className="team-editor" key={slot}>
              <div className="editor-heading">
                <strong>POSIÇÃO {slot + 1}</strong>
                {species && (
                  <button
                    className="text-button"
                    onClick={() =>
                      onChange(team.map((p, i) => (i === slot ? null : p)))
                    }
                    aria-label={`Remover Pokémon da posição ${slot + 1}`}
                  >
                    Limpar
                  </button>
                )}
              </div>
              <label>
                Pokémon {slot + 1}
                <select
                  value={species?.id || ""}
                  onChange={(event) => {
                    const chosen = catalog.pokemon.find(
                      (p) => p.id === Number(event.target.value),
                    );
                    onChange(
                      team.map((p, i) =>
                        i === slot
                          ? chosen
                            ? structuredClone(chosen.preset)
                            : null
                          : p,
                      ),
                    );
                  }}
                >
                  <option value="">Selecione um Pokémon</option>
                  {catalog.pokemon.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{String(p.id).padStart(3, "0")} {p.name}
                    </option>
                  ))}
                </select>
              </label>
              {species && (
                <>
                  <div className="editor-art">
                    <PokemonImage key={species.id} pokemon={species} />
                    <p>{species.types.map(typeLabel).join(" / ")}</p>
                  </div>
                  <label>
                    Habilidade
                    <select
                      value={set.ability}
                      onChange={(event) =>
                        update(slot, { ability: event.target.value })
                      }
                    >
                      {species.abilities.map((a) => (
                        <option key={a}>{a}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Item equipado
                    <select
                      value={set.item || ""}
                      onChange={(event) =>
                        update(slot, { item: event.target.value })
                      }
                    >
                      {catalog.items.map((item) => (
                        <option key={item} value={item}>
                          {item || "Sem item"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset>
                    <legend>Golpes</legend>
                    {Array.from({ length: 4 }, (_, i) => {
                      const selected = catalog.moves[set.moves[i]];
                      return (
                        <div className="move-editor" key={i}>
                          <label>
                            Golpe {i + 1}
                            <select
                              value={set.moves[i] || ""}
                              onChange={(event) => {
                                const next = Array.from(
                                  { length: 4 },
                                  (_, index) => set.moves[index] || "",
                                );
                                next[i] = event.target.value;
                                update(slot, { moves: next });
                              }}
                            >
                              <option value="">Sem golpe</option>
                              {availableMoves.map((m) => (
                                <option
                                  key={m.id}
                                  value={m.id}
                                  disabled={
                                    set.moves.includes(m.id) &&
                                    set.moves[i] !== m.id
                                  }
                                >
                                  {m.name} · {typeLabel(m.type)} ·{" "}
                                  {m.power || "Status"}
                                </option>
                              ))}
                            </select>
                          </label>
                          {selected && <small>{selected.description}</small>}
                        </div>
                      );
                    })}
                  </fieldset>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
