# Batch Generation Plan — 950 Unique Tickets (Batches 002–020)

## Rules
- Each batch = 50 tickets
- Total: 19 batches × 50 = 950 new tickets (+ existing 52 = ~1000)
- No duplicate scenarioHash across ANY batch
- No duplicate question text
- scenarioHash format: `{batch}-{topic}-{variant}-{number}` e.g. `b02-speed-highway-night-001`
- Each ticket must have `imageSearchQueries` with exact sign names from image-map.json
- Use ONLY real PDD sections and paragraph numbers

## Image Assignment Rule
Every ticket MUST include `"imageSearchQueries": ["UA road sign X.XX svg"]` where X.XX is the correct sign for the topic. Mapping:

| Topic | Sign to use |
|-------|------------|
| Speed 50 km/h | UA road sign 3.29-050 |
| Speed 20 km/h (residential) | UA road sign 5.31 |
| Speed 90 km/h | UA road sign 5.36 |
| Speed 130 km/h (highway) | UA road sign 5.1 |
| Traffic lights | UA road sign 5.38 |
| Overtaking | UA road sign 3.25 |
| Give way | UA road sign 2.1 |
| Stop | UA road sign 2.2 |
| Main road | UA road sign 2.3 |
| Intersection warning | UA road sign 1.16 |
| Railway crossing | UA road sign 1.20 |
| Cyclists | UA road sign 6.5 |
| Parking | UA road sign 6.13 |
| Bus stop | UA road sign 5.42 |
| Roundabout | UA road sign 4.10 |
| Lane directions | UA road sign 4.14 |
| Pedestrian crossing | UA road sign 5.38 |
| No entry | UA road sign 3.1 |
| Residential zone | UA road sign 5.31 |

## Batch Distribution

### Batch 002: Signs — Warning signs (п. 1.x)
PDD refs: 1.1–1.39 | 50 tickets | EASY: 25, MEDIUM: 20, HARD: 5
Topics: dangerous turns, intersections, railway, roadworks, animals, school zone
Scenarios: single sign recognition, sign + road situation, multiple signs

### Batch 003: Signs — Priority signs (п. 2.x)
PDD refs: 2.1–2.7 | 50 tickets | EASY: 20, MEDIUM: 20, HARD: 10
Topics: give way, stop, main road, main road end, priority over oncoming
Scenarios: two cars at intersection, T-junction, Y-junction, sign + situation

### Batch 004: Signs — Prohibitory signs (п. 3.x)
PDD refs: 3.1–3.43 | 50 tickets | EASY: 20, MEDIUM: 20, HARD: 10
Topics: no entry, no overtaking, speed limits, no parking, no stopping, weight/height limits
Scenarios: sign meaning, exceptions, zone of action, combination with plates

### Batch 005: Signs — Mandatory signs (п. 4.x)
PDD refs: 4.1–4.14 | 50 tickets | EASY: 20, MEDIUM: 20, HARD: 10
Topics: direction arrows, roundabout, pedestrian path, bicycle path, minimum speed
Scenarios: which direction allowed, lane usage, combined with road situation

### Batch 006: Signs — Informational signs (п. 5.x–6.x)
PDD refs: 5.1–6.21 | 50 tickets | EASY: 20, MEDIUM: 20, HARD: 10
Topics: motorway, settlement, pedestrian crossing, one-way, bus lane, parking, service
Scenarios: sign meaning, zone of action, what is allowed/prohibited

### Batch 007: Traffic lights deep dive (п. 8.x)
PDD refs: 8.1–8.11 | 50 tickets | EASY: 15, MEDIUM: 20, HARD: 15
Topics: red/yellow/green, arrow filters, flashing modes, pedestrian signals, reversing lights, T-intersection
Scenarios: what can you do on X signal, who goes first, filter arrow scenarios

### Batch 008: Road markings (п. 9.x)
PDD refs: 9.1–9.15 | 50 tickets | EASY: 15, MEDIUM: 25, HARD: 10
Topics: solid line, dashed, double solid, stop line, pedestrian crossing, arrows, island
Scenarios: can you cross marking X, what does marking Y mean, combination

