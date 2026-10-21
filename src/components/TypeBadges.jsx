import { TYPE_COLORS } from "../utils/pokemon.js";
export default function TypeBadges({ types }) {
  return (
    <div className="type-badges">
      {types.length ? (
        types.map((type) => (
          <span
            key={type.id}
            style={{ "--type": TYPE_COLORS[type.name] || "#a8a69b" }}
          >
            {type.name}
          </span>
        ))
      ) : (
        <span>Não informado</span>
      )}
    </div>
  );
}
