---
tags:
  - integration
  - blueprint
  - synthesis
  - architecture
  - research
domain: orchestration
status: synthesized
---

# Integration Blueprint: Research to Book Mapping

This document serves as the definitive mapping between the consolidated research in `docs/_research/research-synthesis/` and the book chapters in `@packages/book/`.

**⚠️ ARCHIVE SOURCE POLICY:**
Some source material for this blueprint (e.g., specific scenario specifications or early architectural decisions) resides in `docs/_archive/`. **Files in the archive are still active sources of truth if they are referenced here.** Do not assume archived files are deprecated.

## 🗺️ Master Mapping Table

| Research Source | Book Chapter | Section/Topic | Required Artifacts |
| :--- | :--- | :--- | :--- |
| **V3_RESEARCH_REPORT_FINAL.md** | Ch 01-10 | The "Replicator Framework" & Squeeze Points (Definitive) | Narrative, Deterministic Veto Spec, Latency Heartbeat, Skill Compression Model |
| **V2_RESEARCH_REPORT_FINAL.md** | Ch 01-10 | Legacy Research / Initial Squeeze Point Hypotheses | Historical Context, Baseline Metrics |
| **APPENDIX-THEORY-PRACTICE.md** | Ch 08, 10 | Aspirational Architecture & Gaps | Pattern Diagrams, Gap Table |
| **NEW_DOCUMENTS_CONSENSUS_AND_HALLUCINATIONS.md** | Ch 03, 05, 06, 07 | FECN, "What-If" Machines, Consensus Creativity | Consensus Graph, Hallucination Taxonomy |
| **FINDINGS_DECISION_SCIENCE_AND_GRAPH_NETWORKS.md** | Ch 03, 04, 06, 06.5 | Decision Transformers, 68% Over-reliance, Three-Tier Validation | Decision Tree Viz, DT Formula, Validation Table |
| **RESEARCH_1000_REPO_ANALYSIS_FINAL.md** | All Chapters | Tiered Repo References (T0-T4) | Repo Citation List, Code Snippets |
| **HUGGINGFACE_RESOURCES.md** | Ch 08 | Model Stack (Llama 3.2, Qwen 2.5, etc.) | Model Comparison Matrix |
| **INTEGRATION_ROADMAP.md** | Ch 04, 05, 06, 08 | HF Models & Datasets Integration (Robotics, Economics, Maintenance) | Roadmap Narrative |
| **docs/_research/questions/research-questions.md** | Ch 07, 10 | Economic, Coordination, and Resilience Hypotheses | Research Question Matrix, Simulation Metrics |
| **COMPREHENSIVE_1000_REPO_REANALYSIS.md** & **BROAD_CATEGORIES_1000_REPOS.md** (Archive) | Ch 03, 04, 05, 08 | Missed Tier 1-3 Repos (PyTorch, LangChain, Three.js, Whisper, n8n, Ollama) | Comprehensive Repo Matrix |
| **ALL_RESEARCH_SYNTHESIS_INTEGRATION_MAP.md** (Archive) | All Chapters | Comprehensive Integration Architecture & Content Flow | Synthesis Overview |
| **MICROFACTORY_DOCS_INTEGRATION.md** (Archive) | Ch 01, 05.5, 08, 09 | Previous Documentation Mapping & Architecture Patterns | Implementation Gap Analysis |
| **docs/_research/research-notebooks/manufacturing_export/** | Ch 04.5, 07, 08 | NotebookLM Manufacturing Reports & Deep Dives | Industrial Scenarios |
| **docs/_research/research-notebooks/multiagent_export/** | Ch 05, 05.5, 06 | NotebookLM Multi-Agent Synchronization Reports | Coordination Diagrams |
| **docs/_research/models/evaluations/** | Ch 04, 08 | Evaluated HF Models (Llama-3.1-70B-Instruct-Manufacturing, Thinker-4B, etc.) | Edge Deployment Matrix |
| **docs/_research/datasets/evaluations/** | Ch 07, 09, 10 | Evaluated Datasets (mvtech_anomaly, nvidia/gr00t-sim, etc.) | Benchmark Datasets Matrix |

---

## 📚 Detailed Chapter-by-Chapter Integration

### Chapter 01: Introduction
- **Source**: `RESEARCH_1000_REPO_ANALYSIS_FINAL.md`
- **Content**: Use MiroFish (52K stars) to validate swarm intelligence as a mainstream industry interest.
- **Artifact**: Market validation stats.

### Chapter 02: Core Principles
- **Source**: `FINDINGS_DECISION_SCIENCE_AND_GRAPH_NETWORKS.md`
- **Content**: Introduce graph reasoning fundamentals and explicit reasoning traceability.
- **Artifact**: High-level Graph Reasoning flowchart.

### Chapter 03: AI Fundamentals
- **Source**: `FINDINGS_DECISION_SCIENCE_AND_GRAPH_NETWORKS.md` & `NEW_DOCUMENTS_CONSENSUS_AND_HALLUCINATIONS.md`
- **Content**: 
    - Decision Transformers (Sequential RL as sequence modeling).
    - Hallucinations as creative "What-if" features rather than just bugs.
    - Loss Aversion mathematics (Prospect Theory).
    - **Added Source**: `COMPREHENSIVE_1000_REPO_REANALYSIS.md` (PyTorch, Transformers ML foundations).
- **Artifact**: DT Formula, Hallucination vs. Creativity Matrix.

### Chapter 04: LLMs in Robotics
- **Source**: `RESEARCH_1000_REPO_ANALYSIS_FINAL.md` & `FINDINGS_DECISION_SCIENCE_AND_GRAPH_NETWORKS.md`
- **Content**: 
    - Physics-aware decision support.
    - Latency-aware execution (the Observation-Execution Gap).
    - Differentiable control references (Warp, Newton).
    - **Added Source**: `docs/_research/models/evaluations/` (Robotics vision/control models like Thinker-4B, Spirit-v1.5).
    - **Added Source**: `COMPREHENSIVE_1000_REPO_REANALYSIS.md` (Three.js 3D Viz, Whisper voice control).
- **Artifact**: Latency-Aware Execution diagram.

### Chapter 05: Multi-Agent Systems
- **Source**: `NEW_DOCUMENTS_CONSENSUS_AND_HALLUCINATIONS.md` & `RESEARCH_1000_REPO_ANALYSIS_FINAL.md`
- **Content**: 
    - FECN (Federated Expert Consensus Network) vs. HMCF comparison.
    - pi-coordinator dispatcher pattern.
    - Role-based multi-agent orchestration.
    - **Added Source**: `docs/_research/research-notebooks/multiagent_export/` (NotebookLM multi-agent coordination insights).
    - **Added Source**: `COMPREHENSIVE_1000_REPO_REANALYSIS.md` (LangChain, n8n, Dify frameworks).
- **Artifact**: FECN Architecture Diagram.

### Chapter 05.5: Distributed Manufacturing Networks (New)
- **Source**: `ALL_RESEARCH_SYNTHESIS_INTEGRATION_MAP.md` & `MICROFACTORY_DOCS_INTEGRATION.md`
- **Content**:
    - Federated Learning for Manufacturing (privacy-preserving collaboration).
    - Decentralized Manufacturing and Resource Exchange Framework.
    - Contract Net Protocol and Digital Auctions.
- **Artifact**: Tri-Layer Network Architecture diagram.

### Chapter 06: Trust and Quality Systems
- **Source**: `FINDINGS_DECISION_SCIENCE_AND_GRAPH_NETWORKS.md` & `NEW_DOCUMENTS_CONSENSUS_AND_HALLUCINATIONS.md`
- **Content**: 
    - The "68% Over-Reliance" statistic and cognitive offloading risks.
    - Bias mitigation and augmented intelligence patterns.
    - Managing vs. Eliminating hallucinations.
- **Artifact**: Bias Warning UI mockup, "Trust Boundary" diagram.

### Chapter 06.5: Neuro-Symbolic Safety (New/Expanded)
- **Source**: `FINDINGS_DECISION_SCIENCE_AND_GRAPH_NETWORKS.md` & `RESEARCH_1000_REPO_ANALYSIS_FINAL.md`
- **Content**: 
    - Three-Tier Validation (Step $\rightarrow$ Path $\rightarrow$ Semantic).
    - Deterministic Guardrails (aegis pattern).
    - Fail-stop semantics in physical production.
- **Artifact**: Three-Tier Validation Table, aegis DAG flow.

### Chapter 07: Real-World Scenarios
- **Source**: `RESEARCH_1000_REPO_ANALYSIS_FINAL.md` & `NEW_DOCUMENTS_CONSENSUS_AND_HALLUCINATIONS.md`
- **Content**: 
    - **Case Study**: OrcaSlicer and G-code generation.
    - Consensus-Based Creativity for novel toolpaths.
    - Swarm robotics in the shop floor (PiSwarm).
    - **Added Source**: `docs/_research/datasets/evaluations/` (Real-world testing with mvtech_anomaly, nvidia/gr00t-sim).
    - **Added Source**: `docs/_research/research-notebooks/manufacturing_export/` (Manufacturing scenario deep dives).
- **Artifact**: OrcaSlicer workflow diagram, Toolpath "What-if" examples.

### Chapter 08: Technical Architecture
- **Source**: `RESEARCH_1000_REPO_ANALYSIS_FINAL.md` & `HUGGINGFACE_RESOURCES.md` & `APPENDIX-THEORY-PRACTICE.md`
- **Content**: 
    - Complete System Stack (HF Models $\rightarrow$ Orchestration $\rightarrow$ Physics $\rightarrow$ Execution).
    - Knowledge Graph memory (KARMA).
    - Unified Node Model (Human + Agent + Robot).
    - Aspirational vs. Current Architecture gaps.
    - **Extension Integration**: Integrate third-party CLIs/tools beyond Pi-mono (Ref: `MASTER_PROJECT_DOCUMENT.md`).
    - **Added Source**: `COMPREHENSIVE_1000_REPO_REANALYSIS.md` (Infrastructure: Docker, K8s, Supabase, Ollama).
    - **Added Source**: `docs/_research/models/evaluations/` (Liga-manufacturing-v2 Edge deployment).
- **Artifact**: Full Stack architecture diagram, Unified Node Interface spec.

### Chapter 09: Lessons Learned
- **Source**: `APPENDIX-THEORY-PRACTICE.md`
- **Content**: 
    - Discussion on the "Design vs. Implementation" gap.
    - Maintenance churn in agent-generated code.
- **Artifact**: Gap Analysis Table.

### Chapter 10: Research Agenda
- **Source**: `RESEARCH_1000_REPO_ANALYSIS_FINAL.md` & `APPENDIX-THEORY-PRACTICE.md`
- **Content**: 
    - Agentic AI Physicists (get-physics-done).
    - Discovery Framework: Hypothesis-driven simulation experiments.
    - Future of Physical Intelligence.
    - **Question Tracking**: Incorporate and track research questions from `docs/_research/questions/` (Ref: `START_HERE.md`).
- **Artifact**: Discovery Domain Matrix (9 domains).

---

## 🏁 Integration Status Checklist
- [ ] **Theory vs Practice** $\rightarrow$ Mapped to Ch 08, 09, 10.
- [ ] **Consensus/Hallucinations** $\rightarrow$ Mapped to Ch 03, 05, 06, 07.
- [ ] **Decision Science/Graphs** $\rightarrow$ Mapped to Ch 03, 04, 06, 06.5.
- [ ] **Repo Analysis Final** $\rightarrow$ Distributed across all chapters.
- [ ] **Archive Synthesis Integration** $\rightarrow$ Mapped Tier 1-3 Repos (Ch 03, 04, 05, 08) & Notebook Exports (Ch 04.5, 05.5, 07).
- [ ] **Evaluated Models & Datasets** $\rightarrow$ Mapped specific models/datasets to real-world edge deployment & benchmarks.
- [x] **HF Resources** $\rightarrow$ Mapped to Ch 08 stack.
- [x] **HF Models & Datasets (INTEGRATION_ROADMAP.md)** $\rightarrow$ Mapped to Ch 04, 05, 06.
