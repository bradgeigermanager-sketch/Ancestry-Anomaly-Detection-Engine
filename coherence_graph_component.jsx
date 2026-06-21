import React, { useEffect, useRef } from "react";

export default function CoherenceGraph({ systems }) {
  // systems: array of:
  // {
  //   system_id,
  //   system_type,
  //   n_records,
  //   avg_validity,
  //   first_seen,
  //   last_seen
  // }

  const svgRef = useRef(null);

  // Simple deterministic force layout
  const width = 600;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  // Normalize node sizes and colors
  const maxRecords = Math.max(...systems.map(s => s.n_records || 1));
  const maxValidity = Math.max(...systems.map(s => s.avg_validity || 0.1));

  const nodes = systems.map((s, i) => ({
    id: s.system_id,
    label: s.system_type,
    r: 20 + (40 * (s.n_records / maxRecords)),
    color: validityColor(s.avg_validity / maxValidity),
    x: centerX + Math.cos((2 * Math.PI * i) / systems.length) * 150,
    y: centerY + Math.sin((2 * Math.PI * i) / systems.length) * 150
  }));

  // Compute coherence edges
  const edges = [];
  for (let i = 0; i < systems.length; i++) {
    for (let j = i + 1; j < systems.length; j++) {
      const a = systems[i];
      const b = systems[j];
      const coherence = computeCoherence(a, b);
      edges.push({
        source: nodes[i],
        target: nodes[j],
        weight: coherence
      });
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>Cross‑System Coherence Graph</div>

      <svg ref={svgRef} width={width} height={height} style={styles.svg}>
        {/* Edges */}
        {edges.map((e, idx) => (
          <line
            key={idx}
            x1={e.source.x}
            y1={e.source.y}
            x2={e.target.x}
            y2={e.target.y}
            stroke="#888"
            strokeWidth={1 + e.weight * 4}
            opacity={0.6}
          />
        ))}

        {/* Nodes */}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={n.r}
              fill={n.color}
              stroke="#333"
              strokeWidth={2}
            />
            <text
              x={n.x}
              y={n.y}
              fill="#fff"
              fontSize="12"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.swatch, background: "#ff4444" }}></span>
          Low validity
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.swatch, background: "#ffaa00" }}></span>
          Medium validity
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.swatch, background: "#44ff44" }}></span>
          High validity
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Coherence calculation
// ============================================================

function computeCoherence(a, b) {
  // Coherence = overlap of time ranges × similarity of validity
  const tA1 = new Date(a.first_seen).getTime();
  const tA2 = new Date(a.last_seen).getTime();
  const tB1 = new Date(b.first_seen).getTime();
  const tB2 = new Date(b.last_seen).getTime();

  const overlap =
    Math.max(0, Math.min(tA2, tB2) - Math.max(tA1, tB1)) /
    Math.max(1, Math.max(tA2, tB2) - Math.min(tA1, tB1));

  const validitySim = 1 - Math.abs((a.avg_validity || 0) - (b.avg_validity || 0));

  return (overlap + validitySim) / 2;
}

// ============================================================
// Color mapping
// ============================================================

function validityColor(v) {
  if (v < 0.33) return "#ff4444";
  if (v < 0.66) return "#ffaa00";
  return "#44ff44";
}

// ============================================================
// Styles
// ============================================================

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
  svg: {
    display: "block",
    margin: "0 auto",
    background: "#111",
    borderRadius: 6
  },
  legend: {
    marginTop: 12,
    fontSize: 13
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: 4
  },
  swatch: {
    width: 14,
    height: 14,
    display: "inline-block",
    marginRight: 8
  }
};
