import PokemonImage from "./PokemonImage.jsx";
import TypeBadges from "./TypeBadges.jsx";
import Stats from "./Stats.jsx";
import { numberLabel, TYPE_COLORS } from "../utils/pokemon.js";
import "../css/PokemonCard.css";

export default function PokemonCard({
  pokemon,
  favorite,
  onFavorite,
  onSelect,
}) {
  return (
    <article
      className="pokemon-card"
      style={{ "--accent": TYPE_COLORS[pokemon.types[0]?.name] || "#b5a4c8" }}
    >
      <div className="card-top">
        <span className="number">{numberLabel(pokemon.id)}</span>
        <button
          className="favorite"
          aria-label={`${favorite ? "Remover" : "Adicionar"} ${pokemon.name} ${favorite ? "dos" : "aos"} favoritos`}
          aria-pressed={favorite}
          onClick={() => onFavorite(pokemon.id)}
        >
          {favorite ? "★" : "☆"}
        </button>
      </div>
      <button
        className="pokemon-select"
        onClick={() => onSelect(pokemon)}
        aria-label={`Ver detalhes de ${pokemon.name}`}
      >
        <div className="pokemon-art">
          <PokemonImage key={pokemon.id} pokemon={pokemon} />
        </div>
        <h3>{pokemon.name}</h3>
        <TypeBadges types={pokemon.types} />
      </button>
      <Stats stats={pokemon.stats} compact />
      <button className="details-link" onClick={() => onSelect(pokemon)}>
        Explorar Pokémon <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}
