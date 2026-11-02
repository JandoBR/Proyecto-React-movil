import { Note } from "../entities/Note";

// What the app can do with notes. Presentation depends on this interface, never on an implementation.
export interface NoteRepository {
  getNotes(): Promise<Note[]>;
  addNote(text: string): Promise<Note>;
  toggleNote(id: string): Promise<void>;
  deleteNote(id: string): Promise<void>;
}
