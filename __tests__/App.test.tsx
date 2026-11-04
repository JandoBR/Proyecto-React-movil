import { render, screen } from "@testing-library/react-native";
import React from "react";

import App from "../App";

describe("App", () => {
  it("shows the Nexus splash and then the login screen", async () => {
    render(<App />);
    expect(await screen.findByText("NEXUS")).toBeTruthy();

    expect(
      await screen.findByText("¡Hola de nuevo!", {}, { timeout: 4000 }),
    ).toBeTruthy();
    expect(screen.getByText("Iniciar Sesión")).toBeTruthy();
  });
});
