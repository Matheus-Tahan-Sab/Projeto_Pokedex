import { createBattleApi } from "./api.js";

// Runs only in Node: the simulator is never bundled into the browser.
export default function battlePlugin() {
  function install(server) {
    const api = createBattleApi();
    server.middlewares.use((request, response, next) => {
      void api.middleware(request, response, next).catch(next);
    });
    server.httpServer?.once("close", () => api.close());
  }
  return {
    name: "local-showdown-battles",
    configureServer: install,
    configurePreviewServer: install,
  };
}
