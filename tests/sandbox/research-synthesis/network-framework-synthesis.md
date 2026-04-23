---
tags: [network, multi-agent, architecture, discovery, orchestration]
domain: orchestration
status: synthesized
---

# Network Framework Synthesis - Book Integration Analysis

**Generated:** 2026-04-11  
**Source:** docs/_reviews/network-framework/ (8 files)  
**Purpose:** Assess framework documents for book integration

---

## Executive Summary

The network-framework/ directory contains **8 conceptual framework documents** defining a unified architecture for decentralized manufacturing. These are **vision/theory documents** describing desired system properties rather than implemented code.

**Key Finding:** These documents describe an **aspirational unified architecture** that layers on top of (and potentially conflicts with) the current implementation approach in MASTER_TODO_AND_SPEC.md.

---

## File-by-File Analysis

### 1. CAPABILITY_NETWORK_FRAMEWORK.md

**Summary:** Defines a 5-layer node-based collaboration system

**Key Concepts:**
- Capability network: turns intent into validated outcomes
- 5 layers: Knowledge → Skills → Orchestration → Execution → Reflection
- Core principles: composability, interoperability, human+agent collaboration, continuous learning

**Existing in Book:**
- ❓ Multi-layer architecture mentioned in Ch.8 but not this specific structure
- ❓ Human-AI collaboration discussed but not "continuous learning" framework

**Book Integration:**
- **Status:** POTENTIAL NEW CHAPTER SECTION
- **Recommendation:** Compare against Ch.8 "Technical Architecture" - may enhance or conflict
- **Question:** Does the 5-layer model (Knowledge/Skills/Orc/Exec/Reflect) align with existing Pi-mono + DES architecture?

---

### 2. microfactory_discovery_plan_v2.md ⭐ FLAGSHIP DOCUMENT

**Summary:** Comprehensive discovery/experimentation framework for decentralized manufacturing simulations

**Key Concepts:**
- **9 Discovery Domains** with hypothesis-driven experiments:
  1. Throughput & Efficiency
  2. Quality & Reliability  
  3. Economic Stability
  4. Material Flow & Circularity
  5. Network Resilience
  6. Trust & Reputation
  7. Skill Compression (LLM Impact)
  8. Automation (Robotics Impact)
- **5 Core Experiments:**
  - Centralized vs Distributed Routing
  - Barter vs Credit Economy
  - Recycling Integration
  - Node Failure Shock
  - LLM vs Heuristic Agents
- **9 Insight Rules:** Automated classification (e.g., "Unstable Optimization", "Emergent Centralization", "Barter Instability")

**Existing in Book:**
- ✅ **Ch.10 Research Agenda** - contains hypotheses but NOT this structured
- ✅ **Ch.07 Scenarios** - single-shop, supply shock, etc. but NOT as formal experiments
- ⚠️ Economic stability, material circularity - mentioned but not detailed
- ❌ **Discovery metrics** - NOT explicitly defined
- ❌ **Insight rules** - NOT present

**Book Integration:**
- **Status:** MAJOR ENHANCEMENT
- **Recommendation:** 
  - **ADD** Section 10.X "Discovery Framework" with experiment structure
  - **ENHANCE** Ch.07 scenarios with hypothesis format from this document
  - **INTEGRATE** insight rules as simulation output classifications
- **Value:** This transforms scenarios from "acceptance tests" into "research experiments"
- **Question:** Should Ch.10 become "Research Experiments" instead of "Research Agenda"?

---

### 3. NODE_INTERFACE_FRAMEWORK.md

**Summary:** Universal node structure definition

**Key Concepts:**
- Node: capability-bearing unit with 6 dimensions (Identity, Capabilities, Interfaces, Memory, Constraints, Feedback)
- Lifecycle: Discovery → Selection → Execution → Evaluation → Learning → Adaptation
- Principle: All nodes (human, agent, robot) modeled uniformly

**Existing in Book:**
- ✅ **Ch.5 Multi-Agent Systems** - node agents, capability matching
- ⚠️ **Ch.8 Architecture** - Pi AgentRuntime but not explicit lifecycle
- ❌ **Unified human+agent modeling** - NOT explicitly addressed

**Book Integration:**
- **Status:** ENHANCEMENT
- **Recommendation:** Add lifecycle diagram to Ch.5.5 (Distributed Networks) or Ch.8
- **Note:** "Uniformly model humans, agents, robots" is a **strong philosophical stance** not fully reflected in current "agent" focus

---

