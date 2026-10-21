import { useEffect, useRef } from "react";
import PokemonImage from "./PokemonImage.jsx";
import TypeBadges from "./TypeBadges.jsx";
import Stats from "./Stats.jsx";
import { numberLabel, totalStats, TYPE_COLORS } from "../utils/pokemon.js";

export default function PokemonDetails({
  pokemon,
  trainers,
  favorite,
  onFavorite,
  onClose,
}) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="details-dialog"
      aria-labelledby="pokemon-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="details-content"
        style={{ "--accent": TYPE_COLORS[pokemon.types[0]?.name] || "#b5a4c8" }}
      >
        <button
          className="close-dialog"
          autoFocus
          onClick={onClose}
          aria-label="Fechar detalhes"
        >
          ×
        </button>
        <div className="detail-art">
          <span className="eyebrow">REGISTRO {numberLabel(pokemon.id)}</span>
          <PokemonImage key={pokemon.id} pokemon={pokemon} />
          <TypeBadges types={pokemon.types} />
        </div>
        <div className="detail-info">
          <span className="eyebrow">POKÉDEX / KANTO</span>
          <h2 id="pokemon-title">{pokemon.name}</h2>
          <p>Atributos base do registro da Pokédex.</p>
          <Stats stats={pokemon.stats} />
          <div className="total">
            <span>Total de atributos</span>
            <strong>{totalStats(pokemon)}</strong>
          </div>
          <h3>Treinadores relacionados</h3>
          <p>
            {trainers.length
              ? trainers.map((trainer) => trainer.name).join(" · ")
              : "Nenhum treinador associado nos dados."}
          </p>
          <button
            className="primary"
            aria-pressed={favorite}
            onClick={() => onFavorite(pokemon.id)}
          >
            {favorite ? "★ Remover dos favoritos" : "☆ Adicionar aos favoritos"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
