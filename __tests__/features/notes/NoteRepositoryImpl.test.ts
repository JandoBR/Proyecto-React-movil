import { NoteLocalDataSource } from "@/src/features/notes/data/datasources/NoteLocalDataSource";
import { NoteRepositoryImpl } from "@/src/features/notes/data/repositories/NoteRepositoryImpl";
import { Note } from "@/src/features/notes/domain/entities/Note";

// In-memory data source: tests the repository's logic without touching storage.
class InMemoryNoteDataSource implements NoteLocalDataSource {
  notes: Note[] = [];
  async getAll() {
    return this.notes;
  }
  async saveAll(notes: Note[]) {
    this.notes = notes;
  }
}

describe("NoteRepositoryImpl", () => {
  let ds: InMemoryNoteDataSource;
  let repo: NoteRepositoryImpl;

  beforeEach(() => {
    ds = new InMemoryNoteDataSource();
    repo = new NoteRepositoryImpl(ds);
  });

  it("adds a trimmed note", async () => {
    const note = await repo.addNote("  Buy milk  ");
    expect(note.text).toBe("Buy milk");
    expect(note.done).toBe(false);
    expect(ds.notes).toHaveLength(1);
  });

  it("rejects empty notes", async () => {
    await expect(repo.addNote("   ")).rejects.toThrow("Note text cannot be empty");
    expect(ds.notes).toHaveLength(0);
  });

  it("returns newest notes first", async () => {
    ds.notes = [
      { id: "a", text: "old", done: false, createdAt: 1 },
      { id: "b", text: "new", done: false, createdAt: 2 },
    ];
    expect((await repo.getNotes()).map((n) => n.id)).toEqual(["b", "a"]);
  });

  it("toggles and deletes notes", async () => {
    const note = await repo.addNote("Task");
    await repo.toggleNote(note.id);
    expect(ds.notes[0].done).toBe(true);
    await repo.deleteNote(note.id);
    expect(ds.notes).toHaveLength(0);
  });
});