### 4. NODE_TOOL_MAPPING.md
[[KB: This seems primarily for research agents and how we were going to build a swarm for research. The tools here aren't specific to what should go in the book. We should get the key concepts (node types) and taxonomy integrated.]]
**Summary:** Maps specific tools to node types

**Key Concepts:**
- UACS → Memory Node
- Multi-Agent CLI → Orchestrator Node
- NotebookLM MCP → Knowledge Node
- AI Code Connect → Bridge Node
- LLM Council → Reasoning Node
- Skills Manager → Skill Node

**Existing in Book:**
- ❌ **Node tool taxonomy** - NOT present
- ⚠️ Tools mentioned individually but not in type system

**Book Integration:**
- **Status:** LOW PRIORITY
- **Recommendation:** May be implementation detail rather than book content
- **Question:** Is this describing actual implemented tools or aspirational types?
- **Concern:** Current system uses different toolset - potential mismatch [[KB: We aren't prescribing specific tools and if we are yes, we would want to update and reference properly. I'm sure we will do this after we complete our repo and dataset reseach.]]

---

### 5. ORCHESTRATION_MODEL.md

**Summary:** Task routing and execution flow

**Key Concepts:**
- Core loop: Intent → Plan → Execute → Evaluate → Learn
- Responsibilities: task decomposition, node selection, dependency management, escalation
- Routing factors: capability match, constraints, trust level, load
- Research gaps: dynamic routing optimization, human intervention thresholds

**Existing in Book:**
- ✅ **Ch.5** - job routing, capability matching
- ✅ **Ch.8** - Pi dispatcher patterns
- ⚠️ Trust-based routing mentioned but not "trust level" as explicit factor
- ❌ **Human intervention thresholds** - NOT addressed

**Book Integration:**
- **Status:** ENHANCEMENT
- **Recommendation:** Add "Human Intervention Thresholds" to Ch.6.5 (Neuro-Symbolic Safety)
- **Question:** Does current DES engine support dynamic routing optimization? [[KB: At one point, we discussed a new system somewhere. I need more information to understand to make decisions.]]

---

### 6. reccomendations-for-refining.md ⭐ CRITICAL

**Summary:** Recommendation from document author about how to proceed

**Key Content:**
> "Before expanding these further: 1. Use them in a real flow... 2. Identify friction... 3. Then evolve the docs"

**Actionable Example:**
"Design + build smoke filtration system" → define skill → route through orchestration → evaluate via trust model

**Author's Insight:**
> "These should become: less theoretical, more grounded in real workflows"

**Book Integration:**
- **Status:** META-DOCUMENT
- **Recommendation:** THIS IS THE KEY INSIGHT
- **Interpretation:** These frameworks are **aspirational** - real value comes from testing them against actual implementation
- **Action:** Create "Framework Validation" section documenting gap between theory (these docs) and practice (current code)

---

### 7. SKILL_MODEL.md

**Summary:** Skill as compressed operational unit

**Key Concepts:**
- Skill Structure: Intent, I/O, Preconditions, Constraints, Failure Modes, Success Criteria, Nodes Required
- Expansion modes: Teach/Assist/Do/Simulate
- Research gaps: minimum viable compression, safety thresholds, skill evolution

**Existing in Book:**
- ❌ **Formal skill definition** - NOT present
- ⚠️ **Ch.5** mentions capability matching but not "skill" as entity

**Book Integration:**
- **Status:** POTENTIAL ADDITION
- **Question:** Does current `Capability` type in packages/core need expansion to "Skill"?
- **Concern:** This creates new ontology - "Skill" vs "Capability" vs "Job" - potential confusion
[[KB: I've decided on Skill being the standard. Skill, Capability, and Job are different things. We may need all three defined and updated in the book.]]

---

### 8. TRUST_EVALUATION_MODEL.md

**Summary:** Trust measurement framework

**Key Concepts:**
- Dimensions: Accuracy, Consistency, Cost, Time, Safety
- Signals: Success rate, failure classification, confidence scores, human overrides
- Trust levels: Low/Medium/High
- Research gaps: quantifying trust, feedback normalization, cross-node comparison

**Existing in Book:**
- ✅ **Ch.6** - reputation system discussed
- ✅ **Ch.6.5** - validation layers
- ⚠️ **Ch.5.5** - trust scoring in distributed networks
- ❌ **Explicit trust levels** (Low/Med/High) - NOT defined
- ❌ **Human overrides as trust signal** - NOT mentioned

**Book Integration:**
- **Status:** ENHANCEMENT
- **Recommendation:** Add explicit "Trust Levels" taxonomy to Ch.6
- **Question:** Does current packages/core have Trust type with L/M/H levels? [[KB: We may need to update this after we complete some of the research and review the synthesis.]]

---

## Cross-Cutting Analysis

### Themes Across All Documents

| Theme | Coverage | Status |
|-------|----------|--------|
| **Multi-layer architecture** | 5 layers: Knowledge/Skills/Orc/Exec/Reflect | ⚠️ NOT in current book |
| **Lifecycle management** | Discovery → ... → Adaptation | ⚠️ NOT explicit in current code |
| **Human + Agent + Robot** | Unified modeling | ⚠️ Agent-focused in current |
| **Trust levels** | Low/Medium/High | ❌ NOT in current (has scores, not levels) |
| **Learning/Adaptation** | Continuous | ❌ NOT in current (has events, not learning) |
| **Discovery experiments** | 9 domains, 5 experiments | ❌ NOT in current |
| **Insight rules** | Automated classification | ❌ NOT in current |
| **Skill vs Capability** | Skill is compressed | ❌ Uses "Capability" in code |

### Potential Regressions ⚠️

| Concern | Issue |
|---------|-------|
| **"Capability" vs "Skill"** | Framework uses "Skill" - code uses "Capability" - terminology collision |
| **Unified node modeling** | Framework includes "human, agent, robot" - current focus is agent-only |
| **Tool mapping** | Framework defines 6 node types - current implementation different |
| **5-layer architecture** | Framework proposes Knowledge/Skills/Orc/Exec/Reflect - may not align with Pi-mono + DES | 
[[KB: We should realign our project to this framework, We can merge any items from the existing packages if needed. We created a research system for our Repos, this already seems like something we can leverage or use as reference.]]

### Major Additions ✅

| Addition | Value |
|----------|-------|
| **Discovery framework** | Turns simulation from acceptance tests into research experiments |
| **Insight rules** | Automated outcome classification adds rigor |
| **Experiment hypotheses** | 9 domains with falsifiable predictions |
| **Trust levels** | Low/Med/High simpler than continuous scores |

---

## Recommendations

### Immediate Actions

1. **RESOLVE TERMINOLOGY:** Decide on "Capability" vs "Skill" - they cannot coexist
   - **Option A:** Keep "Capability" (current), note "Skill" as future expansion
   - **Option B:** Rename to "Skill" (framework), align with conceptual model

2. **PRIORITIZE DISCOVERY FRAMEWORK:** The `microfactory_discovery_plan_v2.md` content is the highest-value addition
   - Add Section 10.X "Research Discovery Framework"
   - Convert Ch.07 scenarios to hypothesis-driven experiments
   - Implement insight rules in simulation outputs

3. **ARCHITECTURE ALIGNMENT:** The 5-layer model may conflict with Pi-mono + DES
   - Need engineering review: Does Knowledge/Skills/Orc/Exec/Reflect map to current codebase?
   - If conflict, document as "aspirational future architecture"

4. **HUMAN-IN-THE-LOOP:** Framework emphasizes human+agent - book focuses on agent
   - Add Ch.6.X "Human Intervention and Oversight"
   - Define human override thresholds (from ORCHESTRATION_MODEL.md)

5. **FOLLOW RECOMMENDATION:** The `reccomendations-for-refining.md` says it all:
   - "Use them in a real flow" → Create validation example
   - "Identify friction" → Document theory/practice gap
   - "Less theoretical, more grounded" → Update these frameworks after implementation

### Book Chapter Integration

| Framework Document | Target Location | Action |
|---------------------|-----------------|--------|
| microfactory_discovery_plan_v2.md | Ch.10 (NEW Section) | Add "Discovery Framework" |
| microfactory_discovery_plan_v2.md | Ch.07 | Convert scenarios to experiments |
| ORCHESTRATION_MODEL.md | Ch.6.5 | Add "Human Intervention Thresholds" |
| TRUST_EVALUATION_MODEL.md | Ch.6 | Add "Trust Levels (Low/Med/High)" |
| SKILL_MODEL.md | Ch.5 | Expand "Capability → Skill with modes" |
| NODE_INTERFACE_FRAMEWORK.md | Ch.5.5 | Add lifecycle diagram |
| CAPABILITY_NETWORK_FRAMEWORK.md | Ch.8 | COMPARE against Pi-mono stack |
| NODE_TOOL_MAPPING.md | None | Implementation detail - skip |
| reccomendations-for-refining.md | Ch.1 or Appendix | Add "Theory vs Practice" note |

### Questions for User

1. **Terminology:** Should codebase use "Capability" or "Skill"? Framework uses both.

2. **Human modeling:** Do you want to explicitly model humans as nodes (framework) or keep agents primary (current)?

3. **Discovery experiments:** Should Ch.07 scenarios become formal experiments with hypotheses a la the discovery plan?

4. **Insight rules:** Do you want simulation outputs to automatically classify results ("Unstable Optimization", "Barter Instability", etc.)?

5. **Framework validation:** Should we create a section showing gap between these aspirational frameworks and current implementation?

---

## Final Assessment

**Value:** HIGH - especially `microfactory_discovery_plan_v2.md` which transforms vague scenarios into rigorous research experiments.

**Risk:** MEDIUM - terminology and architecture conflicts need resolution before integration.

**Recommendation:** 
1. Adopt discovery framework (Ch.10)
2. Resolve terminology (Capability vs Skill)
3. Compare 5-layer architecture to current stack
4. Create "Theory vs Practice" appendix documenting gaps

---

**Related Documents:**
- `docs/_research/MIGRATION_FROM_DEPRECATED_DOCS.md` - Other content to migrate
- `docs/_research/research-synthesis/MASTER_TODO_AND_SPEC.md` - Current book spec
- `packages/core/CLAUDE.md` - Current type system (uses "Capability")
