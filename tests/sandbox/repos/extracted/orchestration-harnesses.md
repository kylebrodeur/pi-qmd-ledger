# Analysis of Orchestration Harnesses: Deer-Flow & Citadel

This report evaluates `deer-flow` and `Citadel` as frameworks for high-scale, persistent agent coordination within the microfactory environment.

## 1. Deer-Flow (bytedance/deer-flow)
**Focus:** Long-horizon SuperAgent harness with a strong emphasis on safety and observability via a message gateway and middleware.

### Architecture & Coordination
- **Message Gateway / Middleware**: Utilizes an `AgentMiddleware` chain that wraps agent execution. This allows for intercepting requests, applying filters, and performing audits before a tool is ever executed.
- **State Management**: Leverages a `ThreadState` (likely via LangGraph) to maintain continuity over "long-horizon" tasks that span minutes to hours.
- **Persistence**: Designed for tasks that require steady state tracking across multiple steps, making it suitable for complex assembly or research pipelines.

### Suitability for Microfactory
- **High-Scale Suitability**: Strong. The middleware approach allows for centralized governance of many agents.
- **Persistence**: Excellent for long-running processes.
- **Key Benefit**: The "AuditMiddleware" and "Sandbox" patterns are critical for ensuring that LLM-generated commands do not cause physical damage to hardware.

**Relevance Score: 8/10**

---

## 2. Citadel (SethGammon/Citadel)
**Focus:** A governance-first orchestration harness designed for Claude Code, featuring a tiered routing system and isolated execution environments.

### Architecture & Coordination
- **Four-Tier Routing**: Implements a structured routing system (e.g., `/do`) to manage how tasks are dispatched and handled across different tiers of agents.
- **Isolated Worktrees**: Runs parallel agents in isolated worktrees, preventing state leakage and allowing for "campaign" persistence across separate sessions.
- **Discovery Relay**: Uses a relay system between "waves" of agents, allowing new agents to discover the state and progress of previous waves.
- **Governance Hooks**: Employs `PreToolUse` and `PostToolUse` hooks. Specifically, the ability to block a call (exit code 2) provides a deterministic safety interlock.

### Suitability for Microfactory
- **High-Scale Suitability**: Very High. The "wave" and "relay" pattern enables scaling from a single developer to institutional/factory-wide scale.
- **Persistence**: High. Campaign persistence allows for long-term project tracking across different session lifetimes.
- **Key Benefit**: The hook system is an ideal implementation for industrial safety "Emergency Stops" and rigorous permissioning.

**Relevance Score: 10/10**

---

## Summary Comparison

| Feature | Deer-Flow | Citadel |
| :--- | :--- | :--- |
| **Primary Strength** | Safety Middleware & Sandboxing | Governance Hooks & Tiered Routing |
| **Scale Strategy** | Component-based augmentation | Wave-based orchestration & Worktrees |
| **Persistence** | State-driven (ThreadState) | Campaign-driven |
| **Hardware Fit** | Audit $\rightarrow$ Execute | Hook $\rightarrow$ Interlock $\rightarrow$ Execute |

**Final Recommendation:** 
For the microfactory, **Citadel's** routing and hook system should be the primary model for "governed" hardware execution. **Deer-Flow's** middleware/sandbox pattern should be integrated for the "research and planning" phase of agent activities.
