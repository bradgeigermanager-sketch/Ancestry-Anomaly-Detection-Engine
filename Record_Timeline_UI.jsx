import React from "react";

export default function RecordTimeline({ records }) {
  // records: array of:
  // {
  //   system_type: "CIVIL",
  //   system_id: "RS1",
  //   n_records: 3,
  //   avg_validity: 0.92,
  //   first_seen: "2200-01-02T00:00:00Z",
  //   last_seen: "2205-03-11T00:00:00Z",
  //   raw_records: [
  //      { id, record_type, timestamp, validity_score, payload }
  //   ]
  // }

  const sorted = [...records].sort(
    (a, b) => new Date(a.first_seen) - new Date(b.first_seen)
  );

  return (
    <div style={styles.container}>
      <div style={styles.title}>Record Timeline</div>

      <div style={styles.timeline}>
        {sorted.map((sys, idx) => (
          <TimelineBlock key={idx} system={sys} />
        ))}
      </div>
    </div>
  );
}

function TimelineBlock({ system }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div style={styles.block}>
      <div style={styles.blockHeader} onClick={() => setOpen(!open)}>
        <div style={styles.blockTitle}>
          {system.system_type} — {system.system_id}
        </div>
        <div style={styles.blockMeta}>
          {system.n_records} records • Validity {fmt(system.avg_validity)}
        </div>
        <div style={styles.blockDates}>
          {fmtDate(system.first_seen)} → {fmtDate(system.last_seen)}
        </div>
      </div>

      {open && (
        <div style={styles.recordList}>
          {system.raw_records?.map((r) => (
            <RecordItem key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecordItem({ record }) {
  return (
    <div style={styles.recordItem}>
      <div style={styles.recordHeader}>
        <span style={styles.recordType}>{record.record_type}</span>
        <span style={styles.recordDate}>{fmtDate(record.timestamp)}</span>
      </div>

      <div style={styles.recordMeta}>
        Validity: {fmt(record.validity_score)}
      </div>

      <pre style={styles.payload}>
        {JSON.stringify(record.payload, null, 2)}
      </pre>
    </div>
  );
}

// =========================
// Formatting helpers
// =========================

function fmt(v) {
  return v === null || v === undefined ? "—" : v.toFixed(3);
}

function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toISOString().split("T")[0];
}

// =========================
// Styles
// =========================

const styles = {
  container: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 6,
    padding: 16,
    color: "#e0e0e0",
    marginTop: 20
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12
  },
  timeline: {
    borderLeft: "2px solid #444",
    paddingLeft: 20
  },
  block: {
    marginBottom: 20,
    paddingLeft: 10,
    position: "relative"
  },
  blockHeader: {
    background: "#222",
    border: "1px solid #333",
    borderRadius: 4,
    padding: 12,
    cursor: "pointer"
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: 600
  },
  blockMeta: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 4
  },
  blockDates: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4
  },
  recordList: {
    marginTop: 10,
    paddingLeft: 10,
    borderLeft: "1px dashed #444"
  },
  recordItem: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: 4,
    padding: 10,
    marginBottom: 10
  },
  recordHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6
  },
  recordType: {
    fontWeight: 600,
    color: "#ff8800"
  },
  recordDate: {
    opacity: 0.8
  },
  recordMeta: {
    fontSize: 13,
    marginBottom: 6,
    opacity: 0.8
  },
  payload: {
    background: "#000",
    padding: 10,
    borderRadius: 4,
    border: "1px solid #333",
    fontSize: 12,
    overflowX: "auto"
  }
};
