// One token per dependency registered in the container (see appContainer.ts).
export const TOKENS = {
  LocalPreferences: Symbol("LocalPreferences"),
  NoteLocalDS: Symbol("NoteLocalDS"),
  NoteRepo: Symbol("NoteRepo"),
} as const;
