# V2 Research: Dynamic Query Plan
## Objective
Move beyond basic synthesis to identify "Tensions", "Blind Spots", and "Technical Gaps" at the intersection of Manufacturing AI and Multi-Agent Systems (MAS).

## Identified Research Tensions (The "Squeeze" Points)
1. **The "Deterministic vs. Probabilistic" Gap**: 
   - Manufacturing (especially CNC) requires 100% safety/precision (deterministic). 
   - MAS/LLMs are probabilistic (stochastic). 
   - *Query Focus*: How are "Deterministic Validators" and "Neuro-Symbolic" bridges actually implemented? What is the latency cost of this validation?

2. **The "Sensing-Execution" Latency**: 
   - MAS coordination takes time (inference/network). 
   - Machine physics happen in milliseconds (latency-aware execution).
   - *Query Focus*: What are the specific thresholds for "stale actions" in CNC machining? How do "Latency-Aware Execution" strategies map to specific machine tool controllers?

3. **The "Skill Compression" Paradox**: 
   - The goal is to let non-experts run complex shops via AI "translators".
   - But high-stakes errors require expert-level debugging.
   - *Query Focus*: How does the "AI 30% Rule" handle the "edge case" where the human doesn't know *why* the AI is failing? What does the "Human-in-the-loop" interface actually look like for debugging a failed toolpath?

4. **The "Distributed vs. Centralized" Scale**:
   - Decentralized nodes (garages) vs. Centralized coordination.
   - *Query Focus*: What are the specific "Circular Supply Chain" metadata standards needed to make the "Star Trek Replicator" vision work? How is material composition tracked across a decentralized network?

## Execution Strategy: Distributed Batching
To ensure reliability and avoid rate limits, queries are executed via **Multi-Agent Distributed Mining**:
- **Clustered Assignment**: Queries are grouped into "Thematic Clusters".
- **Small-Batch Processing**: Multiple agents are deployed, each processing one cluster in micro-batches of 3-5 queries.
- **Asynchronous Collection**: Results are written to isolated files in `raw_mining/` to prevent collisions.

## Protocol: Handling Information Gaps
If an `nlm` result indicates a lack of information (e.g., "no information found"), this is not a failure of the tool but a **signal of a knowledge gap in the notebooks**. 
- **Action**: Record the gap in `docs/_research/research-review-v2/RESEARCH_GAPS.md`.
- **Outcome**: These gaps will trigger new research phases to acquire additional sources before the final synthesis.


### Group A: Manufacturing (NB: fa8d9ea8...)
- **Q1 (Safety/Logic)**: "Detail the specific failure modes of using LLMs for G-code generation. What exact symbolic logic or deterministic checks are used to prevent tool breakage? Provide examples of 'non-conforming' outputs from the sources."
- **Q2 (Physics/Scale)**: "Analyze the relationship between PINNs (Physics-Informed Neural Networks) and World Models. How do PINNs specifically reduce the 'reality gap' in CNC machining? Which specific physical laws (thermodynamics, etc.) are most commonly embedded?"
- **Q3 (Human-Centric)**: "Analyze the 'AI 30% Rule'. In a real-world failure scenario, what specific decision-support tools are proposed to help a human operator override an AI's incorrect process optimization?"

### Group B: Multi-Agent Systems (NB: d41ca71a...)
- **Q4 (Latency/Robotics)**: "Explain the 'Observation-Execution Gap' in industrial robotics. What is the specific mechanism for 'Latency-Aware Execution' and how does it prevent 'force overshoot' or machine jamming?"
- **Q5 (Network/Security)**: "What are the technical requirements for 'Surgical-Grade Networking' in a distributed manufacturing context? Detail the Role of PMTUD and packet duplication in ensuring real-time synchronization of digital twins."
- **Q6 (Coordination/Cost)**: "Discuss the 'Compliance-Resilience paradox' and the churn rates of agent-generated vs human-authored work. Why is the 'Dark Factory' narrative considered a trap?"

### Group C: Cross-Cutting / Synthesis
- **Q7 (Convergence)**: "Synthesize a technical architecture for a 'Lights-on Demand Factory' node. It must include: (1) A World Model for simulation, (2) A Neuro-Symbolic layer for G-code validation, and (3) A Latency-Aware Execution engine for the robotic arm. How do these three components communicate?"
- **Q8 (Circular Economy)**: "Map the requirement for a decentralized 'replicator' network to the technical capabilities of MAS. How would a multi-agent system coordinate material tracking and routing across independent nodes to achieve a circular supply chain?"
