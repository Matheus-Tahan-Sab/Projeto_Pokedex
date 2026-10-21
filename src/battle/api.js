export async function battleApi(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api/${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: signal || AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(
      "Não foi possível acessar o simulador local. Confira se npm run dev está aberto e tente atualizar a batalha.",
    );
  }
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "O simulador local não está disponível. Execute npm run dev na versão atual do projeto.",
    );
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error || "Falha ao processar a batalha.");
    error.status = response.status;
    throw error;
  }
  return result;
}
export function readSavedTeam() {
  try {
    const team = JSON.parse(localStorage.getItem("pokedex:team:v1") || "null");
    return Array.isArray(team) && team.length === 6
      ? team
      : Array(6).fill(null);
  } catch {
    return Array(6).fill(null);
  }
}
export function savedBattleId() {
  try {
    return sessionStorage.getItem("pokedex:battle:v1");
  } catch {
    return null;
  }
}
export function rememberBattle(id) {
  try {
    if (id) sessionStorage.setItem("pokedex:battle:v1", id);
    else sessionStorage.removeItem("pokedex:battle:v1");
  } catch {
    /* Navigation still works without storage. */
  }
}
