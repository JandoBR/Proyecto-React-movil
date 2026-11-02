import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Note } from "../../domain/entities/Note";
import { NoteRepository } from "../../domain/repositories/NoteRepository";

type NotesContextType = {
  notes: Note[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addNote: (text: string) => Promise<boolean>;
  toggleNote: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const di = useDI();
  const repo = useMemo(() => di.resolve<NoteRepository>(TOKENS.NoteRepo), [di]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Runs an action against the repository, then reloads the list.
  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      setError(null);
      try {
        await action();
        setNotes(await repo.getNotes());
        return true;
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [repo],
  );

  const refresh = useCallback(async () => {
    await run(async () => {});
  }, [run]);

  // Initial load: state is only set once the repository answers.
  useEffect(() => {
    let active = true;
    repo
      .getNotes()
      .then((loaded) => active && setNotes(loaded))
      .catch((e) => active && setError(e?.message ?? "Could not load notes"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [repo]);

  const value: NotesContextType = {
    notes,
    loading,
    error,
    refresh,
    addNote: (text) => run(() => repo.addNote(text)),
    toggleNote: async (id) => {
      await run(() => repo.toggleNote(id));
    },
    deleteNote: async (id) => {
      await run(() => repo.deleteNote(id));
    },
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used inside NotesProvider");
  return ctx;
}
