import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";

const APP_BASE = "/khmer-typing-master/";

export default defineConfig({
  base: APP_BASE,
  plugins: [
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      srcDirectory: "src",
      server: { entry: "server" },
    }),
    nitro({
      preset: "cloudflare-module",
      baseURL: APP_BASE,
    }),
    react(),
    tailwindcss(),
  ],
});
