import PokemonCard from "./PokemonCard.jsx";
import "../css/PokemonList.css";
export default function PokemonList({
  pokemon,
  favorites,
  onFavorite,
  onSelect,
  onReset,
}) {
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
    <div className="pokemon-grid">
      {pokemon.map((entry) => (
        <PokemonCard
          key={entry.id}
          pokemon={entry}
          favorite={favorites.includes(entry.id)}
          onFavorite={onFavorite}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
