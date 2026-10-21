# Pokédex — Explorador de Kanto

Aplicação acadêmica em **React + Vite**, com interface responsiva em português e execução local. Inclui Pokédex, consulta de treinadores, montagem de equipes e batalhas locais usando o motor real do Pokémon Showdown.

## Executar

Instale Node.js **22.12 ou superior** (recomendado: versão LTS). Na raiz do repositório:

```bash
npm install
npm run dev
```

Abra **http://127.0.0.1:5173** no navegador. Se a porta estiver ocupada, o Vite informa outra no terminal. Não é necessário hospedar a aplicação nem configurar banco de dados.

```bash
npm test        # testes da Pokédex, simulação e API de batalhas
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

## Batalhas com Pokémon Showdown

Abra a aba **Batalhas** com `npm run dev` em execução. O mesmo comando inicia o frontend e a API local de simulação. Depois de `npm run build`, `npm run preview` também disponibiliza a API local. Abrir `dist/index.html` diretamente ou servir somente `dist/` em um servidor estático não executa as batalhas.

1. Escolha **Jogar como treinador** para usar a equipe de um dos 12 treinadores, ou **Montar meu time** para selecionar exatamente seis Pokémon.
2. No editor, selecione Pokémon, habilidade, item (opcional) e de um a quatro golpes distintos. As opções de golpes são específicas de cada espécie; o motor valida o time completo, inclusive incompatibilidades entre golpes de eventos. Existe um botão para preencher uma equipe de exemplo.
3. Escolha o adversário e a dificuldade e clique em **Iniciar batalha**.
4. Escolha quem entra primeiro. Em cada turno, selecione um golpe ou uma troca permitida. O motor resolve velocidade, acerto, dano, imunidade, status, habilidades e itens.
5. Após um desmaio, escolha um substituto. A partida termina com vitória, derrota, desistência ou empate. O registro mostra os principais eventos em português, mantendo os nomes oficiais de golpes em inglês.

### Interface da arena

- Campo em perspectiva, com sprites de frente para o adversário e de costas para o jogador; falhas de imagem usam a ilustração alternativa.
- HP com cores por faixa, status, nível e indicação do integrante em campo.
- Golpes em grade com tipo, categoria e PP; trocas em uma faixa da equipe.
- Histórico lateral no desktop e abaixo dos comandos no celular. A rolagem acompanha novos eventos enquanto você estiver no fim do histórico.
- Temas claro e escuro, foco de teclado após ações e confirmação antes de desistir.
- Transições de HP e entrada em campo respeitam a preferência de movimento reduzido. A interface apresenta o estado após cada turno, sem reproduzir uma sequência de animações de cada golpe.

### Regras desta versão

- Batalhas individuais, Pokémon de Kanto e formato **Gen 9 National Dex AG**, ajustado para nível **50**. É possível usar golpes de gerações anteriores quando legais nesse formato.
- Os atributos e tipos de combate vêm do Showdown. Os registros da Pokédex continuam utilizando o JSON do professor, que possui diferenças históricas (por exemplo, tipo de Clefairy e tipo ausente de Mew).
- Equipes de treinadores preservam o número de integrantes e repetições do JSON; algumas têm menos de seis Pokémon. Seus golpes, habilidades e itens são presets do projeto, não equipes oficiais dos jogos ou anime.
- Os seis espaços são obrigatórios apenas no time personalizado. Repetição de espécies e itens é permitida pelas regras AG.
- Natureza neutra, IVs padrão e EVs automáticos: 252 HP, 252 no maior atributo ofensivo base e 4 em Defesa Especial. Esse conjunto é aplicado igualmente a jogador e bot; não há editor avançado de EVs/IVs nesta etapa.
- Seleção inicial de 15 itens comuns, além de “Sem item”. Não há botões de Mega Evolução, golpes Z, Dynamax ou Terastalização.
- A partida empata automaticamente no turno 300 para encerrar situações prolongadas.

### Dificuldades

| Nível   | Estratégia                                                                                                                        |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Fácil   | Sorteia entre golpes e trocas disponíveis.                                                                                        |
| Médio   | Prioriza estimativa de ataque com tipo, bônus do próprio tipo, precisão e atributos; escolhe substitutos por combinação de tipos. |
| Difícil | Acrescenta cura, status, prioridade em situações de finalização e trocas quando o confronto é desfavorável.                       |

São estratégias heurísticas do projeto, não níveis oficiais de IA do Showdown nem um bot competitivo com busca de vários turnos. O bot recebe sua própria solicitação de ações e informações públicas do adversário. Ele não lê o golpe escolhido pelo jogador, os golpes não revelados, itens ou atributos privados do oponente.

### Armazenamento e recuperação

- O time personalizado é salvo no `localStorage` do navegador. Quando o armazenamento estiver bloqueado, ele pode ser usado na tela atual e a interface informa que não foi salvo.
- A identificação da última batalha fica no `sessionStorage` da aba. Ao navegar para outra seção ou recarregar, entre novamente em **Batalhas** para retomá-la.
- As sessões de batalha existem somente na memória do processo Node. Reiniciar o servidor encerra as partidas, mas mantém o time personalizado salvo no navegador. A interface permite iniciar outra partida se a anterior tiver expirado.
- Limite de 24 sessões simultâneas. Sessões inativas por uma hora são removidas na próxima chamada à API. “Preparar outra batalha” libera a sessão concluída.
- Cada ação exige a versão atual da solicitação do jogador. Ações duplicadas ou antigas são rejeitadas; após erro de rede, a interface consulta o estado em vez de reenviar o turno automaticamente.

### Implementação e fontes

- `server/catalog.js`: catálogo de Kanto, presets, golpes compatíveis e validação.
- `server/battle.js`: sessão, protocolo do motor, estado público e ações do jogador.
- `server/bot.js`: estratégias dos três níveis; sem acesso ao objeto interno da partida.
- `server/api.js` e `server/plugin.js`: API JSON local no processo do Vite, em desenvolvimento e prévia. As rotas são de mesma origem; mantenha o projeto em execução local como configurado.
- `src/battle/`: preparação, editor de equipe, arena, cliente HTTP e estilos.
- `tests/battle.test.js`: valida os 151 presets, equipes de treinadores, regras de montagem, PP, desmaios, trocas, vitória, desistência, dificuldades e ciclo HTTP.

Utiliza [`pokemon-showdown`](https://github.com/smogon/Pokemon-Showdown) **0.11.11** (MIT), com versão fixada para manter o protocolo integrado estável. Referências: [API Node](https://github.com/smogon/Pokemon-Showdown/blob/master/sim/README.md), [simulador](https://github.com/smogon/Pokemon-Showdown/blob/master/sim/SIMULATOR.md), [times e validação](https://github.com/smogon/Pokemon-Showdown/blob/master/sim/TEAMS.md) e [protocolo](https://github.com/smogon/Pokemon-Showdown/blob/master/sim/SIM-PROTOCOL.md).

Depois da instalação inicial, o motor roda localmente sem conta, chave de API ou conexão com os servidores públicos do Showdown. Apenas as imagens externas precisam de internet; falhas de imagem exibem uma alternativa com o nome e não impedem jogar.
