"use client";

import { useCallback, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

/** Fixed panel to the right of a sidebar control; flips left if needed. */
export function useFlyoutPosition(open: boolean, buttonRef: RefObject<HTMLButtonElement | null>) {
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties | null>(null);

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn || !open) return;
    const rect = btn.getBoundingClientRect();
    const gap = 8;
    const estimatedWidth = 288;
    let left = rect.right + gap;
    if (left + estimatedWidth > window.innerWidth - gap) {
      left = Math.max(gap, rect.left - estimatedWidth - gap);
    }
    const maxHeight = Math.min(
      window.innerHeight * 0.7,
      22 * 16,
      Math.max(120, window.innerHeight - rect.top - gap)
    );
    setPopoverStyle({
      position: "fixed",
      top: Math.max(gap, rect.top),
      left,
      maxHeight,
    });
  }, [open, buttonRef]);

  useLayoutEffect(() => {
    if (!open) {
      setPopoverStyle(null);
      return;
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return popoverStyle;
}
