import { useState } from "react";
import PokemonCard from "./PokemonCard.jsx";
import "../css/PokemonList.css";
export default function PokemonList({
  pokemon,
  favorites,
  onFavorite,
  onSelect,
  onReset,
  comparison,
  onCompare,
}) {
  const [limit, setLimit] = useState(24);
  if (!pokemon.length)
    return (
      <div className="empty-state">
        <span className="pokeball" />
        <h3>Nenhum Pokémon por aqui</h3>
        <p>
          Tente outro nome, número ou tipo. Seus favoritos também aparecem nesta
          lista.
        </p>
        <button className="primary" onClick={onReset}>
          Limpar filtros
        </button>
      </div>
    );
  return (
    <>
    <div className="pokemon-grid" id="pokemon-grid">
      {pokemon.slice(0, limit).map((entry) => (
        <PokemonCard
          key={entry.id}
          pokemon={entry}
          comparing={comparison.includes(entry.id)}
          compareDisabled={comparison.length === 2 && !comparison.includes(entry.id)}
          onCompare={onCompare}
          favorite={favorites.includes(entry.id)}
          onFavorite={onFavorite}
          onSelect={onSelect}
        />
      ))}
    </div>
    <div className="load-more">
      <p role="status">Exibindo {Math.min(limit, pokemon.length)} de {pokemon.length} resultados</p>
      {limit < pokemon.length && (
        <button className="primary" aria-controls="pokemon-grid" onClick={() => {
          const nextId = pokemon[limit].id;
          setLimit((current) => current + 24);
          requestAnimationFrame(() => document.getElementById(`pokemon-${nextId}`)?.focus());
        }}>Carregar mais 24 Pokémon</button>
      )}
    </div>
    </>
  );
}
