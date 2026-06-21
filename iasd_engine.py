from __future__ import annotations
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Dict, List, Tuple, Optional, Set
import math
import statistics


# =========================
# Data models
# =========================

@dataclass
class Species:
    id: str
    name: str
    code: str
    avg_lifespan_years: Optional[float] = None
    min_parent_age_years: Optional[float] = None
    max_parent_age_years: Optional[float] = None
    trait_vector: Optional[List[float]] = None


@dataclass
class Person:
    id: str
    external_id: Optional[str]
    name: str
    date_of_birth: date
    place_of_birth: Optional[str]
    claimed_species_id: str
    sex: Optional[str] = None
    date_of_death: Optional[date] = None
    trait_vector: Optional[List[float]] = None  # for species matching


@dataclass
class RecordSystem:
    id: str
    name: str
    type: str  # CIVIL, MEDICAL, EDUCATION, TRAVEL, etc.
    jurisdiction: Optional[str] = None


@dataclass
class Record:
    id: str
    system_id: str
    person_id: str
    record_type: str  # BIRTH, CENSUS, TAX, HOSPITAL, etc.
    timestamp: datetime
    payload: Dict
    validity_score: Optional[float] = None


# =========================
# Graph store
# =========================

@dataclass
class Graph:
    persons: Dict[str, Person] = field(default_factory=dict)
    species: Dict[str, Species] = field(default_factory=dict)
    record_systems: Dict[str, RecordSystem] = field(default_factory=dict)
    records: Dict[str, Record] = field(default_factory=dict)

    parent_of: Dict[str, List[str]] = field(default_factory=dict)      # parent_id -> [child_ids]
    child_of: Dict[str, List[str]] = field(default_factory=dict)       # child_id -> [parent_ids]
    member_of_species: Dict[str, str] = field(default_factory=dict)    # person_id -> species_id
    has_record: Dict[str, List[str]] = field(default_factory=dict)     # person_id -> [record_ids]

    # ---- Node management ----

    def add_person(self, p: Person) -> None:
        self.persons[p.id] = p
        if p.claimed_species_id:
            self.member_of_species[p.id] = p.claimed_species_id

    def add_species(self, s: Species) -> None:
        self.species[s.id] = s

    def add_record_system(self, rs: RecordSystem) -> None:
        self.record_systems[rs.id] = rs

    def add_record(self, r: Record) -> None:
        self.records[r.id] = r
        self.has_record.setdefault(r.person_id, []).append(r.id)

    def add_parent_of(self, parent_id: str, child_id: str) -> None:
        self.parent_of.setdefault(parent_id, []).append(child_id)
        self.child_of.setdefault(child_id, []).append(parent_id)

    # ---- Access helpers ----

    def get_parents(self, person_id: str) -> List[Person]:
        parent_ids = self.child_of.get(person_id, [])
        return [self.persons[pid] for pid in parent_ids if pid in self.persons]

    def get_children(self, person_id: str) -> List[Person]:
        child_ids = self.parent_of.get(person_id, [])
        return [self.persons[cid] for cid in child_ids if cid in self.persons]

    def get_species_for_person(self, person_id: str) -> Optional[Species]:
        sid = self.member_of_species.get(person_id)
        if sid is None:
            return None
        return self.species.get(sid)

    def get_records_for_person(self, person_id: str) -> List[Record]:
        rids = self.has_record.get(person_id, [])
        return [self.records[rid] for rid in rids if rid in self.records]


# =========================
# Utility functions
# =========================

def years_between(d1: date, d2: date) -> float:
    return (d2 - d1).days / 365.25


def euclidean_distance(v1: List[float], v2: List[float]) -> float:
    if len(v1) != len(v2):
        raise ValueError("Vectors must have same length")
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(v1, v2)))


def species_compatible(sp_parent: Species, sp_child: Species) -> bool:
    # Domain-specific; simplest rule: same species code required
    return sp_parent.code == sp_child.code


# =========================
# Core procedures
# =========================

