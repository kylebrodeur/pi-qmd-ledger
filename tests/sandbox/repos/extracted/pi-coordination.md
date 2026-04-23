# Analysis: Pi-Coordinator & Pi-Subagents

## Overview
This report analyzes the orchestration patterns implemented in `pi-coordinator` and the documented role of `pi-subagents`. Together, they represent two different approaches to multi-agent coordination within the `pi` ecosystem: a structured, phase-driven "Dispatcher" pattern (`pi-coordinator`) and a flexible, parallel "Task Decomposition" pattern (`pi-subagents`).

## 1. Pi-Coordinator: The Dispatcher Pattern

### Architecture
`pi-coordinator` transforms the primary agent into a pure orchestrator. It strips the main agent of all codebase tools, leaving it with only one: `dispatch_agent`. All execution is delegated to a hardcoded team of specialist subagents:
- **Researcher:** Read-only codebase exploration.
- **Implementer:** Code writer/editor.
- **Verifier:** Skeptical quality gate.

### Task Routing & Coordination
The coordinator uses a **Strict Four-Phase Workflow** to manage complexity and maintain quality:
1. **Research:** Parallel dispatch of researchers to explore the codebase.
2. **Synthesis:** The coordinator personally analyzes research notes (in the scratchpad) and writes a precise implementation spec.
3. **Implementation:** Serial or parallel dispatch of implementers based on file-set independence.
4. **Verification:** Dispatch of a *different* agent to prove the correctness of the implementation.

### Communication Mechanism
- **Shared Scratchpad:** Communication is asynchronous and file-based via `.pi/scratchpad/`. Agents write reports (`research-<topic>.md`, `verify-<topic>.md`) and the coordinator writes specs (`spec-<topic>.md`).
- **Session Persistence:** Subagents maintain their own conversation history via session files (`.pi/agent-sessions/<name>.json`), allowing the coordinator to return to an agent with existing context.

### Parallel Execution
Parallelism is achieved by spawning multiple `pi` CLI child processes. The coordinator is instructed to dispatch multiple researchers in Phase 1 and non-overlapping implementers in Phase 3.

---

## 2. Pi-Subagents: Async Delegation

### Architecture
Based on documentation from the `feynman` package stack, `pi-subagents` is designed for **parallel agent spawning** focused on literature gathering and task decomposition.

### Distinctions from Coordinator
While `pi-coordinator` is a high-level *workflow* manager (enforcing phases and roles), `pi-subagents` appears to be a lower-level *capability* provider. It enables the runtime to spawn agents for broader information gathering and decomposition of a large goal into smaller, parallelizable sub-tasks.

---

## Comparison Summary

| Feature | Pi-Coordinator | Pi-Subagents |
| :--- | :--- | :--- |
| **Primary Role** | Workflow Orchestration (Quality Gate) | Parallel Task Execution (Scaling) |
| **Control Flow** | Strict Phases (Research $\to$ Synth $\to$ Impl $\to$ Verify) | Task Decomposition $\to$ Parallel Execution |
| **Tooling** | Dispatcher-only (No direct tool access) | Parallel Process Spawning |
| **Communication** | Structured Scratchpad Files | Task/Result delegation |
| **Focus** | Correctness and Reliability | Throughput and Information Gathering |

## Evaluation & Relevance

### Relevance Score: 9/10
These patterns are highly relevant for factory-wide multi-agent coordination.
- **Reliability:** The `pi-coordinator` pattern solves the "rubber-stamp" problem by separating implementation from verification.
- **Scalability:** The async delegation of `pi-subagents` provides the necessary mechanism to scale research across a large codebase.
- **Structure:** The use of a shared scratchpad for inter-agent communication is a robust way to maintain a "source of truth" without bloating the context window of a single agent.

### Recommendation for Microfactory
The "Dispatcher" pattern should be adopted for any critical code modification workflows to ensure that implementation is always preceded by a synthesis phase and followed by independent verification. The shared scratchpad approach is an ideal way to track "agent traces" and audit the reasoning process of the swarm.
