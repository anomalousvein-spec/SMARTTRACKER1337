# Progression Model Specification

## Version: 1.2.1
## Last Updated: 2026-04-23
## Related PR: Coach Memory and Structured Coaching Alignment

---

## 1. Philosophy

The app implements a hybrid progression system combining:
- Double progression as the primary driver: rep-range mastery then load increase
- Heuristic modifiers: RPE, soreness, rest gaps, sleep/recovery, energy, weekly volume landmarks, and recent debrief signals
- Experience-adaptive thresholds: Beginner/Novice/Intermediate/Advanced levels adjust progression pace, set caps, and fatigue thresholds
- Structured coaching overlays: pre-session check-in, post-session debrief, dashboard coach focus, and persistent coach memory

Core principle: suggestions, not mandates. The system prioritizes response-based autoregulation using actual fatigue, readiness, and repeated user feedback while keeping structural guardrails in place.

---

## 2. Input Signals

| Signal | Source | Scale | Used In |
|---|---|---|---|
| Weight | User input per set | lbs/kg | Primary progression variable |
| Reps | User input per set | integer | Secondary progression |
| RPE | User input per set | 1-10 | Effort and quality modifier |
| Soreness | Derived from pre-session body status and saved per session | 1-10 | Recovery status |
| Sleep / Recovery | Pre-session check-in | qualitative mapped to numeric | Readiness gate |
| Pre-session Energy | Pre-session check-in | qualitative mapped to numeric | Readiness gate |
| Body Status | Pre-session check-in | fresh / normal soreness / pain or strain | Safety and protection logic |
| Goal Today | Pre-session check-in | push / standard / light | Aggressiveness preference |
| Time Window | Pre-session check-in | short / normal / long | Minimum effective work logic |
| Session Difficulty | Post-session debrief | undershot / on plan / pushed hard | Fatigue interpretation |
| Plan Fit | Post-session debrief | too easy / about right / too much | Confidence and rebuild logic |
| Body Response | Post-session debrief | felt good / fatigued / pain or strain | Tolerance and pain tracking |
| Next Session Confidence | Post-session debrief | progress / repeat / swap | Swap pressure and confidence bias |
| Date | Auto-captured | ISO string | Rest gap calculation |
| Exercise name | User input / normalized | history lookup | Pattern recognition and settings lookup |

Note: structured check-in/debrief values are saved on each session and also mapped into the legacy numeric readiness fields (`sleep`, `energy`, `soreness`) for engine compatibility.

---

## 3. Derived Metrics

| Metric | Formula | Purpose |
|---|---|---|
| bestSetWeight | max(weight across sets) | Load progression anchor |
| bestSetE1RM | max(E1RM across sets) | Performance comparison |
| avgReps | mean(reps across sets) | Volume indicator |
| repDropOff | firstSet.reps - lastSet.reps | Fatigue and quality proxy |
| avgRPE | mean(RPE across sets) | Effort proxy |
| daysSinceLast | today - lastSession.date | Rest gap detection |
| weeklyMuscleSets | weighted 7-day rolling sets by muscle | Volume ceiling check |
| readinessState | derived from mapped sleep + energy | Daily autoregulation gate |
| lastDebrief | most recent post-session debrief | Recovery and swap interpretation |
| confidenceBias | persistent coach memory, per lift | Aggressiveness modifier |
| toleranceBias | persistent coach memory, per lift | Set-add / set-reduce bias |
| painPenalty | persistent coach memory, per lift | Safety and protection bias |
| swapPreference | persistent coach memory, per lift | Plateau / variation bias |
| recoveryTrend | persistent coach memory, global | Global readiness modifier |
| fatigueTrend | persistent coach memory, global | Global fatigue modifier |

---

## 4. Muscle Group Mapping and Volume Weighting

Weekly volume is calculated with a weighted contribution model:

| Contribution | Weight | Rule | Example |
|---|---|---|---|
| Primary | 1.0x | Main driver of the movement | Bench Press -> Chest |
| Secondary | 0.5x | Significant assisting musculature | Bench Press -> Triceps |

System status:
- Primary source is `exerciseLibrary` metadata
- Static fallback mapping in `src/progression/muscleMapping.ts` is used when a library match is missing
- Supported landmark and mapping coverage now includes `glutes`, `core`, and `calves` in addition to the original upper/lower groups
- Fallback mappings are kept aligned with the seeded exercise library to reduce silent drift when a library lookup misses

Weekly muscle volume is currently calculated across the last 7 calendar days by scanning saved sessions.

---

## 5. Decision Hierarchy

Priority order in the live engine:

### PRIORITY 0: Pain / Protection
- Condition: current body-status pain flag, last debrief pain flag, or persistent pain watch from coach memory
- Action: reduce load to about 85 percent of last best weight, cap sets at 1-2, reduce reps slightly, lower target RPE
- Reason examples:
  - "Pain or strain flagged - keep this lift submaximal and protect the pattern"
  - "Coach memory still has this lift on a pain watch - keep it submaximal and protect the pattern"

