import { Note } from "../../domain/entities/Note";
import { NoteRepository } from "../../domain/repositories/NoteRepository";
import { NoteLocalDataSource } from "../datasources/NoteLocalDataSource";

export class NoteRepositoryImpl implements NoteRepository {
  constructor(private readonly dataSource: NoteLocalDataSource) {}

  async getNotes(): Promise<Note[]> {
    const notes = await this.dataSource.getAll();
    return [...notes].sort((a, b) => b.createdAt - a.createdAt);
  }

  async addNote(text: string): Promise<Note> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Note text cannot be empty");

    const note: Note = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      done: false,
      createdAt: Date.now(),
    };
    const notes = await this.dataSource.getAll();
    await this.dataSource.saveAll([...notes, note]);
    return note;
  }

  async toggleNote(id: string): Promise<void> {
    const notes = await this.dataSource.getAll();
    await this.dataSource.saveAll(notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.dataSource.getAll();
    await this.dataSource.saveAll(notes.filter((n) => n.id !== id));
  }
}
