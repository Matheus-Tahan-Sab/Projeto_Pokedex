import { useState } from "react";

// Images enrich the local dataset; an unavailable image never blocks the Pokédex.
export default function PokemonImage({ pokemon, ...props }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span
        className="image-fallback"
        role="img"
        aria-label={`Imagem indisponível de ${pokemon.name}`}
      >
        <span className="pokeball" />
        {pokemon.name}
      </span>
    );
  return (
    <img
      {...props}
      alt={pokemon.name}
      loading="lazy"
      width="180"
      height="180"
      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
      onError={() => setFailed(true)}
    />
  );
}
