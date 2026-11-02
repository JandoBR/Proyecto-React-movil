import { ILocalPreferences } from "@/src/core/iLocalPreferences";
import { Note } from "../../domain/entities/Note";
import { NoteLocalDataSource } from "./NoteLocalDataSource";

const NOTES_KEY = "notes";

export class NoteLocalDataSourceImpl implements NoteLocalDataSource {
  constructor(private readonly prefs: ILocalPreferences) {}

  getAll(): Promise<Note[]> {
    return this.prefs.getAllEntries<Note>(NOTES_KEY);
  }

  saveAll(notes: Note[]): Promise<void> {
    return this.prefs.replaceEntries<Note>(NOTES_KEY, notes);
  }
}
