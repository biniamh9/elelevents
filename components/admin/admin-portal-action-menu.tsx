"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function AdminPortalActionMenu({
  triggerLabel = "Actions",
  compactTrigger = false,
  triggerClassName = "",
  dropdownClassName = "",
  children,
}: {
  triggerLabel?: string;
  compactTrigger?: boolean;
  triggerClassName?: string;
  dropdownClassName?: string;
  children: React.ReactNode | ((closeMenu: () => void) => React.ReactNode);
}) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let frame = 0;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const dropdownRect = dropdownRef.current?.getBoundingClientRect();
      const estimatedHeight = dropdownRect?.height ?? 280;
      const dropdownWidth = dropdownRect?.width ?? 340;
      const viewportPadding = 16;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const nextDirection =
        spaceBelow < estimatedHeight + 16 && spaceAbove > spaceBelow ? "up" : "down";
      const left = Math.max(
        viewportPadding,
        Math.min(
          triggerRect.right - dropdownWidth,
          window.innerWidth - dropdownWidth - viewportPadding
        )
      );
      const top =
        nextDirection === "up"
          ? triggerRect.top - estimatedHeight - 10
          : triggerRect.bottom + 10;

      setDirection(nextDirection);
      setPosition({
        top: Math.max(12, top),
        left,
      });
    }

    updatePosition();
    frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, children]);

  const triggerClasses = [
    "admin-row-action-trigger",
    compactTrigger ? "admin-row-action-trigger--text" : "",
    open ? "is-open" : "",
    triggerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const dropdownClasses = [
    "admin-row-action-dropdown",
    "admin-row-action-dropdown--portal",
    direction === "up" ? "admin-row-action-dropdown--up" : "",
    dropdownClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const renderedChildren =
    typeof children === "function" ? children(() => setOpen(false)) : children;

  return (
    <div className="admin-row-action-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClasses}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{triggerLabel}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path
            d="m5 7 5 6 5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open
        ? createPortal(
            <div
              ref={dropdownRef}
              className={dropdownClasses}
              style={{
                top: position?.top ?? -9999,
                left: position?.left ?? -9999,
                visibility: position ? "visible" : "hidden",
              }}
            >
              {renderedChildren}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
