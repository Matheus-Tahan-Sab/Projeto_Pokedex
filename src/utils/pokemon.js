export const STAT_LABELS = {
  hp: "HP",
  attack: "Ataque",
  defense: "Defesa",
  specialAttack: "At. especial",
  specialDefense: "Def. especial",
  speed: "Velocidade",
};
export const TYPE_COLORS = {
  Normal: "#a8a69b",
  Fire: "#f28b53",
  Water: "#65a9ee",
  Grass: "#82bc6b",
  Electric: "#e9c750",
  Ice: "#74c9cd",
  Fighting: "#da795c",
  Poison: "#b28acc",
  Ground: "#c5a472",
  Flying: "#9aa9e6",
  Psychic: "#e78eaa",
  Bug: "#acbf52",
  Rock: "#b6a172",
  Ghost: "#9984c1",
  Dark: "#a49b94",
  Dragon: "#8b91e7",
  Steel: "#9eafb9",
};
export const numberLabel = (id) => `#${String(id).padStart(3, "0")}`;
export const totalStats = (pokemon) =>
  Object.values(pokemon.stats).reduce((sum, stat) => sum + stat, 0);
export function selectPokemon(
  pokemon,
  { query = "", type = "", sort = "id", favorites = null } = {},
) {
  const term = query.trim().toLocaleLowerCase("pt-BR").replace(/^#/, "");
  const numericId = /^\d+$/.test(term) ? Number(term) : null;
  return pokemon
    .filter(
      (entry) =>
        (!term ||
          entry.name.toLocaleLowerCase("pt-BR").includes(term) ||
          entry.id === numericId) &&
        (!type ||
          (type === "unknown"
            ? entry.types.length === 0
            : entry.types.some((item) => item.name === type))) &&
        (!favorites || favorites.includes(entry.id)),
    )
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "total") return totalStats(b) - totalStats(a) || a.id - b.id;
      if (sort in STAT_LABELS)
        return b.stats[sort] - a.stats[sort] || a.id - b.id;
      return a.id - b.id;
    });
}
