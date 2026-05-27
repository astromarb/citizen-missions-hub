#!/usr/bin/env python3
"""
Generate locations.csv and commodities.csv from the Supabase migration SQL files.
Output matches the DB table column layout exactly.
"""

import csv
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = os.path.join(ROOT, "exports")
os.makedirs(OUT, exist_ok=True)

# ─── Commodities ────────────────────────────────────────────────────────────
# Merge seeds from both v0 and v3 migration files, de-dup by name.
COMMODITY_FILES = [
    os.path.join(ROOT, "supabase/migrations/20260527000000_reference_tables.sql"),
    os.path.join(ROOT, "supabase/migrations/20260527000002_locations_v3.sql"),
]

commodity_pattern = re.compile(
    r"\('([^']*(?:''[^']*)*)',\s*(\d+)\)\s*(?:,|ON CONFLICT)"
)

commodities = {}   # name → sort_order (de-dup; last wins)

for fpath in COMMODITY_FILES:
    with open(fpath) as f:
        content = f.read()
    # Find the commodities INSERT block
    m = re.search(
        r"INSERT INTO public\.commodities[^;]+?VALUES(.*?)ON CONFLICT \(name\) DO NOTHING",
        content, re.DOTALL
    )
    if not m:
        continue
    block = m.group(1)
    for row in re.finditer(r"\('((?:[^']|'')*)',\s*(\d+)\)", block):
        name = row.group(1).replace("''", "'")
        order = int(row.group(2))
        commodities[name] = order

with open(os.path.join(OUT, "commodities.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["name", "sort_order"])
    for name, order in sorted(commodities.items(), key=lambda x: x[1]):
        w.writerow([name, order])

print(f"Wrote commodities.csv  ({len(commodities)} rows)")

# ─── Locations ──────────────────────────────────────────────────────────────
LOCATION_FILES = [
    os.path.join(ROOT, "supabase/migrations/20260527000002_locations_v3.sql"),
    os.path.join(ROOT, "supabase/migrations/20260527000004_space_stations_v4.sql"),
]

# Collect all rows; de-dup by (system, body, name) — later file wins (mimics ON CONFLICT DO UPDATE)
loc_map = {}  # (system, body, name) → row

# Match each row tuple: 10 comma-separated values, some single-quoted, some bare true/false/NULL
row_re = re.compile(
    r"""\(\s*
        '((?:[^']|'')*)'  ,\s*  # system
        '((?:[^']|'')*)'  ,\s*  # body
        '((?:[^']|'')*)'  ,\s*  # name
        (\d+)             ,\s*  # sort_order
        '((?:[^']|'')*)'  ,\s*  # location_type
        (true|false)      ,\s*  # is_active
        (true|false)      ,\s*  # is_trade_terminal
        (true|false)      ,\s*  # is_freight_elevator
        '((?:[^']|'')*)'  ,\s*  # confidence
        (NULL|'(?:[^']|'')*')   # notes
    \s*\)""",
    re.VERBOSE | re.DOTALL
)

for fpath in LOCATION_FILES:
    with open(fpath) as f:
        content = f.read()
    loc_block_m = re.search(
        r"INSERT INTO public\.locations\s*\([^)]+\)\s*VALUES(.*?)ON CONFLICT \(system, body, name\)",
        content, re.DOTALL
    )
    if not loc_block_m:
        continue
    block = loc_block_m.group(1)
    for m in row_re.finditer(block):
        system     = m.group(1).replace("''", "'")
        body       = m.group(2).replace("''", "'")
        name       = m.group(3).replace("''", "'")
        sort_order = int(m.group(4))
        loc_type   = m.group(5).replace("''", "'")
        is_active  = m.group(6)
        is_trade   = m.group(7)
        is_freight = m.group(8)
        confidence = m.group(9).replace("''", "'")
        notes_raw  = m.group(10)
        notes = "" if notes_raw == "NULL" else notes_raw.strip("'").replace("''", "'")
        loc_map[(system, body, name)] = [
            system, body, name, sort_order, loc_type,
            is_active, is_trade, is_freight, confidence, notes
        ]

# Port Olisar: decommissioned; in DB from v1/v2 but not in Section 4 upserts
loc_map[("Stanton","Crusader","Port Olisar")] = [
    "Stanton","Crusader","Port Olisar", 99,
    "station","false","false","false","verified",
    "Removed in Alpha 3.20.0; replaced by Seraphim Station"
]

locations = list(loc_map.values())

# Sort: system → body → sort_order
locations.sort(key=lambda r: (r[0], r[1], int(r[3])))

COLS = ["system","body","name","sort_order","location_type",
        "is_active","is_trade_terminal","is_freight_elevator","confidence","notes"]

with open(os.path.join(OUT, "locations.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(COLS)
    w.writerows(locations)

print(f"Wrote locations.csv    ({len(locations)} rows)")
print(f"\nFiles saved to: {OUT}/")