### Batch 009: Speed rules comprehensive (п. 11–12)
PDD refs: 11.1–12.8 | 50 tickets | EASY: 15, MEDIUM: 20, HARD: 15
Topics: speed in settlement/outside/highway/residential, towing speed, fog/rain speed, speed for trucks/buses
Scenarios: what speed is allowed in situation X, penalty scenarios, speed sign + situation

### Batch 010: Maneuvering (п. 10.x)
PDD refs: 10.1–10.5 | 50 tickets | EASY: 15, MEDIUM: 20, HARD: 15
Topics: lane change, turning, U-turn, reversing, start of movement, signals before maneuver
Scenarios: who yields when changing lanes, from which lane to turn, where U-turn prohibited

### Batch 011: Overtaking comprehensive (п. 14.x)
PDD refs: 14.1–14.6 | 50 tickets | EASY: 10, MEDIUM: 25, HARD: 15
Topics: where prohibited, how to check, double overtaking, return to lane, overtaking slow vehicles
Scenarios: 2-lane road, 3-lane road, sign + situation, oncoming traffic, hill/curve

### Batch 012: Stopping & Parking (п. 15.x)
PDD refs: 15.1–15.15 | 50 tickets | EASY: 15, MEDIUM: 20, HARD: 15
Topics: where stopping prohibited, where parking prohibited, distance rules, sidewalk parking
Scenarios: near crosswalk, near intersection, on bridge, near railway, with sign

### Batch 013: Intersections — regulated (п. 16.1–16.9)
PDD refs: 16.1–16.9 | 50 tickets | EASY: 10, MEDIUM: 20, HARD: 20
Topics: green signal, turning left/right, filter arrows, yellow signal, police officer signals
Scenarios: 2 cars + signal, 3 cars + who goes first, tram + car, arrow + main signal

### Batch 014: Intersections — unregulated (п. 16.10–16.15)
PDD refs: 16.10–16.15 | 50 tickets | EASY: 10, MEDIUM: 20, HARD: 20
Topics: main vs secondary road, equal roads, tram priority, T-junction, turning from main road
Scenarios: 2 cars, 3 cars, tram + car, sign + situation, road changes priority

### Batch 015: Pedestrians & Crosswalks (п. 17–18)
PDD refs: 17.1–18.4 | 50 tickets | EASY: 15, MEDIUM: 25, HARD: 10
Topics: pedestrian crossing rules, bus stop rules, school buses, blind pedestrians, yielding
Scenarios: regulated crossing, unregulated, bus departing, children near school

### Batch 016: Railway crossings (п. 20.x)
PDD refs: 20.1–20.8 | 50 tickets | EASY: 15, MEDIUM: 20, HARD: 15
Topics: approach rules, barrier down, lights flashing, forced stop, no barrier
Scenarios: with barrier, without barrier, train approaching, stalled vehicle on tracks

### Batch 017: Special rules (п. 21–23)
PDD refs: 21.1–23.5 | 50 tickets | EASY: 20, MEDIUM: 20, HARD: 10
Topics: towing rules, passenger rules, cargo rules, children transport, oversized cargo
Scenarios: which towing allowed, max passengers, cargo dimensions, child seats

### Batch 018: Driver duties & documents (п. 1–2)
PDD refs: 1.1–2.14 | 50 tickets | EASY: 25, MEDIUM: 20, HARD: 5
Topics: required documents, insurance, what to do at accident, signals, seat belts, alcohol
Scenarios: what documents to carry, accident procedure, when to use hazard lights

### Batch 019: First aid & Safety
PDD refs: various | 50 tickets | EASY: 20, MEDIUM: 20, HARD: 10
Topics: first aid basics, CPR, bleeding, fractures, burns, shock, emergency calls, fire extinguisher
Scenarios: what to do first at accident, how to help injured, recovery position

### Batch 020: Mixed exam-style (hardest)
PDD refs: mixed | 50 tickets | EASY: 5, MEDIUM: 15, HARD: 30
Topics: complex intersections, multiple rules in conflict, night driving, weather conditions, multi-vehicle scenarios
Scenarios: 3-4 vehicles at complex intersection, overtaking in rain, sign + marking + signal conflict

## Difficulty Totals (batches 002–020)
- EASY: 300
- MEDIUM: 392
- HARD: 258
- Total: 950

## Combined with batch 001 (52 existing)
- Grand total: ~1002 tickets
- All scenarioHashes unique (prefixed with batch number)