class IASDProcedures:
    def __init__(self, graph: Graph):
        self.g = graph

    # 1) ancestryTree(p, k)
    def ancestry_tree(self, person_id: str, k: int) -> List[Tuple[Person, int]]:
        result: List[Tuple[Person, int]] = []
        visited: Set[str] = set()
        queue: List[Tuple[str, int]] = [(person_id, 0)]

        while queue:
            current_id, depth = queue.pop(0)
            if depth == k:
                continue
            parents = self.g.get_parents(current_id)
            for par in parents:
                if par.id in visited:
                    continue
                visited.add(par.id)
                result.append((par, depth + 1))
                queue.append((par.id, depth + 1))

        return result

    # 2) ancestryEdges(p, k)
    def ancestry_edges(self, person_id: str, k: int) -> List[Tuple[Person, Person]]:
        ancestors = self.ancestry_tree(person_id, k)
        ancestor_ids = {a.id for a, _ in ancestors}
        result: List[Tuple[Person, Person]] = []

        for anc, _depth in ancestors:
            children = self.g.get_children(anc.id)
            for ch in children:
                if ch.id == person_id or ch.id in ancestor_ids:
                    result.append((anc, ch))

        return result

    # 3) ancestryCoverage(p, k)
    def ancestry_coverage(self, person_id: str, k: int) -> float:
        ancestors = self.ancestry_tree(person_id, k)
        if not ancestors:
            return 1.0  # no known ancestors => treat as non-anomalous coverage

        covered = 0
        for anc, _depth in ancestors:
            records = self.g.get_records_for_person(anc.id)
            if records:
                covered += 1

        return covered / len(ancestors)

    # 4) ancestryViolations(p, k)
    def ancestry_violations(self, person_id: str, k: int, epsilon_years: float = 0.5) -> float:
        edges = self.ancestry_edges(person_id, k)
        if not edges:
            return 0.0

        violations = 0
        total_constraints = 0

        for par, ch in edges:
            sp_par = self.g.get_species_for_person(par.id)
            sp_ch = self.g.get_species_for_person(ch.id)
            if sp_par is None or sp_ch is None:
                continue

            # Age constraint
            if par.date_of_birth and ch.date_of_birth:
                age_at_birth = years_between(par.date_of_birth, ch.date_of_birth)
                if sp_par.min_parent_age_years is not None and sp_par.max_parent_age_years is not None:
                    total_constraints += 1
                    if age_at_birth < sp_par.min_parent_age_years or age_at_birth > sp_par.max_parent_age_years:
                        violations += 1

            # Lifespan constraint
            if par.date_of_death is not None and ch.date_of_birth is not None:
                total_constraints += 1
                if years_between(par.date_of_death, ch.date_of_birth) > epsilon_years:
                    violations += 1

            # Species compatibility
            total_constraints += 1
            if not species_compatible(sp_par, sp_ch):
                violations += 1

        if total_constraints == 0:
            return 0.0

        return violations / total_constraints

    # 5) speciesAnomaly(p, σ)
    def species_anomaly(self, person_id: str, sigma: float) -> float:
        p = self.g.persons[person_id]
        if p.trait_vector is None:
            return 0.0

        if p.claimed_species_id not in self.g.species:
            return 0.0

        t_obs = p.trait_vector
        s_claim = self.g.species[p.claimed_species_id]

        sims = []
        sim_claim = None

        for s in self.g.species.values():
            if s.trait_vector is None:
                continue
            d = euclidean_distance(t_obs, s.trait_vector)
            sim = math.exp(-(d * d) / (2 * sigma * sigma))
            sims.append((s, sim))
            if s.id == s_claim.id:
                sim_claim = sim

        if not sims or sim_claim is None:
            return 0.0

        _best_species, sim_best = max(sims, key=lambda x: x[1])
        return sim_best - sim_claim

    # 6) recordFootprint(p)
    def record_footprint(self, person_id: str) -> List[Dict]:
        records = self.g.get_records_for_person(person_id)
        by_system: Dict[str, List[Record]] = {}
        for r in records:
            by_system.setdefault(r.system_id, []).append(r)

        summaries = []
        for sys_id, rs in by_system.items():
            system = self.g.record_systems.get(sys_id)
            system_type = system.type if system else "UNKNOWN"
            n_records = len(rs)
            validity_scores = [r.validity_score for r in rs if r.validity_score is not None]
            avg_validity = statistics.mean(validity_scores) if validity_scores else None
            first_seen = min(r.timestamp for r in rs)
            last_seen = max(r.timestamp for r in rs)
            summaries.append(
                {
                    "system_id": sys_id,
                    "system_type": system_type,
                    "n_records": n_records,
                    "avg_validity": avg_validity,
                    "first_seen": first_seen,
                    "last_seen": last_seen,
                }
            )
        return summaries


