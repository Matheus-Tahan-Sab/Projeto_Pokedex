import PokemonImage from "./PokemonImage.jsx";
import { numberLabel } from "../utils/pokemon.js";
export default function Trainers({ trainers, pokemon, onSelect }) {
  const byId = new Map(pokemon.map((entry) => [entry.id, entry]));
  return (
    <div className="trainer-grid">
      {trainers.map((trainer) => (
        <article className="trainer-card" key={trainer.id}>
          <div className="trainer-heading">
            <span className="trainer-avatar" aria-hidden="true">
              {trainer.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </span>
            <div>
              <h3>{trainer.name}</h3>
              <p>
                {trainer.badges}{" "}
                {trainer.badges === 1 ? "insígnia" : "insígnias"}{" "}
                <span aria-hidden="true">◆</span>
              </p>
            </div>
            <span className="number">
              {String(trainer.id).padStart(2, "0")}
            </span>
          </div>
          <p className="eyebrow">
            EQUIPE · {trainer.pokemonIds.length} POKÉMON
          </p>
          <div className="trainer-team">
            {trainer.pokemonIds.map((id, slot) => {
              const entry = byId.get(id);
              return entry ? (
                <button
                  key={`${id}-${slot}`}
                  onClick={() => onSelect(entry)}
                  aria-label={`Ver ${entry.name}, posição ${slot + 1} da equipe de ${trainer.name}`}
                >
                  <PokemonImage pokemon={entry} />
                  <span>{entry.name}</span>
                  <small>{numberLabel(id)}</small>
                </button>
              ) : (
                <span key={`${id}-${slot}`}>Pokémon #{id} indisponível</span>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}
