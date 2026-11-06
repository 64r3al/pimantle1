import React from "react";

export type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  onResetView: () => void;
};

function MapControls({ onZoomIn, onZoomOut, onRecenter, onResetView }: MapControlsProps) {
  return (
    <div className="map-controls" role="group" aria-label="Map controls">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in" title="Zoom in">
        +
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out" title="Zoom out">
        −
      </button>
      <span className="map-control-divider" aria-hidden="true" />
      <button
        type="button"
        onClick={onRecenter}
        aria-label="Recenter map"
        title="Recenter map"
      >
        ⌖
      </button>
      <button
        type="button"
        onClick={onResetView}
        aria-label="Reset map view"
        title="Reset map view"
      >
        ↺
      </button>
    </div>
  );
}

export default React.memo(MapControls);
