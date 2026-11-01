import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import MapControls from "./MapControls";

describe("MapControls", () => {
  test("calls the matching map action", () => {
    const onZoomIn = jest.fn();
    const onZoomOut = jest.fn();
    const onRecenter = jest.fn();
    const onResetView = jest.fn();

    render(
      <MapControls
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onRecenter={onRecenter}
        onResetView={onResetView}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    fireEvent.click(screen.getByRole("button", { name: "Recenter map" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset map view" }));

    expect(onZoomIn).toHaveBeenCalledTimes(1);
    expect(onZoomOut).toHaveBeenCalledTimes(1);
    expect(onRecenter).toHaveBeenCalledTimes(1);
    expect(onResetView).toHaveBeenCalledTimes(1);
  });
});
