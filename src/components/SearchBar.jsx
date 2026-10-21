import { STAT_LABELS } from "../utils/pokemon.js";
import "../css/SearchBar.css";
export default function SearchBar({
  query,
  onQuery,
  type,
  onType,
  types,
  sort,
  onSort,
}) {
  return (
    <div className="search-toolbar">
      <label className="search-field">
        <span aria-hidden="true">⌕</span>
        <span className="sr-only">Pesquisar por nome ou ID</span>
        <input
          type="search"
          placeholder="Qual Pokémon você procura? Nome ou #ID"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
        />
      </label>
      <label className="select-field">
        <span>Tipo</span>
        <select value={type} onChange={(event) => onType(event.target.value)}>
          <option value="">Todos os tipos</option>
          {types.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
          <option value="unknown">Não informado</option>
        </select>
      </label>
      <label className="select-field">
        <span>Ordenar por</span>
        <select value={sort} onChange={(event) => onSort(event.target.value)}>
          <option value="id">Número crescente</option>
          <option value="name">Nome A–Z</option>
          <option value="total">Total de atributos</option>
          {Object.entries(STAT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label} (maior primeiro)
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
