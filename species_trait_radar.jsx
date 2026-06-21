import React from "react";
import { normalizeVector } from "./normalizeVector";

export default function SpeciesTraitRadarCompare({
  labels,
  observedTraits,
  claimedSpeciesTraits,
  bestFitSpeciesTraits,
  claimedSpeciesName,
  bestFitSpeciesName
}) {
  const size = 300;
  const center = size / 2;
  const radius = size * 0.40;

  const n = labels.length;

  const normObs = normalizeVector(observedTraits);
  const normClaim = normalizeVector(claimedSpeciesTraits);
  const normBest = normalizeVector(bestFitSpeciesTraits);

  const angle = (i) => (2 * Math.PI * i) / n - Math.PI / 2;

  const point = (value, i) => {
    const a = angle(i);
    return {
      x: center + radius * value * Math.cos(a),
      y: center + radius * value * Math.sin(a)
    };
  };

  const poly = (vec) =>
    vec.map((v, i) => point(v, i)).map((p) => `${p.x},${p.y}`).join(" ");

  const axisPoints = labels.map((_, i) => point(1, i));

  return (
    <div style={styles.container}>
      <div style={styles.title}>Species Trait Radar Comparison</div>

      <svg width={size} height={size} style={styles.svg}>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((f, idx) => (
          <circle
            key={idx}
            cx={center}
            cy={center}
            r={radius * f}
            fill="none"
            stroke="#333"
            strokeWidth={1}
          />
        ))}

        {/* Axes */}
        {axisPoints.map((p, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#444"
            strokeWidth={1}
          />
        ))}

        {/* Observed traits polygon */}
        <polygon
          points={poly(normObs)}
          fill="rgba(255, 136, 0, 0.35)"
          stroke="#ff8800"
          strokeWidth={2}
        />

        {/* Claimed species polygon */}
        <polygon
          points={poly(normClaim)}
          fill="rgba(0, 136, 255, 0.25)"
          stroke="#0088ff"
          strokeWidth={2}
        />

        {/* Best-fit species polygon */}
        <polygon
          points={poly(normBest)}
          fill="rgba(0, 255, 136, 0.25)"
          stroke="#00ff88"
          strokeWidth={2}
        />

        {/* Labels */}
        {axisPoints.map((p, i) => (
          <text
            key={i}
            x={p.x * 1.08 - center * 0.08}
            y={p.y * 1.08 - center * 0.08}
            fill="#ccc"
            fontSize="11"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {labels[i]}
          </text>
        ))}
      </svg>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.swatch, background: "#ff8800" }}></span>
          Observed Traits
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.swatch, background: "#0088ff" }}></span>
          Claimed Species: {claimedSpeciesName}
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.swatch, background: "#00ff88" }}></span>
          Best-Fit Species: {bestFitSpeciesName}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 6,
    padding: 16,
    display: "inline-block",
    color: "#e0e0e0"
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 600
  },
  svg: {
    display: "block",
    margin: "0 auto"
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
