import React, { useRef, useEffect } from "react";

interface ZoomableTreeCanvasProps {
  children: React.ReactNode;
  resetKey?: any;
}

// Scrollable inner canvas:
// Screen fixed rehti hai; andar wala area
// overflow ke hisaab se smoothly scroll hota hai.
export const ZoomableTreeCanvas: React.FC<ZoomableTreeCanvasProps> = ({ children, resetKey }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Stop wheel-scroll from "escaping" to the page
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Always keep scrolling inside this container
      e.preventDefault();

      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;
      el.scrollLeft += dx;
      el.scrollTop += dy;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, []);

  // Naye search / naye person pe scroll ko reset karo:
  // start position pe le jao (top), horizontal 0.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Wait for DOM layout so scrollWidth/clientWidth are correct
    const raf = requestAnimationFrame(() => {
      const { scrollHeight, clientHeight } = el;

      // Try to center on the actual root node if present
      const root = el.querySelector("[data-root-node]") as HTMLElement | null;

      let targetLeft = 0;
      if (root) {
        const rootCenter = root.offsetLeft + root.offsetWidth / 2;
        targetLeft = Math.max(0, rootCenter - el.clientWidth / 2);
      }

      // Vertically, center content in view
      const targetTop = Math.max(0, (scrollHeight - clientHeight) / 2);

      el.scrollTo({
        left: targetLeft,
        top: targetTop,
        behavior: "auto",
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [resetKey]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0 overflow-auto overscroll-contain bg-slate-950/60 rounded-2xl border border-white/5"
    >
      {/* Inner content horizontally centered in the box */}
      <div className="flex justify-center items-start w-max h-max min-h-full px-10 py-8">
        {children}
      </div>
    </div>
  );
}

