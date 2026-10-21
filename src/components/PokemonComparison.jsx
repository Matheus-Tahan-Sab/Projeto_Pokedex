import { useRef } from "react";
import PokemonImage from "./PokemonImage.jsx";
import TypeBadges from "./TypeBadges.jsx";
import { STAT_LABELS, totalStats } from "../utils/pokemon.js";

export default function PokemonComparison({ pokemon, onRemove, onClear }) {
  const heading = useRef(null);
  const rows = [...Object.entries(STAT_LABELS), ["total", "Total"]];
  return (
    <section className="comparison" aria-labelledby="comparison-title">
      <div className="comparison-heading">
        <h3 id="comparison-title" tabIndex={-1} ref={heading}>Compare os Pokémon</h3>
        {pokemon.length > 0 && <button className="text-button" onClick={() => { heading.current?.focus(); onClear(); }}>Limpar comparação</button>}
      </div>
      <p role="status">
        {pokemon.length === 0
          ? "Selecione Comparar em até dois cards para ver seus atributos lado a lado."
          : pokemon.length === 1
            ? `${pokemon[0].name} selecionado. Escolha mais um Pokémon no catálogo.`
            : `${pokemon[0].name} e ${pokemon[1].name} selecionados. Os maiores valores estão destacados; empates têm o mesmo valor.`}
      </p>
      {pokemon.length > 0 && (
        <>
          <div className="comparison-picks">
            {pokemon.map((entry) => (
              <div className="comparison-pick" key={entry.id}>
                <PokemonImage pokemon={entry} />
                <div><strong>{entry.name}</strong><TypeBadges types={entry.types} /></div>
                <button className="text-button" aria-label={`Remover ${entry.name} da comparação`} onClick={() => { heading.current?.focus(); onRemove(entry.id); }}>Remover</button>
              </div>
            ))}
          </div>
          {pokemon.length === 2 && (
            <div className="comparison-table-wrap" role="region" aria-label="Tabela comparativa de atributos" tabIndex={0}>
              <table className="comparison-table">
                <caption>Atributos base — um valor maior não determina sozinho o resultado de uma batalha.</caption>
                <thead><tr><th scope="col">Atributo</th>{pokemon.map((entry) => <th scope="col" key={entry.id}>{entry.name}</th>)}</tr></thead>
                <tbody>{rows.map(([key, label]) => {
                  const values = pokemon.map((entry) => key === "total" ? totalStats(entry) : entry.stats[key]);
                  return <tr key={key}><th scope="row">{label}</th>{values.map((value, index) => {
                    const higher = value > values[1 - index];
                    return <td key={pokemon[index].id} className={higher ? "higher-stat" : ""}>{value}{higher && <><span aria-hidden="true"> ↑</span><span className="sr-only"> (maior valor)</span></>}</td>;
                  })}</tr>;
                })}</tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
