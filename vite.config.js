import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import battlePlugin from "./server/plugin.js";

export default defineConfig({ plugins: [react(), battlePlugin()] });
