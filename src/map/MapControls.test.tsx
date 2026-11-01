import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MapControls from "./MapControls";

describe("MapControls", () => {
  test("calls the matching map action", () => {
    const onZoomIn = jest.fn();
    const onZoomOut = jest.fn();
    const onReset = jest.fn();

    render(
      <MapControls
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onReset}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Recenter map" }));

    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
