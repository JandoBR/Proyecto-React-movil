import { Note } from "../../domain/entities/Note";

// Raw storage access. A remote data source (e.g. Roble) would implement a similar interface.
export interface NoteLocalDataSource {
  getAll(): Promise<Note[]>;
  saveAll(notes: Note[]): Promise<void>;
}
