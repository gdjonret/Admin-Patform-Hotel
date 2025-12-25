import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "@mui/material";
import { MdClose } from "react-icons/md";
import ReservationForm from "../ReservationForm";

function getFocusable(node) {
  if (!node) return [];
  return Array.from(
    node.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  );
}

export default function AddReservationModal({ open, onClose, onSubmitSuccess }) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  
  // Ensure there is a portal root (fallback to body)
  const portalTarget =
    document.getElementById("modal-root") || document.body;

  // Side effects: lock scroll, manage focus, escape key, focus trap
  useEffect(() => {
    // Only run the effect if the modal is open
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement;

    // Body scroll lock
    document.body.classList.add("modal-open");

    // Focus the dialog
    const dialogEl = dialogRef.current;
    if (dialogEl) {
      // Try to focus first focusable; fallback to dialog itself
      const focusables = getFocusable(dialogEl);
      (focusables[0] || dialogEl).focus();
    }

    // ESC to close
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === "Tab") {
        // Simple focus trap
        const focusables = getFocusable(dialogRef.current);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      // Restore scroll + focus
      document.body.classList.remove("modal-open");
      if (previouslyFocusedRef.current?.focus) {
        previouslyFocusedRef.current.focus();
      }
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onClose]);

  // Early return (no portal work) if not open
  if (!open) return null;

  const modal = (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="reservation-modal modern-reservation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-reservation-title"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal-header reservation-modal-header">
          <h2 id="add-reservation-title" className="reservation-modal-title">Créer Nouvelle Réservation</h2>
          <IconButton
            aria-label="Close"
            onClick={onClose}
            size="small"
            sx={{ color: "#6b7280" }}
          >
            <MdClose />
          </IconButton>
        </div>

        <div className="modal-body">
          <ReservationForm
            onClose={onClose}
            onSubmitSuccess={(normalizedRow) => {
              onSubmitSuccess?.(normalizedRow);
            }}
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modal, portalTarget);
}
