import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import App from "../../App";

// End-to-end through the real container: screens -> context -> repository -> AsyncStorage (mocked).
describe("Notes flow", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("adds, completes and deletes a note", async () => {
    render(<App />);

    fireEvent.press(await screen.findByText("Notes"));
    expect(await screen.findByText("No notes yet. Tap + to add one.")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("Add note"));
    fireEvent.changeText(await screen.findByLabelText("Note"), "Study navigation");
    fireEvent.press(screen.getByText("Save"));

    expect(await screen.findByText("Study navigation")).toBeTruthy();
    expect(await AsyncStorage.getItem("notes")).toContain("Study navigation");

    fireEvent.press(screen.getByLabelText('Mark "Study navigation" as done'));
    expect(await screen.findByLabelText('Mark "Study navigation" as not done')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Delete "Study navigation"'));
    expect(await screen.findByText("No notes yet. Tap + to add one.")).toBeTruthy();
  });
});