### PRIORITY 0.5: Debrief / Tolerance Rebuild
- Condition: last debrief too much / fatigued / swap, low lift tolerance from memory, negative global recovery trend, or strong persistent swap preference
- Action: reduce load modestly, reduce sets by 1, optionally reduce reps slightly
- Reason examples:
  - "Last session debrief ran harder than planned - reduce demand and rebuild quality"
  - "Coach memory shows this lift has been less well-tolerated recently - reduce demand and rebuild quality"
  - "Last session debrief favored a variation change - keep this lift conservative if you repeat it"

### PRIORITY 1: Pre-Session Readiness Gate
- Condition: mapped sleep < 6.5 or mapped energy <= 4
- Action: cap sets at 1-2, lower target RPE, block volume-add logic
- Reason: "Low sleep or energy - reduced volume to protect recovery and quality"

### PRIORITY 2: User-Intent Session Shaping
- Light day:
  - Action: reduce load slightly, cap sets at 1-2
  - Reason: "Light-day goal selected - hold quality and keep demand intentionally lower"
- Short session:
  - Action: trim to minimum effective work
  - Reason: "Short session window - prioritize minimum effective work"

### PRIORITY 3: Programmed Deload
- Condition: `programWeek % deloadFrequency === 0`, unless deloads are turned off
- Conditional fatigue branch:
  - If fatigue markers are present: larger load and set reduction
  - Otherwise: lighter recovery exposure
- Reason examples:
  - "Programmed deload week (Week N) - fatigue markers present"
  - "Programmed deload week (Week N) - active recovery / light session"

### PRIORITY 4: Safety and Recovery
- High soreness:
  - Action: reduce load and/or sets
  - Reason: "High soreness - prioritize recovery"
- Extended rest with fatigue:
  - Action: rebuild gradually
  - Reason: "Extended rest with fatigue - rebuild gradually"
- Extended rest:
  - Action: conservative re-entry
  - Reason: "Extended rest - conservative re-entry"

### PRIORITY 5: Weekly Volume Guard
- Condition: projected weekly sets would exceed MRV
- Action: cap sets to remain inside recovery limits
- Reason: "Weekly [Muscle] volume near MRV ([Current]/[MRV]) - capping volume"

### PRIORITY 6: Quality Gates
- Maximal effort:
  - Condition: avgRPE > level-adjusted gate
  - Action: reduce reps or hold loading
  - Reason: "Maximal effort reached - build capacity before loading"
- Severe fatigue:
  - Condition: rep drop-off > 4
  - Reason: "Fatigue dominated - improve work capacity"
- Quality threshold:
  - Condition: rep drop-off > 2 and avgRPE > 8.5
  - Reason: "Quality threshold approached - consolidate gains"

### PRIORITY 7: Aggressive Progression
- Strong performance:
  - Action: larger load jump and sometimes an added set
  - Reason: "Strong performance with low effort - accelerate"
- Memory-supported progression:
  - Action: same branch, but allowed earlier if confidence bias is positive
  - Reason: "Strong performance with supportive coach memory - accelerate"
- Fast recovery:
  - Action: add load and/or volume
  - Reason examples:
    - "Recovering fast, stimulus well-tolerated - add volume"
    - "Recovery trend looks strong and the stimulus is being well-tolerated - add volume"

### PRIORITY 8: Standard Double Progression
- Top of range:
  - Action: increase load, reset reps to minimum
  - Reason: "Range mastered with quality - load progression"
- Near top:
  - Action: hold load, add a rep
  - Reason: "Approaching threshold - push reps to unlock load"
- Mid-range:
  - Action: hold load, add a rep
  - Reason: "Standard progression - build reps toward range ceiling"

### PRIORITY 9: Regression / Plateau / Swap Pressure
- Decline:
  - Action: reduce load, rebuild from baseline sets
  - Reason: "Performance declining - reduce load, rebuild"
- Plateau:
  - Condition: no progress over the configured session window and high effort trend
  - Reason: "Plateau detected - performance stagnant despite high effort"
- Memory-led swap:
  - Condition: persistent swapPreference even without the classic plateau shape
  - Reason: "Coach memory is leaning toward a variation change after repeated swap signals"

### PRIORITY 10: Set Adjustment
Applied after main load/rep logic when the system has not already made an explicit volume decision.

- Add set:
  - Condition: strong quality, low soreness, decent recency, weekly volume below MAV, tolerance and fatigue trends acceptable
- Hold sets:
  - Default when no clear add/reduce case exists
- Reduce set:
  - Condition: fatigue / soreness / low readiness / low tolerance / poor fatigue trend
  - Can append: "coach memory is holding volume down"

---

## 6. Coach Memory Layer

