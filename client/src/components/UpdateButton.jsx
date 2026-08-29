import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../config/env";
import getAuthConfig from "../functions/getAuthConfig";

/**
 * UpdateButton
 * ────────────
 * Props:
 *   type            {string}    verification type (character/employee/tenant…)
 *   request_number  {string}    this row's request number
 *   queueStatus     {string|undefined}
 *                   Live status from useQueueStatus hook:
 *                     undefined  → idle   (orange  "Update")
 *                     'PENDING'  → queued (amber   "In Queue")
 *                     'PROCESSING'→ active (blue    "Processing…")
 *   onStatusUpdate  {function}  optional callback(request_number, apiResponse)
 *                               called after HTTP response so the parent can
 *                               merge fresh status cells — no full-table reload.
 *
 * The button also has its own local phase for optimistic UI while the HTTP
 * request is in-flight (before the SSE event arrives).
 */
export default function UpdateButton({
  type,
  request_number,
  queueStatus,
  onStatusUpdate,
}) {
  // Local in-flight phase: "idle" | "submitting" | "error"
  // The live display phase is derived below from queueStatus + localPhase.
  const [localPhase, setLocalPhase] = useState("idle");
  const resetTimer = useRef(null);

  // Auto-reset local error state after 3 s so user can retry
  useEffect(() => {
    if (localPhase === "error") {
      resetTimer.current = setTimeout(() => setLocalPhase("idle"), 3000);
    }
    return () => clearTimeout(resetTimer.current);
  }, [localPhase]);

  // ── Derive the visual phase ─────────────────────────────────────────────────
  //
  //  Priority:
  //    1. localPhase === "submitting"  → show blue spinner (HTTP in-flight)
  //    2. localPhase === "error"       → show red   (HTTP failed)
  //    3. queueStatus === "PROCESSING" → show blue spinner (worker active)
  //    4. queueStatus === "PENDING"    → show amber (queued, waiting for worker)
  //    5. otherwise                    → orange idle
  //
  let displayPhase;
  if (localPhase === "submitting") {
    displayPhase = "submitting";
  } else if (localPhase === "error") {
    displayPhase = "error";
  } else if (queueStatus === "PROCESSING") {
    displayPhase = "processing";
  } else if (queueStatus === "PENDING") {
    displayPhase = "pending";
  }
  else {
    displayPhase = "idle";
  }

  // ── Click handler ───────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    // Prevent double-click or clicking when already queued
    if (localPhase === "submitting" || queueStatus) return;

    setLocalPhase("submitting");

    try {
      const response = await axios.get(`${API_BASE}/updateStatus`, {
        params: { type, request_number },
        ...getAuthConfig(),
      });

      // Success: SSE will push PENDING/PROCESSING to ALL clients including us.
      // Just reset local phase; the queueStatus prop will handle display.
      setLocalPhase("idle");

      if (typeof onStatusUpdate === "function") {
        onStatusUpdate(request_number, response.data);
      }
    } catch (err) {
      console.error("Update failed:", err);
      setLocalPhase("error");
    }
  };

  // ── Per-phase display config ────────────────────────────────────────────────
  const PHASE_CONFIG = {
    idle: {
      className: "update-btn update-btn--idle",
      icon: "⟳",
      label: "Update",
      title: "Click to queue a status update",
      spinning: false,
      disabled: false,
    },
    submitting: {
      className: "update-btn update-btn--updating",
      icon: null,
      label: "Sending…",
      title: "Sending request to server…",
      spinning: true,
      disabled: true,
    },
    pending: {
      className: "update-btn update-btn--queued",
      icon: "⏳",
      label: "In Queue",
      title: "Request is queued — waiting for worker",
      spinning: false,
      disabled: true,
    },
    processing: {
      className: "update-btn update-btn--updating",
      icon: null,
      label: "Processing…",
      title: "Worker is actively processing this request",
      spinning: true,
      disabled: true,
    },
    error: {
      className: "update-btn update-btn--error",
      icon: "✕",
      label: "Failed",
      title: "Update failed — click to retry",
      spinning: false,
      disabled: false,
    },
  };

  const { className, icon, label, title, spinning, disabled } =
    PHASE_CONFIG[displayPhase];

  return (
    <button
      className={className}
      onClick={handleUpdate}
      disabled={disabled}
      title={title}
      aria-label={`${label} for request ${request_number}`}
    >
      {spinning ? (
        <>
          <span className="spinner" aria-hidden="true" />
          <span>{label}</span>
        </>
      ) : (
        <>
          {icon && (
            <span className="update-btn__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <span>{label}</span>
        </>
      )}
    </button>
  );
}