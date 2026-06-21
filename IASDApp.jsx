import React, { useEffect, useState } from "react";

// ============================================================
// Utility Components
// ============================================================

const Panel = ({ children }) => (
  <div style={styles.panel}>{children}</div>
);

const Metric = ({ label, value }) => (
  <div style={styles.metric}>
    <div style={styles.metricLabel}>{label}</div>
    <div style={styles.metricValue}>{value}</div>
  </div>
);

const JSONBlock = ({ data }) => (
  <pre style={styles.jsonBlock}>
    {JSON.stringify(data, null, 2)}
  </pre>
);

// ============================================================
// Sidebar Components
// ============================================================

const PersonListItem = ({ person, onSelect }) => (
  <div
    style={styles.personItem}
    onClick={() => onSelect(person)}
  >
    {person.name} ({person.id})
  </div>
);

const PeopleSidebar = ({ people, onSelect }) => (
  <div style={styles.sidebar}>
    <div style={styles.sectionTitle}>People</div>
    {people.map(p => (
      <PersonListItem key={p.id} person={p} onSelect={onSelect} />
    ))}
  </div>
);

// ============================================================
// Analysis Components
// ============================================================

const ScoreCard = ({ score }) => {
  const pct = Math.min(100, score * 100);

  return (
    <Panel>
      <h2>Imposter Score</h2>
      <div style={styles.metricValue}>{score.toFixed(4)}</div>
      <div style={styles.scoreBar}>
        <div style={{ ...styles.scoreFill, width: pct + "%" }} />
      </div>
    </Panel>
  );
};

const FeatureList = ({ features }) => (
  <Panel>
    <h3>Feature Breakdown</h3>
    {Object.entries(features).map(([key, value]) => (
      <Metric
        key={key}
        label={key}
        value={typeof value === "number" ? value.toFixed(4) : String(value)}
      />
    ))}
  </Panel>
);

const AnalysisPanel = ({ person, analysis }) => (
  <div style={styles.main}>
    <Panel>
      <h2>{person.name}</h2>
    </Panel>

    <ScoreCard score={analysis.score} />
    <FeatureList features={analysis.features} />
    <RecordTimeline records={analysis.features.record_features} />
    <CoherenceGraph systems={analysis.features.record_features} />
    <SpeciesTraitRadarCompare
  labels={["Morphology", "Genetics", "Lifespan", "Metabolism", "Cognition"]}
  observedTraits={analysis.features.observed_trait_vector}
  claimedSpeciesTraits={analysis.features.claimed_species_trait_vector}
  bestFitSpeciesTraits={analysis.features.best_fit_species_trait_vector}
  claimedSpeciesName={analysis.features.claimed_species_name}
  bestFitSpeciesName={analysis.features.best_fit_species_name}
/>

    <Panel>
      <h3>Raw JSON</h3>
      <JSONBlock data={analysis} />
    </Panel>
  </div>
);

// ============================================================
// Root Component
// ============================================================

export default function IASDApp() {
  const [people, setPeople] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    fetch("/people")
      .then(r => r.json())
      .then(setPeople);
  }, []);

  const runIASD = (person) => {
    setSelectedPerson(person);
    fetch(`/iasd/${person.id}`)
      .then(r => r.json())
      .then(setAnalysis);
  };

  return (
    <div style={styles.container}>
      <PeopleSidebar people={people} onSelect={runIASD} />

      {selectedPerson && analysis ? (
        <AnalysisPanel person={selectedPerson} analysis={analysis} />
      ) : (
        <div style={styles.main}>
          <Panel>
            <h2>IASD Engine</h2>
            <p>Select a person from the left to run analysis.</p>
          </Panel>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Styles (Deterministic, No External Dependencies)
// ============================================================

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    height: "100vh",
    background: "#0f0f0f",
    color: "#e0e0e0",
    fontFamily: "system-ui, sans-serif"
  },
  sidebar: {
    background: "#141414",
    borderRight: "2px solid #333",
    padding: "20px",
    overflowY: "auto"
  },
  main: {
    padding: "20px",
    overflowY: "auto"
  },
  sectionTitle: {
    fontSize: "18px",
    marginBottom: "10px",
    fontWeight: 600,
    borderBottom: "1px solid #444",
    paddingBottom: "5px"
  },
  personItem: {
    padding: "10px",
    marginBottom: "8px",
    background: "#1f1f1f",
    border: "1px solid #333",
    borderRadius: "4px",
    cursor: "pointer"
  },
  panel: {
    background: "#1a1a1a",
    padding: "20px",
    border: "1px solid #333",
    borderRadius: "6px",
    marginBottom: "20px"
  },
  metric: {
    margin: "10px 0",
    padding: "10px",
    background: "#222",
    borderRadius: "4px",
    borderLeft: "4px solid #555"
  },
  metricLabel: {
    fontSize: "14px",
    opacity: 0.8
  },
  metricValue: {
    fontSize: "20px",
    fontWeight: 600
  },
  scoreBar: {
    height: "10px",
    background: "#333",
    borderRadius: "4px",
    marginTop: "5px",
    overflow: "hidden"
  },
  scoreFill: {
    height: "100%",
    background: "linear-gradient(90deg, #ff4444, #ff8800)"
  },
  jsonBlock: {
    background: "#111",
    padding: "10px",
    borderRadius: "4px",
    fontFamily: "monospace",
    whiteSpace: "pre",
    overflowX: "auto",
    border: "1px solid #333"
  }
};
