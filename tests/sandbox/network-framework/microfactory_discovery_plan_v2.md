# Microfactory Lab: Discovery Metrics, Experiments & Insight Rules

Generated: 2026-04-10

---

## 1. Purpose

This document defines a structured discovery system for decentralized manufacturing simulations.

Goal:
- Reveal where systems break
- Test assumptions under stress
- Compare economic and coordination models
- Automatically interpret outcomes using insight rules

---

## 2. Discovery Domains

### Throughput & Efficiency
- Jobs completed per time unit
- Idle capacity
- Time-to-completion
- Bottleneck frequency

Hypothesis:
Distributed systems may introduce coordination friction that reduces throughput compared to centralized systems.

---

### Quality & Reliability
- Failure rate
- Rework rate
- Variance between nodes
- Reliability over time

Hypothesis:
Quality may degrade without centralized control unless strong reputation systems emerge.

---

### Economic Stability
- Income distribution
- Price volatility
- Transaction success rate
- Liquidity constraints

Hypothesis:
Barter systems will work at small scale but destabilize as complexity increases.

---

### Material Flow & Circularity
- Reuse rate
- Waste accumulation
- Raw input dependency
- Recycling cost vs new material cost

Hypothesis:
Circular systems reduce cost only when transport and transformation overhead remain low.

---

### Network Resilience
- Recovery time
- Cascade failures
- Redundancy
- Dependency concentration

Hypothesis:
Decentralization improves resilience, but hidden central nodes may still emerge.

---

## 3. Cross-Cutting Metrics

### Trust & Reputation
- Successful vs failed interactions
- Repeat interactions
- Network clustering

Hypothesis:
Nodes will form trust clusters, potentially fragmenting the network.

---

### Skill Compression (LLM Impact)
- Onboarding time
- Error rates
- Performance gap (new vs experienced)

Hypothesis:
LLMs reduce onboarding time but may introduce systemic fragility if over-relied upon.

---

### Automation (Robotics Impact)
- Jobs per operator
- Failure dependency
- Manual vs automated throughput

Hypothesis:
Automation increases efficiency but creates new failure points.

---

## 4. Core Experiments

### Experiment 1: Centralized vs Distributed Routing
Expected:
- Distributed routing improves resilience but reduces efficiency initially

---

### Experiment 2: Barter vs Credit Economy
Expected:
- Barter works locally but fails at scale

---

### Experiment 3: Recycling Integration
Expected:
- Recycling lowers cost but increases coordination complexity

---

### Experiment 4: Node Failure Shock
Expected:
- Redundant networks recover faster

---

### Experiment 5: LLM vs Heuristic Agents
Expected:
- LLM agents outperform early but may introduce instability

---

## 5. Insight Generation Rules

These rules interpret simulation outcomes automatically.

### A. Efficiency vs Stability

IF throughput increases AND failure rate increases  
THEN classify: "Unstable Optimization"

Meaning:
System is pushing capacity beyond safe limits.

---

### B. Circular Tradeoff

IF material reuse increases AND delays increase  
THEN classify: "Circular Friction"

Meaning:
Recycling adds coordination overhead.

---

### C. Hidden Centralization

IF one node handles >40% of jobs  
THEN classify: "Emergent Centralization"

Meaning:
System is not truly decentralized.

---

### D. Trust Collapse

IF transaction failures increase over time  
THEN classify: "Trust Degradation"

Meaning:
Network reliability is breaking down.

---

### E. Barter Breakdown

IF transaction success rate drops below threshold  
AND barter is dominant  
THEN classify: "Barter Instability"

Meaning:
System too complex for non-monetary exchange.

---

### F. Automation Fragility

IF automation increases throughput  
BUT failures spike when nodes fail  
THEN classify: "Automation Dependency Risk"

Meaning:
System relies too heavily on automation nodes.

---

### G. AI Over-Reliance

IF LLM agents outperform initially  
BUT variance increases over time  
THEN classify: "AI Instability"

Meaning:
AI introduces inconsistency or unpredictability.

---

### H. Inequality Formation

IF top 20% of nodes accumulate >60% of value  
THEN classify: "Wealth Concentration"

Meaning:
System favors dominant actors.

---

### I. Resilience Success

IF system recovers quickly after disruption  
AND throughput stabilizes  
THEN classify: "Resilient Network"

Meaning:
Decentralization is functioning correctly.

---

## 6. Discovery Outputs

Each simulation should generate:

- System Summary
- Tradeoffs detected
- Unexpected behaviors
- Failure explanations
- Insight rule classifications

---

## 7. Success Criteria

The system succeeds if:

- It produces conflicting results across models
- It reveals non-obvious tradeoffs
- It surfaces failure early
- It challenges assumptions

---

## 8. Final Insight

This system is not for optimization.

It is for discovering truth under pressure.

---

End of Document
