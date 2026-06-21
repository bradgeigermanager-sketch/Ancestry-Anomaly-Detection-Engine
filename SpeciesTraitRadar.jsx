import React from "react";

const SpeciesTraitRadar = ({ speciesName, traits, labels }) => {
  // traits: number[] in [0,1] or normalized
  // labels: string[] same length as traits

  const size = 260;
  const center = size / 2;
  const radius = size * 0.4;
  const n = traits.length;

  const angleForIndex = (i) => (2 * Math.PI * i) / n;

  const pointForTrait = (value, i) => {
    const angle = angleForIndex(i) - Math.PI / 2; // start at top
    const r = radius * value;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = traits
    .map((v, i) => pointForTrait(v, i))
    .map(p => `${p.x},${p.y}`)
    .join(" ");

  const axisLines = traits.map((_, i) => {
    const angle = angleForIndex(i) - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return { x, y };
  });

  const labelPositions = axisLines.map((p, i) => {
    const dx = p.x - center;
    const dy = p.y - center;
    const factor = 1.1;
    return {
      x: center + dx * factor,
      y: center + dy * factor,
      text: labels[i]
    };
  });

  return (
    <div style={styles.container}>
      <div style={styles.title}>Species Traits — {speciesName}</div>
      <svg width={size} height={size} style={styles.svg}>
        {/* radial grid */}
        {[0.25, 0.5, 0.75, 1.0].map((f, idx) => (
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

        {/* axes */}
        {axisLines.map((p, i) => (
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

        {/* polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(255, 136, 0, 0.35)"
          stroke="#ff8800"
          strokeWidth={2}
        />

        {/* labels */}
        {labelPositions.map((lp, i) => (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            fill="#ccc"
            fontSize="11"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {lp.text}
          </text>
        ))}
      </svg>
    </div>
  );
};

const styles = {
  container: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 6,
    padding: 16,
    display: "inline-block"
  },
  title: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 600
  },
  svg: {
    display: "block",
    margin: "0 auto"
  }
};

export default SpeciesTraitRadar;
