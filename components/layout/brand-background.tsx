"use client";

import { useEffect, useRef, useState } from "react";

// Outer wrapper is 340vmax, inset by -36vmax on each side -> 412vmax total tile area.
const TILE_AREA_VMAX = 340 + 36 * 2;
const ROW_OVERSCAN = 1.15;
const DEFAULT_ROWS = 80;
const DEFAULT_WORDS_PER_ROW = 24;

const WORD_TEXT = "OPENAUX";
const wordClassName = "font-black text-[clamp(2.75rem,7.5vw,8rem)] uppercase leading-none";

function useTileCounts() {
  const measureRef = useRef<HTMLSpanElement>(null);
  const [counts, setCounts] = useState({ rows: DEFAULT_ROWS, cols: DEFAULT_WORDS_PER_ROW });

  useEffect(() => {
    const updateCounts = () => {
      const wordEl = measureRef.current;
      if (!wordEl) return;

      // Use offset dimensions, not getBoundingClientRect, since the parent's
      // -rotate-45 transform would otherwise skew the measured box.
      const width = wordEl.offsetWidth;
      const height = wordEl.offsetHeight;
      if (width <= 0 || height <= 0) return;

      const tileAreaPx = (TILE_AREA_VMAX / 100) * Math.max(window.innerWidth, window.innerHeight);
      const rowHeightPx = height * 0.78; // matches the -mt-[0.22em] row overlap below
      const rows = Math.ceil((tileAreaPx * ROW_OVERSCAN) / rowHeightPx);
      const cols = Math.ceil((tileAreaPx * ROW_OVERSCAN) / width);

      setCounts({ rows: Math.max(rows, 1), cols: Math.max(cols, 1) });
    };

    updateCounts();
    window.addEventListener("resize", updateCounts);
    return () => window.removeEventListener("resize", updateCounts);
  }, []);

  return { ...counts, measureRef };
}

/**
 * Static diagonal tiling of the OPENAUX wordmark used as a decorative page background.
 */
export function BrandBackground() {
  const { rows, cols, measureRef } = useTileCounts();

  return (
    <div
      aria-hidden="true"
      className="fixed left-1/2 top-1/2 z-0 h-[340vmax] w-[340vmax] -translate-x-1/2 -translate-y-1/2 overflow-hidden select-none pointer-events-none -rotate-45"
    >
      <span
        ref={measureRef}
        className={`${wordClassName} invisible absolute inline-block whitespace-nowrap`}
      >
        {WORD_TEXT}{" "}
      </span>

      <div className={`absolute -inset-[36vmax] ${wordClassName} tracking-normal text-foreground`}>
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className={`whitespace-nowrap leading-none ${row === 0 ? "" : "-mt-[0.22em]"}`}>
            {Array.from({ length: cols }, (_, col) => {
              const isAccent = (col + (row % 2)) % 2 === 0;
              return (
                <span
                  key={col}
                  className={`inline-block whitespace-nowrap ${isAccent ? "text-primary" : ""}`}
                >
                  {WORD_TEXT}{" "}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
