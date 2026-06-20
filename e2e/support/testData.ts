import fs from "fs";
import path from "path";

const STATE_FILE = path.resolve(__dirname, "..", ".auth", "test-state.json");

export interface TestState {
  eventId: string;
  eventName: string;
  eventWithPhotosId: string;
  eventWithPhotosName: string;
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

/**
 * Helper que retorna apenas o ID do evento que já tem fotos seedadas.
 * Útil para specs que não precisam fazer upload (02, 05, etc).
 */
export function getTestEventWithPhotos(): { eventId: string; eventName: string } {
  const state = getTestEvent();
  return { eventId: state.eventWithPhotosId, eventName: state.eventWithPhotosName };
}