The system now includes a persistent coach memory layer.

### Per-lift state
- `confidenceBias`: how willing the coach is to push progression on this lift
- `toleranceBias`: how well this lift has tolerated recent training demand
- `painPenalty`: persistent protection pressure after pain / strain signals
- `swapPreference`: persistent lean toward a variation change

### Global state
- `recoveryTrend`: rolling signal from recent check-ins
- `fatigueTrend`: rolling signal from recent debriefs

### Update rules
- Updated every time a session is saved
- Derived from structured pre-session and post-session feedback
- Clamped to bounded ranges to avoid runaway behavior

### Synchronization rule
Coach memory is not the ultimate source of truth. Session history is. When history is structurally changed, coach memory must be rebuilt from saved sessions.

Currently enforced:
- Saving a session incrementally updates coach memory
- Deleting a session triggers a full rebuild from chronological session history

---

## 7. Level-Specific Parameters

| Level | Increment Multiplier | Set Cap | Plateau Threshold | Volume Ease | RPE Offset |
|---|---:|---:|---|---:|---:|
| Beginner | 1.0 | 5 | disabled | 1.2 | -1.0 |
| Novice | 1.0 | 5 | 4 sessions | 1.1 | -0.5 |
| Intermediate | 1.0 | 5 | 3 sessions | 1.0 | 0.0 |
| Advanced | 0.5 | 8 | 3 sessions | 0.8 | +0.5 |

Notes:
- Weight increments still come from exercise settings and user unit
- The multiplier scales that increment by experience level
- The `volumeEase` multiplier also scales the landmark caps for `glutes`, `core`, and `calves`

---

## 8. Weekly Volume Status

The app calculates rolling weekly status dynamically by scanning the last 7 days of saved training history.

| Status | Definition | Behavior |
|---|---|---|
| Under-stimulated | below MEV | Gradually add volume when recovery is good |
| Optimal stimulus | MEV to below MAV | Preferred progression zone |
| Near recovery limit | at or above MAV | Conservative progression |
| Over-reached | above MRV | Reduce volume / favor recovery |

Intermediate default landmarks currently represented in code:

| Muscle Group | MEV | MAV | MRV |
|---|---:|---:|---:|
| Chest | 9 | 15 | 21 |
| Back | 11 | 17 | 23 |
| Quads | 9 | 15 | 21 |
| Hamstrings | 7 | 13 | 19 |
| Glutes | 4 | 10 | 16 |
| Core | 4 | 8 | 14 |
| Calves | 6 | 12 | 18 |
| Shoulders | 7 | 13 | 20 |
| Triceps | 7 | 12 | 18 |
| Biceps | 7 | 12 | 18 |
| Rear Delts | 7 | 12 | 18 |

These are then adjusted by experience-level `volumeEase`.

Implementation note:
- A lightweight build-time taxonomy validation script now checks for drift between `exerciseLibrarySeed.ts`, `muscleMapping.ts`, and `MUSCLE_LANDMARKS`

---

## 9. Interactive Coaching Compliance

The automated and interactive coaching layers must remain downstream of the progression model, not parallel to it.

### Allowed coaching behavior
- Explain why a suggestion changed
- Prioritize which signal matters most today
- Surface safety and recovery context
- Carry tactical notes into the session flow
- Display coach memory and allow reset of stale per-lift bias

### Not allowed
- Invent reasons unsupported by saved metrics or coaching inputs
- Override safety logic because the user selected "push"
- Drift away from engine reasoning in dashboard or log-session UI copy

### Current compliant coaching surfaces
- Dashboard `Coach Focus`
- Log-session `Coach Check-In`
- Log-session `Why Today Changed`
- Post-session debrief
- Analysis `Coach Memory`

---

## 10. Known Differences From Version 1.1.0

The previous markdown did not fully account for:
- Structured pre-session check-in replacing slider-style readiness entry
- Structured post-session debrief shaping future decisions
- Persistent coach memory per lift and globally
- Memory-driven pain watch / tolerance / swap pressure
- Session-history-driven rebuild of coach memory after deletion
- Normalized exercise-name handling across engine, settings, and history lookup

These are now part of the actual model and should be treated as canonical.

---

## 11. Known Limitations / TODO

- Full per-exercise debrief granularity is not implemented yet; debrief is still session-level and applied across all lifts in that session
- Auto-personalization of individual MEV/MAV/MRV is still not implemented
- Editing historical sessions beyond deletion does not yet trigger a full coach-memory rebuild path
- The model still uses a mix of explicit heuristics and string-matched reason classification in some UI layers

---

## Enforcement Rule

For every PR review:
1. Does the PR modify `src/progression/`, `src/repositories/coachStateRepository.ts`, `src/db/`, or suggestion/coaching UI?
2. If yes, does `PROGRESSION_MODEL.md` still accurately describe the implemented model?
3. If not, request documentation updates before considering the work complete.
