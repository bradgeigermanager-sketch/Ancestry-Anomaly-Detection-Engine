"""
Imposter Ancestry–Species Detection (IASD) Engine
=================================================

Self-contained Python implementation of:

- Graph model (Person, Species, RecordSystem, Record)
- In-memory graph store
- Core procedures:
    - ancestry_tree
    - ancestry_edges
    - ancestry_coverage
    - ancestry_violations
    - species_anomaly
    - record_footprint
    - iasd_features

This is designed as a reference engine you can drop into your setting.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Iterable, Set
from datetime import date, datetime
import math
import uuid
from collections import defaultdict


# ---------------------------------------------------------------------------
# Core data structures
# ---------------------------------------------------------------------------

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


@dataclass
class RecordSystem:
    id: str
    name: str

