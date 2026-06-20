import fs from "fs";
import path from "path";

const STATE_FILE = path.resolve(__dirname, "..", ".auth", "test-state.json");

export interface TestState {
  eventId: string;
  eventName: string;
  otherPhotographerId: string;
  otherEventId: string;
}

export function getTestEvent(): TestState {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(
      "Estado de teste não encontrado em .auth/test-state.json. O global-setup rodou antes dos testes?"
    );
  }
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
}
