function ServerPanel({
  socketState,
  playersOnline,
  socketDisconnectCallback,
}: {
  socketState: string;
  playersOnline: number;
  socketDisconnectCallback: () => void;
}) {
  return (
    <div className={`server-panel server-${socketState}`} aria-live="polite">
      <span className={`connection-status connection-${socketState}`}>
        <span className="connection-dot" aria-hidden="true" />
        <span>
          {socketState === "connected"
            ? "Multiplayer live"
            : socketState === "connecting"
            ? "Connecting multiplayer"
            : "Multiplayer offline"}
        </span>
      </span>

      {socketState === "connected" && (
        <>
          <span
            className="player-count"
            title="Players online solving this puzzle"
          >
            <span aria-hidden="true">●</span> {playersOnline} online
          </span>
          <button
            type="button"
            className="disconnect-button"
            onClick={socketDisconnectCallback}
          >
            Disconnect
          </button>
        </>
      )}

      {socketState === "closed" && (
        <button
          type="button"
          className="reconnect-button"
          onClick={() => {
            localStorage.removeItem("pimantle-offline");
            window.setTimeout(() => window.location.reload(), 150);
          }}
        >
          Reconnect
        </button>
      )}
    </div>
  );
}

export default ServerPanel;
