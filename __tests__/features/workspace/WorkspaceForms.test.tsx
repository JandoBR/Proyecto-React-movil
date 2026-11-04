import { fireEvent, render, screen } from "@testing-library/react-native";
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
