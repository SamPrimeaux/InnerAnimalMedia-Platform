export default function QueueIndicator({ current, queueCount, onClear }) {
  if (!current && queueCount === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        background: "var(--bg-elevated)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        zIndex: 1000,
        display: "flex",
        gap: 12,
        alignItems: "center",
        color: "var(--color-text)",
      }}
    >
      <div>
        {current && (
          <div style={{ fontWeight: 500 }}>{current.task_type || "Running"}</div>
        )}
        {queueCount > 0 && (
          <div style={{ color: "var(--text-muted)" }}>+{queueCount} queued</div>
        )}
      </div>

      {queueCount > 0 && onClear && (
        <button
          type="button"
          onClick={onClear}
          style={{
            padding: "4px 8px",
            fontSize: 11,
            background: "transparent",
            border: "1px solid var(--color-border)",
            borderRadius: 4,
            cursor: "pointer",
            color: "var(--color-text)",
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
