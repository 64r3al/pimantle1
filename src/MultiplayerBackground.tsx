import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { fabric } from "fabric";
import { Subject } from "rxjs";

const starShape = [
  { x: 4, y: -2 },
  { x: 0, y: -2 },
  { x: 3.5, y: 1 },
  { x: 2, y: -4 },
  { x: 0.5, y: 1 },
];

function mapToX(
  position: number,
  xRange: number[],
  canvas?: fabric.StaticCanvas
) {
  return (
    ((position - xRange[0]) / (xRange[1] - xRange[0])) *
    (canvas?.getWidth() ?? 0)
  );
}

function mapToY(
  position: number,
  yRange: number[],
  canvas?: fabric.StaticCanvas
) {
  return (
    (1 - (position - yRange[0]) / (yRange[1] - yRange[0])) *
    (canvas?.getHeight() ?? 0)
  );
}

function MultiplayerBackground({
  xRange,
  yRange,
  guessObservable,
}: {
  xRange: number[];
  yRange: number[];
  guessObservable: MutableRefObject<Subject<{ x: number; y: number }>>;
}) {
  const canvasRef = useRef<fabric.StaticCanvas | undefined>(undefined);

  const clearCanvas = useCallback(() => {
    canvasRef.current?.clear();
  }, []);

  const resizeCanvas = useCallback(() => {
    canvasRef.current?.setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  useEffect(() => {
    const canvas = new fabric.StaticCanvas("fabric-canvas");
    canvasRef.current = canvas;
    resizeCanvas();

    return () => {
      canvas.dispose();
      canvasRef.current = undefined;
    };
  }, [resizeCanvas]);

  useEffect(() => {
    const subscription = guessObservable.current
      .asObservable()
      .subscribe((guess) => {
        if (document.hidden) {
          return;
        }

        const left = mapToX(guess.x, xRange, canvasRef.current);
        const top = mapToY(guess.y, yRange, canvasRef.current);

        if (guess.x === 0 && guess.y === 0) {
          const star = new fabric.Polygon(starShape, {
            left,
            top,
            fill: "yellow",
            originX: "center",
            originY: "center",
            scaleX: 0,
            scaleY: 0,
            opacity: 0.25,
          });

          canvasRef.current?.add(
            star
              .animate("scaleX", 200, { duration: 1000 })
              .animate("scaleY", 200, { duration: 1000 })
              .animate("opacity", 0, {
                duration: 1000,
                onChange: canvasRef.current?.renderAll.bind(canvasRef.current),
                onComplete: () => {
                  canvasRef.current?.remove(star);
                },
              })
          );
        } else {
          const circle = new fabric.Circle({
            left,
            top,
            fill: "darkgreen",
            originX: "center",
            originY: "center",
            radius: 0,
            opacity: 1,
          });

          canvasRef.current?.add(
            circle
              .animate("radius", 50, { duration: 1000 })
              .animate("opacity", 0, {
                duration: 1000,
                onChange: canvasRef.current?.renderAll.bind(canvasRef.current),
                onComplete: () => {
                  canvasRef.current?.remove(circle);
                },
              })
          );
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [guessObservable, xRange, yRange]);

  useEffect(() => {
    window.addEventListener("mousedown", clearCanvas);
    window.addEventListener("touchstart", clearCanvas);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("mousedown", clearCanvas);
      window.removeEventListener("touchstart", clearCanvas);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [clearCanvas, resizeCanvas]);

  useEffect(() => {
    clearCanvas();
  }, [xRange, yRange, clearCanvas]);

  return <canvas id="fabric-canvas" className="background-canvas" />;
}

export default MultiplayerBackground;
