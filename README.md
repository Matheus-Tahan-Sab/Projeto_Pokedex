# Pokédex — Explorador de Kanto

Aplicação acadêmica em **React + Vite**, com interface responsiva em português e execução local. Implementa a primeira etapa do projeto: Pokédex e consulta de treinadores. Batalhas com Pokémon Showdown ficam para uma próxima etapa.

## Executar

Instale Node.js **22.12 ou superior** (recomendado: versão LTS). Na raiz do repositório:

```bash
npm install
npm run dev
```

Abra **http://127.0.0.1:5173** no navegador. Se a porta estiver ocupada, o Vite informa outra no terminal. Não é necessário hospedar a aplicação nem configurar banco de dados.

```bash
npm test        # testes de pesquisa, filtros, ordenação e integridade dos dados
npm run build   # gera dist/
npm run preview # prévia do build em http://127.0.0.1:4173
```

## Funcionalidades

- 151 Pokémon, com ID, nome, tipos e todos os seis atributos nos cards e detalhes.
- Pesquisa instantânea por nome (parcial, sem diferenciar maiúsculas) ou ID exato, inclusive `#025`.
- Filtro por tipo combinado com pesquisa e favoritos; opção para tipo não informado.
- Ordenação por número, nome, total e cada atributo (maior primeiro).
- Modal de detalhes com barras de atributos, soma e treinadores relacionados; fechamento por botão, Escape e clique no fundo.
- Favoritos persistidos em `localStorage`, com tratamento de armazenamento indisponível ou inválido.
- Seleção de Pokémon aleatório em todo o catálogo.
- Consulta dos 12 treinadores, insígnias e equipes; detalhes ao clicar nos integrantes.
- Layout responsivo, navegação por teclado e respeito à preferência de movimento reduzido.

## Melhorias de navegação

- Tipos exibidos em português, preservando os identificadores dos dados originais.
- Comparação de até dois Pokémon com atributos e total lado a lado; os maiores valores recebem destaque e indicação textual acessível.
- Catálogo em grupos de 24 com “Carregar mais”; pesquisa, filtros e ordenação continuam abrangendo todos os 151 registros.
- Temas Pokébola (claro) e Ultra Ball (escuro), com preferência salva no navegador.
- Controles com foco visível, alvos de toque ampliados e atributos mais legíveis em telas pequenas.

## Dados e imagens

A fonte principal é **`src/data/pokedex-data.json`**, disponibilizada pelo [professor](https://github.com/joaopauloaramuni/desenvolvimento-e-integracao-de-aplicacoes-web/blob/main/ATIVIDADES/ATIVIDADE%2003%20-%20JSON/data/pokedex-data.json). O conteúdo recebido no repositório foi preservado, corrigindo apenas o nome do arquivo (`poedex-data.json` → `pokedex-data.json`). Não atualizamos os atributos para gerações mais recentes: a atividade usa os dados fornecidos. Mew tem tipos vazios na fonte e aparece como “Não informado”. Pokémon repetidos nas equipes, como as de Koga e Lance, são mantidos.

As ilustrações são carregadas do repositório público [PokeAPI/sprites](https://github.com/PokeAPI/sprites), pelo ID, sem consultar uma API para obter atributos. Exemplo: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png`.

**Apenas as imagens externas precisam de internet durante o uso.** Se não carregarem, mostramos uma alternativa visual com o nome. Dados, pesquisa, filtros, detalhes e treinadores continuam disponíveis. A instalação inicial das dependências também exige internet. Pokémon e seus personagens pertencem aos respectivos titulares; projeto educacional sem afiliação oficial.

## Organização

- `src/App.jsx`: navegação e estados da aplicação.
- `src/components/`: cards, lista, busca, detalhes, imagens, tipos, atributos e treinadores.
- `src/utils/pokemon.js`: pesquisa, filtros, ordenação e constantes visuais.
- `src/data/pokedex-data.json`: dados originais da atividade.
- `src/css/` e `src/index.css`: estilos responsivos.
- `public/`: arquivos estáticos (ícone).
- `tests/`: testes com o runner nativo do Node.

O código React e a configuração do Vite ficam na raiz e em `src/`, seguindo a organização convencional do Vite. A pasta `public/` contém apenas arquivos estáticos.

## Próxima etapa

Integração local com o motor Pokémon Showdown, montagem/validação de times e estratégias do bot. A Pokédex permanece independente dessa etapa.
