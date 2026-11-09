import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { PaperProvider } from "react-native-paper";

import { TaskFormModal } from "../../../src/features/workspace/components/WorkspaceForms";

function renderModal(visible: boolean, onClose = jest.fn()) {
  return render(
    <PaperProvider>
      <TaskFormModal
        visible={visible}
        members={[]}
        onClose={onClose}
        onSubmit={async () => true}
      />
    </PaperProvider>,
  );
}

describe("TaskFormModal", () => {
  it("renders nothing while it is closed", () => {
    renderModal(false);
    expect(screen.queryByText("Nueva tarea")).toBeNull();
  });

  it("renders the sheet when open and closes from the X", () => {
    const onClose = jest.fn();
    renderModal(true, onClose);
    expect(screen.getByText("Nueva tarea")).toBeTruthy();
    fireEvent.press(screen.getByTestId("workspace-form-close"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("TaskFormModal assignees", () => {
  it("submits every selected member", async () => {
    const onSubmit = jest.fn(async () => true);
    render(
      <PaperProvider>
        <TaskFormModal
          visible
          members={[
            { id: "u1", name: "Ana", avatarUrl: "", role: "", isOwner: true },
            { id: "u2", name: "Luis", avatarUrl: "", role: "", isOwner: false },
          ]}
          onClose={jest.fn()}
          onSubmit={onSubmit}
        />
      </PaperProvider>,
    );
    fireEvent.changeText(screen.getByPlaceholderText("Ej. Diseñar el prototipo en Figma"), "Prototipo");
    fireEvent.press(screen.getByTestId("assignee-u1"));
    fireEvent.press(screen.getByTestId("assignee-u2"));
    fireEvent.press(screen.getByText("Crear tarea"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        assignees: [
          expect.objectContaining({ id: "u1" }),
          expect.objectContaining({ id: "u2" }),
        ],
      }),
    );
  });
});
