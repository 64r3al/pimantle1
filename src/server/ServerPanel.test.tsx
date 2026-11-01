import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import ServerPanel from "./ServerPanel.component";

describe("ServerPanel", () => {
  test("shows the connecting state without disconnect controls", () => {
    render(
      <ServerPanel
        socketState="connecting"
        playersOnline={0}
        socketDisconnectCallback={jest.fn()}
      />
    );

    expect(screen.getByText("Connecting multiplayer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Disconnect" })).not.toBeInTheDocument();
  });

  test("shows live players and invokes the disconnect handler", () => {
    const disconnect = jest.fn();

    render(
      <ServerPanel
        socketState="connected"
        playersOnline={7}
        socketDisconnectCallback={disconnect}
      />
    );

    expect(screen.getByText("Multiplayer live")).toBeInTheDocument();
    expect(screen.getByText("7 online")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  test("shows an offline state and a reconnect action", () => {
    render(
      <ServerPanel
        socketState="closed"
        playersOnline={0}
        socketDisconnectCallback={jest.fn()}
      />
    );

    expect(screen.getByText("Multiplayer offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconnect" })).toBeInTheDocument();
  });
});