# =========================
# IASD Engine
# =========================

@dataclass
class IASDConfig:
    ancestry_depth: int = 3
    sigma_species: float = 1.0
    weight_aca: float = 1.0
    weight_axa: float = 1.0
    weight_sma: float = 1.0
    weight_crca: float = 1.0


class IASDEngine:
    def __init__(self, graph: Graph, config: IASDConfig):
        self.g = graph
        self.cfg = config
        self.proc = IASDProcedures(graph)

    def crca_score(self, person_id: str) -> float:
        summaries = self.proc.record_footprint(person_id)
        if not summaries:
            return 1.0  # no records at all: highly anomalous

        density = 0.0
        for s in summaries:
            n = s["n_records"]
            v = s["avg_validity"] if s["avg_validity"] is not None else 0.5
            density += math.log(1 + n) * v

        anomaly = 1.0 / (1.0 + density)
        return anomaly

    def compute_features(self, person_id: str) -> Dict:
        k = self.cfg.ancestry_depth
        sigma = self.cfg.sigma_species

        A_ACA = self.proc.ancestry_coverage(person_id, k)
        A_ACA_anom = 1.0 - A_ACA
        A_AXA = self.proc.ancestry_violations(person_id, k)
        A_SMA = self.proc.species_anomaly(person_id, sigma)
        A_CRCA = self.crca_score(person_id)

        return {
            "ancestry_coverage": A_ACA,
            "ancestry_coverage_anomaly": A_ACA_anom,
            "ancestry_violation_ratio": A_AXA,
            "species_anomaly": A_SMA,
            "crca_anomaly": A_CRCA,
        }

    def imposter_score(self, person_id: str) -> float:
        f = self.compute_features(person_id)
        score = (
            self.cfg.weight_aca * f["ancestry_coverage_anomaly"]
            + self.cfg.weight_axa * f["ancestry_violation_ratio"]
            + self.cfg.weight_sma * f["species_anomaly"]
            + self.cfg.weight_crca * f["crca_anomaly"]
        )
        return score

    def explain(self, person_id: str) -> Dict:
        features = self.compute_features(person_id)
        score = self.imposter_score(person_id)
        return {
            "person_id": person_id,
            "score": score,
            "features": features,
        }


# =========================
# Example wiring
# =========================

if __name__ == "__main__":
    # Minimal demo; replace with your own data loading.
    g = Graph()

    # Species
    human = Species(
        id="S1",
        name="Human",
        code="HUM",
        avg_lifespan_years=80,
        min_parent_age_years=15,
        max_parent_age_years=60,
        trait_vector=[0.1, 0.2, 0.3],
    )
    g.add_species(human)

    # Normal person
    p1 = Person(
        id="P1",
        external_id="X-123",
        name="Normal Citizen",
        date_of_birth=date(2200, 1, 1),
        place_of_birth="City A",
        claimed_species_id="S1",
        trait_vector=[0.11, 0.19, 0.31],
    )
    g.add_person(p1)

    # Imposter: no ancestry, weird traits, no records
    p2 = Person(
        id="P2",
        external_id="X-999",
        name="Suspicious Individual",
        date_of_birth=date(2200, 1, 1),
        place_of_birth="City B",
        claimed_species_id="S1",
        trait_vector=[5.0, 5.0, 5.0],
    )
    g.add_person(p2)

    # Record system + record for p1 only
    rs_civil = RecordSystem(id="RS1", name="CivilRegistry", type="CIVIL")
    g.add_record_system(rs_civil)

    r1 = Record(
        id="R1",
        system_id="RS1",
        person_id="P1",
        record_type="BIRTH",
        timestamp=datetime(2200, 1, 2),
        payload={"note": "Birth record"},
        validity_score=0.95,
    )
    g.add_record(r1)

    cfg = IASDConfig(
        ancestry_depth=3,
        sigma_species=1.0,
        weight_aca=1.0,
        weight_axa=1.0,
        weight_sma=1.0,
        weight_crca=1.0,
    )
    engine = IASDEngine(g, cfg)

    print("P1:", engine.explain("P1"))
    print("P2:", engine.explain("P2"))
