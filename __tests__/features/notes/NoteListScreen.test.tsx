import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { PaperProvider } from "react-native-paper";

import { Container } from "@/src/core/di/container";
import { DIProvider } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Note } from "@/src/features/notes/domain/entities/Note";
import { NoteRepository } from "@/src/features/notes/domain/repositories/NoteRepository";
import { NotesProvider } from "@/src/features/notes/presentation/context/NotesContext";
import NoteListScreen from "@/src/features/notes/presentation/screens/NoteListScreen";

const Stack = createNativeStackNavigator();

// Renders the screen with a fake repository injected through the DI container.
function renderWithRepo(repo: NoteRepository) {
  const container = new Container().register(TOKENS.NoteRepo, repo);
  return render(
    <DIProvider container={container}>
      <NotesProvider>
        <PaperProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Notes" component={NoteListScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </NotesProvider>
    </DIProvider>,
  );
}

const sample: Note[] = [{ id: "1", text: "Read chapter 3", done: false, createdAt: 1 }];

function fakeRepo(overrides: Partial<NoteRepository> = {}): NoteRepository {
  return {
    getNotes: jest.fn().mockResolvedValue(sample),
    addNote: jest.fn(),
    toggleNote: jest.fn().mockResolvedValue(undefined),
    deleteNote: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("NoteListScreen", () => {
  it("shows the notes from the repository", async () => {
    renderWithRepo(fakeRepo());
    expect(await screen.findByText("Read chapter 3")).toBeTruthy();
  });

  it("shows the empty state", async () => {
    renderWithRepo(fakeRepo({ getNotes: jest.fn().mockResolvedValue([]) }));
    expect(await screen.findByText("No notes yet. Tap + to add one.")).toBeTruthy();
  });

  it("asks the repository to delete a note", async () => {
    const repo = fakeRepo();
    renderWithRepo(repo);
    fireEvent.press(await screen.findByLabelText('Delete "Read chapter 3"'));
    expect(repo.deleteNote).toHaveBeenCalledWith("1");
  });

  it("shows repository errors", async () => {
    renderWithRepo(fakeRepo({ getNotes: jest.fn().mockRejectedValue(new Error("Storage unavailable")) }));
    expect(await screen.findByText("Storage unavailable")).toBeTruthy();
  });
});
