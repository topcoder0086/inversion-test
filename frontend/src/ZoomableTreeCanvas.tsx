import React, { useState, useRef, useCallback, useEffect } from "react";

interface ZoomableTreeCanvasProps {
  children: React.ReactNode;
  resetKey?: any;
}

// Zoom + pan canvas, zooming around cursor position
export const ZoomableTreeCanvas: React.FC<ZoomableTreeCanvasProps> = ({ children, resetKey }) => {
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();

      const rect = e.currentTarget.getBoundingClientRect();
      const cursorX = e.clientX - rect.left - rect.width / 2;
      const cursorY = e.clientY - rect.top - rect.height / 2;

      const delta = -e.deltaY;
      const zoomFactor = 0.0015;
      let nextScale = scale + delta * zoomFactor;
      nextScale = Math.min(2.5, Math.max(0.2, nextScale));

      const scaleRatio = nextScale / scale;

      // adjust offset so point under cursor stays roughly fixed
      setOffset((prev) => ({
        x: prev.x - cursorX * (scaleRatio - 1),
        y: prev.y - cursorY * (scaleRatio - 1),
      }));

      setScale(nextScale);
    },
    [scale]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsPanning(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning || !lastPos.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const endPan = () => {
    setIsPanning(false);
    lastPos.current = null;
  };

  // Whenever resetKey changes (new search / new person),
  // recenter and reset zoom.
  useEffect(() => {
    setScale(0.8);
    setOffset({ x: 0, y: 0 });
  }, [resetKey]);

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-slate-950/60 rounded-2xl border border-white/5 cursor-grab active:cursor-grabbing"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={endPan}
      onMouseLeave={endPan}
    >
      <div
        className="absolute top-1/2 left-1/2 transform-gpu"
        style={{
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>

      <div className="absolute bottom-3 right-4 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded-full border border-white/10">
        ZOOM {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

