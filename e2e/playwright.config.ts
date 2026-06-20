import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Permite usar: npx playwright test --env=staging
const envFile = process.env.PLAYWRIGHT_ENV === "staging" ? ".env.staging" : ".env";
dotenv.config({ path: path.resolve(__dirname, envFile) });

export default defineConfig({
  testDir: "./tests",
  globalSetup: require.resolve("./global-setup"),
  globalTeardown: require.resolve("./global-teardown"),

  // Os testes compartilham um único evento de teste criado no global-setup,
  // então rodam em série e em 1 worker pra evitar condição de corrida.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    // Isso substitui o "rodar e anotar manualmente": toda falha já vem
    // com screenshot, vídeo e trace prontos pra debugar sem reproduzir.
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
