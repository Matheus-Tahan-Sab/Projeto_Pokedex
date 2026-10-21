import { getCatalog } from "./catalog.js";
import { BattleSession } from "./battle.js";

const TTL = 60 * 60 * 1000;
export function createBattleApi() {
  const sessions = new Map();
  function cleanup() {
    for (const [id, session] of sessions)
      if (Date.now() - session.lastAccess > TTL && !session.busy) {
        session.destroy();
        sessions.delete(id);
      }
  }
  function json(response, status, body) {
    response.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(body));
  }
  async function readBody(request) {
    if (!request.headers["content-type"]?.startsWith("application/json"))
      throw new Error("Envie os dados em JSON.");
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (Buffer.byteLength(body) > 32768)
        throw new Error("O time enviado excede o limite permitido.");
    }
    try {
      return JSON.parse(body);
    } catch {
      throw new Error("JSON inválido.");
    }
  }
  async function middleware(request, response, next) {
    const url = new URL(request.url, "http://localhost");
    if (!url.pathname.startsWith("/api/")) return next();
    // This API is local and same-origin. Do not accept commands from another site.
    const origin = request.headers.origin;
    if (
      origin &&
      origin !== `http://${request.headers.host}` &&
      origin !== `https://${request.headers.host}`
    )
      return json(response, 403, { error: "Origem não autorizada." });
    cleanup();
    try {
      if (request.method === "GET" && url.pathname === "/api/catalog")
        return json(response, 200, getCatalog());
      if (request.method === "POST" && url.pathname === "/api/battles") {
        if (sessions.size >= 24)
          return json(response, 429, {
            error: "Há muitas batalhas abertas. Encerre uma para continuar.",
          });
        const session = new BattleSession(await readBody(request));
        sessions.set(session.id, session);
        try {
          return json(response, 201, await session.ready());
        } catch (error) {
          session.destroy();
          sessions.delete(session.id);
          throw error;
        }
      }
      const match = url.pathname.match(
        /^\/api\/battles\/([\w-]+)(?:\/(choice|forfeit))?$/,
      );
      if (!match) return json(response, 404, { error: "Rota inexistente." });
      const session = sessions.get(match[1]);
      if (!session)
        return json(response, 404, {
          error:
            "Batalha expirada ou servidor reiniciado. Inicie outra batalha.",
        });
      if (request.method === "GET" && !match[2])
        return json(response, 200, session.snapshot());
      if (request.method === "DELETE" && !match[2]) {
        if (session.busy) throw new Error("Aguarde a ação atual terminar.");
        session.destroy();
        sessions.delete(session.id);
        return json(response, 200, { ok: true });
      }
      if (request.method === "POST" && match[2] === "choice")
        return json(
          response,
          200,
          await session.choose(await readBody(request)),
        );
      if (request.method === "POST" && match[2] === "forfeit")
        return json(response, 200, await session.forfeit());
      return json(response, 405, { error: "Método não permitido." });
    } catch (error) {
      return json(response, 400, {
        error: error.message || "Não foi possível processar a batalha.",
      });
    }
  }
  return {
    middleware,
    close() {
      for (const session of sessions.values()) session.destroy();
      sessions.clear();
    },
  };
}
