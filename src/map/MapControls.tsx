import React from "react";

export type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

function MapControls({ onZoomIn, onZoomOut, onReset }: MapControlsProps) {
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
        onClick={onReset}
        aria-label="Recenter map"
        title="Recenter map"
      >
        ⌖
      </button>
    </div>
  );
}

export default React.memo(MapControls);
