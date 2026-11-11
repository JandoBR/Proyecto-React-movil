import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import { DateField } from "../../src/ui/date-field";

describe("DateField", () => {
  it("opens the calendar and picks a day of the shown month", () => {
    const onChange = jest.fn();
    render(
      <DateField
        label="Fecha límite"
        value={new Date(2026, 10, 3)}
        onChange={onChange}
      />,
    );
    fireEvent.press(screen.getByTestId("date-field"));
    expect(screen.getByText("Noviembre 2026")).toBeTruthy();

    fireEvent.press(screen.getByText("20"));
    const picked: Date = onChange.mock.calls[0][0];
    expect([picked.getFullYear(), picked.getMonth(), picked.getDate()]).toEqual([2026, 10, 20]);
  });

  it("can clear the date when allowed", () => {
    const onChange = jest.fn();
    render(
      <DateField label="Fecha límite" value={new Date(2026, 10, 3)} onChange={onChange} allowClear />,
    );
    fireEvent.press(screen.getByTestId("date-field"));
    fireEvent.press(screen.getByText("Quitar fecha"));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
