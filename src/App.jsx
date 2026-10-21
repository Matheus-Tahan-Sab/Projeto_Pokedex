import { useEffect, useState } from "react";
import data from "./data/pokedex-data.json";
import PokemonComparison from "./components/PokemonComparison.jsx";
import PokemonList from "./components/PokemonList.jsx";
import PokemonDetails from "./components/PokemonDetails.jsx";
import SearchBar from "./components/SearchBar.jsx";
import Trainers from "./components/Trainers.jsx";
import BattleHub from "./battle/BattleHub.jsx";
import { selectPokemon } from "./utils/pokemon.js";
import "./css/App.css";

function readFavorites() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("pokedex:favorites:v1") || "[]",
    );
    return Array.isArray(saved)
      ? saved.filter(
          (id) =>
            Number.isInteger(id) &&
            data.pokemon.some((entry) => entry.id === id),
        )
      : [];
  } catch {
    return [];
  }
}
function readTheme() {
  try {
    return localStorage.getItem("pokedex:theme:v1") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export default function App() {
  const [theme, setTheme] = useState(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#171819" : "#ce293d");
    try {
      localStorage.setItem("pokedex:theme:v1", theme);
    } catch {
      /* The theme remains usable when storage is blocked. */
    }
  }, [theme]);
  const [page, setPage] = useState("pokemon");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("id");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(readFavorites);
  const [comparison, setComparison] = useState([]);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    try {
      localStorage.setItem("pokedex:favorites:v1", JSON.stringify(favorites));
    } catch {
      /* Favorites remain usable when storage is blocked. */
    }
  }, [favorites]);
  const visible = selectPokemon(data.pokemon, {
    query,
    type,
    sort,
    favorites: favoritesOnly ? favorites : null,
  });
  const types = data.types.filter((item) =>
    data.pokemon.some((entry) =>
      entry.types.some((entryType) => entryType.id === item.id),
    ),
  );
  function toggleCompare(id) {
    setComparison((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 2
          ? [...current, id]
          : current,
    );
  }
  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  function reset() {
    setQuery("");
    setType("");
    setSort("id");
    setFavoritesOnly(false);
  }
  return (
    <div className={`app-shell ${page === "battle" ? "battle-page" : ""}`}>
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="header">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            setPage("pokemon");
            reset();
          }}
        >
          <span className="pokeball" />
          <span>
            pokédex<span className="brand-dot">.</span>
          </span>
        </a>
        <nav aria-label="Navegação principal">
          <button
            className={page === "pokemon" ? "active" : ""}
            aria-current={page === "pokemon" ? "page" : undefined}
            onClick={() => setPage("pokemon")}
          >
            Pokémon
          </button>
          <button
            className={page === "trainers" ? "active" : ""}
            aria-current={page === "trainers" ? "page" : undefined}
            onClick={() => setPage("trainers")}
          >
            Treinadores
          </button>
          <button
            className={page === "battle" ? "active" : ""}
            aria-current={page === "battle" ? "page" : undefined}
            onClick={() => setPage("battle")}
          >
            Batalhas
          </button>
        </nav>
        <div className="header-actions">
          <span className="edition">
            <span /> EDIÇÃO KANTO
          </span>
          <button
            className="theme-toggle"
            aria-label="Tema escuro — Ultra Ball"
            aria-pressed={theme === "dark"}
            onClick={() =>
              setTheme((current) => (current === "light" ? "dark" : "light"))
            }
            title={
              theme === "light"
                ? "Ativar tema Ultra Ball"
                : "Ativar tema Pokébola"
            }
          >
            <span className="theme-ball" aria-hidden="true" />
            <span>{theme === "light" ? "Pokébola" : "Ultra Ball"}</span>
            <span aria-hidden="true">{theme === "light" ? "☀" : "☾"}</span>
          </button>
        </div>
      </header>
      <main id="conteudo">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="status-dot" /> SEU GUIA PARA O MUNDO POKÉMON
            </span>
            <h1>
              Uma região.
              <br />
              <span>Infinitas descobertas.</span>
            </h1>
            <p>
              Dos primeiros parceiros aos grandes lendários.
              <br />
              Explore Kanto, conheça cada Pokémon e encontre seus favoritos.
            </p>
            <div className="hero-metrics">
              <div>
                <strong>{data.pokemon.length}</strong>
                <span>POKÉMON</span>
              </div>
              <div>
                <strong>{types.length}</strong>
                <span>TIPOS PRESENTES</span>
              </div>
              <div>
                <strong>{data.trainers.length}</strong>
                <span>TREINADORES</span>
              </div>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-ball">
              <i />
            </div>
            <span className="art-caption">
              GUIA DE CAMPO <b>001 — 151</b>
            </span>
            <span className="art-spark">✦</span>
          </div>
        </section>
        <section className="catalog" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">EXPLORE A REGIÃO</span>
              <h2 id="catalog-title">
                {page === "pokemon"
                  ? "Encontre seu próximo favorito"
                  : page === "battle"
                    ? "Arena de batalhas"
                    : "Conheça os treinadores"}
              </h2>
            </div>
            {page === "pokemon" && (
              <button
                className="random-button"
                onClick={() =>
                  setSelected(
                    data.pokemon[
                      Math.floor(Math.random() * data.pokemon.length)
                    ],
                  )
                }
              >
                <span aria-hidden="true">⤨</span> Pokémon aleatório
              </button>
            )}
          </div>
          {page === "pokemon" ? (
            <>
              <PokemonComparison
                pokemon={comparison.map((id) =>
                  data.pokemon.find((entry) => entry.id === id),
                )}
                onRemove={toggleCompare}
                onClear={() => setComparison([])}
              />
              <SearchBar
                query={query}
                onQuery={setQuery}
                type={type}
                onType={setType}
                types={types}
                sort={sort}
                onSort={setSort}
              />
              {comparison.length === 2 && (
                <button
                  className="text-button"
                  onClick={() => {
                    document.getElementById("comparison-title")?.focus();
                  }}
                >
                  Ver comparação selecionada ↑
                </button>
              )}
              <div className="results-bar">
                <div className="view-switch">
                  <button
                    className={!favoritesOnly ? "selected" : ""}
                    aria-pressed={!favoritesOnly}
                    onClick={() => setFavoritesOnly(false)}
                  >
                    Todos os Pokémon
                  </button>
                  <button
                    className={favoritesOnly ? "selected" : ""}
                    aria-pressed={favoritesOnly}
                    onClick={() => setFavoritesOnly(true)}
                  >
                    ☆ Favoritos <span>{favorites.length}</span>
                  </button>
                </div>
                <p role="status" aria-live="polite">
                  {visible.length} de {data.pokemon.length} Pokémon
                </p>
              </div>
              <PokemonList
                key={JSON.stringify([
                  query,
                  type,
                  sort,
                  favoritesOnly,
                  favoritesOnly ? favorites : null,
                ])}
                comparison={comparison}
                onCompare={toggleCompare}
                pokemon={visible}
                favorites={favorites}
                onFavorite={toggleFavorite}
                onSelect={setSelected}
                onReset={reset}
              />
            </>
          ) : page === "battle" ? (
            <BattleHub />
          ) : (
            <>
              <p className="section-description">
                As equipes e insígnias dos treinadores de Kanto. Selecione um
                Pokémon para explorar seus atributos.
              </p>
              <Trainers
                trainers={data.trainers}
                pokemon={data.pokemon}
                onSelect={setSelected}
              />
            </>
          )}
        </section>
      </main>
      <footer>
        <a className="brand" href="#">
          <span className="pokeball" /> pokédex.
        </a>
        <p>Feito para explorar. Criado para aprender.</p>
        <span>REACT + VITE / KANTO</span>
      </footer>
      {selected && (
        <PokemonDetails
          pokemon={selected}
          trainers={data.trainers.filter((trainer) =>
            trainer.pokemonIds.includes(selected.id),
          )}
          favorite={favorites.includes(selected.id)}
          onFavorite={toggleFavorite}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
