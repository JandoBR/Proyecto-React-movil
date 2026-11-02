import { NoteLocalDataSourceImpl } from "@/src/features/notes/data/datasources/NoteLocalDataSourceImpl";
import { NoteRepositoryImpl } from "@/src/features/notes/data/repositories/NoteRepositoryImpl";
import { ILocalPreferences } from "../iLocalPreferences";
import { LocalPreferencesAsyncStorage } from "../LocalPreferencesAsyncStorage";
import { Container } from "./container";
import { TOKENS } from "./tokens";

// Composition root: the only place that knows which implementation backs each interface.
// To switch a feature to another backend (e.g. Roble), change the data source created here.
export function createAppContainer(): Container {
  const c = new Container();

  const prefs: ILocalPreferences = LocalPreferencesAsyncStorage.getInstance();
  c.register(TOKENS.LocalPreferences, prefs);

  const noteDS = new NoteLocalDataSourceImpl(prefs);
  const noteRepo = new NoteRepositoryImpl(noteDS);
  c.register(TOKENS.NoteLocalDS, noteDS).register(TOKENS.NoteRepo, noteRepo);

  return c;
}
